import { apiSlice } from "../../services/api";

export const membershipsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    updateMembershipPermissions: builder.mutation({
      query: ({ membershipId, permissions }) => ({
        url: `memberships/${membershipId}/permissions`,
        method: "PATCH",
        body: { permissions },
      }),
      invalidatesTags: ["Departments"],
    }),
  }),
});

export const { useUpdateMembershipPermissionsMutation } = membershipsApiSlice;
