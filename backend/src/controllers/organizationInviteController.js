import { OrganizationInviteService } from "../services/organizationInviteService.js";

const organizationInviteService = new OrganizationInviteService();

export const createOrganizationInvite = async (req, res, next) => {
  try {
    const { organizationId, email, roleName } = req.body;

    const result = await organizationInviteService.createInvite({
      organizationId,
      email,
      roleName,
      invitedBy: req.user?.id || req.user?._id || null,
    });

    return res.status(201).json({
      invite: result.invite.toPublic(),
      inviteLink: result.inviteLink,
    });
  } catch (err) {
    next(err);
  }
};

export const validateOrganizationInvite = async (req, res, next) => {
  try {
    const { token } = req.query;
    const invite = await organizationInviteService.validateInviteToken({ token });
    return res.status(200).json({ invite });
  } catch (err) {
    next(err);
  }
};

export const acceptOrganizationInvite = async (req, res, next) => {
  try {
    const { token, name, password } = req.body;
    const result = await organizationInviteService.acceptInvite({ token, name, password });
    return res.status(201).json({
      message: "Invite accepted successfully. Please login.",
      user: result.user,
      organization: result.organization,
      invite: result.invite,
    });
  } catch (err) {
    next(err);
  }
};
