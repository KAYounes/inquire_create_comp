import chalk from 'chalk';
import { I } from './helpers.js';
import { getLengthWithChalk, removeChalk } from './converters.js';
import { isValue } from './checks.js';

const terminalWidth = process.stdout.columns;
let logDisabled = false;
let warningLogged = false;
notifyLogDisabled();

export function silent() {
  logDisabled = true;
  notifyLogDisabled();
}
export function log(...args) {
  if (logDisabled && warningLogged) return;
  console.log(...args);
}

export function logf(...args) {
  // forced log
  console.log(...args);
}

export function bybassLog(f) {
  const prevState = logDisabled;
  logDisabled = false;
  f();
  logDisabled = prevState;
}

export function notifyLogDisabled() {
  if (!logDisabled) return;
  log();
  centeredLog('>> Logging is Disabled <<', chalk.red.italic);
  log();
  warningLogged = true;
}

export function centeredLog(message, color = I) {
  const coloredMessage = message;
  message = removeChalk(message);
  const messageLength = message.length;

  const lines = coloredMessage.split('\n');

  if (typeof color !== 'function') color = I;
  const remaining = (terminalWidth - removeChalk(lines[0]).length) / 2;
  let sides = '-'.repeat(remaining);
  log(color(sides) + color(lines[0]) + color(sides));

  if (lines.length < 1) return;
  for (let line of lines.slice(1)) {
    let remaining = (terminalWidth - removeChalk(line).length) / 2;
    let sides = ' '.repeat(remaining);
    log(color(sides) + color(line) + color(sides));
  }
}

export function logMessage(firstLine, secondLine, flColor = chalk.gray, slColor = chalk.gray) {
  log(`${flColor('>>')} ${firstLine}`);
  log(`    ${slColor('\\__')}${chalk.gray(secondLine)}`);
}

export function warnLog(message) {
  yellowLog('warning', message);
}

export function terminationLog(message) {
  redLog('TERMINATING', message);
}

export function infoLog(message) {
  blueLog('info', message);
}

export function successLog(message) {
  greenLog('success', message);
}

export function yellowLog(title, message) {
  logMessage(chalk.yellow(title), message, chalk.yellow);
}

export function redLog(title, message) {
  logMessage(chalk.red(title), message, chalk.red);
}

export function blueLog(title, message) {
  logMessage(chalk.blue(title), message, chalk.blue);
}

export function greenLog(title, message) {
  logMessage(chalk.green(title), message, chalk.green);
}

export function logFileCreation(fileName, relPath) {
  log();
  greenLog(`File Created [${fileName}]`, `${fileName} created > ${chalk.underline(relPath)}`);
}

export function logFileCreationFailure(fileName, relPath, error) {
  const errorSegment = isValue(error) ? `, error: ${error}` : '';
  redLog(
    `File Creation Failed [${fileName}]`,
    `Failed to create ${fileName} at > ${chalk.underline(relPath)}${errorSegment}`,
  );
}
