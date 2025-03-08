import jwt from 'jsonwebtoken';
import { db } from '../db';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';

// WebSocket token'ı için ortam değişkeni veya varsayılan değer
const WS_TOKEN_SECRET = process.env.WS_TOKEN_SECRET || 'websocket-secret-key';

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}


// WebSocket token'ını doğrula
export const verifyWSToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, WS_TOKEN_SECRET) as { userId: number };
    return decoded.userId;
  } catch (error) {
    console.error('WebSocket token doğrulama hatası:', error);
    return null;
  }
};

// Token'ın süresi dolmuş mu kontrol et
export const isTokenExpired = (token: string): boolean => {
  try {
    jwt.verify(token, WS_TOKEN_SECRET);
    return false;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return true;
    }
    throw error;
  }
};