import Organization from "../models/Organization.js";

export class OrganizationRepository{

    async findByIdSlug(id, slug){
    return Organization.findOne({ _id: id, slug })
    .populate({
      path: "Owner",
      select: "name email role",
      populate: {
        path: "role",
        select: "name permissions",
      },
    });
    }

    async create(data, options = {}){
        const org = await Organization.create([data], options);
        return org[0];
    }

    async findById(id){
        return Organization.findById(id);
    }

    async save(organizationDoc) {
        return organizationDoc.save();
    }

    async list({ status, limit = 20, skip = 0 } = {}){
        const filter = {};
        if (status) filter.status = status;

        return Organization.aggregate([
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
              let: { orgId: "$_id" },
              pipeline: [
                { $match: { $expr: { $eq: ["$organization", "$$orgId"] } } },
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

    async count({ status } = {}) {
        const filter = {};
        if (status) filter.status = status;
        return Organization.countDocuments(filter);
    }

}
