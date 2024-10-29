import chalk from 'chalk';

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
const message = 'Logging Is Disabled';
const prefix = ' >>> ';
const suffix = ' <<< ';
const remaing = terminalWidth - message.length - prefix.length - suffix.length;
// log(`message.length ${message.length} - prefix.length ${prefix.length} suffix.length ${suffix.length}`);
// log(remaing, remaing / 2 + remaing / 2);
// log('-'.repeat(terminalWidth));
// log('-'.repeat(remaing) + prefix + message + suffix);
// log('-'.repeat(remaing / 2) + '-'.repeat(remaing / 2));
// log('-'.repeat(remaing / 2) + '-'.repeat(remaing / 2) + '-'.repeat(29));
// log('-'.repeat(remaing / 2) + prefix + message + suffix + '-'.repeat(remaing / 2));

function centeredLog(message, { prefix, suffix, color, prefixFill, suffixFill }) {
  const terminalWidth = process.stdout.columns;
}
