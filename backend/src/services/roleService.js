import { RoleRepository } from '../repositories/roleRepository.js';
import { ALL_PERMISSIONS } from '../constants/permissions.js';
import { ROLES } from '../constants/roles.js';
import { getAllowedPermissionsForRole } from '../constants/rolePermissionMap.js';

const GLOBAL_ADMIN_MANAGED_ROLES = new Set([ROLES.ORG_ADMIN]);

export class RoleService {

  constructor({ roleRepository = new RoleRepository() } = {}) {
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

  validatePermissions(permissions) {
    const invalid = permissions.filter((permission) => !ALL_PERMISSIONS.includes(permission));
    if (invalid.length) {
      const err = new Error(`Invalid permissions: ${invalid.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }
  }

  validatePermissionsForRole(roleName, permissions) {
    const allowedForRole = new Set(getAllowedPermissionsForRole(roleName));
    const outOfScope = permissions.filter((permission) => !allowedForRole.has(permission));
    if (outOfScope.length) {
      const err = new Error(
        `Permissions not allowed for ${roleName}: ${outOfScope.join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }
  }

  assertRoleManagementScope({ actorRoleName, targetRoleName }) {
    if (actorRoleName === ROLES.GLOBAL_ADMIN && !GLOBAL_ADMIN_MANAGED_ROLES.has(targetRoleName)) {
      const err = new Error(`Global admin cannot manage ${targetRoleName}`);
      err.statusCode = 403;
      throw err;
    }
  }

  async createRole({ name, permissions, actorRoleName = null }) {
    const normalizedName = name?.trim();
    if (!normalizedName) {
      const err = new Error('Role name is required');
      err.statusCode = 400;
      throw err;
    }

    this.assertRoleManagementScope({ actorRoleName, targetRoleName: normalizedName });

    const normalizedPermissions = this.normalizePermissions(permissions);
    this.validatePermissions(normalizedPermissions);
    this.validatePermissionsForRole(normalizedName, normalizedPermissions);

    const existingRole = await this.roleRepository.findByName(normalizedName);
    if (existingRole) {
      const err = new Error('Role already exists');
      err.statusCode = 409;
      throw err;
    }

    return this.roleRepository.create({
      name: normalizedName,
      permissions: normalizedPermissions,
    });
  }

  async updateRolePermissions({ roleId, permissions, actorRoleName = null }) {
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      const err = new Error('Role not found');
      err.statusCode = 404;
      throw err;
    }

    this.assertRoleManagementScope({ actorRoleName, targetRoleName: role.name });

    const normalizedPermissions = this.normalizePermissions(permissions);
    this.validatePermissions(normalizedPermissions);
    this.validatePermissionsForRole(role.name, normalizedPermissions);

    role.permissions = normalizedPermissions;
    return this.roleRepository.save(role);
  }

  async getRoles({ actorRoleName = null } = {}) {
    const roles = await this.roleRepository.get();
    const normalizedRoles = roles.map((role) => {
      const canonicalPermissions = getAllowedPermissionsForRole(role.name);
      const rawRole = typeof role.toObject === "function" ? role.toObject() : role;
      if (!canonicalPermissions.length) return rawRole;

      return {
        ...rawRole,
        permissions: [...canonicalPermissions],
      };
    });

    console.log('Normalized roles:', normalizedRoles);
    return normalizedRoles;
  }

  async getRoleById(id) {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      const err = new Error('Role not found');
      err.statusCode = 404;
      throw err;
    }
    return role;
  }
}
