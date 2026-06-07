import { MembershipService } from "../services/membershipService.js";

const membershipService = new MembershipService();

export const updateMembershipPermissions = async (req, res, next) => {
  try {
    const { permissions } = req.body;
    const result = await membershipService.updatePermissions({
      membershipId: req.params.id,
      permissions,
      actorUserId: req.user?.id || req.user?._id || null,
    });

    return res.status(200).json({
      membership: result.toPublic ? result.toPublic() : result,
    });
  } catch (error) {
    next(error);
  }
};
