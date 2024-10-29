#!/usr/bin/env node
import startPrompting from './src/prompt.js';
import { toLowerCamelCase, toUpperCamelCase } from './src/utilities/converters.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import AYSOverride from './src/AYSOverride.js';
import { __dirname, getFileContent } from './src/utilities/file.system.js';
import { pathToFileURL } from 'url';
import chalk from 'chalk';
import { Command } from 'commander';
import { returnIfValue } from './src/utilities/helpers.js';
import { centeredLog } from './src/utilities/logging.js';

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

const PATHS = {
  package_dir: path.join(__dirname),
  package_src: path.join(__dirname, 'src'),
  source_dir: path.join(process.cwd()),
  source_src: path.join(process.cwd(), 'src'),
};

PATHS.template_root = path.join(PATHS.package_src, 'templates');
PATHS.template_component = path.join(PATHS.template_root, 'component.js');
PATHS.template_index = path.join(PATHS.template_root, 'index.js');

PATHS.component_root_dir = path.join(PATHS.source_src, 'components');

PATHS.config_path = path.join(PATHS.source_dir, configFileName);

/////////////////////////////
// MAIN
/////////////////////////////
async function main() {
  const [nameTokens, createConfigFile] = parseCLI();

  const fileCreated = processConfigFileCreation(createConfigFile);

  centeredLog('A', chalk.red);
  if (fileCreated) return;

  // get user configurations from config file
  const COMPONENT_USER_CONFIG = await getConfigFile();

  // generate the final configrations
  COMPONENT_CONFIG = {
    ...COMPONENT_CONFIG,
    ...COMPONENT_USER_CONFIG,
  };

  COMPONENT_CONFIG.COMPONENT_NAME = returnIfValue(nameTokens.join(' '), COMPONENT_CONFIG.COMPONENT_NAME);

  console.log({
    COMPONENT_CONFIG,
    COMPONENT_USER_CONFIG,
  });
  return;
  // prompt the user for configurations not found in the config.js file
  // startPrompting(globalConfigs (used as default), answers)
  await startPrompting(COMPONENT_CONFIG, COMPONENT_USER_CONFIG);

  COMPONENT_CONFIG.COMPONENT_NAME = toUpperCamelCase(COMPONENT_CONFIG.COMPONENT_NAME);
  COMPONENT_CONFIG.CSS_FILE_AS_MODULE = COMPONENT_CONFIG.CSS_FILE_AS_MODULE ? '.module' : '';

  // define component properties
  COMPONENT.file = `${COMPONENT_CONFIG.COMPONENT_NAME}.${COMPONENT_CONFIG.COMPONENT_FILE_EXTENSION}${
    COMPONENT_CONFIG.ADD_X_TO_EXTENSION ? 'x' : ''
  }`;

  COMPONENT.css = `${COMPONENT_CONFIG.CSS_FILE_NAME}${COMPONENT_CONFIG.CSS_FILE_AS_MODULE}.css`;

  console.log('COMPONENT_CONFIG');
  console.log(COMPONENT_CONFIG);
  console.log('COMPONENT_USER_CONFIG');
  console.log(COMPONENT_USER_CONFIG);
  console.log('COMPONENT');
  console.log(COMPONENT);

  PATHS.component_dir = path.join(PATHS.component_root_dir, COMPONENT_CONFIG.COMPONENT_NAME);
  PATHS.component_path = path.join(PATHS.component_dir, COMPONENT.file);
  PATHS.component_css_path = path.join(PATHS.component_dir, COMPONENT.css);
  PATHS.component_index_path = path.join(PATHS.component_dir, 'index.js');

  processComponentFileCreation();
  if (COMPONENT_CONFIG.CREATE_COMPONENT_INDEX) processIndexFileCreation();
  if (COMPONENT_CONFIG.CREATE_CSS_FILE) processCSSFileCreation();
}

main();
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
function parseCLI() {
  const program = new Command();

  program.argument('[tokens]', 'Name tokens').option('-a, --addConfig', 'Optional name argument').parse(process.argv);

  const nameTokens = program.args; //
  const createConfig = program.opts().addConfig;
  console.log(nameTokens, createConfig);
  return [nameTokens, createConfig ?? false];
}

async function processComponentFileCreation() {
  const emptyLine = '';
  try {
    // Read the content of the source file
    let content = getFileContent(PATHS.template_component);
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
    console.log(chalk.magenta(newContent));
    if (!fs.existsSync(PATHS.component_root_dir)) {
      fs.mkdirSync(PATHS.component_root_dir);
    }
    if (fs.existsSync(PATHS.component_dir)) {
      const confirm = await AYSOverride(COMPONENT_CONFIG.COMPONENT_NAME);
      if (!confirm) return;
    } else {
      fs.mkdirSync(PATHS.component_dir);
    }

    const destFilePath = path.resolve(PATHS.component_path);
    // fs.writeFileSync(destFilePath, newContent, 'utf-8');

    console.log('File processed and saved to:', chalk.green(destFilePath));
  } catch (error) {
    console.error('Error processing file:', error);
  }
}

function processIndexFileCreation() {
  try {
    let content = getFileContent(PATHS.template_index);
    content = content.replaceAll(COMPONENT.palceholder, COMPONENT.file);

    const destFilePath = path.resolve(PATHS.component_index_path);
    // fs.writeFileSync(destFilePath, content, 'utf-8');

    console.log('File processed and saved to:', chalk.green(destFilePath));
  } catch (error) {
    console.error('Error processing file:', error);
  }
}

function processCSSFileCreation() {
  try {
    const destFilePath = path.resolve(PATHS.component_css_path);
    // fs.writeFileSync(destFilePath, '', 'utf-8');

    console.log('File processed and saved to:', chalk.green(destFilePath));
  } catch (error) {
    console.error('Error processing file:', error);
  }
}

async function processConfigFileCreation(createFile) {
  try {
    if (createFile) {
      if (fs.existsSync(PATHS.config_path)) return false;
      const destination = path.join(PATHS.source_dir, configFileName);
      const template = path.join(PATHS.template_root, configFileName);

      const content = getFileContent(template);
      fs.writeFileSync(destination, content, 'utf-8');
      return true;
    }
  } catch (error) {
    console.error('Error processing file:', error);
  }
}

async function getConfigFile() {
  console.log(`PATHS.config_path ${PATHS.config_path}`);
  console.log(`fs.existsSync(PATHS.config_path) ${fs.existsSync(PATHS.config_path)}`);

  if (!fs.existsSync(PATHS.config_path)) return;

  const fileURL = pathToFileURL(PATHS.config_path).href;

  console.log(`fileURL ${fileURL}`);
  return (await import(fileURL)).default;
}
