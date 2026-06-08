import { OrganizationMembershipRepository } from "../repositories/organizationMembershipRepository.js";
import { ROLES } from "../constants/roles.js";
import { getManageablePermissionsForRole } from "../constants/permissions.js";

const toId = (value) => value?._id || value;

export class MembershipService {
  constructor({
    organizationMembershipRepository = new OrganizationMembershipRepository(),
  } = {}) {
    this.organizationMembershipRepository = organizationMembershipRepository;
  }

  normalizePermissions(permissions) {
    return [
      ...new Set(
        (Array.isArray(permissions) ? permissions : [])
          .map((permission) => permission?.trim())
          .filter(Boolean)
      ),
    ];
  }

  async updatePermissions({ membershipId, permissions, actorUserId }) {
    const actorMembership = await this.organizationMembershipRepository.findActiveOrgMembership({
      userId: actorUserId,
    });

    if (!actorMembership) {
      const err = new Error("Only organization admin can manage membership permissions");
      err.statusCode = 403;
      throw err;
    }

    const targetMembership = await this.organizationMembershipRepository.findById(membershipId);
    if (!targetMembership) {
      const err = new Error("Membership not found");
      err.statusCode = 404;
      throw err;
    }

    if (String(targetMembership.organization?._id || targetMembership.organization) !== String(toId(actorMembership.organization))) {
      const err = new Error("Cannot manage permissions outside your organization");
      err.statusCode = 403;
      throw err;
    }

    if (![ROLES.DEPT_ADMIN, ROLES.USER].includes(targetMembership.roleName)) {
      const err = new Error("This membership cannot be permission-managed");
      err.statusCode = 400;
      throw err;
    }

    const normalizedPermissions = this.normalizePermissions(permissions);
    const allowedPermissions = new Set(getManageablePermissionsForRole(targetMembership.roleName));
    const invalidPermissions = normalizedPermissions.filter((permission) => !allowedPermissions.has(permission));

    if (invalidPermissions.length) {
      const err = new Error(
        `Permissions not allowed for ${targetMembership.roleName}: ${invalidPermissions.join(", ")}`
      );
      err.statusCode = 400;
      throw err;
    }

    targetMembership.permissions = normalizedPermissions;
    return this.organizationMembershipRepository.save(targetMembership);
  }
}
