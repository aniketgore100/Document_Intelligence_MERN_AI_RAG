export const ACTIONS = Object.freeze({
  ORGANIZATION: Object.freeze({
    CREATE: 'organization:create',
    READ: 'organization:read',
    ANALYTICS_READ: 'organization:analytics:read',
  }),
  DEPARTMENT: Object.freeze({
    CREATE: 'department:create',
    READ: 'department:read',
    UPDATE: 'department:update',
    DELETE: 'department:delete',
  }),
  DOCUMENT: Object.freeze({
    CREATE: 'document:create',
    READ: 'document:read',
    UPDATE: 'document:update',
    DELETE: 'document:delete',
    ASSIGN: 'document:assign',
    READ_ASSIGNED: 'document:read:assigned',
  }),

  USER : Object.freeze({
    CREATE : 'user:create',
    READ : 'user:read',
    DELETE : 'user:delete',
    UPDATE : 'user:update'
  }),
  ACCESS: Object.freeze({
    READ: 'access:read',
    UPDATE: 'access:update',
  }),
  PROFILE: Object.freeze({
    UPDATE: 'profile:update',
  }),
});
