import 'express-session';

declare module 'express-session' {
  interface SessionData {
    adminId?: number;
    isAdmin?: boolean;
  }
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string; 
  createdAt: string;
  files: string[] | null;
  isRead?: boolean;
  receiverId?: number; 
  sender?: {
    id: number;
    username: string;
    profileImage?: string;
    gender?: string;
    avatar?: string;
  };
  receiver?: {
    id: number;
    username: string;
    profileImage?: string;
    gender?: string;
    avatar?: string;
  };
}

export interface Conversation {
  id: number;
  listingId: number;
  senderId: number;
  receiverId: number;
  createdAt: string;
  listingTitle: string;
  contactPerson?: string;
  sender?: {
    id: number;
    username: string;
    profileImage?: string;
    gender?: string;
    avatar?: string;
    isAdmin?: boolean;
  };
  receiver?: {
    id: number;
    username: string;
    profileImage?: string;
    gender?: string;
    avatar?: string;
  };
  unreadCount: number;
  is_admin_conversation?: boolean;
}

export interface Listing {
  id: number;
  title: string;
  description?: string;
  price?: number;
  status?: string;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
  images?: string[];
  categoryId?: number;
  city?: string;
  approved?: boolean;
  active?: boolean;
  listingType?: string;
  expiresAt?: string;
  contactPerson?: string;
  phone?: string;
}

export interface FileGroup {
  messageId: number;
  fileKey: string;
  createdAt: string;
}

export interface ConversationPage {
  messages: any;
  nextPage?: number;
  listingId?: any;
  conversationStarterId?: any;
  is_admin_conversation?: boolean;
}

export type { User } from '@shared/schemas';