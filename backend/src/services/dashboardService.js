import { DepartmentRepository } from "../repositories/departmentRepository.js";
import { DocumentAssignmentRepository } from "../repositories/documentAssignmentRepository.js";
import { DocumentRepository } from "../repositories/documentRepository.js";
import { OrganizationMembershipRepository } from "../repositories/organizationMembershipRepository.js";
import { ROLES } from "../constants/roles.js";

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
    series.push({ date: analyticsDateFormatter.format(date), count: 0 });
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

const normalizeAnalyticsDays = (days) => {
  const parsedDays = Number.parseInt(days, 10);
  return [7, 14, 30].includes(parsedDays) ? parsedDays : ANALYTICS_DAYS;
};

export class DashboardService {
  constructor({
    departmentRepository = new DepartmentRepository(),
    documentAssignmentRepository = new DocumentAssignmentRepository(),
    documentRepository = new DocumentRepository(),
    organizationMembershipRepository = new OrganizationMembershipRepository(),
  } = {}) {
    this.departmentRepository = departmentRepository;
    this.documentAssignmentRepository = documentAssignmentRepository;
    this.documentRepository = documentRepository;
    this.organizationMembershipRepository = organizationMembershipRepository;
  }

  async getOrgAdminSummary({ userId, days = ANALYTICS_DAYS }) {
    const analyticsDays = normalizeAnalyticsDays(days);
    const membership = await this.organizationMembershipRepository.findActiveOrgMembershipByRole({
      userId,
      roleName: ROLES.ORG_ADMIN,
    });

    if (!membership?.organization?._id && !membership?.organization) {
      const error = new Error("Organization context not found for this account");
      error.statusCode = 403;
      throw error;
    }

    const organizationId = membership.organization._id || membership.organization;

    const [
      documentsTotal,
      departmentsTotal,
      membersTotal,
      dailyUsersAdded,
      dailyDocumentsAdded,
    ] = await Promise.all([
      this.documentRepository.countByOrganization({ organizationId }),
      this.departmentRepository.countByOrganization({ organizationId }),
      this.organizationMembershipRepository.countOrganizationMembers({
        organizationId,
        roleNames: ANALYTICS_MEMBER_ROLES,
        status: "active",
      }),
      this.organizationMembershipRepository.dailyOrganizationDepartmentMembersAdded({
        organizationId,
        roleNames: ANALYTICS_MEMBER_ROLES,
        days: analyticsDays,
      }),
      this.documentAssignmentRepository.dailyOrganizationDepartmentDocumentsAdded({
        organizationId,
        days: analyticsDays,
      }),
    ]);

    return {
      organization: {
        id: organizationId,
        name: membership.organization?.name || null,
        slug: membership.organization?.slug || null,
      },
      totals: {
        documents: documentsTotal,
        members: membersTotal,
        departments: departmentsTotal,
      },
      daily: {
        rangeDays: analyticsDays,
        usersAdded: normalizeDailySeries(dailyUsersAdded, analyticsDays),
        documentsAdded: normalizeDailySeries(dailyDocumentsAdded, analyticsDays),
      },
    };
  }
}
