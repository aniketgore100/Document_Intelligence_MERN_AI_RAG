import { apiSlice } from "../../services/api";

export const dashboardApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOrgAdminSummary: builder.query({
      query: ({ days = 7 } = {}) => ({
        url: "dashboard/org-admin/summary",
        method: "GET",
        params: { days },
      }),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetOrgAdminSummaryQuery } = dashboardApiSlice;
