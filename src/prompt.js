import chalk from 'chalk';
import inquirer from 'inquirer';
import { stdin } from 'process';

import CustomConfirmPrompt from './custom.prompts/customConfirmPrompt.js';
import CustomInputPrompt from './custom.prompts/customInputPrompt.js';
import CustomSelectPrompt from './custom.prompts/customSelectPrompt.js';

import { log } from 'console';
import { isValidFunctionName } from './utilities/checks.js';
import { toFunctionName, toLowerCamelCase, toMultiLine, toUpperCamelCase } from './utilities/converters.js';
import { bybassLog, centeredLog, logf } from './utilities/logging.js';

inquirer.registerPrompt('c_input', CustomInputPrompt);
inquirer.registerPrompt('c_select', CustomSelectPrompt);
inquirer.registerPrompt('c_confirm', CustomConfirmPrompt);

const globalTheme = {
  prefix: { idle: chalk.magenta('(?)'), done: '✔ ' },
  style: {
    answer: (text) => chalk.green(text),
    error: (text) => chalk.red(text),
  },
};

export default async function startPrompting(COMPONENT_CONFIG, answerd) {
  // Capture keypress events to exit on Escape
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  stdin.on('data', (key) => {
    if (key === '\u001B') {
      bybassLog(() => {
        logf('\n\n');
        centeredLog(` XX Operation Was Cenceled XX\n${chalk.gray("'esc' was pressed")}\n`, chalk.red);
      });
      process.exit(0);
    }
  });

  bybassLog(() => {
    centeredLog(
      `${chalk.magenta(" !! Use 'Esc' to exit !! ")}\n${chalk.italic.gray('You can quit by pressing the escape key')}`,
      chalk.gray,
    );
    log();
  });

  // Prompt for component name first to be used later for other prompts
  COMPONENT_CONFIG.COMPONENT_NAME = await CustomInputPrompt({
    name: 'COMPONENT_CONFIG.COMPONENT_NAME',
    message: 'Component Name:',
    help: 'as a single word [SidebarMenu], or separated words [sidebar menu]',
    required: true,
    default: answerd?.COMPONENT_NAME || COMPONENT_CONFIG.COMPONENT_NAME,
    theme: { ...globalTheme },
    validate: (input) => isValidFunctionName(toFunctionName(input)),
    filter: function (input) {
      // console.log(input);
      // return input;
      return toUpperCamelCase(input);
    },
  });

  const COMPONENT_DECLARATION = toMultiLine(`function ${COMPONENT_CONFIG.COMPONENT_NAME} ({...})`, '{', '   ...', '}');

  // Sequentially prompt for each configuration
  COMPONENT_CONFIG.ADD_CHILDREN_PROPS =
    answerd?.ADD_CHILDREN_PROPS ??
    (await CustomConfirmPrompt({
      name: 'ADD_CHILDREN_PROPS',
      message: 'Add children prop?',
      help: `(function ${COMPONENT_CONFIG.COMPONENT_NAME} ({ children })`,
      accept: {
        name: 'Add children props',
        description: `(function ${COMPONENT_CONFIG.COMPONENT_NAME} ({ children })`,
      },
      decline: {
        name: 'Do not',
        description: `(function ${COMPONENT_CONFIG.COMPONENT_NAME} ({ props })`,
      },
      default: COMPONENT_CONFIG.ADD_CHILDREN_PROPS,
      theme: { ...globalTheme },
    }));

  COMPONENT_CONFIG.USE_CLIENT_DIRECTIVE =
    answerd?.USE_CLIENT_DIRECTIVE ??
    (await CustomConfirmPrompt({
      name: 'USE_CLIENT_DIRECTIVE',
      message: 'Add "use client" directive?',
      help: '(for next.js)',
      accept: {
        name: 'Add "use client" directive',
        description: toMultiLine('"use client"', '', COMPONENT_DECLARATION),
      },
      decline: {
        name: 'Do not',
        description: toMultiLine(COMPONENT_DECLARATION),
      },
      default: COMPONENT_CONFIG.USE_CLIENT_DIRECTIVE,
      theme: { ...globalTheme },
    }));

  COMPONENT_CONFIG.USE_INLINE_EXPORT =
    answerd?.USE_INLINE_EXPORT ??
    (await CustomConfirmPrompt({
      name: 'USE_INLINE_EXPORT',
      message: 'Export component inline with component declaration?',
      accept: {
        name: 'Use inline export',
        description: `export default ${COMPONENT_DECLARATION}`,
      },
      decline: {
        name: 'Do not',
        description: toMultiLine(COMPONENT_DECLARATION, '', `export default ${COMPONENT_CONFIG.COMPONENT_NAME};`),
      },
      default: COMPONENT_CONFIG.USE_INLINE_EXPORT,
      theme: { ...globalTheme },
    }));

  COMPONENT_CONFIG.CREATE_CSS_FILE =
    answerd?.CREATE_CSS_FILE ??
    (await CustomConfirmPrompt({
      name: 'CREATE_CSS_FILE',
      message: 'Create a CSS file for your component?',
      accept: {
        name: 'Add CSS file',
      },
      decline: {
        name: 'Do not',
      },
      default: COMPONENT_CONFIG.CREATE_CSS_FILE,
      theme: { ...globalTheme },
    }));

  if (COMPONENT_CONFIG.CREATE_CSS_FILE) {
    COMPONENT_CONFIG.CSS_FILE_AS_MODULE =
      answerd?.CSS_FILE_AS_MODULE ??
      (await CustomConfirmPrompt({
        name: 'CSS_FILE_AS_MODULE',
        message: 'Create the CSS file as a module?',
        accept: {
          name: 'Make CSS file a module',
          description: `${toLowerCamelCase(COMPONENT_CONFIG.COMPONENT_NAME)}.module.css`,
        },
        decline: {
          name: 'Do not',
          description: `${toLowerCamelCase(COMPONENT_CONFIG.COMPONENT_NAME)}.css`,
        },
        default: COMPONENT_CONFIG.CSS_FILE_AS_MODULE,
        theme: { ...globalTheme },
      }));
  }

  if (COMPONENT_CONFIG.CREATE_CSS_FILE) {
    COMPONENT_CONFIG.CSS_FILE_NAME =
      answerd?.CSS_FILE_NAME ??
      (await CustomInputPrompt({
        name: 'CSS_FILE_NAME',
        message: "Type the name of the component's CSS file.",
        default: toLowerCamelCase(COMPONENT_CONFIG.COMPONENT_NAME),
        required: true,
        filter: function (answer) {
          const regex = /^(.*?)(?:\.module|)\.css$/;
          const match = answer.match(regex);

          return match ? match[1] : answer; // if extension provided by user remove it
        },
        theme: { ...globalTheme },
      }));
  }

  COMPONENT_CONFIG.CREATE_COMPONENT_INDEX =
    answerd?.CREATE_COMPONENT_INDEX ??
    (await CustomConfirmPrompt({
      name: 'CREATE_COMPONENT_INDEX',
      message: 'Create index.js file?',
      accept: {
        name: 'Create index.js',
        description: toMultiLine(
          `export * from './${COMPONENT_CONFIG.COMPONENT_NAME}';`,
          `export { default } from './${COMPONENT_CONFIG.COMPONENT_NAME}';`,
        ),
      },
      decline: {
        name: 'Do not',
      },
      default: COMPONENT_CONFIG.CREATE_COMPONENT_INDEX,
      theme: { ...globalTheme },
    }));

  COMPONENT_CONFIG.COMPONENT_FILE_EXTENSION =
    answerd?.COMPONENT_FILE_EXTENSION ??
    (await CustomConfirmPrompt({
      name: 'COMPONENT_FILE_EXTENSION',
      message: 'What should the file type be?',
      accept: {
        name: `${COMPONENT_CONFIG.COMPONENT_NAME}.js`,
        value: 'js',
      },
      decline: {
        name: `${COMPONENT_CONFIG.COMPONENT_NAME}.ts`,
        value: 'ts',
      },
      default: COMPONENT_CONFIG.COMPONENT_FILE_EXTENSION,
      theme: { ...globalTheme },
    }));

  COMPONENT_CONFIG.ADD_X_TO_EXTENSION =
    answerd?.ADD_X_TO_EXTENSION ??
    (await CustomConfirmPrompt({
      name: 'ADD_X_TO_EXTENSION',
      message: 'Make it jsx?',
      accept: {
        name: `${COMPONENT_CONFIG.COMPONENT_NAME}.${COMPONENT_CONFIG.COMPONENT_FILE_EXTENSION}x`,
      },
      decline: {
        name: `${COMPONENT_CONFIG.COMPONENT_NAME}.${COMPONENT_CONFIG.COMPONENT_FILE_EXTENSION}`,
      },
      default: COMPONENT_CONFIG.ADD_X_TO_EXTENSION,
      theme: { ...globalTheme },
    }));

  stdin.pause();

  return COMPONENT_CONFIG;
}
