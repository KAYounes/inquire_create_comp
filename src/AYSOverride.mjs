import AreYourSurePrompt from './custom.prompts/areYouSurePrompt.mjs';
import chalk from 'chalk';
import CustomInputPrompt from './custom.prompts/customInputPrompt.mjs';

export default async function AYSOverride(componentName) {
  const confirm = await AreYourSurePrompt({
    name: 'overriding',
    message: `${chalk.underline('ARE YOU SURE')} you want to override the component [${chalk.underline.magenta(
      componentName,
    )}]`,
    delay: 2500,
    loop: false,
    accept: {
      value: true,
      name: `YESS! I do not need that work anymore.`,
      description: "Any work in the component's file and its CSS file will be lost",
    },
    decline: {
      value: false,
      name: `NOOO! Do not do anything.`,
      description: "Operation will be cancelled and your work 'should' be safe",
    },
    default: false,
  });

  if (confirm) {
    const final = await CustomInputPrompt({
      message: `Enter the name of the component to confirm ${componentName}`,
      validate: function (input) {
        return input === componentName
          ? true
          : `Component name is ${componentName}${input ? `, you entered ${input}` : ''}`;
      },
      filter: () => true,
    });
    console.log(final);
    return final;
  }
  return confirm;
}
