import mongoose from 'mongoose';
import DocumentAssignment from '../models/DocumentAssignment.js';

const ANALYTICS_TIMEZONE = 'Asia/Kolkata';
const toObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : value;

const buildDailySeriesPipeline = ({ match, dateField, days }) => {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - (days - 1));

  return [
    {
      $match: {
        ...match,
        [dateField]: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: `$${dateField}`,
            timezone: ANALYTICS_TIMEZONE,
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ];
};

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

  countActiveDepartmentDocuments({ organizationId, departmentId }) {
    return DocumentAssignment.countDocuments({
      organization: organizationId,
      department: departmentId,
      targetType: 'DEPARTMENT',
      status: 'active',
    });
  }

  dailyDepartmentDocumentsAdded({ organizationId, departmentId, days = 7 }) {
    return DocumentAssignment.aggregate(
      buildDailySeriesPipeline({
        match: {
          organization: toObjectId(organizationId),
          department: toObjectId(departmentId),
          targetType: 'DEPARTMENT',
          status: 'active',
        },
        dateField: 'assignedAt',
        days,
      }),
    );
  }

  dailyOrganizationDepartmentDocumentsAdded({ organizationId, days = 7 }) {
    return DocumentAssignment.aggregate(
      buildDailySeriesPipeline({
        match: {
          organization: toObjectId(organizationId),
          department: { $ne: null },
          targetType: 'DEPARTMENT',
          status: 'active',
        },
        dateField: 'assignedAt',
        days,
      }),
    );
  }

  revokeUserAssignmentsByDepartments({ documentId, departmentIds, revokedBy }) {
    return DocumentAssignment.updateMany(
      {
        document: documentId,
        department: { $in: departmentIds.map(toObjectId) },
        targetType: 'USER',
        status: 'active',
      },
      {
        $set: {
          status: 'revoked',
          revokedBy,
          revokedAt: new Date(),
        },
      },
    );
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
