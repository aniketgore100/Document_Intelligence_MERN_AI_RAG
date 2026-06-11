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

  findActiveDepartmentMembershipByRole({ userId, roleName, departmentId }) {
    const filter = {
      roleName,
      status: "active",
      department: { $ne: null },
    };

    if (userId) filter.user = userId;
    if (departmentId) filter.department = departmentId;

    return OrganizationMembership.findOne(filter)
      .populate("user", "name email")
      .populate("department", "name slug")
      .populate("organization", "name slug");
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

  listDepartmentMembersByRoles({ organizationId, departmentId, roleNames, status = "active" }) {
    return OrganizationMembership.find({
      organization: organizationId,
      department: departmentId,
      roleName: { $in: roleNames },
      status,
    })
      .populate("user", "name email")
      .populate("department", "name slug")
      .sort({ createdAt: -1 });
  }

  listActiveMembersByDepartmentsAndRole({ organizationId, departmentIds, roleName }) {
    return OrganizationMembership.find({
      organization: organizationId,
      department: { $in: departmentIds },
      roleName,
      status: "active",
    })
      .populate("user", "name email")
      .populate("department", "name slug");
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
