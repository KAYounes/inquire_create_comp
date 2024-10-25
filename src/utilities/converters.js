import chalk from 'chalk';

export function toFunctionName(tokens) {
  tokens = tokens.split(' ');
  tokens = tokens.map((token) => token.trim().replace(/^./, (match) => match.toUpperCase()));
  tokens = tokens.filter((token) => token);
  return tokens.join('');
}

function upperCapFirst(word) {
  return word.replace(/^./, (first) => first.toUpperCase());
}
function lowerCapFirst(word) {
  return word.replace(/^./, (first) => first.toLowerCase());
}

function tokenize(input) {
  return input.split(' ').filter(Boolean);
}

export function toUpperCamelCase(input) {
  const tokens = tokenize(input);
  return tokens.map((token) => upperCapFirst(token)).join('');
}
export function toLowerCamelCase(input) {
  const upperCamelCase = toUpperCamelCase(input);
  return lowerCapFirst(upperCamelCase);
}

// case 1: U U / Sidebar Menu = 2
// case 1: U l / Sidebar menu = 2
// case 1: l U / sidebar Menu = 2
// case 1: l l / sidebar menu = 2
// case 1:  UU / SidebarMenu = 2
// case 1:  Ul / Sidebarmenu = 0
// case 1:  lU / sidebarMenu = 2
// case 1:  ll / sidebarmenu = 0

export function appendHelpToMessage(message, help) {
  return message + chalk.gray(help);
}

export function toMultiLine(...lines) {
  return lines.join('\n');
}

export function getLengthWithChalk(str) {
  // Remove ANSI escape codes
  const ansiRegex = /\u001B\[[0-9;]*m/g;
  return str.replace(ansiRegex, '').length;
}
