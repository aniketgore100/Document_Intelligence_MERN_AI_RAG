import { ACTIONS } from "../constants/actions.js";
import { ROLES } from "../constants/roles.js";

const ROLE_ACTION_MAP = new Map([
  [
    ROLES.GLOBAL_ADMIN,
    new Set([
      ACTIONS.ORGANIZATION.CREATE,
      ACTIONS.ORGANIZATION.READ,
      ACTIONS.ORGANIZATION.ANALYTICS_READ,
    ]),
  ],
  [
    ROLES.ORG_ADMIN,
    new Set([
      ACTIONS.DEPARTMENT.CREATE,
      ACTIONS.DEPARTMENT.READ,
      ACTIONS.DEPARTMENT.UPDATE,
      ACTIONS.DEPARTMENT.DELETE,
      ACTIONS.USER.READ,
      ACTIONS.DOCUMENT.CREATE,
      ACTIONS.DOCUMENT.READ,
      ACTIONS.DOCUMENT.UPDATE,
      ACTIONS.DOCUMENT.DELETE,
      ACTIONS.DOCUMENT.ASSIGN,
      ACTIONS.DOCUMENT.PROCESS,
      ACTIONS.ACCESS.READ,
      ACTIONS.ACCESS.UPDATE,
    ]),
  ],
]);

const PERMISSION_BASED_ROLES = new Set([ROLES.DEPT_ADMIN, ROLES.USER]);

export const can = ({ roleName, permissions = [] }, action) => {
  if (!action) {
    return {
      allowed: false,
      reason: "Missing Context",
    };
  }

  const allowedActions = ROLE_ACTION_MAP.get(roleName);
  if (allowedActions) {
    if (!allowedActions.has(action)) {
      return {
        allowed: false,
        reason: "Insufficient Role",
      };
    }

    return {
      allowed: true,
    };
  }

  if (!PERMISSION_BASED_ROLES.has(roleName)) {
    return {
      allowed: false,
      reason: "Insufficient Role",
    };
  }

  const allowedPermissions = new Set(
    Array.isArray(permissions)
      ? permissions.filter((permission) => typeof permission === "string")
      : []
  );

  if (!allowedPermissions.has(action)) {
    return {
      allowed: false,
      reason: "Insufficient Permission",
    };
  }

  return { allowed: true };
};
