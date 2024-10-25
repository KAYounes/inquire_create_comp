import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  usePagination,
  useRef,
  useMemo,
  useEffect,
  isBackspaceKey,
  isEnterKey,
  isUpKey,
  isDownKey,
  isNumberKey,
  Separator,
  ValidationError,
  makeTheme,
} from '@inquirer/core';
import figures from '@inquirer/figures';
import ansiEscapes from 'ansi-escapes';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { getLengthWithChalk } from '../utilities/converters.mjs';

const defualtTheme = {
  prefix: chalk.red.underline(figures.warning),
  // spinner: {
  //   interval: 1000,
  //   frames: [],
  // },
  icon: { cursor: `${figures.play} ` },
  style: {
    // answer: (text: string) => string;
    // message: (text: string, status: 'idle' | 'done' | 'loading') => string;
    message: function (text, status) {
      if (status === 'idle' || status === 'loading') {
        return chalk.italic.bold.yellow(figures.lineDownRightArc, text);
      }

      return text;
    },
    // error: (text: string) => string;
    help: (text) => chalk.gray(text),
    highlight: (text) => chalk.green.bold(text),
    description: (text) => chalk.gray(text),
    disabled: (text) => chalk.dim(`- ${text}`),
  },
  helpMode: 'auto',
  indentation: ' '.repeat(10),
};

function isSelectable(item) {
  return !Separator.isSeparator(item) && !item.disabled;
}

function normalizeChoices(choices) {
  return choices.map((choice) => {
    if (Separator.isSeparator(choice)) return choice;

    if (typeof choice === 'string') {
      return {
        value: choice,
        name: choice,
        short: choice,
        disabled: false,
      };
    }

    const name = choice.name ?? String(choice.value);
    return {
      value: choice.value,
      name,
      description: choice.description,
      short: choice.short ?? name,
      disabled: choice.disabled ?? false,
    };
  });
}
function countdownArray(milliseconds) {
  const countdown = [];

  for (let i = milliseconds; i > 0; i -= 10) {
    countdown.push(i);
  }

  return countdown;
}

const AreYourSurePrompt = createPrompt(function (config, done) {
  const { loop = true, pageSize = 7 } = config;
  const firstRender = useRef(true);
  // defualtTheme.spinner.interval = 10;
  // defualtTheme.spinner.frames = countdownArray(config.delay);
  const theme = makeTheme(defualtTheme, config.theme);
  const [status, setStatus] = useState('loading');
  const prefix = usePrefix({ status, theme });
  const searchTimeoutRef = useRef();
  const gap = ' '.repeat(2);

  let accept = {
    name: 'accept',
    short: 'yes',
    value: true,
    ...config.accept,
  };
  let decline = {
    name: 'decline',
    short: 'no',
    value: false,
    ...config.decline,
  };
  config.choices = [accept, decline];

  const items = useMemo(() => normalizeChoices(config.choices), [config.choices]);

  const bounds = useMemo(() => {
    const first = items.findIndex(isSelectable);
    const last = items.findLastIndex(isSelectable);

    if (first === -1) {
      throw new ValidationError('[select prompt] No selectable choices. All choices are disabled.');
    }

    return { first, last };
  }, [items]);

  const defaultItemIndex = useMemo(() => {
    if (!('default' in config)) return -1;
    const byValue = items.findIndex((item) => isSelectable(item) && item.value === config.default);
    const firstChoiceIndex = items.findIndex((item) => isSelectable(item));
    const lastChocieIndex = items.findLastIndex((item) => isSelectable(item));

    if (byValue === -1) {
      return config.default ? firstChoiceIndex : lastChocieIndex;
    }

    return byValue;
  }, [config.default, items]);

  const [active, setActive] = useState(defaultItemIndex === -1 ? bounds.first : defaultItemIndex);

  // Safe to assume the cursor position always point to a Choice.
  const selectedChoice = items[active];

  const [ignoreInput, setIgnoreInput] = useState(true);

  // console.log(`\n\n----- ${ignoreInput} ----- \n\n`);

  useEffect(function () {
    // console.log('\n 111111111111111111111');
    const id = setTimeout(() => {
      // console.log('\n 2222222222222222222222');
      setIgnoreInput(false);
      setStatus('idle');
    }, config.delay);
    return () => clearTimeout(id);
  }, []);

  useKeypress((key, rl) => {
    clearTimeout(searchTimeoutRef.current);

    // console.log(`\n\n----- ${ignoreInput} ----- \n\n`);

    if (ignoreInput) return;

    if (isEnterKey(key)) {
      setStatus('done');
      done(selectedChoice.value);
    } else if (isUpKey(key) || isDownKey(key)) {
      rl.clearLine(0);
      if (loop || (isUpKey(key) && active !== bounds.first) || (isDownKey(key) && active !== bounds.last)) {
        const offset = isUpKey(key) ? -1 : 1;
        let next = active;
        do {
          next = (next + offset + items.length) % items.length;
        } while (!isSelectable(items[next]));
        setActive(next);
      }
    } else if (isNumberKey(key)) {
      rl.clearLine(0);
      const position = Number(key.name) - 1;
      const item = items[position];
      if (item != null && isSelectable(item)) {
        setActive(position);
      }
    } else if (isBackspaceKey(key)) {
      rl.clearLine(0);
    } else {
      // Default to search
      const searchTerm = rl.line.toLowerCase();
      const matchIndex = items.findIndex((item) => {
        if (Separator.isSeparator(item) || !isSelectable(item)) return false;

        return item.name.toLowerCase().startsWith(searchTerm);
      });

      if (matchIndex !== -1) {
        setActive(matchIndex);
      }

      searchTimeoutRef.current = setTimeout(() => {
        rl.clearLine(0);
      }, 700);
    }
  });

  useEffect(
    () => () => {
      clearTimeout(searchTimeoutRef.current);
    },
    [],
  );

  const message = theme.style.message(config.message, status);

  let helpMessage = config.help ? theme.style.help(config.help) : undefined;
  let useArrowKeys = theme.style.help('(Use arrow keys)');
  // let helpTipBottom = '';

  const page = usePagination({
    items,
    active,
    renderItem({ item, index, isActive }) {
      let itemText = item.name;

      if (Separator.isSeparator(item)) {
        return ` ${item.separator}`;
      }

      if (index === 0) {
        if (theme.helpMode === 'always' || (theme.helpMode === 'auto' && firstRender.current)) {
          firstRender.current = false;
          itemText = item.name + ' ' + useArrowKeys;
        }
      }

      if (item.disabled) {
        const disabledLabel = typeof item.disabled === 'string' ? item.disabled : '(disabled)';
        return theme.style.disabled(`${theme.indentation}${itemText} ${disabledLabel}`);
      }
      const color = index ? chalk.green : chalk.red;
      const activeColor = isActive ? (x) => x : chalk.dim;
      const cursor = isActive ? figures.line + figures.line + figures.line + figures.line : '    ';
      const _prefix = index === 1 ? figures.lineUpRightArc : figures.lineUpDownRight;
      return activeColor(color(`${theme.indentation}${_prefix}${cursor}${itemText}`));
    },
    pageSize,
    loop,
  });

  if (status === 'done') {
    return chalk.red.dim.italic(`${prefix} ${message} ${theme.style.answer(selectedChoice.short)}`);
  }

  // active is the index of the active choice, 0 for confirming action which is DANGEROUS
  const choiceDescriptionColor = active ? chalk.green : chalk.red;
  const choiceDescription = selectedChoice.description
    ? `\n${theme.indentation}${choiceDescriptionColor(
        selectedChoice.description.split('\n').join('\n' + theme.indentation),
      )}`
    : ``;
  // console.log('\n\n', prefix.length + 10);
  return `\n${[prefix.padEnd(prefix.length + 10 - 2), message, helpMessage, prefix.padStart(prefix.length + 10 - 2)]
    .filter((query) => query !== undefined)
    .join(
      ' ',
    )}\n${theme.indentation}${chalk.gray(figures.lineVertical)}\n${page}\n${theme.indentation}${chalk.gray(figures.lineDashed4.repeat(20))}${choiceDescription}${ansiEscapes.cursorHide}\n\n\n\n\n\n\n`;
});

// Function to handle multiple prompts
async function promptMultiple(prompts) {
  const results = [];

  for (const promptConfig of prompts) {
    const result = await prompt(promptConfig);
    results.push(result);
  }

  return results;
}

export default AreYourSurePrompt;
