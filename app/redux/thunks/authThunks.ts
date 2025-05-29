// app/redux/thunks/authThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';

interface ResendEmailPayload {
  email: string;
}

interface ResendEmailResponse {
  success: boolean;
  message: string;
}

// Thunk API için bir tip tanımlayın (özellikle rejectValue için)
interface ThunkApiConfig {
  rejectValue: string;
}

export const resendVerificationEmail = createAsyncThunk<
  ResendEmailResponse, // Payload creator'ın dönüş tipi
  ResendEmailPayload,  // Payload creator'a ilk argüman
  ThunkApiConfig       // ThunkAPI için tipler
>(
  'auth/resendVerificationEmail',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/resend-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload), // { email: "user@example.com" } şeklinde gönder
      });
      const data: ResendEmailResponse = await response.json();
      if (!response.ok || !data.success) {
        return rejectWithValue(data.message || 'E-posta gönderilemedi.');
      }
      return data; // Bu, fulfilled durumunda action.payload olacak
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Doğrulama e-postası gönderilirken bilinmeyen bir hata oluştu.');
    }
  }
);
