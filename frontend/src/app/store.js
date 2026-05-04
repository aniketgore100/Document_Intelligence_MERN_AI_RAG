import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import { setupApiInterceptors } from '../services/api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

setupApiInterceptors(store);
