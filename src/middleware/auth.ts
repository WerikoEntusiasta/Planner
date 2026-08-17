import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key_change_me';

export function generateToken(userId: string, isAdmin: boolean): string {
  return jwt.sign({ userId, isAdmin }, JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Não autenticado' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; isAdmin: boolean };
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).user?.isAdmin) return res.status(403).json({ error: 'Acesso negado' });
  next();
}
