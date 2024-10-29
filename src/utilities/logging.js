import chalk from 'chalk';
import { I } from './helpers.js';
import { getLengthWithChalk } from './converters.js';

const logDisabled = false;

export function log(...args) {
  if (logDisabled) return;
  console.log(...args);
}

function notifyLogDisabled() {
  // if(logDisabled) console.log(chalk.red(""))
}

const terminalWidth = process.stdout.columns;

console.log('Terminal width:', terminalWidth);
const message = 'working?';
const prefix = ' >>> ';
const suffix = ' <<< ';
const remaing = terminalWidth - message.length - prefix.length - suffix.length;
// log(`message.length ${message.length} - prefix.length ${prefix.length} suffix.length ${suffix.length}`);
// log(remaing, remaing / 2 + remaing / 2);
// log('-'.repeat(terminalWidth));
// log('-'.repeat(remaing) + prefix + message + suffix);
// log('-'.repeat(remaing / 2) + '-'.repeat(remaing / 2));
// log('-'.repeat(remaing / 2) + '-'.repeat(remaing / 2) + '-'.repeat(29));
log('-'.repeat(remaing / 2) + prefix + message + suffix + '-'.repeat(remaing / 2));

export function centeredLog(message, color = I) {
  const terminalWidth = process.stdout.columns;
  const messageLength = getLengthWithChalk(message);
  const coloredMessageLength = message.length - messageLength;
  console.log(messageLength);

  if (typeof color !== 'function') color = I;

  log(message.padStart((terminalWidth + messageLength) / 2, '-').padEnd(terminalWidth, '-'));
  log(''.padStart((terminalWidth + messageLength) / 2).length);
}
