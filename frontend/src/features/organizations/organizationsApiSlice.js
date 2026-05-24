import { apiSlice } from "../../services/api";

export const organizationsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOrganizations: builder.query({
      query: ({ page = 1, limit = 20, status } = {}) => ({
        url: "organizations/getOrgs",
        method: "GET",
        params: {
          page,
          limit,
          ...(status ? { status } : {}),
        },
      }),
      providesTags: ["Organizations"],
    }),
    createOrganization: builder.mutation({
      query: (payload) => ({
        url: "organizations/createOrg",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Organizations"],
    }),
  }),
});

export const { useGetOrganizationsQuery, useCreateOrganizationMutation } = organizationsApiSlice;
