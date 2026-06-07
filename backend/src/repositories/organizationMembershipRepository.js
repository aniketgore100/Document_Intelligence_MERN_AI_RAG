import OrganizationMembership from "../models/OrganizationMembership.js";

export class OrganizationMembershipRepository {
  create(payload, options = {}) {
    return OrganizationMembership.create([payload], options).then((docs) => docs[0]);
  }

  findByUserOrgRole({ userId, organizationId, roleName, department = null }) {
    return OrganizationMembership.findOne({
      user: userId,
      organization: organizationId,
      roleName,
      department,
    });
  }

  findActiveOrgMembershipByRole({ userId, roleName }) {
    return OrganizationMembership.findOne({
      user: userId,
      roleName,
      status: "active",
      department: null,
    }).populate("organization", "name slug");
  }

  findActiveOrgMembership({ userId }) {
    return OrganizationMembership.findOne({
      user: userId,
      status: "active",
      department: null,
    }).populate("organization", "name slug");
  }

  findActiveDepartmentMembership({ userId, departmentId }) {
    return OrganizationMembership.findOne({
      user: userId,
      department: departmentId,
      status: "active",
    });
  }

  findActiveMembershipByRole({ userId, roleName }) {
    return OrganizationMembership.findOne({
      user: userId,
      roleName,
      status: "active",
    }).populate("department", "name slug").populate("organization", "name slug");
  }

  findActiveDepartmentMembershipByRole({ userId, roleName }) {
    return OrganizationMembership.findOne({
      user: userId,
      roleName,
      status: "active",
      department: { $ne: null },
    }).populate("department", "name slug").populate("organization", "name slug");
  }

  listDepartmentMembersByRole({ organizationId, departmentId, roleName, status = "active" }) {
    return OrganizationMembership.find({
      organization: organizationId,
      department: departmentId,
      roleName,
      status,
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });
  }

  findById(id) {
    return OrganizationMembership.findById(id)
      .populate("user", "name email")
      .populate("department", "name slug")
      .populate("organization", "name slug");
  }

  save(membershipDoc) {
    return membershipDoc.save();
  }
}
