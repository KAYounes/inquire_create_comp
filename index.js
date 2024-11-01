#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';
import { log } from 'console';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';
import AYSOverride from './src/AYSOverride.js';
import startPrompting from './src/prompt.js';
import { toLowerCamelCase, toUpperCamelCase } from './src/utilities/converters.js';
import { __dirname, getFileContent, relativePathToProject } from './src/utilities/file.system.js';
import { returnIfValue, sleep } from './src/utilities/helpers.js';
import {
  centeredLog,
  logf,
  logFileCreation,
  logFileCreationFailure,
  redLog,
  silent,
  successLog,
} from './src/utilities/logging.js';
// component related properties
const COMPONENT = {
  palceholder: 'COMPONENT_NAME',
  // file: fileName (dynamic),
  // css: css fileName (dynamic)
};

// the defaults
const COMPONENT_DEDFAULT_CONFIG = {
  COMPONENT_NAME: 'Component Name ',
  ADD_CHILDREN_PROPS: false,
  USE_CLIENT_DIRECTIVE: false,
  USE_INLINE_EXPORT: false,
  CREATE_CSS_FILE: false,
  CSS_FILE_AS_MODULE: '',
  CSS_FILE_NAME: `${toLowerCamelCase('Component Name')}`,
  CREATE_COMPONENT_INDEX: false,
  COMPONENT_FILE_EXTENSION: 'js',
  ADD_X_TO_EXTENSION: false,
};

// the final configurations used when creating the component
let COMPONENT_CONFIG = {
  ...COMPONENT_DEDFAULT_CONFIG,
  // ...COMPONENT_USER_CONFIG
};

const configFileName = 'create.comp.config.js';

const FILE_SYSTEM = {
  package_dir: path.join(__dirname),
  package_src: path.join(__dirname, 'src'),
  source_dir: path.join(process.cwd()),
  source_src: path.join(process.cwd(), 'src'),
};

FILE_SYSTEM.template_root = path.join(FILE_SYSTEM.package_src, 'templates');
FILE_SYSTEM.template_component = path.join(FILE_SYSTEM.template_root, 'component.js');
FILE_SYSTEM.template_index = path.join(FILE_SYSTEM.template_root, 'index.js');

FILE_SYSTEM.component_root_dir = path.join(FILE_SYSTEM.source_src, 'components');

FILE_SYSTEM.config_path = path.join(FILE_SYSTEM.source_dir, configFileName);

/////////////////////////////
// MAIN
/////////////////////////////
async function main() {
  logf();
  const [nameTokens, createConfigFile, silentMode] = parseCLI();

  if (silentMode) silent();

  const fileCreated = await processConfigFileCreation(createConfigFile);

  if (createConfigFile) {
    if (fileCreated) return successLog(`The config file ${configFileName} was added!`);
    else
      redLog(
        'Operation Failed [creating config file]',
        `A config file with the name ${configFileName} already exists!`,
      );

    log();
    await sleep(500);
  }

  // get user configurations from config file
  const COMPONENT_USER_CONFIG = await getConfigFile();

  // generate the final configrations
  COMPONENT_CONFIG = {
    ...COMPONENT_CONFIG,
    ...COMPONENT_USER_CONFIG,
  };

  COMPONENT_CONFIG.COMPONENT_NAME = returnIfValue(nameTokens.join(' '), COMPONENT_CONFIG.COMPONENT_NAME);

  // centeredLog(
  //   ` >> How do you like your component? <<\n${chalk.yellow(`(answers in ${configFileName} are skipped)`)}`,
  //   chalk.green,
  // );

  // prompt the user for configurations not found in the config.js file
  // startPrompting(globalConfigs (used as default), answers)
  // process.stdout.clearLine();
  await startPrompting(COMPONENT_CONFIG, COMPONENT_USER_CONFIG);
  log();
  centeredLog(' >> logs <<', chalk.gray);
  COMPONENT_CONFIG.COMPONENT_NAME = toUpperCamelCase(COMPONENT_CONFIG.COMPONENT_NAME);
  COMPONENT_CONFIG.CSS_FILE_AS_MODULE = COMPONENT_CONFIG.CSS_FILE_AS_MODULE ? '.module' : '';

  // define component properties
  COMPONENT.file = `${COMPONENT_CONFIG.COMPONENT_NAME}.${COMPONENT_CONFIG.COMPONENT_FILE_EXTENSION}${
    COMPONENT_CONFIG.ADD_X_TO_EXTENSION ? 'x' : ''
  }`;

  COMPONENT.css = `${COMPONENT_CONFIG.CSS_FILE_NAME}${COMPONENT_CONFIG.CSS_FILE_AS_MODULE}.css`;

  FILE_SYSTEM.component_dir = path.join(FILE_SYSTEM.component_root_dir, COMPONENT_CONFIG.COMPONENT_NAME);
  FILE_SYSTEM.component_path = path.join(FILE_SYSTEM.component_dir, COMPONENT.file);
  FILE_SYSTEM.component_css_path = path.join(FILE_SYSTEM.component_dir, COMPONENT.css);
  FILE_SYSTEM.component_index_path = path.join(FILE_SYSTEM.component_dir, 'index.js');

  const proceed = await processComponentFileCreation();
  if (proceed) {
    if (COMPONENT_CONFIG.CREATE_COMPONENT_INDEX) processIndexFileCreation();
    if (COMPONENT_CONFIG.CREATE_CSS_FILE) processCSSFileCreation();
  }
  centeredLog(chalk.green.dim.italic(' ____ finito ____ '), chalk.gray);
  logf();
}

main();

process.stdin.pause();
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
function parseCLI() {
  const program = new Command();

  program
    .argument('[tokens]', 'Name tokens')
    .option('-a, --addConfig', 'Optional name argument')
    .option('-s, --shhh', 'turn off logs')
    .parse(process.argv);

  const nameTokens = program.args; //
  const createConfig = program.opts().addConfig;
  const silentMode = program.opts().shhh;
  // console.log(nameTokens, createConfig);
  return [nameTokens, createConfig ?? false, silentMode ?? false];
}

async function processComponentFileCreation() {
  const fileName = COMPONENT.file;
  const dest = FILE_SYSTEM.component_path;
  const emptyLine = '';
  try {
    // Read the content of the source file
    let content = getFileContent(FILE_SYSTEM.template_component);
    content = content.replaceAll(COMPONENT.palceholder, COMPONENT_CONFIG.COMPONENT_NAME);

    // Split the content into lines
    const lines = content.split(os.EOL);

    const component = {
      useClient: COMPONENT_CONFIG.USE_CLIENT_DIRECTIVE ? "'use client';" : undefined,
      importReact: lines[0],
      importCSS: COMPONENT_CONFIG.CREATE_CSS_FILE ? `import styles from './${COMPONENT.css};'` : undefined,
      declaration:
        (COMPONENT_CONFIG.USE_INLINE_EXPORT ? 'export default ' : '') +
        lines[1].replace('PROPS', COMPONENT_CONFIG.ADD_CHILDREN_PROPS ? '{ children }' : 'props'),
      body: lines[2],
      closure: lines[3],
    };

    // Join the remaining lines back into a single string
    const newContent = [
      component.useClient,
      component.importReact,
      component.importCSS,
      emptyLine,
      component.declaration,
      component.body,
      component.closure,
      emptyLine,
      COMPONENT_CONFIG.USE_INLINE_EXPORT ? undefined : `export default ${COMPONENT_CONFIG.COMPONENT_NAME};`,
    ]
      .filter((query) => query !== undefined)
      .join(os.EOL);

    if (!fs.existsSync(FILE_SYSTEM.component_root_dir)) {
      fs.mkdirSync(FILE_SYSTEM.component_root_dir);
    }
    if (fs.existsSync(FILE_SYSTEM.component_dir)) {
      const confirm = await AYSOverride(COMPONENT_CONFIG.COMPONENT_NAME);
      if (!confirm) return false;
    } else {
      fs.mkdirSync(FILE_SYSTEM.component_dir);
    }

    fs.writeFileSync(dest, newContent, 'utf-8');
    logFileCreation(fileName, relativePathToProject(FILE_SYSTEM.source_dir, dest));
    return true;
  } catch (error) {
    logFileCreationFailure(fileName, relativePathToProject(FILE_SYSTEM.source_dir, dest), error.message);
  }
}

function processIndexFileCreation() {
  const fileName = 'index.js';
  const dest = FILE_SYSTEM.component_index_path;

  try {
    let content = getFileContent(FILE_SYSTEM.template_index);
    content = content.replaceAll(COMPONENT.palceholder, COMPONENT.file);

    fs.writeFileSync(dest, content, 'utf-8');
    logFileCreation(fileName, relativePathToProject(FILE_SYSTEM.source_dir, dest));
  } catch (error) {
    logFileCreationFailure(fileName, relativePathToProject(FILE_SYSTEM.source_dir, dest), error.message);
  }
}

function processCSSFileCreation() {
  const fileName = COMPONENT.css;
  const dest = FILE_SYSTEM.component_css_path;
  try {
    fs.writeFileSync(dest, '', 'utf-8');
    logFileCreation(fileName, relativePathToProject(FILE_SYSTEM.source_dir, dest));
  } catch (error) {
    logFileCreationFailure(fileName, relativePathToProject(FILE_SYSTEM.source_dir, dest), error.message);
  }
}

async function processConfigFileCreation(createFile) {
  try {
    if (createFile) {
      if (fs.existsSync(FILE_SYSTEM.config_path)) return false;
      const destination = path.join(FILE_SYSTEM.source_dir, configFileName);
      const template = path.join(FILE_SYSTEM.template_root, configFileName);

      const content = getFileContent(template);
      fs.writeFileSync(destination, content, 'utf-8');
      return true;
    }
  } catch (error) {
    console.error('Error processing file:', error);
  }
}

async function getConfigFile() {
  // console.log(`PATHS.config_path ${PATHS.config_path}`);
  // console.log(`fs.existsSync(PATHS.config_path) ${fs.existsSync(PATHS.config_path)}`);

  if (!fs.existsSync(FILE_SYSTEM.config_path)) return;

  const fileURL = pathToFileURL(FILE_SYSTEM.config_path).href;

  // console.log(`fileURL ${fileURL}`);
  return (await import(fileURL)).default;
}
