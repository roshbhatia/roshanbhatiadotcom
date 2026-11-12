import { ansi, CSI } from '../tty/ansi.js';
import { decodeInput } from '../tty/input.js';
import { createScreen } from '../tty/screen.js';
import { createUi } from '../tty/widgets.js';
import { BUILTIN_COMMANDS, HOME, displayPath, normalizePath } from '../filesystem.js';
import { createLess } from './less.js';
import { createVi } from './vi.js';
import { createDaw } from './daw.js';

const HISTORY_LIMIT = 100;
const MAX_INPUT_LENGTH = 200;
const POSTS_INDEX = 'writing/index.json';
const LINKS = {
  github: 'https://github.com/roshbhatia',
  linkedin: 'https://www.linkedin.com/in/roshan-bhatia-2b1970a7/',
};
const UNAME = { s: 'RBOS', n: 'roshan', r: '1.0.0-desk', m: 'rb8088' };
const BRIGHT = `${CSI}1;38;2;232;255;240m`;

const COMMANDS = [
  ['ls [-la] [path]', 'list files'],
  ['cd [path]', 'change directory'],
  ['pwd', 'print working directory'],
  ['cat <file...>', 'print files'],
  ['less <file>', 'page through a file'],
  ['head|tail [-n N] <file>', 'first or last lines'],
  ['vi|vim [file]', 'edit a file (saved in this browser)'],
  ['uname [-a]', 'system information'],
  ['whoami', 'about me'],
  ['blog [id]', 'list or read posts'],
  ['daw', 'step sequencer'],
  ['github, linkedin', 'open in a new tab'],
  ['reset', 'put the whole desk back'],
  ['clear, help', ''],
];

const bold = (text) => `${CSI}1m${text}${CSI}22m`;
const bright = (text) => `${BRIGHT}${text}${ansi.reset}`;

function parseLineCount(args) {
  let count = 10;
  const files = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '-n') count = Number(args[(index += 1)]);
    else if (/^-n\d+$/.test(arg)) count = Number(arg.slice(2));
    else if (/^-\d+$/.test(arg)) count = Number(arg.slice(1));
    else files.push(arg);
  }
  return { count: Number.isFinite(count) && count >= 0 ? count : 10, files };
}

// rbsh: the login shell. A line editor in cooked-mode style, built-in commands, and full-screen
// programs launched on the alternate screen through io.spawn.
export function createShell(io, { fileSystem, resetScene, bootLines }) {
  const history = [];
  let historyIndex = 0;
  let line = '';
  let cursor = 0;
  let cwd = HOME;
  let running = false;
  const queuedNotices = [];

  const resolve = (path) => normalizePath(cwd, path);
  const promptText = () => `${bold('guest@roshan')}:${bright(displayPath(cwd))}$ `;
  const print = (...lines) => io.write(`${lines.join('\r\n')}\r\n`);

  function redrawLine() {
    const back = line.length - cursor;
    io.write(`\r${ansi.clearToEnd}${promptText()}${line}${back > 0 ? `${CSI}${back}D` : ''}`);
  }

  function showPrompt() {
    line = '';
    cursor = 0;
    io.write(promptText());
  }

  // Draws a widget into a scratch screen and prints it inline, so tables scroll with the output.
  function printComponent(height, render) {
    const screen = createScreen(io.columns, height);
    render(createUi(screen), screen);
    print(...screen.toLines());
  }

  async function readFile(command, path) {
    try {
      return await fileSystem.read(resolve(path));
    } catch (error) {
      print(`${command}: ${path}: ${error.message}`);
      return null;
    }
  }

  function listDirectory(args) {
    const flags = args.filter((arg) => arg.startsWith('-')).join('');
    const showHidden = flags.includes('a');
    const long = flags.includes('l');
    const targets = args.filter((arg) => !arg.startsWith('-'));
    for (const target of targets.length ? targets : ['.']) {
      const path = resolve(target);
      const node = fileSystem.stat(path);
      if (!node) {
        print(`ls: cannot access '${target}': No such file or directory`);
        continue;
      }
      if (targets.length > 1) print(`${target}:`);
      const entries =
        node.type === 'dir'
          ? fileSystem.list(path).filter((entry) => showHidden || !entry.name.startsWith('.'))
          : [{ name: target, type: 'file', size: node.content?.length ?? null }];
      const label = (entry) => (entry.type === 'dir' ? bright(`${entry.name}/`) : entry.name);
      if (long) {
        entries.forEach((entry) => {
          const permissions = entry.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--';
          print(`${permissions} guest ${String(entry.size ?? '-').padStart(6)} ${label(entry)}`);
        });
        continue;
      }
      if (!entries.length) continue;
      const width = Math.max(...entries.map((entry) => entry.name.length + (entry.type === 'dir' ? 1 : 0))) + 2;
      const perRow = Math.max(1, Math.floor(io.columns / width));
      for (let index = 0; index < entries.length; index += perRow) {
        print(
          entries
            .slice(index, index + perRow)
            .map((entry) => label(entry) + ' '.repeat(width - entry.name.length - (entry.type === 'dir' ? 1 : 0)))
            .join(''),
        );
      }
    }
  }

  async function runBlog(argument) {
    let posts;
    try {
      const response = await fetch(POSTS_INDEX);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      posts = await response.json();
    } catch (error) {
      print(`blog: could not load posts (${error.message})`);
      return;
    }
    if (!argument) {
      printComponent(posts.length + 2, (ui) =>
        ui.table(0, 0, [{ title: 'id', width: 5 }, { title: 'date', width: 11 }, { title: 'title', width: io.columns - 22 }], posts.map((post) => [post.slug, post.date, post.title])),
      );
      print(`read one with ${bright('blog <id>')}`);
      return;
    }
    const post = posts.find((entry) => entry.slug === argument || Number(entry.slug) === Number(argument));
    if (!post) {
      print(`blog: no post '${argument}'`);
      return;
    }
    const text = await fetch(post.path).then((response) => response.text());
    await io.spawn((childIo) => createLess(childIo, { title: post.title, text, markdown: true, baseUrl: new URL(post.path, location.href) }));
  }

  async function execute(commandLine) {
    const [name = '', ...args] = commandLine.trim().split(/\s+/).filter(Boolean);
    switch (name) {
      case '':
        return;
      case 'help':
        printComponent(COMMANDS.length + 2, (ui) => ui.table(0, 0, [{ title: 'command', width: 24 }, { title: 'does', width: io.columns - 28 }], COMMANDS));
        print(ansi.dim('tab completes, up/down recalls history, ctrl-c cancels, ctrl-l clears.'));
        return;
      case 'clear':
        io.write(ansi.clearScreen);
        return;
      case 'pwd':
        print(cwd);
        return;
      case 'uname': {
        const flags = args.join('').replace(/-/g, '');
        if (!flags || flags === 's') print(UNAME.s);
        else if (flags.includes('a')) print(`${UNAME.s} ${UNAME.n} ${UNAME.r} ${UNAME.m} ${UNAME.s}`);
        else print([...flags].map((flag) => UNAME[flag]).filter(Boolean).join(' '));
        return;
      }
      case 'cd': {
        const path = resolve(args[0] ?? '~');
        const node = fileSystem.stat(path);
        if (!node) print(`cd: no such file or directory: ${args[0]}`);
        else if (node.type !== 'dir') print(`cd: not a directory: ${args[0]}`);
        else cwd = path;
        return;
      }
      case 'ls':
        listDirectory(args);
        return;
      case 'cat':
        if (!args.length) print('cat: missing file operand');
        for (const path of args) {
          const content = await readFile('cat', path);
          if (content !== null) print(...content.replace(/\n$/, '').split('\n'));
        }
        return;
      case 'head':
      case 'tail': {
        const { count, files } = parseLineCount(args);
        if (!files.length) print(`${name}: missing file operand`);
        for (const path of files) {
          const content = await readFile(name, path);
          if (content === null) continue;
          const fileLines = content.replace(/\n$/, '').split('\n');
          if (files.length > 1) print(`==> ${path} <==`);
          print(...(name === 'head' ? fileLines.slice(0, count) : fileLines.slice(Math.max(0, fileLines.length - count))));
        }
        return;
      }
      case 'less': {
        if (!args[0]) {
          print('less: missing file operand');
          return;
        }
        const content = await readFile('less', args[0]);
        if (content === null) return;
        const path = resolve(args[0]);
        await io.spawn((childIo) => createLess(childIo, { title: displayPath(path), text: content, markdown: path.endsWith('.md'), baseUrl: fileSystem.remoteUrl(path) }));
        return;
      }
      case 'vi':
      case 'vim':
        await io.spawn((childIo) => createVi(childIo, { path: resolve(args[0] ?? 'untitled.txt'), fileSystem }));
        return;
      case 'daw':
        await io.spawn((childIo) => createDaw(childIo));
        return;
      case 'whoami': {
        const readme = await fileSystem.read(`${HOME}/README.txt`);
        print(...readme.replace(/\n$/, '').split('\n').filter((entry) => !entry.startsWith('try:')));
        return;
      }
      case 'blog':
        await runBlog(args[0]);
        return;
      case 'reset':
        print('resetting desk...');
        resetScene();
        return;
      default:
        if (name in LINKS) {
          print(`opening ${LINKS[name]}`);
          window.open(LINKS[name], '_blank', 'noopener');
        } else print(`rbsh: command not found: ${name}`);
    }
  }

  function complete() {
    const before = line.slice(0, cursor);
    const tokens = before.split(' ');
    const partial = tokens.at(-1);
    let candidates;
    if (tokens.length === 1) {
      candidates = BUILTIN_COMMANDS.filter((command) => command.startsWith(partial)).map((command) => `${command} `);
    } else {
      const slash = partial.lastIndexOf('/');
      const directoryPart = slash === -1 ? '' : partial.slice(0, slash + 1);
      const namePart = partial.slice(slash + 1);
      const entries = fileSystem.list(resolve(directoryPart || '.')) ?? [];
      candidates = entries
        .filter((entry) => entry.name.startsWith(namePart) && (namePart.startsWith('.') || !entry.name.startsWith('.')))
        .map((entry) => `${directoryPart}${entry.name}${entry.type === 'dir' ? '/' : ' '}`);
    }
    if (!candidates.length) return;
    let prefix = candidates[0];
    for (const candidate of candidates) while (!candidate.startsWith(prefix)) prefix = prefix.slice(0, -1);
    if (candidates.length > 1 && prefix.length <= partial.length) {
      io.write('\r\n');
      print(candidates.map((candidate) => candidate.trim()).join('  '));
      redrawLine();
      return;
    }
    const completion = candidates.length === 1 ? candidates[0] : prefix;
    line = before.slice(0, before.length - partial.length) + completion + line.slice(cursor);
    cursor = before.length - partial.length + completion.length;
    redrawLine();
  }

  async function submit() {
    const commandLine = line;
    io.write('\r\n');
    if (commandLine.trim()) {
      history.push(commandLine);
      if (history.length > HISTORY_LIMIT) history.shift();
    }
    historyIndex = history.length;
    running = true;
    try {
      await execute(commandLine);
    } finally {
      running = false;
      if (queuedNotices.length) print(...queuedNotices.splice(0));
      showPrompt();
    }
  }

  function handleKey({ key, ctrl }) {
    if (ctrl) {
      if (key === 'c') {
        io.write('^C\r\n');
        showPrompt();
      } else if (key === 'l') {
        io.write(ansi.clearScreen);
        redrawLine();
      } else if (key === 'a') cursor = 0;
      else if (key === 'e') cursor = line.length;
      else if (key === 'u') {
        line = line.slice(cursor);
        cursor = 0;
      } else if (key === 'k') line = line.slice(0, cursor);
      else if (key === 'w') {
        const start = line.slice(0, cursor).replace(/\S+\s*$/, '').length;
        line = line.slice(0, start) + line.slice(cursor);
        cursor = start;
      }
      if (key !== 'c' && key !== 'l') redrawLine();
      return;
    }
    switch (key) {
      case 'Enter':
        submit();
        return;
      case 'Backspace':
        if (cursor > 0) {
          line = line.slice(0, cursor - 1) + line.slice(cursor);
          cursor -= 1;
        }
        break;
      case 'Delete':
        line = line.slice(0, cursor) + line.slice(cursor + 1);
        break;
      case 'ArrowLeft':
        cursor = Math.max(0, cursor - 1);
        break;
      case 'ArrowRight':
        cursor = Math.min(line.length, cursor + 1);
        break;
      case 'Home':
        cursor = 0;
        break;
      case 'End':
        cursor = line.length;
        break;
      case 'ArrowUp':
        if (historyIndex > 0) line = history[(historyIndex -= 1)];
        cursor = line.length;
        break;
      case 'ArrowDown':
        historyIndex = Math.min(history.length, historyIndex + 1);
        line = history[historyIndex] ?? '';
        cursor = line.length;
        break;
      case 'Tab':
        complete();
        return;
      default:
        if (key.length !== 1 || line.length >= MAX_INPUT_LENGTH) return;
        line = line.slice(0, cursor) + key + line.slice(cursor);
        cursor += 1;
    }
    redrawLine();
  }

  return {
    start() {
      io.write(ansi.clearScreen);
      print(...bootLines);
      showPrompt();
    },
    input(data) {
      if (running) return;
      for (const event of decodeInput(data)) if (event.type === 'key') handleKey(event);
    },
    // Status messages from the desk (floppy drives). Printed above the prompt, or after the
    // running command finishes.
    notify(messages) {
      if (running) {
        queuedNotices.push(...messages);
        return;
      }
      io.write(`\r${ansi.clearLine}`);
      print(...messages);
      redrawLine();
    },
  };
}
