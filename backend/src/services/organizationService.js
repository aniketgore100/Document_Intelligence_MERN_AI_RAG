import { AuthRepository } from "../repositories/authRepository.js";
import { OrganizationRepository } from "../repositories/organizationRepositories.js";
import { OrganizationInviteService } from "./organizationInviteService.js";
import { ROLES } from "../constants/roles.js";

export class OrganizationService {
  
  constructor({
    organizationRepository = new OrganizationRepository(),
    organizationInviteService = new OrganizationInviteService(),
    authRepository = new AuthRepository(),
    
  } = {}) {
    this.organizationRepository = organizationRepository;
    this.organizationInviteService = organizationInviteService;
    this.authRepository = authRepository;
  }

  slugify(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  toPublicOrganization(org) {
    if (!org) return null;

    if (typeof org.toPublic === "function") {
      return org.toPublic();
    }

    const metadata = org?.metadata instanceof Map
      ? Object.fromEntries(org.metadata)
      : org?.metadata || {};

    return {
      id: org._id,
      name: org.name,
      slug: org.slug,
      status: org.status,
      createdBy: org.createdBy,
      Owner: org.Owner || null,
      metadata,
      inviteStatus: org.inviteStatus ?? null,
      inviteExpiresAt: org.inviteExpiresAt ?? null,
      inviteEmail: org.inviteEmail ?? null,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  }

  async createOrganization({ name, status, metadata, Owner, createdBy }) {
    if (!name || name.trim().length < 2) {
      const err = new Error("Organization name must be at least 2 characters");
      err.statusCode = 400;
      throw err;
    }

    if (!createdBy) {
      const err = new Error("createdBy is required");
      err.statusCode = 400;
      throw err;
    }

    const slug = this.slugify(name);
    const existing = await this.organizationRepository.findBySlug(slug);
    if (existing) {
      const err = new Error("Organization with this name/slug already exists");
      err.statusCode = 409;
      throw err;
    }

    const allowedStatus = new Set(["active", "suspended", "archived"]);
    const normalizedStatus = status?.trim() || "active";
    if (!allowedStatus.has(normalizedStatus)) {
      const err = new Error("Invalid organization status");
      err.statusCode = 400;
      throw err;
    }

    const existingUser = await this.authRepository.findByEmail(metadata?.orgAdminEmail?.trim()?.toLowerCase());
    if (existingUser) {
      const err = new Error("User with this email already exists");
      err.statusCode = 409;
      throw err;
    }

    const org = await this.organizationRepository.create({
      name: name.trim(),
      slug,
      createdBy,
      status: normalizedStatus,
      metadata: metadata && typeof metadata === "object" ? metadata : {},
    });

    const inviteEmail = metadata?.orgAdminEmail?.trim()?.toLowerCase();
    if (inviteEmail) {
      const inviteResult = await this.organizationInviteService.createInvite({
        organizationId: org._id,
        email: inviteEmail,
        invitedBy: createdBy,
        inviterRoleName: ROLES.GLOBAL_ADMIN,
      });

      return {
        organization: org,
        invite: {
          ...inviteResult.invite.toPublic(),
          inviteLink: inviteResult.inviteLink,
        },
      };
    }

    return { organization: org };
  }

  async getOrganizations() {
    return this.getOrganizationsPaginated({});
  }

  async getOrganizationsPaginated({ page = 1, limit = 20, status } = {}) {
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    const safePage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const safeLimitRaw = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 20;
    const safeLimit = Math.min(safeLimitRaw, 100);

    const allowedStatus = new Set(["active", "suspended", "archived"]);
    const normalizedStatus = status?.trim();

    if (normalizedStatus && !allowedStatus.has(normalizedStatus)) {
      const err = new Error("Invalid status filter");
      err.statusCode = 400;
      throw err;
    }

    const skip = (safePage - 1) * safeLimit;

    const [organizations, total] = await Promise.all([
      this.organizationRepository.list({
        status: normalizedStatus,
        limit: safeLimit,
        skip,
      }),
      this.organizationRepository.count({
        status: normalizedStatus,
      }),
    ]);

    return {
      organizations: organizations.map((organization) => this.toPublicOrganization(organization)),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1,
        hasNextPage: skip + organizations.length < total,
        hasPrevPage: safePage > 1,
      },
    };
  }
  
}
