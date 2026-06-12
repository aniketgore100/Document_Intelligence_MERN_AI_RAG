import { AuthRepository } from "../repositories/authRepository.js";
import { RoleRepository } from "../repositories/roleRepository.js";
import { OrganizationMembershipRepository } from "../repositories/organizationMembershipRepository.js";
import { signToken } from "../utils/jwt.js";
import { ROLES } from "../constants/roles.js";
import { getDefaultPermissionsForRole } from "../constants/permissions.js";

export class AuthService {
  
  constructor({ 
    authRepository = new AuthRepository(), 
    roleRepository = new RoleRepository(),
    organizationMembershipRepository = new OrganizationMembershipRepository(),
  } = {}) {
    this.authRepository = authRepository;
    this.roleRepository = roleRepository;
    this.organizationMembershipRepository = organizationMembershipRepository;
  }

  async register({ name, email, password }) {
    const existing = await this.authRepository.findByEmail(email);
    if (existing) {
      const err = new Error("Email already in use");
      err.statusCode = 409;
      throw err;
    }

    const user = await this.authRepository.createUser({
      name,
      email,
      password,
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
    const membership =
      roleDoc?.name === ROLES.ORG_ADMIN
        ? await this.organizationMembershipRepository.findActiveOrgMembership({ userId: user._id })
        : roleDoc?.name
          ? await this.organizationMembershipRepository.findActiveMembershipByRole({
              userId: user._id,
              roleName: roleDoc.name,
            })
          : null;
    const token = signToken({ id: user._id });
    const permissions = Array.isArray(membership?.permissions)
      ? membership.permissions
      : getDefaultPermissionsForRole(roleDoc?.name || null);

    return {
      user: {
        ...user.toPublic(),
        roleName: roleDoc?.name || null,
        permissions,
        organizationId: membership?.organization?._id || membership?.organization || null,
        organizationName: membership?.organization?.name || null,
        departmentId: membership?.department?._id || membership?.department || null,
        departmentName: membership?.department?.name || null,
      },
      token,
    };
  }

  getMe(user, auth = {}) {
    return {
      user: {
        ...user.toPublic(),
        roleName: auth.roleName || user.roleName || null,
        permissions: auth.permissions || [],
        organizationId: auth.organizationId || null,
        organizationName: auth.organizationName || null,
        departmentId: auth.departmentId || null,
        departmentName: auth.departmentName || null,
      },
    };
  }

  async updateMe({ userId, name, auth = {} }) {
    const normalizedName = typeof name === "string" ? name.trim() : "";
    if (normalizedName.length < 2 || normalizedName.length > 60) {
      const err = new Error("Name must be 2-60 characters");
      err.statusCode = 400;
      throw err;
    }

    const user = await this.authRepository.findById(userId);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    user.name = normalizedName;
    const updatedUser = await this.authRepository.saveUser(user);
    return this.getMe(updatedUser, auth);
  }
}
