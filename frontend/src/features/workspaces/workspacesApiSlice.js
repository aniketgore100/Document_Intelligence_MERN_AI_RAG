import { apiSlice } from '../../services/api';

export const workspacesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listWorkspaces: builder.query({
      query: () => ({ url: 'workspaces', method: 'GET' }),
      providesTags: ['Workspaces'],
    }),

    createWorkspace: builder.mutation({
      query: (body) => ({ url: 'workspaces', method: 'POST', body }),
      invalidatesTags: ['Workspaces'],
    }),

    getWorkspace: builder.query({
      query: (id) => ({ url: `workspaces/${id}`, method: 'GET' }),
      providesTags: (result, error, id) => [{ type: 'Workspaces', id }],
    }),

    updateWorkspace: builder.mutation({
      query: ({ id, ...body }) => ({ url: `workspaces/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => ['Workspaces', { type: 'Workspaces', id }],
    }),

    deleteWorkspace: builder.mutation({
      query: (id) => ({ url: `workspaces/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Workspaces'],
    }),

    appendFinding: builder.mutation({
      query: ({ workspaceId, ...body }) => ({
        url: `workspaces/${workspaceId}/findings`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { workspaceId }) => [{ type: 'Workspaces', id: workspaceId }],
    }),
  }),
});

export const {
  useListWorkspacesQuery,
  useCreateWorkspaceMutation,
  useGetWorkspaceQuery,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useAppendFindingMutation,
} = workspacesApiSlice;
