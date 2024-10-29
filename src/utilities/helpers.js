import { isValue } from './checks.js';

export function returnIfValue(query, def) {
  return isValue(query) ? query : def;
}

export function I(query) {
  return query;
}
