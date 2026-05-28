import { apiSlice } from "../../services/api";

export const departmentsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query({
      query: ({ page = 1, limit = 50, status } = {}) => ({
        url: "departments/list",
        method: "GET",
        params: {
          page,
          limit,
          ...(status ? { status } : {}),
        },
      }),
      providesTags: ["Departments"],
    }),
    createDepartment: builder.mutation({
      query: (payload) => ({
        url: "departments/create",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Departments"],
    }),
  }),
});

export const { useGetDepartmentsQuery, useCreateDepartmentMutation } = departmentsApiSlice;
