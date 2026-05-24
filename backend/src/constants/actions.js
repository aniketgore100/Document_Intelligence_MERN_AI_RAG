export const ACTIONS = Object.freeze({
  ORGANIZATION: Object.freeze({
    CREATE: 'organization:create',
    READ: 'organization:read',
  }),

  ROLE: Object.freeze({
    CREATE: 'role:create',
    READ: 'role:read',
    UPDATE: 'role:update',
  }),

  USER : Object.freeze({
    CREATE : 'user:create',
    READ : 'user:read',
    DELETE : 'user:delete',
    UPDATE : 'user:update'
  }),
  
  PERMISSION: Object.freeze({
    CREATE: 'permission:create',
    UPDATE: 'permission:update',
    DELETE: 'permission:delete',
    READ: 'permission:read',
  }),
});
