import { ACTIONS } from "../constants/actions.js";
import { ROLES } from "../constants/roles.js";

export const can = ({ roleName, permissions }, action) => {
  if (!action) {
    return {
      allowed: false,
      reason: "Missing Context",
    };
  }

  const globalAdminOnlyActions = new Set([
    ACTIONS.ROLE.CREATE,
    ACTIONS.ROLE.UPDATE,
    ACTIONS.ROLE.READ,
    ACTIONS.PERMISSION.CREATE,
    ACTIONS.PERMISSION.UPDATE,
    ACTIONS.PERMISSION.DELETE,
    ACTIONS.PERMISSION.READ,
  ]);

  if (globalAdminOnlyActions.has(action) && roleName !== ROLES.GLOBAL_ADMIN) {
    return {
      allowed: false,
      reason: "Only global admin can manage organization-level roles/permissions",
    };
  }

  const allowedActions = new Set(
    Array.isArray(permissions)
      ? permissions.filter((permission) => typeof permission === "string")
      : []
  );

  if (!allowedActions.has(action) && !allowedActions.has("*")) {
    return {
      allowed: false,
      reason: "Insufficient Role",
    };
  }

  return {
    allowed: true,
  };
};
