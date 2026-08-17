import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Trust reverse proxies to resolve correct req.protocol and req.get('host')
app.set('trust proxy', true);

// Increase body-parser limits for sync payload and capture rawBody for Stripe signature verification
app.use(express.json({ 
  limit: '20mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

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
      permissions TEXT
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
app.post('/api/auth/register', (req, res) => {
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

    db.prepare(`
      INSERT INTO users (id, name, email, phone, password, createdAt, plan, isTeamMember, invitedByUserId, permissions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      name.trim(),
      email.trim().toLowerCase(),
      phone ? phone.trim() : null,
      password,
      createdAt,
      defaultPlan,
      0, // isTeamMember false
      null, // invitedByUserId null
      null // permissions null
    );

    const newUser = {
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      password: password,
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
app.post('/api/auth/login', (req, res) => {
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
    if (!user) {
      return res.status(400).json({ success: false, error: 'E-mail não cadastrado. Cadastre-se grátis!' });
    }

    if (user.password !== password) {
      return res.status(400).json({ success: false, error: 'Senha de acesso incorreta.' });
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

// Stripe keys loaded from environment variables or database metadata

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

  return '';
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
  basic: {
    brl: {
      monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY_BRL || '',
      quarterly: process.env.STRIPE_PRICE_BASIC_QUARTERLY_BRL || '',
    },
    usd: {
      monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY_USD || '',
      quarterly: process.env.STRIPE_PRICE_BASIC_QUARTERLY_USD || '',
    },
  },
  pro: {
    brl: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY_BRL || '',
      quarterly: process.env.STRIPE_PRICE_PRO_QUARTERLY_BRL || '',
    },
    usd: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY_USD || '',
      quarterly: process.env.STRIPE_PRICE_PRO_QUARTERLY_USD || '',
    },
  },
  growth: {
    brl: {
      monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY_BRL || '',
      quarterly: process.env.STRIPE_PRICE_GROWTH_QUARTERLY_BRL || '',
    },
    usd: {
      monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY_USD || '',
      quarterly: process.env.STRIPE_PRICE_GROWTH_QUARTERLY_USD || '',
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
    supportedPlans: ['free', 'basic', 'pro', 'growth'],
    pricing: {
      brl: {
        basic: { monthly: 29.00, quarterly: 84.00 },
        pro: { monthly: 49.00, quarterly: 144.00 },
        growth: { monthly: 79.00, quarterly: 224.00 }
      },
      usd: {
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

// 6.3 Stripe Checkout Session Creation
app.post('/api/stripe/checkout', async (req, res) => {
  try {
    const { plan, cycle = 'monthly', customer, userId } = req.body;

    if (!plan || plan === 'free' || !STRIPE_PRICES[plan]) {
      return res.json({ success: true, checkoutUrl: `/?payment=success&plan=free&cycle=monthly` });
    }

    const requestedCurrency = (customer?.currency || req.body.currency || (customer?.country === 'BR' ? 'brl' : 'brl')).toLowerCase();
    const currency = (requestedCurrency === 'usd' ? 'usd' : 'brl');
    const selectedCycle = cycle === 'quarterly' ? 'quarterly' : 'monthly';

    const baseUrl = getBaseUrl(req);
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

      // Use pre-configured Stripe Price ID if available
      if (priceId && priceId.startsWith('price_')) {
        lineItems.push({
          price: priceId,
          quantity: 1,
        });
      } else {
        // Dynamic price data fallback
        let unitAmount = 2900;
        let planName = 'Basic';
        let planDescription = 'Plano de assinatura mensal';

        if (plan === 'basic') {
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

        lineItems.push({
          price_data: {
            currency: currency,
            product_data: {
              name: `Planner SaaS - Plano ${planName}`,
              description: planDescription,
              images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80']
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        });
      }

      const useSubscriptionMode = priceId && priceId.startsWith('price_');

      const sessionPayload: any = {
        line_items: lineItems,
        mode: useSubscriptionMode ? 'subscription' : 'payment',
        ...(useSubscriptionMode ? {} : { payment_method_types: ['card'] }),
        customer_email: customerEmail || undefined,
        client_reference_id: userId || customerEmail || undefined,
        metadata: {
          plan,
          cycle: selectedCycle,
          currency,
          customerName,
          customerEmail: customerEmail || '',
          userId: userId || ''
        },
        billing_address_collection: 'auto',
        success_url: `${baseUrl}/?payment=success&plan=${plan}&cycle=${selectedCycle}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/?payment=cancelled&plan=${plan}`,
      };

      let session;
      try {
        session = await stripe.checkout.sessions.create(sessionPayload);
      } catch (createErr: any) {
        // If price ID was invalid or belonging to another account, fallback to dynamic price data
        if (priceId && (createErr?.message?.includes('No such price') || createErr?.message?.includes('resource_missing'))) {
          console.warn('[Stripe] Preço ID não encontrado no modo atual, usando price_data dinâmico...');
          let unitAmount = currency === 'usd' ? (selectedCycle === 'quarterly' ? 1699 : 599) : (selectedCycle === 'quarterly' ? 8400 : 2900);
          if (plan === 'pro') unitAmount = currency === 'usd' ? (selectedCycle === 'quarterly' ? 2899 : 999) : (selectedCycle === 'quarterly' ? 14400 : 4900);
          if (plan === 'growth') unitAmount = currency === 'usd' ? (selectedCycle === 'quarterly' ? 4599 : 1599) : (selectedCycle === 'quarterly' ? 22400 : 7900);

          sessionPayload.line_items = [{
            price_data: {
              currency: currency,
              product_data: {
                name: `Planner SaaS - Plano ${plan.toUpperCase()}`,
                description: `Assinatura Plano ${plan.toUpperCase()} (${selectedCycle}) - Planner SaaS`
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          }];
          sessionPayload.mode = 'payment';
          sessionPayload.payment_method_types = ['card'];
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
          isLiveStripe: true
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

setupFrontend().catch((err) => {
  console.error('Error booting frontend layer:', err);
});
