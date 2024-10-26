export function isValidFunctionName(name) {
  return /^[a-zA-Z_\$][a-zA-Z0-9_\$]*$/.test(name);
}

export function isValue(query) {
  return query !== '' && query !== undefined && query != null && query !== 0;
}
