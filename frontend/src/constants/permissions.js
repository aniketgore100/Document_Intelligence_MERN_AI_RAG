import { ROLES } from "./roles";

export const PERMISSIONS = Object.freeze({
  ORGANIZATION: Object.freeze({
    CREATE: 'organization:create',
    READ: 'organization:read',
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
});

export const PERMISSION_OPTIONS = Object.freeze([
  ...Object.values(PERMISSIONS.ORGANIZATION),
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
    PERMISSIONS.ORGANIZATION.READ,
  ]),
  [ROLES.DEPT_ADMIN]: Object.freeze([]),
  [ROLES.USER]: Object.freeze([]),
});

export const getAllowedPermissionsForRole = (roleName) => {
  if (!roleName || typeof roleName !== "string") return [];
  return ROLE_PERMISSION_MAP[roleName] || [];
};
