import { RoleRepository } from '../repositories/roleRepository.js';
import { ALL_PERMISSIONS } from '../constants/permissions.js';
import { getAllowedPermissionsForRole } from '../constants/rolePermissionMap.js';

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

  async createRole({ name, permissions }) {
    const normalizedName = name?.trim();
    if (!normalizedName) {
      const err = new Error('Role name is required');
      err.statusCode = 400;
      throw err;
    }

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

  async updateRolePermissions({ roleId, permissions }) {
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      const err = new Error('Role not found');
      err.statusCode = 404;
      throw err;
    }

    const normalizedPermissions = this.normalizePermissions(permissions);
    this.validatePermissions(normalizedPermissions);
    this.validatePermissionsForRole(role.name, normalizedPermissions);

    role.permissions = normalizedPermissions;
    return this.roleRepository.save(role);
  }

  async getRoles() {
    return this.roleRepository.get();
  }
}
