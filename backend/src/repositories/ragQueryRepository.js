import mongoose from 'mongoose';
import RagQuery from '../models/RagQuery.js';

export class RagQueryRepository {
  async countSuccessfulByOrganization({ organizationId }) {
    return RagQuery.countDocuments({
      organization: new mongoose.Types.ObjectId(organizationId),
      status: 'success',
    });
  }

  // Single aggregation: join with memberships to find the user's department, count per dept + resolve dept names
  async countSuccessfulByDepartments({ organizationId }) {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    return RagQuery.aggregate([
      { $match: { organization: orgObjId, status: 'success' } },
      {
        $lookup: {
          from: 'organizationmemberships',
          let: { userId: '$user' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$user', '$$userId'] },
                    { $eq: ['$organization', orgObjId] },
                    { $eq: ['$status', 'active'] },
                    { $ne: ['$department', null] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: 'membership',
        },
      },
      { $unwind: { path: '$membership', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$membership.department', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'dept',
        },
      },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          departmentId: '$_id',
          departmentName: { $ifNull: ['$dept.name', 'Unknown'] },
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  // Single aggregation: count queries from users in a specific department
  async countSuccessfulByDepartment({ organizationId, departmentId }) {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const deptObjId = new mongoose.Types.ObjectId(departmentId);
    const result = await RagQuery.aggregate([
      { $match: { organization: orgObjId, status: 'success' } },
      {
        $lookup: {
          from: 'organizationmemberships',
          let: { userId: '$user' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$user', '$$userId'] },
                    { $eq: ['$organization', orgObjId] },
                    { $eq: ['$department', deptObjId] },
                    { $eq: ['$status', 'active'] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: 'membership',
        },
      },
      { $unwind: { path: '$membership', preserveNullAndEmptyArrays: false } },
      { $count: 'total' },
    ]);
    return result[0]?.total ?? 0;
  }

  // Per-document query counts for a specific user across the organization
  async countSuccessfulByUserPerDocument({ userId, organizationId }) {
    const userObjId = new mongoose.Types.ObjectId(userId);
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    return RagQuery.aggregate([
      { $match: { user: userObjId, organization: orgObjId, status: 'success' } },
      { $group: { _id: '$document', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'documents',
          localField: '_id',
          foreignField: '_id',
          as: 'doc',
        },
      },
      { $unwind: { path: '$doc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          documentId: '$_id',
          documentName: { $ifNull: ['$doc.originalName', 'Unknown'] },
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  // Single aggregation: per-user query counts in a department, with user names resolved
  async countSuccessfulByUsersInDepartment({ organizationId, departmentId }) {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const deptObjId = new mongoose.Types.ObjectId(departmentId);
    return RagQuery.aggregate([
      { $match: { organization: orgObjId, status: 'success' } },
      {
        $lookup: {
          from: 'organizationmemberships',
          let: { userId: '$user' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$user', '$$userId'] },
                    { $eq: ['$organization', orgObjId] },
                    { $eq: ['$department', deptObjId] },
                    { $eq: ['$status', 'active'] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: 'membership',
        },
      },
      { $unwind: { path: '$membership', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userData',
        },
      },
      { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          userName: { $ifNull: ['$userData.name', 'Unknown'] },
          userEmail: { $ifNull: ['$userData.email', null] },
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);
  }
}
