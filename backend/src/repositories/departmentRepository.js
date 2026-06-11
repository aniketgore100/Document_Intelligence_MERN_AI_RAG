import mongoose from "mongoose";
import Department from "../models/Department.js";

const toObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : value;

export class DepartmentRepository {
  create(payload, options = {}) {
    return Department.create([payload], options).then((docs) => docs[0]);
  }

  findById(id) {
    return Department.findById(id).populate("Owner", "name email");
  }

  findByIdPlain(id, options = {}) {
    const query = Department.findById(id);
    if (options.session) {
      query.session(options.session);
    }
    return query;
  }

  findBySlugInOrganization({ organizationId, slug }) {
    return Department.findOne({ organization: organizationId, slug });
  }

  save(departmentDoc, options = {}) {
    return departmentDoc.save(options);
  }

  deleteById(id, options = {}) {
    return Department.deleteOne({ _id: id }, options);
  }

  listByOrganization({ organizationId, status, limit = 20, skip = 0 }) {
    const filter = { organization: toObjectId(organizationId) };
    if (status) filter.status = status;
    return Department.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "Owner",
          foreignField: "_id",
          as: "Owner",
          pipeline: [{ $project: { _id: 1, name: 1, email: 1 } }],
        },
      },
      {
        $unwind: {
          path: "$Owner",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "organizationinvites",
          let: { departmentId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$department", "$$departmentId"] },
                roleName: "DEPT_ADMIN",
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { _id: 0, status: 1, expiresAt: 1, email: 1 } },
          ],
          as: "latestInvite",
        },
      },
      {
        $addFields: {
          inviteStatus: { $ifNull: [{ $arrayElemAt: ["$latestInvite.status", 0] }, null] },
          inviteExpiresAt: { $ifNull: [{ $arrayElemAt: ["$latestInvite.expiresAt", 0] }, null] },
          inviteEmail: { $ifNull: [{ $arrayElemAt: ["$latestInvite.email", 0] }, null] },
        },
      },
      { $project: { latestInvite: 0 } },
    ]);
  }

  countByOrganization({ organizationId, status }) {
    const filter = { organization: organizationId };
    if (status) filter.status = status;
    return Department.countDocuments(filter);
  }
}
