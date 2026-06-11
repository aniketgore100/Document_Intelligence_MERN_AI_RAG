import { ACTIONS } from "./actions.js";
import { ROLES } from "./roles.js";

export const DEFAULT_MEMBERSHIP_PERMISSIONS = Object.freeze({
  [ROLES.GLOBAL_ADMIN]: Object.freeze([]),
  [ROLES.ORG_ADMIN]: Object.freeze([]),
  [ROLES.DEPT_ADMIN]: Object.freeze([
    ACTIONS.DEPARTMENT.READ,
    ACTIONS.USER.CREATE,
    ACTIONS.USER.READ,
    ACTIONS.USER.DELETE,
    ACTIONS.DOCUMENT.READ,
    ACTIONS.DOCUMENT.ASSIGN,
  ]),
  [ROLES.USER]: Object.freeze([
    ACTIONS.DOCUMENT.READ_ASSIGNED,
    ACTIONS.PROFILE.UPDATE,
  ]),
});

export const PERMISSION_MANAGEMENT_SCOPE = Object.freeze({
  [ROLES.ORG_ADMIN]: Object.freeze([
    ROLES.DEPT_ADMIN,
    ROLES.USER,
  ]),
});

export const MANAGED_PERMISSION_OPTIONS = Object.freeze({
  [ROLES.DEPT_ADMIN]: Object.freeze([
    ACTIONS.DEPARTMENT.READ,
    ACTIONS.USER.CREATE,
    ACTIONS.USER.READ,
    ACTIONS.USER.DELETE,
    ACTIONS.DOCUMENT.READ,
    ACTIONS.DOCUMENT.ASSIGN,
  ]),
  [ROLES.USER]: Object.freeze([
    ACTIONS.DOCUMENT.READ_ASSIGNED,
    ACTIONS.PROFILE.UPDATE,
  ]),
});

export const getDefaultPermissionsForRole = (roleName) => {
  if (!roleName || typeof roleName !== "string") return [];
  return [...(DEFAULT_MEMBERSHIP_PERMISSIONS[roleName] || [])];
};

export const getManageableRolePermissions = (actorRoleName) => {
  if (!actorRoleName || typeof actorRoleName !== "string") return [];
  return [...(PERMISSION_MANAGEMENT_SCOPE[actorRoleName] || [])];
};

export const getManageablePermissionsForRole = (roleName) => {
  if (!roleName || typeof roleName !== "string") return [];
  return [...(MANAGED_PERMISSION_OPTIONS[roleName] || [])];
};
