import { apiSlice } from "../../services/api";

export const dashboardApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOrgAdminSummary: builder.query({
      query: () => ({
        url: "dashboard/org-admin/summary",
        method: "GET",
      }),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetOrgAdminSummaryQuery } = dashboardApiSlice;
