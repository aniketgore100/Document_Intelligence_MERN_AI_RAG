import mongoose from "mongoose";
import { DepartmentRepository } from "../repositories/departmentRepository.js";
import { OrganizationMembershipRepository } from "../repositories/organizationMembershipRepository.js";
import { DocumentAssignmentRepository } from "../repositories/documentAssignmentRepository.js";
import { DocumentRepository } from "../repositories/documentRepository.js";
import { OrganizationInviteService } from "./organizationInviteService.js";
import { ROLES } from "../constants/roles.js";
import { DOCUMENT_UPLOAD } from "../constants/documents.js";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const toId = (value) => value?._id || value;
const ANALYTICS_DAYS = 7;
const ANALYTICS_MEMBER_ROLES = [ROLES.DEPT_ADMIN, ROLES.USER];
const ANALYTICS_TIMEZONE = "Asia/Kolkata";
const analyticsDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: ANALYTICS_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const buildEmptyDailySeries = (days = ANALYTICS_DAYS) => {
  const series = [];
  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const key = analyticsDateFormatter.format(date);
    series.push({ date: key, count: 0 });
  }
  return series;
};

const normalizeDailySeries = (rows, days = ANALYTICS_DAYS) => {
  const countsByDate = new Map(rows.map((row) => [row._id, row.count]));
  return buildEmptyDailySeries(days).map((item) => ({
    ...item,
    count: countsByDate.get(item.date) || 0,
  }));
};

export class DepartmentService {
  constructor({
    departmentRepository = new DepartmentRepository(),
    organizationMembershipRepository = new OrganizationMembershipRepository(),
    documentAssignmentRepository = new DocumentAssignmentRepository(),
    documentRepository = new DocumentRepository(),
    organizationInviteService = new OrganizationInviteService(),
  } = {}) {
    this.departmentRepository = departmentRepository;
    this.organizationMembershipRepository = organizationMembershipRepository;
    this.documentAssignmentRepository = documentAssignmentRepository;
    this.documentRepository = documentRepository;
    this.organizationInviteService = organizationInviteService;
  }

  toPublicDepartment(department) {
    if (!department) return null;
    if (typeof department.toPublic === "function") return department.toPublic();

    return {
      id: department._id,
      organization: department.organization,
      name: department.name,
      slug: department.slug,
      status: department.status,
      createdBy: department.createdBy,
      Owner: department.Owner || null,
      inviteStatus: department.inviteStatus ?? null,
      inviteExpiresAt: department.inviteExpiresAt ?? null,
      inviteEmail: department.inviteEmail ?? null,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
    };
  }

  slugify(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  async getOrgAdminMembership(userId) {
    const membership = await this.organizationMembershipRepository.findActiveOrgMembershipByRole({
      userId,
      roleName: ROLES.ORG_ADMIN,
    });

    if (!membership) {
      const err = new Error("Organization context not found for this account");
      err.statusCode = 403;
      throw err;
    }

    return membership;
  }


  async getDepartmentAdminMembership(userId) {
    const membership = await this.organizationMembershipRepository.findActiveDepartmentMembershipByRole({
      userId,
      roleName: ROLES.DEPT_ADMIN,
    });

    if (!membership) {
      const err = new Error("Department context not found for this account");
      err.statusCode = 403;
      throw err;
    }

    return membership;
  }

  async createDepartment({ name, status, adminEmail, createdBy }) {
    if (!name || name.trim().length < 2) {
      const err = new Error("Department name must be at least 2 characters");
      err.statusCode = 400;
      throw err;
    }
    if (!adminEmail || !EMAIL_REGEX.test(adminEmail.trim())) {
      const err = new Error("Valid department admin email is required");
      err.statusCode = 400;
      throw err;
    }

    const orgAdminMembership = await this.getOrgAdminMembership(createdBy);
    const organizationId = toId(orgAdminMembership.organization);
    const slug = this.slugify(name);

    const existing = await this.departmentRepository.findBySlugInOrganization({
      organizationId,
      slug,
    });
    if (existing) {
      const err = new Error("Department with this name already exists in organization");
      err.statusCode = 409;
      throw err;
    }

    const allowedStatus = new Set(["active", "suspended", "archived"]);
    const normalizedStatus = status?.trim() || "active";
    if (!allowedStatus.has(normalizedStatus)) {
      const err = new Error("Invalid department status");
      err.statusCode = 400;
      throw err;
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();


      const department = await this.departmentRepository.create(
        {
          organization: organizationId,
          name: name.trim(),
          slug,
          status: normalizedStatus,
          createdBy,
        },
        { session }
      );



      const inviteResult = await this.organizationInviteService.createInvite({
        organizationId,
        departmentId: department._id,
        email: adminEmail.trim(),
        invitedBy: createdBy,
        inviterRoleName: ROLES.ORG_ADMIN,
        roleName: ROLES.DEPT_ADMIN,
        session,
      });

      await session.commitTransaction();
      return {
        department,
        invite: {
          ...inviteResult.invite.toPublic(),
          inviteLink: inviteResult.inviteLink,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async listDepartments({ userId, page = 1, limit = 20, status }) {
    
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const safePage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const safeLimitRaw = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 20;
    const safeLimit = Math.min(safeLimitRaw, 100);
    const skip = (safePage - 1) * safeLimit;

    const allowedStatus = new Set(["active", "suspended", "archived"]);
    const normalizedStatus = status?.trim();
    if (normalizedStatus && !allowedStatus.has(normalizedStatus)) {
      const err = new Error("Invalid status filter");
      err.statusCode = 400;
      throw err;
    }



    const orgAdminMembership = await this.organizationMembershipRepository.findActiveOrgMembershipByRole({
      userId,
      roleName: ROLES.ORG_ADMIN,
    });


    if (orgAdminMembership) {
      const organizationId = toId(orgAdminMembership.organization);

      const [departments, total] = await Promise.all([
        this.departmentRepository.listByOrganization({
          organizationId,
          status: normalizedStatus,
          limit: safeLimit,
          skip,
        }),
        this.departmentRepository.countByOrganization({
          organizationId,
          status: normalizedStatus,
        }),
      ]);

      return {
        departments: departments.map((dept) => this.toPublicDepartment(dept)),
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages: Math.ceil(total / safeLimit) || 1,
          hasNextPage: skip + departments.length < total,
          hasPrevPage: safePage > 1,
        },
      };
    }

    const deptAdminMembership = await this.getDepartmentAdminMembership(userId);
    const departmentId = deptAdminMembership.department?._id || deptAdminMembership.department;
    const department = await this.departmentRepository.findById(departmentId);

    const matchesStatus = !normalizedStatus || department?.status === normalizedStatus;
    const scopedDepartments = department && matchesStatus ? [department] : [];

    return {
      departments: scopedDepartments.map((dept) => this.toPublicDepartment(dept)),
      pagination: {
        page: 1,
        limit: safeLimit,
        total: scopedDepartments.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  async updateDepartment({ departmentId, userId, name, status }) {
    const membership = await this.organizationMembershipRepository.findActiveOrgMembershipByRole({
      userId,
      roleName: ROLES.ORG_ADMIN,
    });
    if (!membership) {
      const err = new Error("Not allowed to update this department");
      err.statusCode = 403;
      throw err;
    }

    const department = await this.departmentRepository.findByIdPlain(departmentId);
    if (!department) {
      const err = new Error("Department not found");
      err.statusCode = 404;
      throw err;
    }

    if (String(department.organization) !== String(toId(membership.organization))) {
      const err = new Error("Not allowed to update this department");
      err.statusCode = 403;
      throw err;
    }

    if (name && name.trim() && name.trim() !== department.name) {
      const slug = this.slugify(name);
      const existing = await this.departmentRepository.findBySlugInOrganization({
        organizationId: toId(department.organization),
        slug,
      });
      if (existing && String(existing._id) !== String(department._id)) {
        const err = new Error("Department with this name already exists in organization");
        err.statusCode = 409;
        throw err;
      }
      department.name = name.trim();
      department.slug = slug;
    }

    if (status) {
      const allowedStatus = new Set(["active", "suspended", "archived"]);
      const normalizedStatus = status.trim();
      if (!allowedStatus.has(normalizedStatus)) {
        const err = new Error("Invalid department status");
        err.statusCode = 400;
        throw err;
      }
      department.status = normalizedStatus;
    }

    await this.departmentRepository.save(department);
    const populated = await this.departmentRepository.findById(department._id);
    return populated.toPublic();
  }

  async deleteDepartment({ departmentId, userId }) {
    const membership = await this.organizationMembershipRepository.findActiveOrgMembershipByRole({
      userId,
      roleName: ROLES.ORG_ADMIN,
    });
    if (!membership) {
      const err = new Error("Not allowed to delete this department");
      err.statusCode = 403;
      throw err;
    }

    const department = await this.departmentRepository.findByIdPlain(departmentId);
    if (!department) {
      const err = new Error("Department not found");
      err.statusCode = 404;
      throw err;
    }

    if (String(department.organization) !== String(toId(membership.organization))) {
      const err = new Error("Not allowed to delete this department");
      err.statusCode = 403;
      throw err;
    }

    await this.departmentRepository.deleteById(departmentId);
    return { success: true };
  }

async getDepartmentById({ orgId, deptId, userId, roleName }) {

  const department = await this.departmentRepository.findById(deptId);
  
  if (!department) {
    const err = new Error("Department not found");
    err.statusCode = 404;
    throw err;
  }

  if (String(department.organization) !== String(toId(orgId))) {
    const err = new Error("Department does not belong to this organization");
    err.statusCode = 403;
    throw err;
  }

  if (roleName === ROLES.ORG_ADMIN) {
    const membership = await this.organizationMembershipRepository.findActiveOrgMembershipByRole({
      userId,
      roleName: ROLES.ORG_ADMIN,
    });

    if (!membership || String(toId(membership.organization)) !== String(toId(orgId))) {
      const err = new Error("Cannot access department outside your organization");
      err.statusCode = 403;
      throw err;
    }
  } else if (roleName === ROLES.DEPT_ADMIN) {
    const membership = await this.organizationMembershipRepository.findActiveDepartmentMembershipByRole({
      userId,
      roleName: ROLES.DEPT_ADMIN,
      departmentId: deptId,
    });

    if (
      !membership ||
      String(toId(membership.organization)) !== String(toId(orgId)) ||
      String(toId(membership.department)) !== String(toId(deptId))
    ) {
      const err = new Error("Cannot access department outside your department");
      err.statusCode = 403;
      throw err;
    }
  } else {
    const err = new Error("Not allowed to access this department");
    err.statusCode = 403;
    throw err;
  }

  const departmentAdmin =
    await this.organizationMembershipRepository.findActiveDepartmentMembershipByRole({
      departmentId: deptId,
      roleName: ROLES.DEPT_ADMIN,
    });

  return {
    ...department.toPublic(),
    admin: departmentAdmin
      ? {
          id: departmentAdmin.user?._id || departmentAdmin.user,
          name: departmentAdmin.user?.name || null,
          email: departmentAdmin.user?.email || null,
        }
      : null,
  };
}

async getDepartmentAnalytics({ orgId, deptId, userId, roleName }) {
  const department = await this.getDepartmentById({ orgId, deptId, userId, roleName });
  const organizationId = toId(department.organization);

  const [
    totalUsers,
    totalActiveUsers,
    totalDepartmentDocs,
    totalOrganizationDocs,
    dailyUsersRaw,
    dailyDocumentsRaw,
  ] = await Promise.all([
    this.organizationMembershipRepository.countDepartmentMembers({
      organizationId,
      departmentId: deptId,
      roleNames: ANALYTICS_MEMBER_ROLES,
    }),
    this.organizationMembershipRepository.countDepartmentMembers({
      organizationId,
      departmentId: deptId,
      roleNames: ANALYTICS_MEMBER_ROLES,
      status: "active",
    }),
    this.documentAssignmentRepository.countActiveDepartmentDocuments({
      organizationId,
      departmentId: deptId,
    }),
    this.documentRepository.countByOrganization({
      organizationId,
      status: DOCUMENT_UPLOAD.STATUSES.ACTIVE,
    }),
    this.organizationMembershipRepository.dailyDepartmentMembersAdded({
      organizationId,
      departmentId: deptId,
      roleNames: ANALYTICS_MEMBER_ROLES,
      days: ANALYTICS_DAYS,
    }),
    this.documentAssignmentRepository.dailyDepartmentDocumentsAdded({
      organizationId,
      departmentId: deptId,
      days: ANALYTICS_DAYS,
    }),
  ]);

  const workloadPercent = totalOrganizationDocs > 0
    ? Number(((totalDepartmentDocs / totalOrganizationDocs) * 100).toFixed(1))
    : 0;

  return {
    department: {
      id: department.id,
      name: department.name,
      organization: department.organization,
    },
    totals: {
      users: totalUsers,
      activeUsers: totalActiveUsers,
      documents: totalDepartmentDocs,
      organizationDocuments: totalOrganizationDocs,
      workloadPercent,
    },
    daily: {
      usersAdded: normalizeDailySeries(dailyUsersRaw, ANALYTICS_DAYS),
      documentsAdded: normalizeDailySeries(dailyDocumentsRaw, ANALYTICS_DAYS),
    },
  };
}
}
