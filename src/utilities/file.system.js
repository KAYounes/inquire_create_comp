import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);

// Find the project root by looking for package.json
let __dirname = path.dirname(__filename);
while (!fs.existsSync(path.join(__dirname, 'package.json'))) {
  __dirname = path.dirname(__dirname);
}

// Function to read the content of a file given its path
function getFileContent(_path) {
  try {
    const sourceFilePath = path.resolve(_path);
    return fs.readFileSync(sourceFilePath, 'utf-8');
  } catch (error) {
    console.error('Error processing file:', error);
  }
}

export { __dirname, getFileContent };

export function relativePathToProject(projectPath, absPath) {
  return path.join('...', path.relative(path.resolve(projectPath, '..'), absPath));
}
