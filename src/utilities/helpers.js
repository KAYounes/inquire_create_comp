import chalk from 'chalk';
import { isValue } from './checks.js';
import ansiEscapes from 'ansi-escapes';

export function returnIfValue(query, def) {
  return isValue(query) ? query : def;
}

export function I(query) {
  return query;
}

export function toggle(query) {
  return !query;
}

// export async function sleep(ms) {
//   return new Promise((resolve) => {
//     const frames = ['', '.', '..', '...'];
//     let i = 0;

//     process.stdin.pause();
//     console.log(ansiEscapes.cursorHide);

//     const interval = setInterval(() => {
//       process.stdout.write(`\r`); // \r returns the cursor to the start of the line
//       process.stdout.clearLine();
//       // process.stdout.write(``); // \r returns the cursor to the start of the line
//       process.stdout.write(`${chalk.gray(frames[i % frames.length])} `); // \r returns the cursor to the start of the line
//       i++;
//     }, 500); // updates every 500ms

//     setTimeout(() => {
//       process.stdout.clearLine();
//       process.stdout.write(`\r`); // \r returns the cursor to the start of the line
//       console.log(ansiEscapes.cursorShow);
//       clearInterval(interval);
//       process.stdout.write('\rDone!          \n'); // clear the line after animation
//       resolve();
//     }, ms);
//   });
// }

export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
