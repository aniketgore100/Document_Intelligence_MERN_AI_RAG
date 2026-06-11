import { ROLES } from "./roles";

export const DEPARTMENT_PERMISSION_OPTIONS = Object.freeze({
  [ROLES.DEPT_ADMIN]: Object.freeze([
    {
      value: "department:read",
      label: "View department",
      description: "Access department details and analytics.",
    },
    {
      value: "user:create",
      label: "Create users",
      description: "Invite new department members.",
    },
    {
      value: "user:read",
      label: "View users",
      description: "See department members and invitations.",
    },
    {
      value: "user:delete",
      label: "Remove users",
      description: "Delete access for department members.",
    },
    {
      value: "document:read",
      label: "Read documents",
      description: "Open and review department documents.",
    },
    {
      value: "document:assign",
      label: "Assign documents",
      description: "Route documents to other members.",
    },
  ]),
  [ROLES.USER]: Object.freeze([
    {
      value: "document:read:assigned",
      label: "Read assigned documents",
      description: "Open documents assigned to the user.",
    },
    {
      value: "profile:update",
      label: "Update profile",
      description: "Allow basic account updates.",
    },
  ]),
});
