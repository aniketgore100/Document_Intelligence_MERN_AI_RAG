import { ACTIONS } from './actions.js';

const collectActionValues = (obj) => {
  return Object.values(obj).flatMap((value) => {
    if (typeof value === 'string') return [value];
    if (value && typeof value === 'object') return collectActionValues(value);
    return [];
  });
};

export const ALL_PERMISSIONS = Object.freeze(collectActionValues(ACTIONS));

export const isValidPermission = (permission) => ALL_PERMISSIONS.includes(permission);
