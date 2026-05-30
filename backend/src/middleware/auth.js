import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import { getAllowedPermissionsForRole } from '../constants/rolePermissionMap.js';

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
    const canonicalPermissions = roleName ? getAllowedPermissionsForRole(roleName) : [];
    req.auth = {
      userId: user._id.toString(),
      roleId: user.role?._id?.toString() || null,
      roleName,
      permissions: canonicalPermissions.length
        ? canonicalPermissions
        : Array.isArray(user.role?.permissions)
          ? user.role.permissions
          : [],
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
