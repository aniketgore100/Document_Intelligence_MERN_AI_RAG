import { RoleRepository } from '../repositories/roleRepository.js';

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

  async createRole({ name, permissions }) {
    const normalizedName = name?.trim();
    if (!normalizedName) {
      const err = new Error('Role name is required');
      err.statusCode = 400;
      throw err;
    }

    const normalizedPermissions = this.normalizePermissions(permissions);

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

    role.permissions = this.normalizePermissions(permissions);
    return this.roleRepository.save(role);
  }

  async getRoles () {
    return this.roleRepository.get();
  }
}
