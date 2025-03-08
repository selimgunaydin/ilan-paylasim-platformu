import { Express } from 'express';
import { registerAuthRoutes } from './auth';
import { registerProfileRoutes } from './profile';

export function registerUserRoutes(app: Express): void {
  // Kullanıcı kimlik doğrulama rotalarını kaydet
  registerAuthRoutes(app);
  
  // Kullanıcı profil rotalarını kaydet
  registerProfileRoutes(app);
} 