import { Request, Response, NextFunction } from 'express';
import { db } from '../../server';
import crypto from 'crypto';

export const affiliateTracker = (req: Request, res: Response, next: NextFunction) => {
  const ref = req.query.ref;
  if (ref && typeof ref === 'string') {
    // Armazena o código de afiliado em um cookie seguro por 30 dias
    res.cookie('affiliate_code', ref, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    // Log the click
    try {
      db.prepare('INSERT INTO affiliate_clicks (id, affiliate_code, timestamp) VALUES (?, ?, ?)').run(
        crypto.randomUUID(),
        ref,
        new Date().toISOString()
      );
    } catch (error) {
      console.error('Error logging affiliate click:', error);
    }
  }
  next();
};
