import { configureStore } from '@reduxjs/toolkit';
import messageReducer from './slices/messageSlice';

// Redux store'u oluştur
export const store = configureStore({
  reducer: {
    messages: messageReducer,
    // Diğer reducer'lar buraya eklenebilir
  },
});

// RootState ve AppDispatch tipleri
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 