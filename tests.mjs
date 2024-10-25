import inquirer from 'inquirer';

async function getFileName() {
  const { fileName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'fileName',
      message: 'Enter the file name (without extension):',
    },
  ]);

  // Remove existing .module.css extension if present
  const cleanedFileName = fileName.replace(/\.module\.css$/, '');

  // Remove any other existing extensions
  const finalFileName = cleanedFileName.replace(/\.[^/.]+$/, '') + '.module.css';

  console.log('Final file name:', finalFileName);
}

getFileName();
