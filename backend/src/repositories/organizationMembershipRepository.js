import OrganizationMembership from "../models/OrganizationMembership.js";

export class OrganizationMembershipRepository {
  create(payload) {
    return OrganizationMembership.create(payload);
  }

  findByUserOrgRole({ userId, organizationId, roleName, department = null }) {
    return OrganizationMembership.findOne({
      user: userId,
      organization: organizationId,
      roleName,
      department,
    });
  }
}
