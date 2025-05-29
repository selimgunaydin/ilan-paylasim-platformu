import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resendVerificationEmail } from '../thunks/authThunks';

interface AuthState {
  loading: boolean;
  successMessage: string | null;
  errorMessage: string | null;
}

const initialState: AuthState = {
  loading: false,
  successMessage: null,
  errorMessage: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthMessages: (state) => {
      state.successMessage = null;
      state.errorMessage = null;
    },
    setAuthError: (state, action: PayloadAction<string>) => {
      state.errorMessage = action.payload;
      state.successMessage = null;
      state.loading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(resendVerificationEmail.pending, (state) => {
        state.loading = true;
        state.successMessage = null;
        state.errorMessage = null;
      })
      .addCase(resendVerificationEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(resendVerificationEmail.rejected, (state, action) => {
        state.loading = false;
        state.errorMessage = action.payload as string;
      });
  },
});

export const { clearAuthMessages, setAuthError } = authSlice.actions;
export default authSlice.reducer;
