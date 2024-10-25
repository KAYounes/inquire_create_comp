import inquirer from 'inquirer';
import CustomInputPrompt from '../customInputPrompt.mjs';

inquirer.registerPrompt('c_input', CustomInputPrompt);

CustomInputPrompt({
  message: 'what is your name?',
  default: 'kareem younes',
  help: 'as first_name last_name',
  when: false,
  // required: true,
});

// inquirer.prompt({
//   type: 'input',
//   message: 'what is your name?',
//   default: 'kareem younes',
//   help: 'as first_name last_name',
//   when: true,
//   // required: true,
// });
