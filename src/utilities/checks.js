export function isValidFunctionName(name) {
  return /^[a-zA-Z_\$][a-zA-Z0-9_\$]*$/.test(name);
}
