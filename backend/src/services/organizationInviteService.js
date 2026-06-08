import crypto from "crypto";
import { OrganizationInviteRepository } from "../repositories/organizationInviteRepository.js";
import { OrganizationRepository } from "../repositories/organizationRepositories.js";
import { DepartmentRepository } from "../repositories/departmentRepository.js";
import { AuthRepository } from "../repositories/authRepository.js";
import { RoleRepository } from "../repositories/roleRepository.js";
import { OrganizationMembershipRepository } from "../repositories/organizationMembershipRepository.js";
import { ROLES } from "../constants/roles.js";
import { getDefaultPermissionsForRole } from "../constants/permissions.js";
// import { inviteEmailQueue } from "../queue/inviteQueue.js";



const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const DEFAULT_INVITE_TTL_HOURS = 1 / 60;
const toId = (value) => value?._id || value;




export class OrganizationInviteService {


  constructor({
    inviteRepository = new OrganizationInviteRepository(),
    organizationRepository = new OrganizationRepository(),
    departmentRepository = new DepartmentRepository(),
    authRepository = new AuthRepository(),
    roleRepository = new RoleRepository(),
    organizationMembershipRepository = new OrganizationMembershipRepository(),
  } = {}) {
    this.inviteRepository = inviteRepository;
    this.organizationRepository = organizationRepository;
    this.departmentRepository = departmentRepository;
    this.authRepository = authRepository;
    this.roleRepository = roleRepository;
    this.organizationMembershipRepository = organizationMembershipRepository;
  }

  hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  generateInviteToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  normalizeEmail(email) {
    return email?.trim().toLowerCase();
  }

  validateInviteState(invite) {
    if (!invite) {
      const err = new Error("Invalid invite token");
      err.statusCode = 404;
      throw err;
    }

    if (invite.status !== "pending") {
      const err = new Error(`Invite is ${invite.status}`);
      err.statusCode = 400;
      throw err;
    }

    if (new Date(invite.expiresAt) < new Date()) {
      invite.status = "expired";
      return this.inviteRepository.save(invite).then(() => {
        const err = new Error("Invite has expired");
        err.statusCode = 410;
        throw err;
      });
    }
  }

  async ensureRole(roleName) {
    let roleDoc = await this.roleRepository.findByName(roleName);
    if (roleDoc) return roleDoc;

    return this.roleRepository.create({
      name: roleName,
    });
  }



  async createInvite({
    organizationId,
    departmentId = null,
    email,
    invitedBy,
    inviterRoleName = null,
    roleName = ROLES.ORG_ADMIN,
    session = null,
  }) {
    const resolvedOrganizationId = toId(organizationId);

    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      const err = new Error("Valid invite email is required");
      err.statusCode = 400;
      throw err;
    }

    const organization = await this.organizationRepository.findById(resolvedOrganizationId);


    if (!organization) {
      const err = new Error("Organization not found");
      err.statusCode = 404;
      throw err;
    }
    
    if (departmentId) {
      const department = await this.departmentRepository.findByIdPlain(
        departmentId,
        session ? { session } : {}
      );

      if (!department) {
        const err = new Error("Department not found");
        err.statusCode = 404;
        throw err;
      }
      if (String(department.organization) !== String(resolvedOrganizationId)) {
        const err = new Error("Department does not belong to organization");
        err.statusCode = 400;
        throw err;
      }
    }

    if (roleName === ROLES.ORG_ADMIN) {
      if (inviterRoleName !== ROLES.GLOBAL_ADMIN) {
        const err = new Error("Only global admin can invite organization admin");
        err.statusCode = 403;
        throw err;
      }
      if (departmentId) {
        const err = new Error("Department is not allowed for organization admin invite");
        err.statusCode = 400;
        throw err;
      }
    }

    if (roleName === ROLES.DEPT_ADMIN) {
      if (inviterRoleName !== ROLES.ORG_ADMIN) {
        const err = new Error("Only organization admin can invite department admin");
        err.statusCode = 403;
        throw err;
      }
      if (!departmentId) {
        const err = new Error("departmentId is required for department admin invite");
        err.statusCode = 400;
        throw err;
      }

      const inviterOrgMembership = await this.organizationMembershipRepository.findActiveOrgMembershipByRole({
        userId: invitedBy,
        roleName: ROLES.ORG_ADMIN,
      });

      if (!inviterOrgMembership || String(toId(inviterOrgMembership.organization)) !== String(resolvedOrganizationId)) {
        const err = new Error("Invite scope is outside your organization");
        err.statusCode = 403;
        throw err;
      }
    }

    if (roleName === ROLES.USER) {
      if (inviterRoleName !== ROLES.DEPT_ADMIN) {
        const err = new Error("Only department admin can invite users");
        err.statusCode = 403;
        throw err;
      }
      if (!departmentId) {
        const err = new Error("departmentId is required for user invite");
        err.statusCode = 400;
        throw err;
      }

      const inviterDepartmentMembership =
        await this.organizationMembershipRepository.findActiveDepartmentMembershipByRole({
          userId: invitedBy,
          roleName: ROLES.DEPT_ADMIN,
        });

      const inviterDepartmentId =
        inviterDepartmentMembership?.department?._id || inviterDepartmentMembership?.department;

      if (
        !inviterDepartmentMembership ||
        String(toId(inviterDepartmentMembership.organization)) !== String(resolvedOrganizationId) ||
        String(inviterDepartmentId) !== String(departmentId)
      ) {
        const err = new Error("Invite scope is outside your department");
        err.statusCode = 403;
        throw err;
      }
    }

    const existingUser = await this.authRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      const err = new Error("User with this email already exists");
      err.statusCode = 409;
      throw err;
    }

    const existingPending = await this.inviteRepository.findPendingByScopeAndEmail({
      organizationId,
      departmentId,
      email: normalizedEmail,
    });
    if (existingPending && new Date(existingPending.expiresAt) > new Date()) {
      const err = new Error("Active invite already exists for this email");
      err.statusCode = 409;
      throw err;
    }

    const rawToken = this.generateInviteToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + DEFAULT_INVITE_TTL_HOURS * 60 * 60 * 1000);

    const invitePayload = {
      organization: organizationId,
      ...(departmentId ? { department: departmentId } : {}),
      email: normalizedEmail,
      roleName,
      tokenHash,
      expiresAt,
      invitedBy,
    };
    const invite = session
      ? await this.inviteRepository.create(invitePayload, { session })
      : await this.inviteRepository.create(invitePayload);

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const inviteLink = `${clientUrl}/invite/accept?token=${rawToken}`;
    // await inviteEmailQueue.add(
    //   "invite.send",
    //   {
    //     inviteId: String(invite._id),
    //     rawToken,
    //   },
    //   {
    //     jobId: `invite-${invite._id}-send-v1`,
    //   }
    // );

    return {
      invite,
      rawToken,
    };
  }

  async validateInviteToken({ token }) {
    if (!token) {
      const err = new Error("Invite token is required");
      err.statusCode = 400;
      throw err;
    }

    const tokenHash = this.hashToken(token);
    const invite = await this.inviteRepository.findByTokenHash(tokenHash);
    await this.validateInviteState(invite);

    return {
      inviteId: invite._id,
      email: invite.email,
      roleName: invite.roleName,
      organization: {
        id: invite.organization?._id,
        name: invite.organization?.name,
        slug: invite.organization?.slug,
      },
      ...(invite.department
        ? {
          department: {
            id: invite.department?._id,
            name: invite.department?.name,
            slug: invite.department?.slug,
          },
        }
        : {}),
      expiresAt: invite.expiresAt,
      status: invite.status,
    };
  }


  async acceptInvite({ token, name, password }) {
    if (!token) {
      const err = new Error("Invite token is required");
      err.statusCode = 400;
      throw err;
    }

    if (!name || name.trim().length < 2) {
      const err = new Error("Name must be at least 2 characters");
      err.statusCode = 400;
      throw err;
    }

    if (!password || password.length < 6) {
      const err = new Error("Password must be at least 6 characters");
      err.statusCode = 400;
      throw err;
    }

    const tokenHash = this.hashToken(token);
    const invite = await this.inviteRepository.findByTokenHash(tokenHash);
    await this.validateInviteState(invite);

    const existingUser = await this.authRepository.findByEmail(invite.email);
    if (existingUser) {
      const err = new Error("User with this email already exists");
      err.statusCode = 409;
      throw err;
    }

    const roleDoc = await this.ensureRole(invite.roleName);

    const user = await this.authRepository.createUser({
      name: name.trim(),
      email: invite.email,
      password,
      role: roleDoc._id,
    });

    const organization = await this.organizationRepository.findById(invite.organization?._id);
    let department = null;
    if (organization) {
      if (invite.roleName === ROLES.ORG_ADMIN) {
        organization.Owner = user._id;
        await this.organizationRepository.save(organization);
      }
    }

    if (invite.department?._id && invite.roleName === ROLES.DEPT_ADMIN) {
      department = await this.departmentRepository.findByIdPlain(invite.department._id);
      if (department) {
        department.Owner = user._id;
        await this.departmentRepository.save(department);
      }
    }

    const existingMembership = await this.organizationMembershipRepository.findByUserOrgRole({
      userId: user._id,
      organizationId: invite.organization?._id,
      roleName: invite.roleName,
      department: invite.department?._id || null,
    });

    if (!existingMembership) {
      await this.organizationMembershipRepository.create({
        user: user._id,
        organization: invite.organization?._id,
        roleName: invite.roleName,
        permissions: getDefaultPermissionsForRole(invite.roleName),
        department: invite.department?._id || null,
        status: "active",
        invitedBy: invite.invitedBy?._id || invite.invitedBy || null,
        joinedAt: new Date(),
      });
    }

    invite.status = "accepted";
    invite.acceptedAt = new Date();
    await this.inviteRepository.save(invite);

    return {
      user: user.toPublic(),
      organization: organization?.toPublic() || null,
      department: department?.toPublic() || null,
      invite: invite.toPublic(),
    };
  }

  async listDepartmentUsers({ departmentId, requestedBy, requesterRoleName }) {
    if (!departmentId) {
      const err = new Error("departmentId is required");
      err.statusCode = 400;
      throw err;
    }

    const department = await this.departmentRepository.findByIdPlain(departmentId);
    if (!department) {
      const err = new Error("Department not found");
      err.statusCode = 404;
      throw err;
    }

    const requesterMembership =
      requesterRoleName === ROLES.ORG_ADMIN
        ? await this.organizationMembershipRepository.findActiveOrgMembership({
            userId: requestedBy,
          })
        : requesterRoleName === ROLES.DEPT_ADMIN
          ? await this.organizationMembershipRepository.findActiveDepartmentMembershipByRole({
              userId: requestedBy,
              roleName: ROLES.DEPT_ADMIN,
            })
          : null;

    if (!requesterMembership) {
      const err = new Error("Only organization or department admin can view department users");
      err.statusCode = 403;
      throw err;
    }

    const requesterDepartmentId = requesterMembership?.department?._id || requesterMembership?.department;
    if (
      requesterRoleName === ROLES.DEPT_ADMIN &&
      String(requesterDepartmentId) !== String(departmentId)
    ) {
      const err = new Error("Cannot access users from another department");
      err.statusCode = 403;
      throw err;
    }

    if (
      requesterRoleName === ROLES.ORG_ADMIN &&
      String(toId(requesterMembership.organization)) !== String(toId(department.organization))
    ) {
      const err = new Error("Cannot access users outside your organization");
      err.statusCode = 403;
      throw err;
    }

    const visibleRoleNames =
      requesterRoleName === ROLES.ORG_ADMIN
        ? [ROLES.DEPT_ADMIN, ROLES.USER]
        : [ROLES.USER];

    const memberships = (
      await Promise.all(
        visibleRoleNames.map((roleName) =>
          this.organizationMembershipRepository.listDepartmentMembersByRole({
            organizationId: toId(requesterMembership.organization),
            departmentId,
            roleName,
            status: "active",
          })
        )
      )
    ).flat();

    const invites = (
      await Promise.all(
        visibleRoleNames.map((roleName) =>
          this.inviteRepository.listByDepartmentAndRole({
            organizationId: toId(requesterMembership.organization),
            departmentId,
            roleName,
            statuses: ["pending", "expired"],
          })
        )
      )
    ).flat();

    const inviteByEmail = new Map();
    for (const invite of invites) {
      if (!invite?.email || inviteByEmail.has(invite.email)) continue;
      inviteByEmail.set(invite.email, {
        id: invite._id,
        email: invite.email,
        status: invite.status,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      });
    }

    const users = memberships.map((membership) => ({
      membershipId: membership._id,
      user: membership.user
        ? {
          id: membership.user._id,
          name: membership.user.name,
          email: membership.user.email,
        }
        : null,
      organization: membership.organization,
      department: membership.department,
      roleName: membership.roleName,
      permissions: membership.permissions || [],
      status: membership.status,
      joinedAt: membership.joinedAt,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
    }));

    const activeUserEmails = new Set(users.map((item) => item.user?.email).filter(Boolean));
    const pendingInvites = Array.from(inviteByEmail.values()).filter(
      (invite) => !activeUserEmails.has(invite.email)
    );

    return { users, pendingInvites };
  }

}
