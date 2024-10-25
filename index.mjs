import start from './src/prompt.mjs';
import { toLowerCamelCase, toUpperCamelCase } from './src/utilities/converters.mjs';
// import fs from 'fs/promises';
import fs, { copyFile } from 'fs';
import path from 'path';
import os from 'os';
import { stdin } from 'process';
import AYSOverride from './src/AYSOverride.mjs';

const COMPONENT_CONFIG = {
  COMPONENT_NAME: 'Component Name',
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

const CREATION_CONFIG = {
  overriding: true,
};

// changes are reflected in original config object
await start(COMPONENT_CONFIG);
stdin.pause();

const COMPONENT = {
  content: '',
  palceholder: 'COMPONENT_NAME',
  file: `${COMPONENT_CONFIG.COMPONENT_NAME}.${COMPONENT_CONFIG.COMPONENT_FILE_EXTENSION}${
    COMPONENT_CONFIG.ADD_X_TO_EXTENSION ? 'x' : ''
  }`,
  css: `${COMPONENT_CONFIG.CSS_FILE_NAME}${COMPONENT_CONFIG.CSS_FILE_AS_MODULE}.css`,
};

console.log(COMPONENT_CONFIG);

const PATHS = {
  src: './src',
};

PATHS.template_component = path.join(PATHS.src, 'templates', 'component.js');
PATHS.template_index = path.join(PATHS.src, 'templates', 'index.js');
PATHS.component_root_directory = path.join(PATHS.src, 'dest', 'components');
PATHS.component_directory = path.join(PATHS.component_root_directory, COMPONENT_CONFIG.COMPONENT_NAME);
PATHS.component_path = path.join(PATHS.component_directory, COMPONENT.file);
PATHS.component_css_path = path.join(PATHS.component_directory, COMPONENT.css);
PATHS.component_index_path = path.join(PATHS.component_directory, 'index.js');
console.log(PATHS);

function getFileContent(_path) {
  try {
    // Read the content of the source file
    const sourceFilePath = path.resolve(_path);
    return fs.readFileSync(sourceFilePath, 'utf-8');
  } catch (error) {
    console.error('Error processing file:', error);
  }
}

async function processComponentFileCreation() {
  const emptyLine = '';
  try {
    // Read the content of the source file
    let content = getFileContent(PATHS.template_component);
    content = content.replaceAll(COMPONENT.palceholder, COMPONENT_CONFIG.COMPONENT_NAME);

    // Split the content into lines
    const lines = content.split(os.EOL);
    console.log(lines);

    const component = {
      useClient: COMPONENT_CONFIG.USE_CLIENT_DIRECTIVE ? "'use client';" : undefined,
      importReact: lines[0],
      importCSS: COMPONENT_CONFIG.CREATE_CSS_FILE
        ? `import styles from './${COMPONENT_CONFIG.CSS_FILE_NAME}${
            COMPONENT_CONFIG.CSS_FILE_AS_MODULE ? '.module' : ''
          }.css';`
        : undefined,
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

    if (!fs.existsSync(PATHS.component_root_directory)) {
      fs.mkdirSync(PATHS.component_root_directory);
    }
    if (fs.existsSync(PATHS.component_directory)) {
      const confirm = await AYSOverride(COMPONENT_CONFIG.COMPONENT_NAME);
      if (!confirm) return;
    } else {
      fs.mkdirSync(PATHS.component_directory);
    }

    const destFilePath = path.resolve(PATHS.component_path);
    fs.writeFileSync(destFilePath, newContent, 'utf-8');

    console.log('File processed and saved to:', destFilePath);
  } catch (error) {
    console.error('Error processing file:', error);
  }
}

function processIndexFileCreation() {
  try {
    let content = getFileContent(PATHS.template_index);
    content = content.replaceAll(COMPONENT.palceholder, COMPONENT.file);

    const destFilePath = path.resolve(PATHS.component_index_path);
    fs.writeFileSync(destFilePath, content, 'utf-8');

    console.log('File processed and saved to:', destFilePath);
  } catch (error) {
    console.error('Error processing file:', error);
  }
}

function processCSSFileCreation() {
  try {
    const destFilePath = path.resolve(PATHS.component_css_path);
    fs.writeFileSync(destFilePath, '', 'utf-8');

    console.log('File processed and saved to:', destFilePath);
  } catch (error) {
    console.error('Error processing file:', error);
  }
}

// Execute the function
processComponentFileCreation();
if (COMPONENT_CONFIG.CREATE_COMPONENT_INDEX) processIndexFileCreation();
if (COMPONENT_CONFIG.CREATE_CSS_FILE) processCSSFileCreation();
