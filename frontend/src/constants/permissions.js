import { ROLES } from "./roles";

export const PERMISSIONS = Object.freeze({
  ORGANIZATION: Object.freeze({
    CREATE: 'organization:create',
    READ: 'organization:read',
  }),
  DEPARTMENT: Object.freeze({
    CREATE: 'department:create',
    READ: 'department:read',
    UPDATE: 'department:update',
    DELETE: 'department:delete',
  }),
  ROLE: Object.freeze({
    CREATE: 'role:create',
    READ: 'role:read',
    UPDATE: 'role:update',
  }),
  PERMISSION: Object.freeze({
    CREATE: 'permission:create',
    READ: 'permission:read',
    UPDATE: 'permission:update',
    DELETE: 'permission:delete',
  }),
  USER: Object.freeze({
    CREATE: 'user:create',
    READ: 'user:read',
    UPDATE: 'user:update',
    DELETE: 'user:delete',
  }),
});

export const PERMISSION_OPTIONS = Object.freeze([
  ...Object.values(PERMISSIONS.ORGANIZATION),
  ...Object.values(PERMISSIONS.DEPARTMENT),
  ...Object.values(PERMISSIONS.ROLE),
  ...Object.values(PERMISSIONS.PERMISSION),
]);

export const ROLE_PERMISSION_MAP = Object.freeze({
  [ROLES.GLOBAL_ADMIN]: Object.freeze([
    PERMISSIONS.ORGANIZATION.CREATE,
    PERMISSIONS.ORGANIZATION.READ,
    PERMISSIONS.ROLE.CREATE,
    PERMISSIONS.ROLE.READ,
    PERMISSIONS.ROLE.UPDATE,
    PERMISSIONS.PERMISSION.CREATE,
    PERMISSIONS.PERMISSION.READ,
    PERMISSIONS.PERMISSION.UPDATE,
    PERMISSIONS.PERMISSION.DELETE,
  ]),
  [ROLES.ORG_ADMIN]: Object.freeze([
    PERMISSIONS.DEPARTMENT.CREATE,
    PERMISSIONS.DEPARTMENT.READ,
    PERMISSIONS.DEPARTMENT.UPDATE,
    PERMISSIONS.DEPARTMENT.DELETE,
  ]),
  [ROLES.DEPT_ADMIN]: Object.freeze([
    PERMISSIONS.USER.CREATE,
    PERMISSIONS.USER.READ,
    PERMISSIONS.USER.UPDATE,
    PERMISSIONS.USER.DELETE
  ]),
  [ROLES.USER]: Object.freeze([]),
});

export const getAllowedPermissionsForRole = (roleName) => {
  if (!roleName || typeof roleName !== "string") return [];
  return ROLE_PERMISSION_MAP[roleName] || [];
};
