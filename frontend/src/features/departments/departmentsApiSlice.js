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
      invalidatesTags: ["Departments", "Dashboard"],
    }),


      getDepartmentById: builder.query({
        query: ({ orgId, deptId }) => ({
          url: `departments/department/${orgId}/${deptId}`,
          method: "GET",
        }),
        providesTags: (result, error, { deptId }) => [{ type: "Department", id: deptId }],
      }),

      getDepartmentAnalytics: builder.query({
        query: ({ orgId, deptId }) => ({
          url: `departments/department/${orgId}/${deptId}/analytics`,
          method: "GET",
        }),
        providesTags: (result, error, { deptId }) => [{ type: "Department", id: `${deptId}-analytics` }],
      }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useGetDepartmentByIdQuery,
  useGetDepartmentAnalyticsQuery,
} = departmentsApiSlice;
