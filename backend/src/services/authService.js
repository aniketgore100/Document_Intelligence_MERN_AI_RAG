import { AuthRepository } from "../repositories/authRepository.js";
import { RoleRepository } from "../repositories/roleRepository.js";
import { signToken } from "../utils/jwt.js";
import { ROLES } from "../constants/roles.js";
import { getAllowedPermissionsForRole } from "../constants/rolePermissionMap.js";

export class AuthService {
  constructor({
    authRepository = new AuthRepository(),
    roleRepository = new RoleRepository(),
  } = {}) {
    this.authRepository = authRepository;
    this.roleRepository = roleRepository;
  }

  normalizePermissions(permissions) {
    return [
      ...new Set(
        (Array.isArray(permissions) ? permissions : [])
          .map((permission) => permission?.trim())
          .filter(Boolean)
      ),
    ];
  }

  async register({ name, email, password, role }) {
    const existing = await this.authRepository.findByEmail(email);
    if (existing) {
      const err = new Error("Email already in use");
      err.statusCode = 409;
      throw err;
    }

    let roleId = null;

    if (role) {
      const roleName = role.trim();
      let roleDoc = await this.roleRepository.findByName(roleName);

      if (roleName === ROLES.GLOBAL_ADMIN) {
        if (!roleDoc) {
          roleDoc = await this.roleRepository.create({
            name: ROLES.GLOBAL_ADMIN,
            permissions: [...getAllowedPermissionsForRole(ROLES.GLOBAL_ADMIN)],
          });
        } else {
          const mergedPermissions = this.normalizePermissions([
            ...(roleDoc.permissions || []),
            ...getAllowedPermissionsForRole(ROLES.GLOBAL_ADMIN),
          ]);

          if (mergedPermissions.length !== (roleDoc.permissions || []).length) {
            roleDoc.permissions = mergedPermissions;
            roleDoc = await this.roleRepository.save(roleDoc);
          }
        }
      } else if (!roleDoc) {
        const err = new Error("Invalid role");
        err.statusCode = 400;
        throw err;
      }

      roleId = roleDoc?._id || null;
    }

    const user = await this.authRepository.createUser({
      name,
      email,
      password,
      role: roleId,
    });

    return { user: user.toPublic() };
  }

  async login({ email, password }) {
    const user = await this.authRepository.findByEmail(email, { withPassword: true });
    if (!user || !(await user.comparePassword(password))) {
      const err = new Error("Invalid email or password");
      err.statusCode = 401;
      throw err;
    }

    const roleDoc = user.role ? await this.roleRepository.findById(user.role) : null;
    const token = signToken({ id: user._id });

    return {
      user: {
        ...user.toPublic(),
        roleName: roleDoc?.name || null,
      },
      token,
    };
  }

  getMe(user) {
    return { user: user.toPublic() };
  }
}
