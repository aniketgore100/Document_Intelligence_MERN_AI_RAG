import { apiSlice } from '../../services/api';

export const rolesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query({
      query: () => ({
        url: 'roles/roles',
        method: 'GET',
      }),
      providesTags: ['Roles'],
    }),

    createRole: builder.mutation({
      query: (payload) => ({
        url: 'roles/create-role',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Roles'],
    }),
    updateRolePermissions: builder.mutation({
      query: ({ id, permissions }) => ({
        url: `roles/${id}/permissions`,
        method: 'PATCH',
        body: { permissions },
      }),
      invalidatesTags: ['Roles'],
    }),
  }),
});

export const { useGetRolesQuery, useCreateRoleMutation, useUpdateRolePermissionsMutation } = rolesApiSlice;
