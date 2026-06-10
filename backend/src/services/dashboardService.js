import { DepartmentRepository } from "../repositories/departmentRepository.js";
import { DocumentRepository } from "../repositories/documentRepository.js";
import { OrganizationMembershipRepository } from "../repositories/organizationMembershipRepository.js";
import { ROLES } from "../constants/roles.js";

export class DashboardService {
  constructor({
    departmentRepository = new DepartmentRepository(),
    documentRepository = new DocumentRepository(),
    organizationMembershipRepository = new OrganizationMembershipRepository(),
  } = {}) {
    this.departmentRepository = departmentRepository;
    this.documentRepository = documentRepository;
    this.organizationMembershipRepository = organizationMembershipRepository;
  }

  async getOrgAdminSummary({ userId }) {
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

    const [documentsTotal, departmentsTotal] = await Promise.all([
      this.documentRepository.countByOrganization({ organizationId }),
      this.departmentRepository.countByOrganization({ organizationId }),
    ]);

    return {
      organization: {
        id: organizationId,
        name: membership.organization?.name || null,
        slug: membership.organization?.slug || null,
      },
      totals: {
        documents: documentsTotal,
        departments: departmentsTotal,
      },
    };
  }
}
