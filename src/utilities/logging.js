import chalk from 'chalk';
import { I } from './helpers.js';
import { getLengthWithChalk, removeChalk } from './converters.js';

const terminalWidth = process.stdout.columns;
const logDisabled = false;
let warningLogged = false;
notifyLogDisabled();

export function log(...args) {
  if (logDisabled && warningLogged) return;
  console.log(...args);
}

export function notifyLogDisabled() {
  if (!logDisabled) return;
  centeredLog('>> Logging is Disabled <<', chalk.gray.italic);
  warningLogged = true;
}

export function centeredLog(message, color = I) {
  const coloredMessage = message;
  message = removeChalk(message);
  const messageLength = message.length;

  if (typeof color !== 'function') color = I;

  log(
    color(
      message
        .padStart((terminalWidth + messageLength) / 2, '-')
        .padEnd(terminalWidth, '-')
        .replace(message, coloredMessage),
    ),
  );
}
