import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

let storeRef = null;

export const setupApiInterceptors = (store) => {
  storeRef = store;

  api.interceptors.request.use(
    (config) => {
      const token = storeRef?.getState()?.auth?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401 && storeRef) {
        storeRef.dispatch({ type: 'auth/logout' });
      }
      return Promise.reject(error);
    },
  );
};

export const apiRequest = async (request) => {
  const response = await request;
  return response.data;
};
