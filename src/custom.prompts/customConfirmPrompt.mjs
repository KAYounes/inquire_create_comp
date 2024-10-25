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

const defualtTheme = {
  // prefix: string | { idle: string; done: string };
  // spinner: {
  //   interval: number;
  //   frames: string[];
  // };
  icon: { cursor: `${figures.play} ` },
  style: {
    // answer: (text: string) => string;
    // message: (text: string, status: 'idle' | 'done' | 'loading') => string;
    message: function (text, status) {
      if (status === 'idle') {
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

const CustomConfirmPrompt = createPrompt(function (config, done) {
  const { loop = true, pageSize = 7 } = config;
  const firstRender = useRef(true);
  const theme = makeTheme(defualtTheme, config.theme);
  const [status, setStatus] = useState('idle');
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

  useKeypress((key, rl) => {
    clearTimeout(searchTimeoutRef.current);

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

  let helpMessage = config.help ? theme.style.help(config.help) : '';
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
      const color = isActive ? theme.style.highlight : chalk.dim;
      const cursor = isActive ? figures.line + figures.line + figures.line + figures.line : '    ';
      const _prefix = index === 1 ? figures.lineUpRightArc : figures.lineUpDownRight;
      return color(`${theme.indentation}${_prefix}${cursor}${itemText}`);
    },
    pageSize,
    loop,
  });

  if (status === 'done') {
    return chalk.dim(`${prefix} ${message} ${theme.style.answer(selectedChoice.short)}`);
  }

  const choiceDescription = selectedChoice.description
    ? `\n${theme.indentation}${theme.style.description(
        selectedChoice.description.split('\n').join('\n' + theme.indentation),
      )}`
    : ``;

  return `\n${[prefix, ' '.repeat(5), message, helpMessage, ' '.repeat(5), prefix].join(
    ' ',
  )}\n${theme.indentation}${chalk.gray(figures.lineVertical)}\n${page}\n${theme.indentation}${chalk.gray(figures.lineDashed4.repeat(20))}${choiceDescription}${ansiEscapes.cursorHide}\n\n\n\n\n\n\n`;
});

export default CustomConfirmPrompt;
