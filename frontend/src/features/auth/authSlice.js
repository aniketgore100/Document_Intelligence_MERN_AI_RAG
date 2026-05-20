import { createSlice } from '@reduxjs/toolkit';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const getStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const initialState = {
  user: getStoredUser(),
  token: localStorage.getItem(TOKEN_KEY),
};

const persistAuth = (user, token) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      persistAuth(action.payload.user, action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      clearAuth();
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
