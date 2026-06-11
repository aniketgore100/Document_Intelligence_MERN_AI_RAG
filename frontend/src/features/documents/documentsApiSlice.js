import { apiSlice } from '../../services/api';

export const documentsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({


    getDocuments: builder.query({
      query: ({ page = 1, limit = 20, status } = {}) => ({
        url: 'documents',
        method: 'GET',
        params: {
          page,
          limit,
          ...(status ? { status } : {}),
        },
      }),
      providesTags: ['Documents'],
    }),


    createDocumentUploadUrl: builder.mutation({
      query: (payload) => ({
        url: 'documents/upload-url',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Documents'],
    }),


    completeDocumentUpload: builder.mutation({
      query: ({ id, originalName, sizeBytes, contentType }) => ({
        url: `documents/${id}/complete`,
        method: 'POST',
        body: {
          originalName,
          sizeBytes,
          contentType,
        },
      }),
      invalidatesTags: ['Documents', 'Dashboard'],
    }),

    
    deleteDocument: builder.mutation({
      query: ({ id }) => ({
        url: `documents/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Documents', 'Dashboard'],
    }),

    getDocumentAssignmentTargets: builder.query({
      query: ({ id }) => ({
        url: `documents/${id}/assignment-targets`,
        method: 'GET',
      }),
      providesTags: ['Documents'],
    }),

    assignDocumentDepartments: builder.mutation({
      query: ({ id, departmentIds }) => ({
        url: `documents/${id}/assign-departments`,
        method: 'PATCH',
        body: { departmentIds },
      }),
      invalidatesTags: ['Documents', 'Dashboard', 'Department'],
    }),

    assignDocumentUsers: builder.mutation({
      query: ({ id, userIds }) => ({
        url: `documents/${id}/assign-users`,
        method: 'PATCH',
        body: { userIds },
      }),
      invalidatesTags: ['Documents', 'Dashboard', 'Department'],
    }),
  }),
});

export const {
  useAssignDocumentDepartmentsMutation,
  useAssignDocumentUsersMutation,
  useGetDocumentsQuery,
  useLazyGetDocumentAssignmentTargetsQuery,
  useCreateDocumentUploadUrlMutation,
  useCompleteDocumentUploadMutation,
  useDeleteDocumentMutation,
} = documentsApiSlice;
