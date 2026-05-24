import OrganizationInvite from "../models/OrganizationInvite.js";

export class OrganizationInviteRepository {
  create(payload) {
    return OrganizationInvite.create(payload);
  }

  findByTokenHash(tokenHash) {
    return OrganizationInvite.findOne({ tokenHash })
      .populate("organization")
      .populate("invitedBy", "name email");
  }

  findPendingByOrgAndEmail({ organizationId, email }) {
    return OrganizationInvite.findOne({
      organization: organizationId,
      email,
      status: "pending",
    });
  }

  save(inviteDoc) {
    return inviteDoc.save();
  }
}
