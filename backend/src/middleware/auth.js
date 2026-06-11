import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import { OrganizationMembershipRepository } from "../repositories/organizationMembershipRepository.js";
import { ROLES } from "../constants/roles.js";
import { getDefaultPermissionsForRole } from "../constants/permissions.js";

const organizationMembershipRepository = new OrganizationMembershipRepository();

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).populate('role');

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = user;
    const roleName = user.role?.name || null;
    const membership =
      roleName === ROLES.ORG_ADMIN
        ? await organizationMembershipRepository.findActiveOrgMembership({ userId: user._id })
        : roleName
          ? await organizationMembershipRepository.findActiveMembershipByRole({
              userId: user._id,
              roleName,
            })
          : null;
    const permissions = Array.isArray(membership?.permissions)
      ? membership.permissions
      : getDefaultPermissionsForRole(roleName);
    req.auth = {
      userId: user._id.toString(),
      roleId: user.role?._id?.toString() || null,
      roleName,
      organizationId: membership?.organization?._id?.toString?.() || membership?.organization?.toString?.() || null,
      organizationName: membership?.organization?.name || null,
      departmentId: membership?.department?._id?.toString?.() || membership?.department?.toString?.() || null,
      departmentName: membership?.department?.name || null,
      permissions,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
