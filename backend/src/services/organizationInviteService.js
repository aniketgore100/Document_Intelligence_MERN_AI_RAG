import crypto from "crypto";
import { OrganizationInviteRepository } from "../repositories/organizationInviteRepository.js";
import { OrganizationRepository } from "../repositories/organizationRepositories.js";
import { AuthRepository } from "../repositories/authRepository.js";
import { RoleRepository } from "../repositories/roleRepository.js";
import { OrganizationMembershipRepository } from "../repositories/organizationMembershipRepository.js";
import { ROLES } from "../constants/roles.js";
import { getAllowedPermissionsForRole } from "../constants/rolePermissionMap.js";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const DEFAULT_INVITE_TTL_HOURS = 72;

export class OrganizationInviteService {
  constructor({
    inviteRepository = new OrganizationInviteRepository(),
    organizationRepository = new OrganizationRepository(),
    authRepository = new AuthRepository(),
    roleRepository = new RoleRepository(),
    organizationMembershipRepository = new OrganizationMembershipRepository(),
  } = {}) {
    this.inviteRepository = inviteRepository;
    this.organizationRepository = organizationRepository;
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

  async ensureOrgAdminRole() {
    let roleDoc = await this.roleRepository.findByName(ROLES.ORG_ADMIN);
    if (roleDoc) return roleDoc;

    roleDoc = await this.roleRepository.create({
      name: ROLES.ORG_ADMIN,
      permissions: [...getAllowedPermissionsForRole(ROLES.ORG_ADMIN)],
    });

    return roleDoc;
  }

  async createInvite({ organizationId, email, invitedBy, roleName = ROLES.ORG_ADMIN }) {



    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      const err = new Error("Valid invite email is required");
      err.statusCode = 400;
      throw err;
    }

    const organization = await this.organizationRepository.findById(organizationId);
    if (!organization) {
      const err = new Error("Organization not found");
      err.statusCode = 404;
      throw err;
    }

    const existingUser = await this.authRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      const err = new Error("User with this email already exists");
      err.statusCode = 409;
      throw err;
    }

    const existingPending = await this.inviteRepository.findPendingByOrgAndEmail({
      organizationId,
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

    const invite = await this.inviteRepository.create({
      organization: organizationId,
      email: normalizedEmail,
      roleName,
      tokenHash,
      expiresAt,
      invitedBy,
    });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const inviteLink = `${clientUrl}/invite/accept?token=${rawToken}`;

    console.log("inviteLink :::", inviteLink);

    return {
      invite,
      inviteLink,
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

    const roleDoc = await this.ensureOrgAdminRole();

    const user = await this.authRepository.createUser({
      name: name.trim(),
      email: invite.email,
      password,
      role: roleDoc._id,
    });

    const organization = await this.organizationRepository.findById(invite.organization?._id);
    if (organization) {
      organization.Owner = user._id;
      await this.organizationRepository.save(organization);
    }

    const existingMembership = await this.organizationMembershipRepository.findByUserOrgRole({
      userId: user._id,
      organizationId: invite.organization?._id,
      roleName: invite.roleName,
      department: null,
    });

    if (!existingMembership) {
      await this.organizationMembershipRepository.create({
        user: user._id,
        organization: invite.organization?._id,
        roleName: invite.roleName,
        department: null,
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
      invite: invite.toPublic(),
    };
  }
}
