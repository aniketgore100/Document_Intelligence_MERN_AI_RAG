export const ACTIONS = Object.freeze({

  ORGANIZATION: Object.freeze({
    CREATE: 'organization:create',
  }),

  ROLE: Object.freeze({
    CREATE: 'role:create',
    READ: 'role:read',
    UPDATE: 'role:update',
  }),
  
  PERMISSION: Object.freeze({
    CREATE: 'permission:create',
    UPDATE: 'permission:update',
    DELETE: 'permission:delete',
    READ : 'permission:read',
  }),
});
