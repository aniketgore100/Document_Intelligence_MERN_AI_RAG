import DocumentAssignment from '../models/DocumentAssignment.js';

export class DocumentAssignmentRepository {
  listActiveByDocument({ documentId, targetType } = {}) {
    const filter = {
      document: documentId,
      status: 'active',
    };
    if (targetType) filter.targetType = targetType;

    return DocumentAssignment.find(filter)
      .populate('department', 'name slug Owner')
      .populate('user', 'name email');
  }

  listActiveByDocuments({ documentIds, targetType } = {}) {
    const filter = {
      document: { $in: documentIds },
      status: 'active',
    };
    if (targetType) filter.targetType = targetType;

    return DocumentAssignment.find(filter)
      .populate('department', 'name slug Owner')
      .populate('user', 'name email');
  }

  listActiveDocumentIdsByDepartment({ organizationId, departmentId }) {
    return DocumentAssignment.find({
      organization: organizationId,
      department: departmentId,
      targetType: 'DEPARTMENT',
      status: 'active',
    }).distinct('document');
  }

  listActiveDocumentIdsByUser({ organizationId, userId }) {
    return DocumentAssignment.find({
      organization: organizationId,
      user: userId,
      targetType: 'USER',
      status: 'active',
    }).distinct('document');
  }

  async syncDepartmentAssignments({ document, organizationId, departmentIds, assignedBy }) {
    const desiredIds = new Set(departmentIds.map(String));
    const existing = await DocumentAssignment.find({
      document,
      targetType: 'DEPARTMENT',
      status: 'active',
    });

    const existingIds = new Set(existing.map((assignment) => String(assignment.department)));
    const toCreate = departmentIds.filter((departmentId) => !existingIds.has(String(departmentId)));
    const toRevoke = existing.filter((assignment) => !desiredIds.has(String(assignment.department)));

    if (toRevoke.length) {
      await DocumentAssignment.updateMany(
        { _id: { $in: toRevoke.map((assignment) => assignment._id) } },
        {
          $set: {
            status: 'revoked',
            revokedBy: assignedBy,
            revokedAt: new Date(),
          },
        },
      );
    }

    if (toCreate.length) {
      await DocumentAssignment.insertMany(
        toCreate.map((departmentId) => ({
          document,
          organization: organizationId,
          department: departmentId,
          targetType: 'DEPARTMENT',
          assignedBy,
        })),
        { ordered: false },
      );
    }
  }

  async syncUserAssignments({ document, organizationId, departmentId, userIds, assignedBy }) {
    const desiredIds = new Set(userIds.map(String));
    const existing = await DocumentAssignment.find({
      document,
      department: departmentId,
      targetType: 'USER',
      status: 'active',
    });

    const existingIds = new Set(existing.map((assignment) => String(assignment.user)));
    const toCreate = userIds.filter((userId) => !existingIds.has(String(userId)));
    const toRevoke = existing.filter((assignment) => !desiredIds.has(String(assignment.user)));

    if (toRevoke.length) {
      await DocumentAssignment.updateMany(
        { _id: { $in: toRevoke.map((assignment) => assignment._id) } },
        {
          $set: {
            status: 'revoked',
            revokedBy: assignedBy,
            revokedAt: new Date(),
          },
        },
      );
    }

    if (toCreate.length) {
      await DocumentAssignment.insertMany(
        toCreate.map((userId) => ({
          document,
          organization: organizationId,
          department: departmentId,
          user: userId,
          targetType: 'USER',
          assignedBy,
        })),
        { ordered: false },
      );
    }
  }


  
}
