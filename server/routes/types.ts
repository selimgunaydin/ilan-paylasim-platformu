import * as schema from '@shared/schema';
import { users, messages, conversations } from '@shared/schema';
import { Express } from 'express';

// Kullanıcı tipleri
export type UserSelect = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;

// Mesaj tipleri
export type MessageSelect = typeof messages.$inferSelect;
export type MessageInsert = typeof messages.$inferInsert;

// Konuşma tipleri
export type ConversationSelect = typeof conversations.$inferSelect;
export type ConversationInsert = typeof conversations.$inferInsert;

// Konuşma ve kullanıcı bilgilerini birleştiren tip
export interface ConversationWithUser extends ConversationSelect {
  sender?: UserSelect;
  receiver?: UserSelect;
  listingTitle: string;
}

// Resim servisi arayüzü
export interface ImageService {
  uploadMultipleImages: (files: Express.Multer.File[]) => Promise<string[]>;
  deleteMultipleImages: (imagePaths: string[]) => Promise<void>;
  deleteSingleImage: (imagePath: string) => Promise<void>;
}

// Kategori ve alt kategorileri içeren tip
export type CategoryWithChildren = schema.Category & {
  children: CategoryWithChildren[];
}; 