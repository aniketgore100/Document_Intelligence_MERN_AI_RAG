import { apiSlice } from '../../services/api';
import { setCredentials } from './authSlice';

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query({
      query: () => ({
        url: '/auth/me',
        method: 'GET',
      }),
      async onQueryStarted(_, { dispatch, getState, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const token = getState()?.auth?.token;
          if (token && data?.user) {
            dispatch(setCredentials({ user: data.user, token }));
          }
        } catch {
          // Auth guard handles invalid sessions globally.
        }
      },
      providesTags: ['Auth'],
    }),

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
  }),
});

export const { useGetMeQuery, useLoginMutation } = authApiSlice;
