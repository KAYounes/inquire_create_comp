import AreYourSurePrompt from './custom.prompts/areYouSurePrompt.js';
import chalk from 'chalk';
import CustomInputPrompt from './custom.prompts/customInputPrompt.js';

export default async function AYSOverride(componentName) {
  // await CustomSelectPrompt({
  //   name: 'foo',
  //   message: 'fooooo',
  //   choices: ['1', '2'],
  // });

  const confirm = await AreYourSurePrompt({
    name: 'overriding',
    message: `${chalk.underline('ARE YOU SURE')} you want to override the component [${chalk.underline.magenta(
      componentName,
    )}]`,
    delay: 2000,
    loop: false,
    accept: {
      value: true,
      name: `OVERIDE, And Proceed!`,
      description: ` ${chalk.italic.underline(
        'Your work will be LOST',
      )}: Your component's file, index file, and CSS file will be overwritten!`,
    },
    decline: {
      value: false,
      name: `Cancel Operation!`,
      description: 'Component creation will be canceled.',
    },
    default: false,
  });
  if (confirm) {
    const final = await CustomInputPrompt({
      message: chalk.yellow.italic(
        `Enter the name of the component to confirm [${chalk.underline.magenta(componentName)}]`,
      ),
      validate: function (input) {
        return input === componentName
          ? true
          : `Component name is ${componentName}${input ? `, you entered ${input}` : ''}`;
      },
      filter: () => true,
    });
    return final;
  }
  return confirm;
}
