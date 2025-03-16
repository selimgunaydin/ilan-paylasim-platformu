import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';


// State tipleri
export interface MessageState {
  unreadMessages: number;
  incomingUnreadMessages: number;
  outgoingUnreadMessages: number;
  notifications: MessageNotification[];
  loading: boolean;
  error: string | null;
}

// Mesaj bildirimi tipi
export interface MessageNotification {
  id: number;
  senderId: number;
  senderName: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

// Başlangıç değerleri
const initialState: MessageState = {
  unreadMessages: 0,
  incomingUnreadMessages: 0,
  outgoingUnreadMessages: 0,
  notifications: [],
  loading: false,
  error: null,
};

// Gelen mesajlardaki okunmamış mesaj sayısını getir
export const fetchUnreadMessages = createAsyncThunk(
  'messages/fetchUnreadMessages',
  async (_, { rejectWithValue }) => {
    try {
      const [incomingResponse, outgoingResponse] = await Promise.all([
        fetch('/api/conversations/received'),
        fetch('/api/conversations/sent')
      ]);
      
      if (!incomingResponse.ok || !outgoingResponse.ok) {
        throw new Error('Mesajlar yüklenemedi');
      }
      
      const incomingData = await incomingResponse.json();
      const outgoingData = await outgoingResponse.json();
      
      // Okunmamış mesaj sayılarını hesapla
      const incomingUnread = incomingData.reduce((total: number, conversation: any) => 
        total + (conversation.unreadCount || 0), 0);
      
      const outgoingUnread = outgoingData.reduce((total: number, conversation: any) => 
        total + (conversation.unreadCount || 0), 0);
      
      return {
        incomingUnread,
        outgoingUnread,
        totalUnread: incomingUnread + outgoingUnread,
      };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Mesaj slice
const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    // Yeni mesaj bildirimi ekle
    addMessageNotification: (state, action: PayloadAction<MessageNotification>) => {
      state.notifications.unshift(action.payload);
      state.unreadMessages += 1;
      state.incomingUnreadMessages += 1;
    },
    
    // Okunmamış mesaj sayısını güncelle
    updateUnreadMessages: (state, action: PayloadAction<number>) => {
      state.unreadMessages = action.payload;
    },
    
    // Gelen okunmamış mesaj sayısını güncelle
    updateIncomingUnreadMessages: (state, action: PayloadAction<number>) => {
      state.incomingUnreadMessages = action.payload;
    },
    
    // Giden okunmamış mesaj sayısını güncelle
    updateOutgoingUnreadMessages: (state, action: PayloadAction<number>) => {
      state.outgoingUnreadMessages = action.payload;
    },
    
    // Bildirimleri oku
    markNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.isRead = true;
      });
    },
    
    // Bildirimi sil
    deleteNotification: (state, action: PayloadAction<number>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    
    // Tüm bildirimleri temizle
    clearNotifications: (state) => {
      state.notifications = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnreadMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUnreadMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.unreadMessages = action.payload.totalUnread;
        state.incomingUnreadMessages = action.payload.incomingUnread;
        state.outgoingUnreadMessages = action.payload.outgoingUnread;
      })
      .addCase(fetchUnreadMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Actions
export const {
  addMessageNotification,
  updateUnreadMessages,
  updateIncomingUnreadMessages,
  updateOutgoingUnreadMessages,
  markNotificationsAsRead,
  deleteNotification,
  clearNotifications
} = messageSlice.actions;

// Selectors
export const selectUnreadMessages = (state: RootState) => state.messages.unreadMessages;
export const selectIncomingUnreadMessages = (state: RootState) => state.messages.incomingUnreadMessages;
export const selectOutgoingUnreadMessages = (state: RootState) => state.messages.outgoingUnreadMessages;
export const selectNotifications = (state: RootState) => state.messages.notifications;
export const selectLoading = (state: RootState) => state.messages.loading;
export const selectError = (state: RootState) => state.messages.error;

export default messageSlice.reducer; 