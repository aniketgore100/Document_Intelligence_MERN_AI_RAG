import { apiSlice } from '../../services/api';
import { setCredentials } from './authSlice';

export const authApiSlice = apiSlice.injectEndpoints({
endpoints: (builder) => ({
    login: builder.mutation({
      query: (payload) => ({
        url: '/auth/login',
        method: 'POST',
        body: payload,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch {
          // Surface errors through the mutation hook.
        }
      },
      invalidatesTags: ['Auth'],
    }),
    register: builder.mutation({
      query: (payload) => ({
        url: '/auth/register',
        method: 'POST',
        body: payload,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch {
          // Surface errors through the mutation hook.
        }
      },
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation } = authApiSlice;
