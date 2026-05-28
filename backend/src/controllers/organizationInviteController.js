import { OrganizationInviteService } from "../services/organizationInviteService.js";
import { ROLES } from "../constants/roles.js";

const organizationInviteService = new OrganizationInviteService();

export const createOrgAdminInvite = async (req, res, next) => {
  try {
    const { organizationId, email } = req.body;

    const result = await organizationInviteService.createInvite({
      organizationId,
      email,
      roleName: ROLES.ORG_ADMIN,
      invitedBy: req.user?.id || req.user?._id || null,
      inviterRoleName: req.auth?.roleName || null,
    });

    return res.status(201).json({
      invite: result.invite.toPublic(),
      inviteLink: result.inviteLink,
    });
  } catch (err) {
    next(err);
  }
};

export const createDepartmentAdminInvite = async (req, res, next) => {
  try {
    const { organizationId, departmentId, email } = req.body;

    const result = await organizationInviteService.createInvite({
      organizationId,
      departmentId,
      email,
      roleName: ROLES.DEPT_ADMIN,
      invitedBy: req.user?.id || req.user?._id || null,
      inviterRoleName: req.auth?.roleName || null,
    });

    return res.status(201).json({
      invite: result.invite.toPublic(),
      inviteLink: result.inviteLink,
    });
  } catch (err) {
    next(err);
  }
};

export const createDepartmentUserInvite = async (req, res, next) => {
  try {
    const { organizationId, departmentId, email } = req.body;

    const result = await organizationInviteService.createInvite({
      organizationId,
      departmentId,
      email,
      roleName: ROLES.USER,
      invitedBy: req.user?.id || req.user?._id || null,
      inviterRoleName: req.auth?.roleName || null,
    });

    return res.status(201).json({
      invite: result.invite.toPublic(),
      inviteLink: result.inviteLink,
    });
  } catch (err) {
    next(err);
  }
};

export const listDepartmentUsers = async (req, res, next) => {
  try {
    const result = await organizationInviteService.listDepartmentUsers({
      departmentId: req.params.departmentId,
      requestedBy: req.user?.id || req.user?._id || null,
      requesterRoleName: req.auth?.roleName || null,
    });

    return res.status(200).json({
      users: result.users,
      pendingInvites: result.pendingInvites,
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
