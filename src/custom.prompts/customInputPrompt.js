import { createPrompt, useState, useKeypress, usePrefix, isEnterKey, isBackspaceKey, makeTheme } from '@inquirer/core';
import figures from '@inquirer/figures';
import chalk from 'chalk';
import { getLengthWithChalk } from '../utilities/converters.js';
const CustomInputPrompt = createPrompt((config, done) => {
  // if (!config.when) {
  //   done();
  //   return '\r';
  // }
  const { required, validate = () => true } = config;
  const theme = makeTheme(config.theme);
  const [status, setStatus] = useState('idle');
  const [defaultValue = '', setDefaultValue] = useState(config.default);
  const [errorMsg, setError] = useState();
  const [value, setValue] = useState('');

  const prefix = usePrefix({ status, theme });

  useKeypress(async (key, rl) => {
    // Ignore keypress while our prompt is doing other processing.
    if (status !== 'idle') {
      return;
    }

    if (isEnterKey(key)) {
      const answer = value || defaultValue;
      setStatus('loading');

      const isValid = required && !answer ? 'You must provide a value' : await validate(answer);
      if (isValid === true) {
        setValue(answer);
        setStatus('done');

        if (typeof config.filter === 'function') {
          done(config.filter(answer));
        } else {
          done(answer);
        }
      } else {
        // Reset the readline line value to the previous value. On line event, the value
        // get cleared, forcing the user to re-enter the value instead of fixing it.
        rl.write(value);
        setError(isValid || 'You must provide a valid value');
        setStatus('idle');
      }
    } else if (isBackspaceKey(key) && !value && !required) {
      setDefaultValue(undefined);
    } else if (key.name === 'tab' && !value && !defaultValue) {
      rl.clearLine(0); // Remove the tab character.
      setDefaultValue(config.default);
    } else if (key.name === 'tab' && !value) {
      // setDefaultValue(undefined);
      rl.clearLine(0); // Remove the tab character.
      rl.write(defaultValue);
      setValue(defaultValue);
    } else {
      setValue(rl.line);
      setError(undefined);
    }
  });

  const message = theme.style.message(config.message, status);
  let formattedValue = value;
  if (typeof config.transformer === 'function') {
    formattedValue = config.transformer(value, { isFinal: status === 'done' });
  } else if (status === 'done') {
    formattedValue = theme.style.answer(value);
  }

  let defaultStr;
  if (defaultValue && status !== 'done' && !value) {
    defaultStr = chalk.italic.gray(`['Tab' to edit defualt (${defaultValue}) ${chalk.italic(figures.play)}]`);
  } else if (config.default && !defaultValue && status !== 'done' && !value) {
    defaultStr = chalk.italic.gray(`['Tab' to use defualt (${config.default}) ${chalk.italic(figures.play)}]`);
  }

  let indentation = getLengthWithChalk(prefix);

  let error = undefined;
  if (errorMsg) {
    error = theme.style.error(errorMsg);
  }

  let help = undefined;
  if (config.help) {
    help = chalk.gray.italic(
      `${' '.repeat(indentation)} ${figures.lineUpRightArc} ${chalk.italic('help')}: ${config.help}`,
    );
  }

  let bottom = help + '\n' + error;

  if (status === 'done') {
    return chalk.dim([prefix, message, formattedValue].join(' '));
  }

  return [
    [prefix, help ? chalk.gray(figures.lineDownRightArc) : undefined, message, defaultStr, error, formattedValue]
      .filter((query) => query !== undefined)
      .join(' '),
    help,
  ];
});

export default CustomInputPrompt;
