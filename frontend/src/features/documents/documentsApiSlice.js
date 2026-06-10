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
  }),
});

export const {
  useGetDocumentsQuery,
  useCreateDocumentUploadUrlMutation,
  useCompleteDocumentUploadMutation,
  useDeleteDocumentMutation,
} = documentsApiSlice;
