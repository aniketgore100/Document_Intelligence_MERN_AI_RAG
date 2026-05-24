import { skipToken } from "@reduxjs/toolkit/query";
import { apiSlice } from "../../services/api";

export const invitesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOrganizationInvite: builder.mutation({
      query: (payload) => ({
        url: "organization-invites/create",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Organizations"],
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
  useValidateOrganizationInviteQuery,
  useAcceptOrganizationInviteMutation,
} = invitesApiSlice;
