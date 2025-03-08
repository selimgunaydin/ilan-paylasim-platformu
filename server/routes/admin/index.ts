import { Express } from 'express';
import { registerAdminAuthRoutes } from './auth';
import { registerAdminUserRoutes } from './users';
import { registerAdminCategoryRoutes } from './categories';
import { registerAdminListingRoutes } from './listings';
import { registerAdminConversationRoutes } from './conversations';
import { registerAdminPaymentRoutes } from './payments';

export function registerAdminRoutes(app: Express): void {
  // Admin kimlik doğrulama rotalarını kaydet
  registerAdminAuthRoutes(app);
  
  // Admin kullanıcı yönetimi rotalarını kaydet
  registerAdminUserRoutes(app);
  
  // Admin kategori yönetimi rotalarını kaydet
  registerAdminCategoryRoutes(app);
  
  // Admin ilan yönetimi rotalarını kaydet
  registerAdminListingRoutes(app);
  
  // Admin mesajlaşma yönetimi rotalarını kaydet
  registerAdminConversationRoutes(app);
  
  // Admin ödeme yönetimi rotalarını kaydet
  registerAdminPaymentRoutes(app);
} 