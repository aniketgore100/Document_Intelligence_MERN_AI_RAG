import OrganizationInvite from "../models/OrganizationInvite.js";

export class OrganizationInviteRepository {
  create(payload, options = {}) {
    return OrganizationInvite.create([payload], options).then((docs) => docs[0]);
  }

  findByTokenHash(tokenHash) {
    return OrganizationInvite.findOne({ tokenHash })
      .populate("organization")
      .populate("department")
      .populate("invitedBy", "name email");
  }

  findById(id) {
    return OrganizationInvite.findById(id);
  }

  findByIdWithRelations(id) {
    return OrganizationInvite.findById(id)
      .populate("organization")
      .populate("department")
      .populate("invitedBy", "name email");
  }

  findPendingByScopeAndEmail({ organizationId, departmentId = null, email }) {
    return OrganizationInvite.findOne({
      organization: organizationId,
      department: departmentId,
      email,
      status: "pending",
    });
  }

  save(inviteDoc) {
    return inviteDoc.save();
  }

  listByDepartmentAndRole({ organizationId, departmentId, roleName, statuses = ["pending", "expired"] }) {
    return OrganizationInvite.find({
      organization: organizationId,
      department: departmentId,
      roleName,
      status: { $in: statuses },
    }).sort({ createdAt: -1 });
  }
}
