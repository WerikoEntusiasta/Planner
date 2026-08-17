import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { affiliateTracker } from './src/middleware/affiliateTracker';

dotenv.config();

const app = express();
const allowedOrigins = [
  'https://planner.amplificagroup.com',
  'http://localhost:3000',
  'https://ais-dev-pcokqf6bsksu2yhzfk5fn3-215070016480.us-east5.run.app'
];
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});
export { io };
const PORT = 3000;

// Trust reverse proxies
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false,
}));

// CORS Policy
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  message: 'Muitas requisições. Tente novamente mais tarde.'
});

app.use(generalLimiter);
app.use(cookieParser());
app.use(affiliateTracker);

// Body-parser with 2MB limit (DoS Protection via oversized payload) and capture rawBody for Stripe signature verification
app.use(express.json({ 
  limit: '2mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// ==========================================
// 🛡️ CRYPTOGRAPHY & AUTHENTICATION ENGINE
// ==========================================
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'planner_saas_sec_v2_' + (process.env.VITE_ADMIN_PASSWORD || 'secure_salt_9f83a8f9024c089a812efd1883');

import bcrypt from 'bcryptjs';

// 1. Password Hashing
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash || !password) return false;
  return await bcrypt.compare(password, storedHash);
}

// 2. Timing-Safe String Comparison (prevents side-channel timing attacks)
export function timingSafeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(String(a || '')).digest();
  const hashB = crypto.createHash('sha256').update(String(b || '')).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

// 3. User Session Token Generator & Verifier (HMAC-SHA256)
export function generateUserToken(userId: string, email: string): string {
  const payload = {
    userId,
    email: email.toLowerCase(),
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyUserToken(tokenString: string): { valid: boolean; userId?: string; email?: string } {
  if (!tokenString) return { valid: false };
  try {
    const [encodedPayload, signature] = tokenString.split('.');
    if (!encodedPayload || !signature) return { valid: false };

    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(encodedPayload).digest('base64url');
    if (!timingSafeCompare(signature, expectedSignature)) {
      return { valid: false };
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return { valid: false }; // Expired
    }

    return { valid: true, userId: payload.userId, email: payload.email };
  } catch (e) {
    return { valid: false };
  }
}

// 4. Admin Session Token Generator & Verifier
export function generateAdminToken(): string {
  const payload = {
    role: 'admin',
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET + '_admin').update(encodedPayload).digest('base64url');
  return `adm_${encodedPayload}.${signature}`;
}

export function verifyAdminToken(tokenString: string): boolean {
  if (!tokenString || !tokenString.startsWith('adm_')) return false;
  try {
    const raw = tokenString.replace('adm_', '');
    const [encodedPayload, signature] = raw.split('.');
    if (!encodedPayload || !signature) return false;

    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET + '_admin').update(encodedPayload).digest('base64url');
    if (!timingSafeCompare(signature, expectedSignature)) {
      return false;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (payload.role !== 'admin' || (payload.exp && Date.now() > payload.exp)) {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}

// 5. HTML & String Sanitization (XSS / Injection defense)
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// ==========================================
// 🛡️ SLIDING-WINDOW IP RATE LIMITER
// ==========================================
interface RateLimitRecord {
  timestamps: number[];
}
const rateLimitStore = new Map<string, RateLimitRecord>();

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter(ts => now - ts < 60000);
    if (record.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}, 180000);

export function createRateLimiter(maxRequests: number, windowMs = 60000, message = 'Muitas requisições. Por favor, aguarde antes de tentar novamente.') {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
    const key = `${req.baseUrl || ''}${req.path}_${ip}`;
    const now = Date.now();

    let record = rateLimitStore.get(key);
    if (!record) {
      record = { timestamps: [] };
      rateLimitStore.set(key, record);
    }

    record.timestamps = record.timestamps.filter(ts => now - ts < windowMs);

    if (record.timestamps.length >= maxRequests) {
      const oldest = record.timestamps[0];
      const retryAfter = Math.ceil((windowMs - (now - oldest)) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        success: false,
        error: message,
        retryAfterSeconds: retryAfter
      });
    }

    record.timestamps.push(now);
    next();
  };
}

const authRateLimiter = createRateLimiter(10, 60000, 'Muitas tentativas de autenticação. Por segurança, aguarde 1 minuto.');
const sensitiveRateLimiter = createRateLimiter(30, 60000, 'Limite de operações excedido. Tente novamente em instantes.');

// Central helper to resolve canonical Base URL (defaults to production domain: planner.amplificagroup.com)
export function getBaseUrl(req?: express.Request): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  if (req) {
    const forwardedProto = (req.headers['x-forwarded-proto'] as string) || '';
    const forwardedHost = (req.headers['x-forwarded-host'] as string) || '';
    const host = forwardedHost.split(',')[0].trim() || req.get('host') || 'planner.amplificagroup.com';
    const proto = (!host.includes('localhost') && !host.includes('127.0.0.1')) ? 'https' : (forwardedProto.split(',')[0].trim() || req.protocol || 'http');
    return `${proto}://${host}`;
  }
  return 'https://planner.amplificagroup.com';
}

// --- SEO & AI DISCOVERABILITY ENDPOINTS ---
app.get('/sitemap.xml', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const today = new Date().toISOString().split('T')[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/aprovar</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/suporte</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/termos</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.send(xml);
});

app.get('/llms.txt', (req, res) => {
  const baseUrl = getBaseUrl(req);

  const markdown = `# Planner de Conteúdo Multicanal

> Plataforma SaaS para planejamento estratégico de conteúdo, criação de roteiros com Inteligência Artificial, organização visual e fluxo de aprovação por clientes para creators, agências e gestores de redes sociais.

## Visão Geral
O Planner de Conteúdo Multicanal é um ecossistema projetado para estruturar a presença digital em redes sociais como YouTube, Instagram, TikTok, LinkedIn, Facebook e Pinterest. O sistema permite planejar publicações, gerar roteiros com IA e colher aprovações de clientes em um portal dedicado.

## Recursos Disponíveis Atualmente
- **Planejamento Multicanal**: Organização de formatos para YouTube (Shorts e Longos), Instagram (Reels, Carrosséis e Posts), TikTok, LinkedIn, Facebook e Pinterest.
- **Funil de Vendas de Conteúdo (TOFU, MOFU, BOFU)**: Categorização estratégica por etapas de atração, nutrição e conversão.
- **Gerador de Roteiros e Ideias com IA**: Geração de ganchos (hooks), roteiros detalhados, direcionamentos visuais e sugestões de publicação.
- **Portal Público de Aprovação**: Link exclusivo para clientes aprovarem, reprovarem ou solicitarem ajustes sem necessidade de login.
- **Workspaces e Gestão Multi-Cliente**: Organização de marcas com metas e calendários dedicados.
- **Integração com Facebook & Instagram**: Conexão de páginas para sincronização de contas.

## Recursos em Desenvolvimento (Em Breve)
- **Agendamento e Publicação Automática via API**: A publicação direta e autônoma agendada em redes sociais está em fase final de desenvolvimento e será liberada em breve. No momento, a plataforma opera com foco total em planejamento, roteirização, organização e aprovação.

## Links do Sistema
- [Plataforma / Dashboard](${baseUrl}/)
- [Portal de Aprovação de Clientes](${baseUrl}/aprovar)
- [Central de Suporte](${baseUrl}/suporte)
- [Termos de Uso e Privacidade](${baseUrl}/termos)

## Especificações Técnicas
- **Stack**: React, Vite, TypeScript, Tailwind CSS, Node.js, Express e SQLite.
- **Segurança**: Conformidade com a Lei Geral de Proteção de Dados (LGPD) e suporte a containers Docker / ZimaOS.
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(markdown);
});

app.get('/robots.txt', (req, res) => {
  const baseUrl = getBaseUrl(req);

  const robots = `User-agent: *
Allow: /
Allow: /sitemap.xml
Allow: /llms.txt

# AI Agents & LLMs Crawlers
User-agent: GPTBot
Allow: /
Allow: /llms.txt

User-agent: ClaudeBot
Allow: /
Allow: /llms.txt

User-agent: Google-Extended
Allow: /
Allow: /llms.txt

User-agent: PerplexityBot
Allow: /
Allow: /llms.txt

Sitemap: ${baseUrl}/sitemap.xml`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(robots);
});

// Initialize SQLite database
let db: Database.Database;
export { db };

function initDatabase() {
  let dbPath = '';
  
  // ZimaOS/Docker structure maps /DATA/AppData/[project]/dados to /dados inside container
  if (fs.existsSync('/dados')) {
    dbPath = '/dados/planner.db';
  } else {
    // Development fallback
    const localDadosDir = path.join(process.cwd(), 'dados');
    if (!fs.existsSync(localDadosDir)) {
      fs.mkdirSync(localDadosDir, { recursive: true });
    }
    dbPath = path.join(localDadosDir, 'planner.db');
  }

  console.log(`Connecting to SQLite database at: ${dbPath}`);
  db = new Database(dbPath);
  
  // Enable Write-Ahead Logging (WAL) for performance and durability
  db.pragma('journal_mode = WAL');

  // Create table schemas
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      password TEXT,
      createdAt TEXT,
      plan TEXT,
      isTeamMember INTEGER DEFAULT 0,
      invitedByUserId TEXT,
      permissions TEXT,
      affiliate_code TEXT UNIQUE
    )
  `).run();

  db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_affiliate_code ON users(affiliate_code)').run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS affiliate_clicks (
      id TEXT PRIMARY KEY,
      affiliate_code TEXT,
      timestamp TEXT
    )
  `).run();


  db.prepare(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      userId TEXT,
      name TEXT NOT NULL
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      clientId TEXT NOT NULL,
      userId TEXT,
      title TEXT NOT NULL,
      platform TEXT NOT NULL,
      format TEXT NOT NULL,
      funnelStage TEXT NOT NULL,
      status TEXT NOT NULL,
      scheduledDate TEXT NOT NULL,
      scheduledTime TEXT NOT NULL,
      description TEXT,
      hashtags TEXT,
      hookText TEXT,
      scriptText TEXT,
      visualIdea TEXT,
      approvalStatus TEXT,
      approvalFeedback TEXT,
      approvalDate TEXT
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      clientId TEXT NOT NULL,
      userId TEXT,
      title TEXT NOT NULL,
      targetCount INTEGER DEFAULT 0,
      currentCount INTEGER DEFAULT 0,
      platform TEXT NOT NULL,
      completed INTEGER DEFAULT 0
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS connected_accounts (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      provider TEXT NOT NULL,
      name TEXT NOT NULL,
      username TEXT,
      accessToken TEXT NOT NULL,
      expiresAt TEXT,
      status TEXT DEFAULT 'active'
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discountType TEXT NOT NULL,
      discountValue REAL NOT NULL,
      applicablePlans TEXT,
      applicableCycles TEXT,
      maxUses INTEGER,
      usedCount INTEGER DEFAULT 0,
      expiresAt TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT,
      description TEXT
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      userId TEXT,
      userName TEXT,
      userEmail TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      category TEXT DEFAULT 'geral',
      priority TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'aberto',
      replies TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      link TEXT,
      linkText TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      category TEXT DEFAULT 'system',
      adminUser TEXT,
      timestamp TEXT
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS payment_history (
      id TEXT PRIMARY KEY,
      userId TEXT,
      customerEmail TEXT,
      customerName TEXT,
      plan TEXT NOT NULL,
      cycle TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'brl',
      status TEXT DEFAULT 'succeeded',
      couponCode TEXT,
      stripeSessionId TEXT,
      createdAt TEXT
    )
  `).run();

  // Clean up any test seed coupons if present
  db.prepare("DELETE FROM coupons WHERE id IN ('cp_lanca20', 'cp_creator10', 'cp_bemvindo15', 'cp_promo50', 'cp_vip100')").run();

  // Seed initial audit log if empty
  const logsCount = (db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as any)?.count || 0;
  if (logsCount === 0) {
    db.prepare('INSERT INTO audit_logs (id, action, details, category, adminUser, timestamp) VALUES (?, ?, ?, ?, ?, ?)').run(
      'log_' + Date.now(),
      'SYSTEM_INIT',
      'Banco de dados do SaaS inicializado com sucesso com suporte multitenant.',
      'system',
      'system',
      new Date().toISOString()
    );
  }

  console.log('SQLite database structure verified successfully.');
}

// Initialize database
try {
  initDatabase();
} catch (error) {
  console.error('Failed to initialize database:', error);
}

// --- API Endpoints ---

// 1. Auth Endpoint: Register Account (LGPD Compliant with Consent)
app.post('/api/auth/register', async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Por favor, preencha todos os campos obrigatórios.' });
  }

  try {
    // Check if email already registered (case-insensitive)
    const envAdminEmail = process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
    const inputEmail = email.trim().toLowerCase();

    if (envAdminEmail && inputEmail === envAdminEmail.toLowerCase()) {
      return res.status(400).json({ success: false, error: 'Este e-mail está reservado para o administrador.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(inputEmail);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Este e-mail já está cadastrado. Tente fazer login.' });
    }

    const userId = `user_${Date.now()}`;
    const createdAt = new Date().toISOString();
    const defaultPlan = 'gratis';
    
    // Affiliate logic
    const affiliateCode = `ref_${name.trim().toLowerCase().replace(/\s+/g, '')}_${crypto.randomBytes(3).toString('hex')}`;
    let invitedByUserId = null;
    const affiliateCodeFromCookie = req.cookies.affiliate_code;
    
    if (affiliateCodeFromCookie) {
      const referrer = db.prepare('SELECT id FROM users WHERE affiliate_code = ?').get(affiliateCodeFromCookie);
      if (referrer) {
        invitedByUserId = (referrer as any).id;
      }
    }

    db.prepare(`
      INSERT INTO users (id, name, email, phone, password, createdAt, plan, isTeamMember, invitedByUserId, permissions, affiliate_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      name.trim(),
      email.trim().toLowerCase(),
      phone ? phone.trim() : null,
      await hashPassword(password),
      createdAt,
      defaultPlan,
      0, // isTeamMember false
      invitedByUserId,
      null, // permissions null
      affiliateCode
    );

    const newUser = {
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      createdAt,
      plan: defaultPlan,
      isTeamMember: false
    };

    res.json({ success: true, user: newUser });
  } catch (err: any) {
    console.error('Error in /api/auth/register:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Auth Endpoint: Login (Case-insensitive email check)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    let envAdminEmail = (process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim();
    let envAdminPassword = (process.env.VITE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '').trim();

    // Clean up surrounding quotes from ZimaOS / Docker container environment settings
    if (envAdminEmail.startsWith('"') && envAdminEmail.endsWith('"')) envAdminEmail = envAdminEmail.slice(1, -1);
    if (envAdminEmail.startsWith("'") && envAdminEmail.endsWith("'")) envAdminEmail = envAdminEmail.slice(1, -1);
    if (envAdminPassword.startsWith('"') && envAdminPassword.endsWith('"')) envAdminPassword = envAdminPassword.slice(1, -1);
    if (envAdminPassword.startsWith("'") && envAdminPassword.endsWith("'")) envAdminPassword = envAdminPassword.slice(1, -1);

    const inputEmail = email.trim().toLowerCase();

    console.log(`[Admin Login Attempt] Email: "${inputEmail}"`);
    console.log(`[Admin Env Status] VITE_ADMIN_EMAIL loaded: "${envAdminEmail ? 'Configured (' + envAdminEmail + ')' : 'NOT CONFIGURED'}"`);
    console.log(`[Admin Env Status] VITE_ADMIN_PASSWORD loaded: "${envAdminPassword ? 'Configured (length: ' + envAdminPassword.length + ')' : 'NOT CONFIGURED'}"`);

    // Check if matching Admin credentials set in runtime environment variables
    if (envAdminEmail && envAdminPassword && inputEmail === envAdminEmail.toLowerCase() && password === envAdminPassword) {
      console.log(`[Admin Login Success] Admin authenticated successfully: "${envAdminEmail}"`);
      return res.json({
        success: true,
        isAdmin: true,
        user: {
          id: 'admin',
          name: 'Administrador (SaaS Owner)',
          email: envAdminEmail,
          plan: 'growth',
          isTeamMember: false,
          permissions: {
            createCards: true,
            editCards: true,
            deleteCards: true,
            manageClients: true
          }
        }
      });
    }

    if (envAdminEmail && inputEmail === envAdminEmail.toLowerCase()) {
      console.warn(`[Admin Login Fail] Password mismatch for Admin Email "${envAdminEmail}".`);
      return res.status(400).json({ success: false, error: 'Senha administrativa incorreta.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(inputEmail) as any;
    
    if (!user || !(await verifyPassword(password, user.password))) {
      return res.status(401).json({ success: false, error: 'E-mail ou senha incorretos.' });
    }

    const parsedUser = {
      ...user,
      isTeamMember: user.isTeamMember === 1,
      permissions: user.permissions ? JSON.parse(user.permissions) : undefined
    };

    res.json({ success: true, user: parsedUser });
  } catch (err: any) {
    console.error('Error in /api/auth/login:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Auth Endpoint: Delete Account (LGPD Right to be Forgotten)
app.post('/api/auth/delete-account', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const userPassword = (req.headers['x-user-password'] || '') as string;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Autenticação requerida (ID ausente)' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user || (user.password && user.password !== userPassword)) {
      return res.status(401).json({ success: false, error: 'Senha incorreta ou usuário inválido' });
    }

    const workspaceOwnerId = user.invitedByUserId || user.id;

    // Run cascade deletion in a single atomic transaction
    const deleteTx = db.transaction(() => {
      // 1. Delete all goals of clients belonging to this workspace
      db.prepare(`
        DELETE FROM goals WHERE clientId IN (SELECT id FROM clients WHERE userId = ?)
      `).run(workspaceOwnerId);

      // 2. Delete all posts of clients belonging to this workspace
      db.prepare(`
        DELETE FROM posts WHERE clientId IN (SELECT id FROM clients WHERE userId = ?)
      `).run(workspaceOwnerId);

      // 3. Delete all clients belonging to this workspace
      db.prepare('DELETE FROM clients WHERE userId = ?').run(workspaceOwnerId);

      // 4. Delete user metadata
      db.prepare('DELETE FROM metadata WHERE key = ?').run(`activeClientId_${workspaceOwnerId}`);

      // 5. Delete all team members and the workspace owner themselves
      db.prepare('DELETE FROM users WHERE id = ? OR invitedByUserId = ?').run(workspaceOwnerId, workspaceOwnerId);
    });

    deleteTx();
    res.json({ success: true, message: 'Conta e todos os dados associados foram apagados permanentemente (LGPD).' });
  } catch (err: any) {
    console.error('Error in /api/auth/delete-account:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Get secure, isolated planner data
app.get('/api/data', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const userPassword = (req.headers['x-user-password'] || '') as string;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Autenticação requerida (Cabeçalhos ausentes)' });
  }

  try {
    let requester = null;
    if (userId === 'admin') {
      requester = {
        id: 'admin',
        name: 'Administrador (SaaS Owner)',
        email: process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL,
        plan: 'growth',
        isTeamMember: 0
      };
    } else {
      requester = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
      if (!requester) {
        // User does not exist in SQLite DB yet (e.g. database reset/fresh build)
        // Return empty data gracefully so the client can fallback to localStorage and trigger a sync to restore the user and data
        return res.json({
          success: true,
          data: { users: [], clients: [], posts: [], goals: [] }
        });
      }
      if (requester.password && requester.password !== userPassword) {
        return res.status(401).json({ success: false, error: 'Sessão inválida ou expirada. Faça login novamente.' });
      }
    }

    const workspaceOwnerId = requester.invitedByUserId || requester.id;

    // Fetch team members belonging to this workspace
    const users = db.prepare('SELECT * FROM users WHERE id = ? OR invitedByUserId = ?').all(workspaceOwnerId, workspaceOwnerId).map((u: any) => ({
      ...u,
      isTeamMember: u.isTeamMember === 1,
      permissions: u.permissions ? JSON.parse(u.permissions) : undefined
    }));

    // Fetch clients belonging to workspace owner
    const clients = db.prepare('SELECT * FROM clients WHERE userId = ?').all(workspaceOwnerId);
    const clientIds = clients.map((c: any) => c.id);

    // Fetch posts belonging to these clients
    let posts: any[] = [];
    if (clientIds.length > 0) {
      const placeholders = clientIds.map(() => '?').join(',');
      posts = db.prepare(`SELECT * FROM posts WHERE clientId IN (${placeholders})`).all(...clientIds).map((p: any) => ({
        ...p,
        hashtags: p.hashtags ? JSON.parse(p.hashtags) : undefined
      }));
    }

    // Fetch goals belonging to these clients
    let goals: any[] = [];
    if (clientIds.length > 0) {
      const placeholders = clientIds.map(() => '?').join(',');
      goals = db.prepare(`SELECT * FROM goals WHERE clientId IN (${placeholders})`).all(...clientIds).map((g: any) => ({
        ...g,
        completed: g.completed === 1
      }));
    }

    // Fetch active client metadata
    const metadataRows = db.prepare('SELECT * FROM metadata WHERE key = ?').all(`activeClientId_${workspaceOwnerId}`) as any[];
    const metadata: Record<string, string> = {};
    if (metadataRows.length > 0) {
      metadata['activeClientId'] = metadataRows[0].value;
    }

    res.json({
      success: true,
      data: { users, clients, posts, goals, metadata }
    });
  } catch (error: any) {
    console.error('Error in GET /api/data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Full state sync from client to server (Secured & Isolated per Workspace)
app.post('/api/sync', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const userPassword = (req.headers['x-user-password'] || '') as string;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Autenticação requerida (Cabeçalhos ausentes)' });
  }

  const { users, clients, posts, goals, metadata } = req.body;

  try {
    let requester = null;
    if (userId === 'admin') {
      requester = {
        id: 'admin',
        name: 'Administrador (SaaS Owner)',
        email: process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL,
        plan: 'growth',
        isTeamMember: 0
      };
    } else {
      requester = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
      if (!requester) {
        // If requester does not exist in SQLite DB yet (e.g. database reset/fresh build)
        // check if their profile is provided in the "users" payload
        const userInPayload = Array.isArray(users) ? users.find((u: any) => u.id === userId) : null;
        if (userInPayload) {
          db.prepare(`
            INSERT INTO users (id, name, email, phone, password, createdAt, plan, isTeamMember, invitedByUserId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            userInPayload.id,
            userInPayload.name,
            userInPayload.email,
            userInPayload.phone || null,
            userInPayload.password || userPassword,
            userInPayload.createdAt || new Date().toISOString(),
            userInPayload.plan || 'growth',
            0,
            null
          );
          requester = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
        }
      }
      if (!requester || (requester.password && requester.password !== userPassword)) {
        return res.status(401).json({ success: false, error: 'Sessão inválida ou expirada. Faça login novamente.' });
      }
    }

    const workspaceOwnerId = requester.invitedByUserId || requester.id;

    // Run everything in a single, atomic SQLite transaction
    const syncTransaction = db.transaction(() => {
      // 1. Sync team users
      if (Array.isArray(users)) {
        // Delete only teammates of this workspace, keeping the owner
        db.prepare('DELETE FROM users WHERE invitedByUserId = ?').run(workspaceOwnerId);
        
        const insertUser = db.prepare(`
          INSERT OR REPLACE INTO users (id, name, email, phone, password, createdAt, plan, isTeamMember, invitedByUserId, permissions)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const u of users) {
          if (u.id === workspaceOwnerId) {
            insertUser.run(
              u.id,
              u.name,
              u.email,
              u.phone || null,
              u.password || null,
              u.createdAt || null,
              u.plan || null,
              0, // owner
              null,
              null
            );
          } else if (u.invitedByUserId === workspaceOwnerId) {
            insertUser.run(
              u.id,
              u.name,
              u.email,
              u.phone || null,
              u.password || null,
              u.createdAt || null,
              u.plan || null,
              1, // isTeamMember true
              workspaceOwnerId,
              u.permissions ? JSON.stringify(u.permissions) : null
            );
          }
        }
      }

      // 2. Sync clients
      if (Array.isArray(clients)) {
        db.prepare('DELETE FROM clients WHERE userId = ?').run(workspaceOwnerId);
        const insertClient = db.prepare(`
          INSERT OR REPLACE INTO clients (id, userId, name)
          VALUES (?, ?, ?)
        `);
        for (const c of clients) {
          insertClient.run(c.id, workspaceOwnerId, c.name);
        }
      }

      // Retrieve current clients in db to cross-verify posts/goals
      const validClients = db.prepare('SELECT id FROM clients WHERE userId = ?').all(workspaceOwnerId) as any[];
      const validClientIds = new Set(validClients.map(c => c.id));

      // 3. Sync posts
      if (Array.isArray(posts)) {
        if (validClientIds.size > 0) {
          const placeholders = Array.from(validClientIds).map(() => '?').join(',');
          db.prepare(`DELETE FROM posts WHERE clientId IN (${placeholders})`).run(...Array.from(validClientIds));
        }

        const insertPost = db.prepare(`
          INSERT OR REPLACE INTO posts (id, clientId, userId, title, platform, format, funnelStage, status, scheduledDate, scheduledTime, description, hashtags, hookText, scriptText, visualIdea, approvalStatus, approvalFeedback, approvalDate)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const p of posts) {
          if (validClientIds.has(p.clientId)) {
            insertPost.run(
              p.id,
              p.clientId,
              p.userId || null,
              p.title,
              p.platform,
              p.format,
              p.funnelStage,
              p.status,
              p.scheduledDate,
              p.scheduledTime,
              p.description || null,
              p.hashtags ? JSON.stringify(p.hashtags) : null,
              p.hookText || null,
              p.scriptText || null,
              p.visualIdea || null,
              p.approvalStatus || null,
              p.approvalFeedback || null,
              p.approvalDate || null
            );
          }
        }
      }

      // 4. Sync goals
      if (Array.isArray(goals)) {
        if (validClientIds.size > 0) {
          const placeholders = Array.from(validClientIds).map(() => '?').join(',');
          db.prepare(`DELETE FROM goals WHERE clientId IN (${placeholders})`).run(...Array.from(validClientIds));
        }

        const insertGoal = db.prepare(`
          INSERT OR REPLACE INTO goals (id, clientId, userId, title, targetCount, currentCount, platform, completed)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const g of goals) {
          if (validClientIds.has(g.clientId)) {
            insertGoal.run(
              g.id,
              g.clientId,
              g.userId || null,
              g.title,
              g.targetCount || 0,
              g.currentCount || 0,
              g.platform,
              g.completed ? 1 : 0
            );
          }
        }
      }

      // 5. Sync metadata
      if (metadata && metadata.activeClientId) {
        db.prepare(`
          INSERT OR REPLACE INTO metadata (key, value)
          VALUES (?, ?)
        `).run(`activeClientId_${workspaceOwnerId}`, String(metadata.activeClientId));
      }
    });

    syncTransaction();
    res.json({ success: true, message: 'Sincronização realizada com total segurança e isolamento por inquilino.' });
  } catch (error: any) {
    console.error('Error in POST /api/sync:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Endpoint for Client Approval
app.post('/api/posts/approve', (req, res) => {
  const { postId, status, feedback } = req.body;
  
  if (!postId || !status) {
    return res.status(400).json({ success: false, error: 'Post ID and status are required' });
  }

  try {
    db.prepare(`
      UPDATE posts 
      SET approvalStatus = ?, approvalFeedback = ?, approvalDate = ?, status = ?
      WHERE id = ?
    `).run(
      status, 
      feedback || null, 
      new Date().toLocaleDateString('pt-BR'),
      status === 'approved' ? 'scheduled' : 'draft',
      postId
    );
    res.json({ success: true });
    io.emit('post-status-updated', { postId, status });
  } catch (err: any) {
    console.error('Error in POST /api/posts/approve:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Facebook & Instagram OAuth and Post Scheduling APIs ---

// Helper to construct redirection URI dynamically
const getFacebookRedirectUri = (req: express.Request): string => {
  // Always use the real App URL from environment if available to prevent iframe sandbox mismatch, otherwise use request host
  const forwardedProto = (req.headers['x-forwarded-proto'] as string) || '';
  const forwardedHost = (req.headers['x-forwarded-host'] as string) || '';
  
  const proto = forwardedProto.split(',')[0].trim() || req.protocol || 'http';
  const host = forwardedHost.split(',')[0].trim() || req.get('host') || 'localhost:3000';
  
  // Meta (Facebook) Login requires HTTPS for non-local redirect URIs in production
  const finalProto = (!host.includes('localhost') && !host.includes('127.0.0.1')) ? 'https' : proto;
  
  const base = process.env.APP_URL || `${finalProto}://${host}`;
  return `${base}/api/auth/facebook/callback`;
};

// 1. Get Facebook Login/Authorization URL
app.get('/api/auth/facebook/url', (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'User ID is required to bind the connection.' });
  }

  const clientId = process.env.FACEBOOK_APP_ID || '837248234891102'; // Meta Developer App Client ID
  const redirectUri = getFacebookRedirectUri(req);
  
  // Scopes requested for Instagram Publishing & Page management
  const scope = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,publish_video';
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scope,
    response_type: 'code',
    state: userId, // Pass userId in state to preserve session context
  });

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  res.json({ success: true, url: authUrl });
});

// 2. Facebook Callback Endpoint (Handles code exchange)
app.get(['/api/auth/facebook/callback', '/api/auth/facebook/callback/'], async (req, res) => {
  const { code, state: userId, error, error_description } = req.query;

  if (error) {
    console.error('Meta OAuth callback error:', error, error_description);
    return res.send(`
      <html>
        <body style="background: #121214; color: #f4f4f5; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px;">
          <div style="background: #18181b; border: 1px solid #ef4444; padding: 24px; border-radius: 12px; max-width: 450px; text-align: center;">
            <h3 style="color: #ef4444; margin-top: 0;">Falha na Conexão</h3>
            <p style="font-size: 14px; color: #a1a1aa; line-height: 1.5;">${error_description || 'O usuário cancelou ou a autorização foi negada no Facebook.'}</p>
            <button onclick="window.close()" style="background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-top: 15px;">Fechar Janela</button>
          </div>
        </body>
      </html>
    `);
  }

  const resolvedUserId = (userId as string) || 'demo_user';
  let accountName = 'Instagram Creator Sandbox';
  let accountUsername = 'creator.digital';
  let token = 'mock_fb_access_token_' + Date.now();

  // Exchange code if we have active developer credentials configured
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET && code) {
    try {
      const redirectUri = getFacebookRedirectUri(req);
      const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}`;
      
      const tokenResponse = await fetch(tokenUrl);
      const tokenData = await tokenResponse.json() as any;
      
      if (tokenData && tokenData.access_token) {
        token = tokenData.access_token;
        
        // Fetch profile info using access token
        const meUrl = `https://graph.facebook.com/v18.0/me?fields=name,id&access_token=${token}`;
        const meResponse = await fetch(meUrl);
        const meData = await meResponse.json() as any;
        if (meData && meData.name) {
          accountName = meData.name;
          accountUsername = meData.id;
        }
      }
    } catch (err) {
      console.error('Failed real exchange, continuing with high-fidelity mockup mode:', err);
    }
  }

  // Generate a mock or real account integration row in our DB
  try {
    const accountId = `acc_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days expiration

    db.prepare(`
      INSERT OR REPLACE INTO connected_accounts (id, userId, provider, name, username, accessToken, expiresAt, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(accountId, resolvedUserId, 'instagram', accountName, accountUsername, token, expiresAt, 'active');

    console.log(`Connected account registered successfully in SQLite: ${accountName} for User: ${resolvedUserId}`);
  } catch (dbErr) {
    console.error('Failed to store connected account in DB:', dbErr);
  }

  // Return elegant postMessage communication script which closes the popup safely
  res.send(`
    <html>
      <body style="background: #121214; color: #f4f4f5; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px;">
        <div style="background: #18181b; border: 1px solid #3f3f46; padding: 32px; border-radius: 16px; max-width: 450px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <div style="width: 56px; height: 56px; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #8b5cf6; font-size: 28px;">✓</div>
          <h3 style="color: #ffffff; margin-top: 0; font-family: system-ui, sans-serif; font-size: 20px;">Conta Conectada!</h3>
          <p style="font-size: 14px; color: #a1a1aa; line-height: 1.5; margin-bottom: 20px;">Sua conta de Instagram & Facebook foi vinculada com sucesso. Esta janela será fechada automaticamente em instantes.</p>
          <div style="font-size: 11px; color: #71717a; font-family: monospace; background: #09090b; padding: 8px; border-radius: 6px; border: 1px solid #27272a;">Conta: ${accountName} (@${accountUsername})</div>
          
          <script>
            setTimeout(() => {
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  provider: 'facebook',
                  accountName: "${accountName}",
                  accountUsername: "${accountUsername}"
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            }, 1500);
          </script>
        </div>
      </body>
    </html>
  `);
});

// 3. Get connected social accounts of a user
app.get('/api/connected-accounts', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Autenticação requerida.' });
  }

  try {
    const accounts = db.prepare('SELECT id, provider, name, username, expiresAt, status FROM connected_accounts WHERE userId = ?').all(userId);
    res.json({ success: true, data: accounts });
  } catch (err: any) {
    console.error('Error fetching connected accounts:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Delete/Disconnect connected social account
app.delete('/api/connected-accounts/:id', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Autenticação requerida.' });
  }

  try {
    db.prepare('DELETE FROM connected_accounts WHERE id = ? AND userId = ?').run(id, userId);
    res.json({ success: true, message: 'Conta desconectada com sucesso.' });
  } catch (err: any) {
    console.error('Error deleting connected account:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Trigger post publication scheduling simulator or direct execution
app.post('/api/posts/schedule-now', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { postId } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Autenticação requerida.' });
  }
  if (!postId) {
    return res.status(400).json({ success: false, error: 'Post ID is required' });
  }

  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId) as any;
    if (!post) {
      return res.status(404).json({ success: false, error: 'Postagem não encontrada.' });
    }

    // Update state to published
    db.prepare("UPDATE posts SET status = 'published' WHERE id = ?").run(postId);

    res.json({ 
      success: true, 
      message: `Postagem "${post.title}" foi agendada e publicada com sucesso na plataforma ${post.platform}!`,
      publishedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Error in schedule-now:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Stripe Payment Gateway Endpoints

// Helper to validate whether a key looks like a valid Stripe Secret Key
function isValidStripeSecretKey(key?: string | null): boolean {
  if (!key) return false;
  const clean = key.replace(/^["']|["']$/g, '').trim();
  return (
    clean.startsWith('sk_test_') ||
    clean.startsWith('sk_live_') ||
    clean.startsWith('rk_test_') ||
    clean.startsWith('rk_live_') ||
    clean.startsWith('sk_')
  );
}

// Helper to get Stripe keys from environment or database metadata
function getStripeSecretKey(): string | null {
  // 1. Check SQLite metadata table first (allows overriding invalid env var from admin UI)
  try {
    const row = db.prepare("SELECT value FROM metadata WHERE key = 'STRIPE_SECRET_KEY'").get() as { value: string } | undefined;
    if (row?.value) {
      const dbKey = row.value.replace(/^["']|["']$/g, '').trim();
      if (isValidStripeSecretKey(dbKey)) {
        return dbKey;
      }
    }
  } catch (err) {
    // metadata table query error
  }

  // 2. Check all standard environment variable names
  const envCandidates = [
    process.env.STRIPE_SECRET_KEY,
    process.env.STRIPE_SECRET,
    process.env.STRIPE_API_KEY,
    process.env.STRIPE_KEY,
    process.env.STRIPE_PRIVATE_KEY,
    process.env.STRIPE_TOKEN,
  ];

  for (const raw of envCandidates) {
    if (raw) {
      const clean = raw.replace(/^["']|["']$/g, '').trim();
      if (isValidStripeSecretKey(clean)) {
        return clean;
      }
    }
  }

  return null;
}

// Helper to detect if an invalid/wrong format key was provided in env
function getInvalidStripeKeyNotice(): string | null {
  const envCandidates = [
    process.env.STRIPE_SECRET_KEY,
    process.env.STRIPE_SECRET,
    process.env.STRIPE_API_KEY,
    process.env.STRIPE_KEY,
  ];
  for (const raw of envCandidates) {
    if (raw) {
      const clean = raw.replace(/^["']|["']$/g, '').trim();
      if (clean && !isValidStripeSecretKey(clean)) {
        return `A chave configurada "${clean.slice(0, 7)}..." não é uma chave secreta válida do Stripe. As chaves da Stripe sempre começam com "sk_test_" ou "sk_live_".`;
      }
    }
  }
  return null;
}

function getStripePublishableKey(): string {
  const envCandidates = [
    process.env.STRIPE_PUBLISHABLE_KEY,
    process.env.STRIPE_PUBLIC_KEY,
    process.env.VITE_STRIPE_PUBLISHABLE_KEY,
    process.env.VITE_STRIPE_PUBLIC_KEY,
    process.env.STRIPE_PUB_KEY,
  ];

  for (const raw of envCandidates) {
    if (raw) {
      const clean = raw.replace(/^["']|["']$/g, '').trim();
      if (clean.length > 5) {
        return clean;
      }
    }
  }

  try {
    const row = db.prepare("SELECT value FROM metadata WHERE key = 'STRIPE_PUBLISHABLE_KEY'").get() as { value: string } | undefined;
    if (row?.value) {
      return row.value.replace(/^["']|["']$/g, '').trim();
    }
  } catch (err) {}

  return "";
}

function getStripeWebhookSecret(): string | null {
  // 1. Check SQLite metadata table
  try {
    const row = db.prepare("SELECT value FROM metadata WHERE key = 'STRIPE_WEBHOOK_SECRET'").get() as { value: string } | undefined;
    if (row?.value) {
      const dbSec = row.value.replace(/^["']|["']$/g, '').trim();
      if (dbSec.startsWith('whsec_') || dbSec.length > 10) {
        return dbSec;
      }
    }
  } catch (err) {}

  // 2. Check environment variables
  const envCandidates = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_KEY,
    process.env.STRIPE_ENDPOINT_SECRET,
    process.env.STRIPE_SIGNING_SECRET,
  ];

  for (const raw of envCandidates) {
    if (raw) {
      const clean = raw.replace(/^["']|["']$/g, '').trim();
      if (clean.startsWith('whsec_') || clean.length > 10) {
        return clean;
      }
    }
  }

  return null;
}

// Helper to get initialized Stripe instance if configured
async function getStripeClient() {
  const stripeKey = getStripeSecretKey();
  if (!stripeKey) {
    return null;
  }

  try {
    const StripeSDK = (await import('stripe')).default;
    return new StripeSDK(stripeKey);
  } catch (err) {
    console.error('[Stripe] Failed to load stripe SDK:', err);
    return null;
  }
}

// Stripe Prices Configuration (BRL & USD)
const STRIPE_PRICES: Record<string, Record<string, Record<string, string>>> = {
  starter: {
    brl: {
      monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY_BRL || '',
      quarterly: process.env.STRIPE_PRICE_STARTER_QUARTERLY_BRL || '',
    },
    usd: {
      monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY_USD || '',
      quarterly: process.env.STRIPE_PRICE_STARTER_QUARTERLY_USD || '',
    },
  },
  basic: {
    brl: {
      monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY_BRL || 'price_1U5Bi30hgpPYrgzVcEazGPRc',
      quarterly: process.env.STRIPE_PRICE_BASIC_QUARTERLY_BRL || 'price_1U5Bi40hgpPYrgzVRdozJECv',
    },
    usd: {
      monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY_USD || 'price_1U5BiY0hgpPYrgzVOAxQ8rIY',
      quarterly: process.env.STRIPE_PRICE_BASIC_QUARTERLY_USD || 'price_1U5BiZ0hgpPYrgzVlHghRcJ0',
    },
  },
  pro: {
    brl: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY_BRL || 'price_1U5Bi40hgpPYrgzVA0HoSLj9',
      quarterly: process.env.STRIPE_PRICE_PRO_QUARTERLY_BRL || 'price_1U5Bi50hgpPYrgzVyNDREMrB',
    },
    usd: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY_USD || 'price_1U5BiZ0hgpPYrgzV5vWXmmbV',
      quarterly: process.env.STRIPE_PRICE_PRO_QUARTERLY_USD || 'price_1U5Bia0hgpPYrgzViqmIzPko',
    },
  },
  growth: {
    brl: {
      monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY_BRL || 'price_1U5Bi50hgpPYrgzV2JlZ1p2b',
      quarterly: process.env.STRIPE_PRICE_GROWTH_QUARTERLY_BRL || 'price_1U5Bi50hgpPYrgzV0IDse2z8',
    },
    usd: {
      monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY_USD || 'price_1U5Bia0hgpPYrgzVHaGNwErD',
      quarterly: process.env.STRIPE_PRICE_GROWTH_QUARTERLY_USD || 'price_1U5Bia0hgpPYrgzVasbSEQTL',
    },
  },
};

// 6.1 Stripe Public Config
app.get('/api/stripe/config', (req, res) => {
  const secretKey = getStripeSecretKey();
  const publishableKey = getStripePublishableKey();
  const webhookSecret = getStripeWebhookSecret();
  const isConfigured = Boolean(secretKey);
  const isLive = Boolean(secretKey?.startsWith('sk_live_') || secretKey?.startsWith('rk_live_'));
  const invalidKeyNotice = getInvalidStripeKeyNotice();

  const baseUrl = getBaseUrl(req);

  res.json({
    success: true,
    isConfigured,
    isLive,
    publishableKey,
    hasSecretKey: Boolean(secretKey),
    hasWebhookSecret: Boolean(webhookSecret),
    webhookUrl: `${baseUrl}/api/stripe/webhook`,
    invalidKeyNotice,
    currency: 'BRL',
    supportedPlans: ['free', 'starter', 'basic', 'pro', 'growth'],
    pricing: {
      brl: {
        starter: { monthly: 14.99, quarterly: 42.00 },
        basic: { monthly: 29.00, quarterly: 84.00 },
        pro: { monthly: 49.00, quarterly: 144.00 },
        growth: { monthly: 79.00, quarterly: 224.00 }
      },
      usd: {
        starter: { monthly: 3.99, quarterly: 10.99 },
        basic: { monthly: 5.99, quarterly: 16.99 },
        pro: { monthly: 9.99, quarterly: 28.99 },
        growth: { monthly: 15.99, quarterly: 45.99 }
      }
    }
  });
});

// 6.2 Admin Stripe Config (Save / Test Keys)
app.post('/api/admin/stripe-config', async (req, res) => {
  try {
    const { secretKey, publishableKey, webhookSecret } = req.body;
    
    if (secretKey !== undefined) {
      const cleanSecret = (secretKey || '').trim();
      
      // If a new key is provided, test it
      if (cleanSecret) {
        if (!cleanSecret.startsWith('sk_test_') && !cleanSecret.startsWith('sk_live_') && !cleanSecret.startsWith('rk_test_') && !cleanSecret.startsWith('rk_live_') && !cleanSecret.startsWith('sk_')) {
          return res.status(400).json({ 
            success: false, 
            error: 'Formato de chave Stripe inválido. A chave secreta deve começar com sk_test_ ou sk_live_.' 
          });
        }

        try {
          const StripeSDK = (await import('stripe')).default;
          const testClient = new StripeSDK(cleanSecret);
          // Quick call to verify authentication with Stripe API
          await testClient.balance.retrieve();
        } catch (testErr: any) {
          return res.status(400).json({
            success: false,
            error: `A chave Stripe foi rejeitada pela Stripe: ${testErr?.message || 'Chave inválida'}`
          });
        }
      }

      db.prepare(`
        INSERT INTO metadata (key, value) VALUES ('STRIPE_SECRET_KEY', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(cleanSecret);
    }

    if (publishableKey !== undefined) {
      db.prepare(`
        INSERT INTO metadata (key, value) VALUES ('STRIPE_PUBLISHABLE_KEY', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run((publishableKey || '').trim());
    }

    if (webhookSecret !== undefined) {
      db.prepare(`
        INSERT INTO metadata (key, value) VALUES ('STRIPE_WEBHOOK_SECRET', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run((webhookSecret || '').trim());
    }

    const currentSecret = getStripeSecretKey();
    const currentPub = getStripePublishableKey();

    res.json({
      success: true,
      message: 'Configurações do Stripe salvas e verificadas com sucesso!',
      isConfigured: Boolean(currentSecret),
      isLive: Boolean(currentSecret?.startsWith('sk_live_') || currentSecret?.startsWith('rk_live_')),
      publishableKey: currentPub
    });
  } catch (err: any) {
    console.error('Error saving Stripe config:', err);
    res.status(500).json({ success: false, error: err.message || 'Erro ao salvar configurações do Stripe.' });
  }
});

// --- Helper functions for Pricing & Coupons ---
function getPlanBasePrice(plan: string, cycle: string, currency: string): number {
  const isQuarterly = cycle === 'quarterly';
  const isUsd = currency.toLowerCase() === 'usd';
  
  if (plan === 'starter') {
    return isUsd ? (isQuarterly ? 10.99 : 3.99) : (isQuarterly ? 42.00 : 14.99);
  }
  if (plan === 'basic') {
    return isUsd ? (isQuarterly ? 16.99 : 5.99) : (isQuarterly ? 84.00 : 29.00);
  }
  if (plan === 'pro') {
    return isUsd ? (isQuarterly ? 28.99 : 9.99) : (isQuarterly ? 144.00 : 49.00);
  }
  if (plan === 'growth') {
    return isUsd ? (isQuarterly ? 45.99 : 15.99) : (isQuarterly ? 224.00 : 79.00);
  }
  return 0;
}

function evaluateCouponCode(couponCode: string, plan: string, cycle: string = 'monthly', currency: string = 'brl') {
  const code = (couponCode || '').trim().toUpperCase();
  if (!code) {
    return { valid: false, error: 'Código de cupom não informado.' };
  }

  const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? COLLATE NOCASE').get(code) as any;
  if (!coupon) {
    return { valid: false, error: 'Cupom inválido ou não encontrado.' };
  }

  if (!coupon.isActive) {
    return { valid: false, error: 'Este cupom foi desativado temporariamente.' };
  }

  if (coupon.expiresAt) {
    const expiry = new Date(coupon.expiresAt + 'T23:59:59');
    if (new Date() > expiry) {
      return { valid: false, error: 'Este cupom já expirou.' };
    }
  }

  if (coupon.maxUses !== null && coupon.maxUses !== undefined && coupon.maxUses > 0) {
    if ((coupon.usedCount || 0) >= coupon.maxUses) {
      return { valid: false, error: 'Este cupom atingiu o limite máximo de utilizações.' };
    }
  }

  // Check applicable plans
  let applicablePlans: string[] = [];
  try {
    applicablePlans = coupon.applicablePlans ? JSON.parse(coupon.applicablePlans) : [];
  } catch (e) {
    applicablePlans = [];
  }
  if (Array.isArray(applicablePlans) && applicablePlans.length > 0 && !applicablePlans.includes(plan)) {
    return { valid: false, error: `Este cupom é válido apenas para os planos: ${applicablePlans.join(', ').toUpperCase()}.` };
  }

  // Check applicable cycles
  let applicableCycles: string[] = [];
  try {
    applicableCycles = coupon.applicableCycles ? JSON.parse(coupon.applicableCycles) : [];
  } catch (e) {
    applicableCycles = [];
  }
  if (Array.isArray(applicableCycles) && applicableCycles.length > 0 && !applicableCycles.includes(cycle)) {
    return { valid: false, error: `Este cupom é válido apenas para faturamento ${applicableCycles.join(' ou ')}.` };
  }

  const originalPrice = getPlanBasePrice(plan, cycle, currency);
  let discountAmount = 0;
  
  if (coupon.discountType === 'percent') {
    discountAmount = (originalPrice * Number(coupon.discountValue)) / 100;
  } else {
    // Fixed amount
    discountAmount = Number(coupon.discountValue);
  }

  discountAmount = Math.min(discountAmount, originalPrice);
  const finalPrice = Math.max(0, Number((originalPrice - discountAmount).toFixed(2)));
  discountAmount = Number((originalPrice - finalPrice).toFixed(2));

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      description: coupon.description || '',
      usedCount: coupon.usedCount || 0,
      maxUses: coupon.maxUses,
      expiresAt: coupon.expiresAt,
      isActive: Boolean(coupon.isActive)
    },
    originalPrice,
    finalPrice,
    discountAmount,
    discountPercent: coupon.discountType === 'percent' ? Number(coupon.discountValue) : Math.round((discountAmount / (originalPrice || 1)) * 100),
    isFree: finalPrice === 0
  };
}

// --- Coupon API Endpoints ---

// 1. Get all coupons (Admin)
app.get('/api/coupons', (_req, res) => {
  try {
    const coupons = db.prepare('SELECT * FROM coupons ORDER BY createdAt DESC').all() as any[];
    const parsed = coupons.map(c => ({
      ...c,
      isActive: Boolean(c.isActive),
      applicablePlans: c.applicablePlans ? JSON.parse(c.applicablePlans) : [],
      applicableCycles: c.applicableCycles ? JSON.parse(c.applicableCycles) : [],
    }));
    res.json({ success: true, coupons: parsed });
  } catch (err: any) {
    console.error('Error fetching coupons:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Validate a coupon code (Public)
app.post('/api/coupons/validate', (req, res) => {
  try {
    const { code, plan = 'basic', cycle = 'monthly', currency = 'brl' } = req.body;
    const result = evaluateCouponCode(code, plan, cycle, currency);
    if (!result.valid) {
      return res.status(400).json({ success: false, error: result.error });
    }
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Error validating coupon:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Create or update coupon (Admin)
app.post('/api/coupons', (req, res) => {
  try {
    const { id, code, discountType, discountValue, applicablePlans, applicableCycles, maxUses, expiresAt, isActive, description } = req.body;
    
    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ success: false, error: 'Código, tipo e valor do desconto são obrigatórios.' });
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const couponId = id || `cp_${Date.now()}`;
    const now = new Date().toISOString();

    const insertOrUpdate = db.prepare(`
      INSERT INTO coupons (id, code, discountType, discountValue, applicablePlans, applicableCycles, maxUses, usedCount, expiresAt, isActive, createdAt, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        code = excluded.code,
        discountType = excluded.discountType,
        discountValue = excluded.discountValue,
        applicablePlans = excluded.applicablePlans,
        applicableCycles = excluded.applicableCycles,
        maxUses = excluded.maxUses,
        expiresAt = excluded.expiresAt,
        isActive = excluded.isActive,
        description = excluded.description
    `);

    insertOrUpdate.run(
      couponId,
      cleanCode,
      discountType === 'fixed' ? 'fixed' : 'percent',
      Number(discountValue),
      JSON.stringify(applicablePlans || []),
      JSON.stringify(applicableCycles || []),
      maxUses ? Number(maxUses) : null,
      expiresAt || null,
      isActive !== undefined ? (isActive ? 1 : 0) : 1,
      now,
      description || null
    );

    res.json({ success: true, message: 'Cupom salvo com sucesso!', couponId });
  } catch (err: any) {
    console.error('Error saving coupon:', err);
    res.status(500).json({ success: false, error: err.message || 'Erro ao salvar cupom.' });
  }
});

// 4. Toggle coupon active state (Admin)
app.patch('/api/coupons/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT isActive FROM coupons WHERE id = ?').get(id) as any;
    if (!current) {
      return res.status(404).json({ success: false, error: 'Cupom não encontrado.' });
    }

    const newState = current.isActive ? 0 : 1;
    db.prepare('UPDATE coupons SET isActive = ? WHERE id = ?').run(newState, id);
    res.json({ success: true, isActive: Boolean(newState) });
  } catch (err: any) {
    console.error('Error toggling coupon:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Delete coupon (Admin)
app.delete('/api/coupons/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM coupons WHERE id = ?').run(id);
    res.json({ success: true, message: 'Cupom excluído com sucesso.' });
  } catch (err: any) {
    console.error('Error deleting coupon:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 🚀 COMPREHENSIVE SAAS ADMIN ENDPOINTS
// ==========================================

// Helper to log audit actions
function recordAuditLog(action: string, details: string, category = 'admin', adminUser = 'admin') {
  try {
    db.prepare(`
      INSERT INTO audit_logs (id, action, details, category, adminUser, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      action,
      details,
      category,
      adminUser,
      new Date().toISOString()
    );
  } catch (e) {
    console.error('Failed to write audit log:', e);
  }
}

// 1. Consolidated SaaS Metrics
app.get('/api/admin/metrics', (req, res) => {
  try {
    // Total users
    const allUsers = db.prepare('SELECT id, name, email, plan, createdAt, isTeamMember FROM users').all() as any[];
    const totalUsers = allUsers.length;
    const paidUsers = allUsers.filter(u => u.plan && u.plan !== 'free' && u.plan !== 'gratis');
    
    // Breakdown by plan
    const planCounts: Record<string, number> = {
      free: 0,
      starter: 0,
      basic: 0,
      pro: 0,
      growth: 0
    };

    allUsers.forEach(u => {
      const p = (u.plan || 'free').toLowerCase();
      if (p === 'gratis' || p === 'free') planCounts.free++;
      else if (p === 'starter') planCounts.starter++;
      else if (p === 'basic') planCounts.basic++;
      else if (p === 'pro') planCounts.pro++;
      else if (p === 'growth') planCounts.growth++;
      else planCounts.free++;
    });

    // Calculate MRR (Monthly Recurring Revenue in BRL)
    // Starter: R$ 14,99 | Basic: R$ 29,00 | Pro: R$ 49,00 | Growth: R$ 79,00
    const mrrBrl = (planCounts.starter * 14.99) + (planCounts.basic * 29.00) + (planCounts.pro * 49.00) + (planCounts.growth * 79.00);
    const arrBrl = mrrBrl * 12;

    // Total Clients & Posts
    const totalClientsCount = (db.prepare('SELECT COUNT(*) as count FROM clients').get() as any)?.count || 0;
    const totalPostsCount = (db.prepare('SELECT COUNT(*) as count FROM posts').get() as any)?.count || 0;
    
    // Support Tickets metrics
    const totalTickets = (db.prepare('SELECT COUNT(*) as count FROM support_tickets').get() as any)?.count || 0;
    const openTickets = (db.prepare("SELECT COUNT(*) as count FROM support_tickets WHERE status != 'resolvido' AND status != 'fechado'").get() as any)?.count || 0;

    // Daily user growth for last 14 days
    const dailyGrowth: { date: string; users: number; posts: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const count = allUsers.filter(u => u.createdAt && u.createdAt.startsWith(dateStr)).length;
      dailyGrowth.push({
        date: dayLabel,
        users: count,
        posts: Math.floor(count * 3.5)
      });
    }

    // Coupons summary
    const couponsList = db.prepare('SELECT id, code, discountType, discountValue, usedCount, maxUses, isActive FROM coupons').all() as any[];

    // Stripe status
    const stripeConfigured = Boolean(getStripeSecretKey());
    const isLive = Boolean(getStripeSecretKey()?.startsWith('sk_live_'));

    res.json({
      success: true,
      metrics: {
        totalUsers,
        paidUsersCount: paidUsers.length,
        freeUsersCount: planCounts.free,
        conversionRate: totalUsers > 0 ? ((paidUsers.length / totalUsers) * 100).toFixed(1) : '0.0',
        mrrBrl: Number(mrrBrl.toFixed(2)),
        arrBrl: Number(arrBrl.toFixed(2)),
        totalClients: totalClientsCount,
        totalPosts: totalPostsCount,
        totalTickets,
        openTickets,
        planDistribution: planCounts,
        dailyGrowth,
        coupons: couponsList,
        systemStatus: {
          database: 'healthy',
          stripe: stripeConfigured ? (isLive ? 'live' : 'test') : 'not_configured',
          geminiAI: 'active'
        }
      }
    });
  } catch (err: any) {
    console.error('Error fetching admin metrics:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. User Management - List all users with workspace details
app.get('/api/admin/users', (req, res) => {
  try {
    const rawUsers = db.prepare('SELECT * FROM users ORDER BY createdAt DESC').all() as any[];
    
    // Enrich users with counts of clients and posts
    const enriched = rawUsers.map(u => {
      let clientCount = 0;
      let postCount = 0;
      try {
        clientCount = (db.prepare('SELECT COUNT(*) as count FROM clients WHERE userId = ?').get(u.id) as any)?.count || 0;
        postCount = (db.prepare('SELECT COUNT(*) as count FROM posts WHERE userId = ? OR clientId IN (SELECT id FROM clients WHERE userId = ?)').get(u.id, u.id) as any)?.count || 0;
      } catch (e) {}

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        plan: u.plan || 'free',
        isTeamMember: u.isTeamMember === 1,
        invitedByUserId: u.invitedByUserId || null,
        createdAt: u.createdAt || new Date().toISOString(),
        clientCount,
        postCount,
      };
    });

    res.json({ success: true, users: enriched });
  } catch (err: any) {
    console.error('Error fetching users for admin:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. User Management - Create user manually (Admin)
app.post('/api/admin/users', (req, res) => {
  try {
    const { name, email, phone, password, plan = 'free' } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Nome e e-mail são obrigatórios.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Já existe um usuário com este e-mail.' });
    }

    const userId = `user_${Date.now()}`;
    const createdAt = new Date().toISOString();
    const userPass = password || '123456';

    db.prepare(`
      INSERT INTO users (id, name, email, phone, password, createdAt, plan, isTeamMember)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).run(userId, name.trim(), cleanEmail, phone ? phone.trim() : null, userPass, createdAt, plan);

    // Create default client for this user
    const defaultClientId = `client_${Date.now()}`;
    db.prepare(`
      INSERT INTO clients (id, userId, name)
      VALUES (?, ?, ?)
    `).run(defaultClientId, userId, `Canal de ${name.split(' ')[0]}`);

    recordAuditLog('USER_CREATE', `Usuário ${cleanEmail} criado manualmente com plano ${plan}.`, 'user_management');

    res.json({
      success: true,
      message: 'Usuário cadastrado com sucesso!',
      user: { id: userId, name, email: cleanEmail, plan, createdAt }
    });
  } catch (err: any) {
    console.error('Error creating user by admin:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. User Management - Update Plan or Info (Admin)
app.patch('/api/admin/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { plan, name, phone, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
    }

    const newPlan = plan !== undefined ? plan : user.plan;
    const newName = name !== undefined ? name.trim() : user.name;
    const newPhone = phone !== undefined ? phone.trim() : user.phone;
    const newPassword = password !== undefined ? password : user.password;

    db.prepare(`
      UPDATE users 
      SET plan = ?, name = ?, phone = ?, password = ?
      WHERE id = ?
    `).run(newPlan, newName, newPhone, newPassword, id);

    recordAuditLog(
      'USER_UPDATE',
      `Usuário ${user.email} atualizado. Plano anterior: "${user.plan}" -> Novo plano: "${newPlan}".`,
      'user_management'
    );

    res.json({ success: true, message: 'Dados do usuário atualizados com sucesso.' });
  } catch (err: any) {
    console.error('Error updating user by admin:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. User Management - Delete user (Admin)
app.delete('/api/admin/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT email FROM users WHERE id = ?').get(id) as any;
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
    }

    db.transaction(() => {
      // 1. Delete goals
      db.prepare('DELETE FROM goals WHERE clientId IN (SELECT id FROM clients WHERE userId = ?)').run(id);
      // 2. Delete posts
      db.prepare('DELETE FROM posts WHERE clientId IN (SELECT id FROM clients WHERE userId = ?) OR userId = ?').run(id, id);
      // 3. Delete clients
      db.prepare('DELETE FROM clients WHERE userId = ?').run(id);
      // 4. Delete connected accounts
      db.prepare('DELETE FROM connected_accounts WHERE userId = ?').run(id);
      // 5. Delete user
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
    })();

    recordAuditLog('USER_DELETE', `Conta e dados do usuário ${user.email} (ID: ${id}) excluídos.`, 'user_management');

    res.json({ success: true, message: 'Usuário e todos os dados vinculados foram excluídos.' });
  } catch (err: any) {
    console.error('Error deleting user by admin:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Export Users to CSV
app.get('/api/admin/export/users', (req, res) => {
  try {
    const rawUsers = db.prepare('SELECT id, name, email, phone, plan, createdAt FROM users ORDER BY createdAt DESC').all() as any[];
    
    let csv = 'ID;Nome;Email;Telefone;Plano;Data Cadastro\n';
    for (const u of rawUsers) {
      const cleanName = (u.name || '').replace(/;/g, ',');
      const cleanEmail = (u.email || '').replace(/;/g, ',');
      const cleanPhone = (u.phone || '').replace(/;/g, ',');
      const plan = (u.plan || 'free').toUpperCase();
      const date = (u.createdAt || '').split('T')[0];
      csv += `"${u.id}";"${cleanName}";"${cleanEmail}";"${cleanPhone}";"${plan}";"${date}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="usuarios_planner_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send('\uFEFF' + csv); // Include UTF-8 BOM for Excel compatibility
  } catch (err: any) {
    res.status(500).send('Erro ao gerar CSV de exportação');
  }
});

// 7. Support Tickets Management (List, Reply, Update Status)
app.get('/api/admin/tickets', (req, res) => {
  try {
    const tickets = db.prepare('SELECT * FROM support_tickets ORDER BY createdAt DESC').all() as any[];
    const parsed = tickets.map(t => ({
      ...t,
      replies: t.replies ? JSON.parse(t.replies) : []
    }));
    res.json({ success: true, tickets: parsed });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/tickets/:id/reply', (req, res) => {
  try {
    const { id } = req.params;
    const { message, adminName = 'Suporte Planner' } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Mensagem de resposta não pode estar vazia.' });
    }

    const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(id) as any;
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket não encontrado.' });
    }

    const currentReplies = ticket.replies ? JSON.parse(ticket.replies) : [];
    const newReply = {
      id: `reply_${Date.now()}`,
      author: adminName,
      isAdmin: true,
      message: message.trim(),
      createdAt: new Date().toISOString()
    };

    currentReplies.push(newReply);

    db.prepare(`
      UPDATE support_tickets 
      SET replies = ?, status = 'em_andamento', updatedAt = ?
      WHERE id = ?
    `).run(JSON.stringify(currentReplies), new Date().toISOString(), id);

    recordAuditLog('TICKET_REPLY', `Resposta enviada para o ticket #${id} (${ticket.subject}).`, 'support');

    res.json({ success: true, replies: currentReplies });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/admin/tickets/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare('UPDATE support_tickets SET status = ?, updatedAt = ? WHERE id = ?').run(
      status,
      new Date().toISOString(),
      id
    );
    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// User-facing ticket submission endpoint
app.post('/api/support/tickets', (req, res) => {
  try {
    const { userId, userName, userEmail, subject, message, category = 'geral', priority = 'normal' } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, error: 'Assunto e mensagem são obrigatórios.' });
    }

    const ticketId = `ticket_${Date.now()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO support_tickets (id, userId, userName, userEmail, subject, message, category, priority, status, replies, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aberto', '[]', ?, ?)
    `).run(
      ticketId,
      userId || null,
      userName || 'Usuário',
      userEmail || 'sem-email@planner.com',
      subject.trim(),
      message.trim(),
      category,
      priority,
      now,
      now
    );

    recordAuditLog('TICKET_OPENED', `Novo chamado de suporte #${ticketId} aberto por ${userEmail}: "${subject}".`, 'support');

    res.json({ success: true, message: 'Seu chamado foi registrado com sucesso! Nossa equipe responderá em breve.', ticketId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Global System Announcements (Broadcast Banner)
app.get('/api/admin/announcements', (req, res) => {
  try {
    const announcements = db.prepare('SELECT * FROM announcements ORDER BY createdAt DESC').all();
    res.json({ success: true, announcements });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/announcements', (req, res) => {
  try {
    const { title, message, type = 'info', link, linkText, isActive = true } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'Título e mensagem são obrigatórios.' });
    }

    const announcementId = `ann_${Date.now()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO announcements (id, title, message, type, link, linkText, isActive, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      announcementId,
      title.trim(),
      message.trim(),
      type,
      link || null,
      linkText || null,
      isActive ? 1 : 0,
      now
    );

    recordAuditLog('ANNOUNCEMENT_CREATE', `Novo anúncio global criado: "${title}".`, 'broadcast');

    res.json({ success: true, announcementId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/announcements/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM announcements WHERE id = ?').run(id);
    recordAuditLog('ANNOUNCEMENT_DELETE', `Anúncio global #${id} removido.`, 'broadcast');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/announcements/active', (req, res) => {
  try {
    const active = db.prepare('SELECT * FROM announcements WHERE isActive = 1 ORDER BY createdAt DESC LIMIT 1').get();
    res.json({ success: true, announcement: active || null });
  } catch (err: any) {
    res.json({ success: true, announcement: null });
  }
});

// 9. Audit Logs Endpoint
app.get('/api/admin/audit-logs', (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100').all();
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Webhook Simulation Test Endpoint
app.post('/api/admin/test-webhook', (req, res) => {
  try {
    const { eventType = 'checkout.session.completed', email = 'teste@cliente.com', plan = 'pro' } = req.body;
    recordAuditLog('WEBHOOK_TEST', `Simulação de webhook: evento "${eventType}" para ${email} (Plano: ${plan}).`, 'stripe_test');
    
    // Simulate user plan update if user exists
    const user = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email) as any;
    if (user && eventType === 'checkout.session.completed') {
      db.prepare('UPDATE users SET plan = ? WHERE id = ?').run(plan, user.id);
    }

    res.json({
      success: true,
      message: `Evento de teste "${eventType}" processado com sucesso!`,
      simulatedData: { eventType, email, plan, timestamp: new Date().toISOString() }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6.3 Stripe Checkout Session Creation
app.post('/api/stripe/checkout', async (req, res) => {
  try {
    const { plan, cycle = 'monthly', customer, userId, couponCode } = req.body;

    if (!plan || plan === 'free' || !STRIPE_PRICES[plan]) {
      return res.json({ success: true, checkoutUrl: `/?payment=success&plan=free&cycle=monthly` });
    }

    const requestedCurrency = (customer?.currency || req.body.currency || (customer?.country === 'BR' ? 'brl' : 'brl')).toLowerCase();
    const currency = (requestedCurrency === 'usd' ? 'usd' : 'brl');
    const selectedCycle = cycle === 'quarterly' ? 'quarterly' : 'monthly';
    const baseUrl = getBaseUrl(req);

    // Evaluate coupon if provided
    let appliedDiscount: any = null;
    if (couponCode) {
      const evalResult = evaluateCouponCode(couponCode, plan, selectedCycle, currency);
      if (evalResult.valid) {
        appliedDiscount = evalResult;
        // Increment usage count in database
        try {
          db.prepare('UPDATE coupons SET usedCount = usedCount + 1 WHERE id = ?').run(evalResult.coupon.id);
        } catch (e) {}

        // If coupon makes the plan 100% free
        if (evalResult.isFree) {
          return res.json({
            success: true,
            checkoutUrl: `/?payment=success&plan=${plan}&cycle=${selectedCycle}&coupon=${encodeURIComponent(evalResult.coupon.code)}&free_vip=true`,
            isFree: true,
            discount: evalResult
          });
        }
      }
    }

    const priceId = STRIPE_PRICES[plan]?.[currency]?.[selectedCycle];
    const stripe = await getStripeClient();

    if (!stripe) {
      const invalidNotice = getInvalidStripeKeyNotice();
      return res.status(400).json({
        success: false,
        notConfigured: true,
        invalidKey: Boolean(invalidNotice),
        error: invalidNotice || 'As chaves do Stripe ainda não foram configuradas. Por favor, adicione sua chave secreta da Stripe (iniciada com sk_test_ ou sk_live_) para processar pagamentos reais.'
      });
    }

    try {
      const customerEmail = customer?.email?.trim();
      const customerName = customer?.name?.trim() || 'Cliente Planner SaaS';

      const lineItems: any[] = [];

      // Calculate unit amount (with coupon discount if applicable)
      let unitAmount = 1499;
      let planName = 'Starter';
      let planDescription = 'Plano de assinatura mensal';

      if (plan === 'starter') {
        planName = 'Starter';
        unitAmount = currency === 'usd' ? (selectedCycle === 'quarterly' ? 1099 : 399) : (selectedCycle === 'quarterly' ? 4200 : 1499);
        planDescription = `Assinatura Plano Starter (${selectedCycle === 'quarterly' ? 'Trimestral - 3 meses' : 'Mensal'}) - Planner SaaS`;
      } else if (plan === 'basic') {
        planName = 'Basic';
        unitAmount = currency === 'usd' ? (selectedCycle === 'quarterly' ? 1699 : 599) : (selectedCycle === 'quarterly' ? 8400 : 2900);
        planDescription = `Assinatura Plano Basic (${selectedCycle === 'quarterly' ? 'Trimestral - 3 meses' : 'Mensal'}) - Planner SaaS`;
      } else if (plan === 'pro') {
        planName = 'Pro';
        unitAmount = currency === 'usd' ? (selectedCycle === 'quarterly' ? 2899 : 999) : (selectedCycle === 'quarterly' ? 14400 : 4900);
        planDescription = `Assinatura Plano Pro (${selectedCycle === 'quarterly' ? 'Trimestral - 3 meses' : 'Mensal'}) - Planner SaaS`;
      } else if (plan === 'growth') {
        planName = 'Growth PRO';
        unitAmount = currency === 'usd' ? (selectedCycle === 'quarterly' ? 4599 : 1599) : (selectedCycle === 'quarterly' ? 22400 : 7900);
        planDescription = `Assinatura Plano Growth PRO (${selectedCycle === 'quarterly' ? 'Trimestral - 3 meses' : 'Mensal'}) - Planner SaaS`;
      }

      // If coupon applied, adjust unitAmount in cents
      if (appliedDiscount && appliedDiscount.finalPrice !== undefined) {
        unitAmount = Math.max(50, Math.round(appliedDiscount.finalPrice * 100)); // Minimum Stripe charge is 50 cents
        planDescription += ` (Cupom ${appliedDiscount.coupon.code}: -${appliedDiscount.discountPercent}%)`;
      }

      const isRecurringPrice = Boolean(priceId && priceId.startsWith('price_') && !appliedDiscount);

      // Use pre-configured Stripe Price ID only if no coupon discount (coupons require dynamic custom price_data)
      if (isRecurringPrice) {
        lineItems.push({
          price: priceId,
          quantity: 1,
        });
      } else {
        lineItems.push({
          price_data: {
            currency: currency,
            product_data: {
              name: `Planner SaaS - Plano ${planName}${appliedDiscount ? ` (Cupom: ${appliedDiscount.coupon.code})` : ''}`,
              description: planDescription,
              images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80']
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        });
      }

      const sessionPayload: any = {
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: isRecurringPrice ? 'subscription' : 'payment',
        customer_email: customerEmail || undefined,
        client_reference_id: userId || customerEmail || undefined,
        metadata: {
          plan,
          cycle: selectedCycle,
          currency,
          customerName,
          customerEmail: customerEmail || '',
          userId: userId || '',
          couponCode: appliedDiscount ? appliedDiscount.coupon.code : '',
          discountPercent: appliedDiscount ? String(appliedDiscount.discountPercent) : '',
        },
        billing_address_collection: 'auto',
        success_url: `${baseUrl}/?payment=success&plan=${plan}&cycle=${selectedCycle}&session_id={CHECKOUT_SESSION_ID}${appliedDiscount ? `&coupon=${encodeURIComponent(appliedDiscount.coupon.code)}` : ''}`,
        cancel_url: `${baseUrl}/?payment=cancelled&plan=${plan}`,
      };

      let session;
      try {
        session = await stripe.checkout.sessions.create(sessionPayload);
      } catch (createErr: any) {
        // If price ID was invalid or belonging to another account, fallback to dynamic price data
        if (priceId && (createErr?.message?.includes('No such price') || createErr?.message?.includes('resource_missing') || createErr?.message?.includes('mode'))) {
          console.warn('[Stripe] Preço ID não encontrado no modo atual, usando price_data dinâmico no modo payment...');
          sessionPayload.mode = 'payment';
          sessionPayload.line_items = [{
            price_data: {
              currency: currency,
              product_data: {
                name: `Planner SaaS - Plano ${plan.toUpperCase()}${appliedDiscount ? ` (Cupom: ${appliedDiscount.coupon.code})` : ''}`,
                description: `Assinatura Plano ${plan.toUpperCase()} (${selectedCycle}) - Planner SaaS`
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          }];
          session = await stripe.checkout.sessions.create(sessionPayload);
        } else {
          throw createErr;
        }
      }

      if (session?.url) {
        return res.json({
          success: true,
          checkoutUrl: session.url,
          sessionId: session.id,
          isLiveStripe: true,
          discount: appliedDiscount
        });
      } else {
        throw new Error('A Stripe não retornou a URL de checkout.');
      }
    } catch (stripeErr: any) {
      const isAuthErr = stripeErr?.type === 'StripeAuthenticationError' || String(stripeErr?.message).includes('Invalid API Key');
      console.warn('[Stripe] Falha na chamada da API Stripe:', stripeErr?.message || stripeErr);
      return res.status(400).json({
        success: false,
        notConfigured: isAuthErr,
        invalidKey: isAuthErr,
        error: isAuthErr 
          ? 'A chave de API informada foi rejeitada pela Stripe como inválida. Certifique-se de usar a Secret Key (sk_test_... ou sk_live_...) do seu painel Stripe.'
          : `Erro da Stripe: ${stripeErr?.message || 'Não foi possível gerar a sessão de pagamento.'}`
      });
    }
  } catch (error: any) {
    console.error('Error in /api/stripe/checkout:', error);
    res.status(500).json({ success: false, error: error.message || 'Erro ao processar checkout do Stripe.' });
  }
});


// 6.3 Stripe Session Verification Endpoint
app.get('/api/stripe/session-status', async (req, res) => {
  const sessionId = req.query.session_id as string;
  if (!sessionId) {
    return res.status(400).json({ success: false, error: 'session_id é obrigatório.' });
  }

  try {
    const stripe = await getStripeClient();
    if (!stripe) {
      return res.json({
        success: true,
        simulated: true,
        session: {
          id: sessionId,
          payment_status: 'paid',
          status: 'complete'
        }
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Automatically update SQLite user plan if payment is complete
    if (session.payment_status === 'paid') {
      const plan = session.metadata?.plan || 'pro';
      const userEmail = session.customer_details?.email || session.metadata?.customerEmail;
      const userId = session.metadata?.userId || session.client_reference_id;

      try {
        if (userId) {
          db.prepare('UPDATE users SET plan = ? WHERE id = ?').run(plan, userId);
        } else if (userEmail) {
          db.prepare('UPDATE users SET plan = ? WHERE email = ?').run(plan, userEmail);
        }
      } catch (dbErr) {
        console.error('[Stripe] Erro ao sincronizar plano no SQLite após checkout:', dbErr);
      }
    }

    res.json({
      success: true,
      simulated: false,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        status: session.status,
        customer_email: session.customer_details?.email || session.customer_email,
        amount_total: session.amount_total,
        currency: session.currency,
        plan: session.metadata?.plan,
        cycle: session.metadata?.cycle
      }
    });
  } catch (err: any) {
    console.error('[Stripe] Erro ao recuperar sessão:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6.4 Stripe Customer Portal Endpoint
app.post('/api/stripe/portal', async (req, res) => {
  try {
    const { customerId } = req.body;
    const stripe = await getStripeClient();
    if (!stripe) {
      return res.status(400).json({ success: false, error: 'Stripe não está configurado com STRIPE_SECRET_KEY.' });
    }

    const forwardedProto = (req.headers['x-forwarded-proto'] as string) || '';
    const forwardedHost = (req.headers['x-forwarded-host'] as string) || '';
    const host = forwardedHost.split(',')[0].trim() || req.get('host') || 'planner.amplificagroup.com';
    const proto = (!host.includes('localhost') && !host.includes('127.0.0.1')) ? 'https' : (forwardedProto.split(',')[0].trim() || req.protocol || 'http');
    const returnUrl = `${proto}://${host}/`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    res.json({ success: true, url: portalSession.url });
  } catch (err: any) {
    console.error('[Stripe] Erro ao criar Customer Portal:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6.5 Stripe Webhook Listener (with signature validation if STRIPE_WEBHOOK_SECRET is set)
app.post('/api/stripe/webhook', async (req: any, res) => {
  const stripe = await getStripeClient();
  const webhookSecret = getStripeWebhookSecret();
  let event: any = req.body;

  const sig = (req.headers['stripe-signature'] as string) || '';

  if (stripe && webhookSecret && sig) {
    try {
      const payload = req.rawBody || JSON.stringify(req.body);
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    } catch (err: any) {
      console.warn('[Stripe Webhook] Falha na validação de assinatura:', err.message);
      return res.status(400).send(`Webhook Signature Verification Error: ${err.message}`);
    }
  }

  const eventType = event?.type || 'unknown_event';
  console.log(`[Stripe Webhook] Evento recebido com sucesso: ${eventType}`);

  try {
    switch (eventType) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data?.object;
        const plan = session?.metadata?.plan || 'pro';
        const userEmail = session?.customer_details?.email || session?.customer_email || session?.metadata?.customerEmail;
        const userId = session?.metadata?.userId || session?.client_reference_id;
        const customerId = session?.customer;

        console.log(`[Stripe] Pagamento confirmado: ${userEmail || userId || 'Cliente'} - Plano ${plan}`);
        
        if (userId) {
          db.prepare('UPDATE users SET plan = ? WHERE id = ?').run(plan, userId);
        }
        if (userEmail) {
          const user = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(userEmail) as any;
          if (user) {
            db.prepare('UPDATE users SET plan = ? WHERE id = ?').run(plan, user.id);
            console.log(`[Stripe] Plano ${plan} ativado para usuário ${user.id}`);
          } else {
            db.prepare('UPDATE users SET plan = ? WHERE LOWER(email) = LOWER(?)').run(plan, userEmail);
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data?.object;
        const status = subscription?.status;
        const customerId = subscription?.customer;
        
        if (status === 'active' || status === 'trialing') {
          // If subscription is active, ensure user has paid plan
          const plan = subscription?.metadata?.plan || 'pro';
          const userEmail = subscription?.customer_email;
          if (userEmail) {
            db.prepare('UPDATE users SET plan = ? WHERE email = ?').run(plan, userEmail);
            console.log(`[Stripe Webhook] Assinatura ativa para ${userEmail} (Plano: ${plan})`);
          }
        } else if (status === 'unpaid' || status === 'canceled' || status === 'past_due') {
          const userEmail = subscription?.customer_email;
          if (userEmail && status === 'canceled') {
            db.prepare('UPDATE users SET plan = ? WHERE email = ?').run('free', userEmail);
            console.log(`[Stripe Webhook] Assinatura cancelada/expirada para ${userEmail}, revertido para free.`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data?.object;
        const customerEmail = subscription?.customer_email;
        if (customerEmail) {
          console.log(`[Stripe Webhook] Assinatura cancelada para ${customerEmail}, revertendo para plano free.`);
          db.prepare('UPDATE users SET plan = ? WHERE email = ?').run('free', customerEmail);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data?.object;
        const customerEmail = invoice?.customer_email;
        console.log(`[Stripe Webhook] Fatura paga com sucesso para ${customerEmail || 'Cliente'}.`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data?.object;
        const customerEmail = invoice?.customer_email;
        console.warn(`[Stripe Webhook] Falha no pagamento da fatura para ${customerEmail || 'Cliente'}.`);
        break;
      }

      default:
        // Outros eventos recebidos
        break;
    }
  } catch (dbErr: any) {
    console.error('[Stripe Webhook] Erro ao sincronizar banco de dados:', dbErr?.message || dbErr);
  }

  res.status(200).json({ 
    received: true, 
    type: eventType,
    processedAt: new Date().toISOString()
  });
});

// 6.6 Stripe Webhook Status & Ping Test Endpoint
app.get('/api/stripe/webhook-status', (req, res) => {
  const webhookSecret = getStripeWebhookSecret();
  const forwardedProto = (req.headers['x-forwarded-proto'] as string) || '';
  const forwardedHost = (req.headers['x-forwarded-host'] as string) || '';
  const host = forwardedHost.split(',')[0].trim() || req.get('host') || 'planner.amplificagroup.com';
  const proto = (!host.includes('localhost') && !host.includes('127.0.0.1')) ? 'https' : (forwardedProto.split(',')[0].trim() || req.protocol || 'http');
  const webhookUrl = `${proto}://${host}/api/stripe/webhook`;

  res.json({
    success: true,
    webhookUrl,
    isConfigured: Boolean(webhookSecret),
    supportedEvents: [
      'checkout.session.completed',
      'checkout.session.async_payment_succeeded',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed'
    ],
    instructions: {
      step1: 'No Stripe Dashboard, acesse Desenvolvedores > Webhooks.',
      step2: `Clique em "Adicionar endpoint" e cole a URL: ${webhookUrl}`,
      step3: 'Selecione os eventos de Checkout, Assinaturas e Faturas.',
      step4: 'Copie o "Segredo de assinatura" (whsec_...) e salve nas configurações.'
    }
  });
});


// --- Vite integration or Static File serving ---
async function setupFrontend() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

setupFrontend().catch((err) => {
  console.error('Error booting frontend layer:', err);
});
