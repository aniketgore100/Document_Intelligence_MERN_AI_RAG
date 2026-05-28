export const ACTIONS = Object.freeze({
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
