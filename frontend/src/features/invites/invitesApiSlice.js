import { skipToken } from "@reduxjs/toolkit/query";
import { apiSlice } from "../../services/api";

export const invitesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOrganizationInvite: builder.mutation({
      query: (payload) => ({
        url: "organization-invites/org-admin",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Organizations"],
    }),
    createDepartmentAdminInvite: builder.mutation({
      query: (payload) => ({
        url: "organization-invites/department-admin",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Departments"],
    }),
    createDepartmentUserInvite: builder.mutation({
      query: (payload) => ({
        url: "organization-invites/department-user",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Departments"],
    }),
    getDepartmentUsers: builder.query({
      query: ({ departmentId }) => ({
        url: `organization-invites/department-users/${departmentId}`,
        method: "GET",
      }),
      providesTags: ["Departments"],
    }),
    validateOrganizationInvite: builder.query({
      query: ({ token }) => ({
        url: "organization-invites/validate",
        method: "GET",
        params: { token },
      }),
    }),
    acceptOrganizationInvite: builder.mutation({
      query: (payload) => ({
        url: "organization-invites/accept",
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const useValidateInviteQueryArg = (token) => (token ? { token } : skipToken);

export const {
  useCreateOrganizationInviteMutation,
  useCreateDepartmentAdminInviteMutation,
  useCreateDepartmentUserInviteMutation,
  useGetDepartmentUsersQuery,
  useValidateOrganizationInviteQuery,
  useAcceptOrganizationInviteMutation,
} = invitesApiSlice;
