import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout } from '../features/auth/authSlice';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState }) => {
    const token = getState()?.auth?.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithAuthGuard = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    api.dispatch(logout());
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuthGuard,
  tagTypes: ['Auth', 'Roles', 'Organizations', 'Departments', 'Department', 'Documents', 'Dashboard', 'Workspaces'],
  endpoints: () => ({}),
});
