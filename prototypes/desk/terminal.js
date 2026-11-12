import { SCREEN_WIDTH, SCREEN_HEIGHT } from './computer-model.js';
import { PHOSPHOR, prepareText } from './phosphor.js';
import { createPager } from './pager.js';
import { createVi } from './vi.js';
import { BUILTIN_COMMANDS, HOME, createFileSystem, displayPath, normalizePath } from './filesystem.js';

const FONT_SIZE = 34;
const LINE_HEIGHT = 36;
const MAX_VISIBLE_LINES = 19;
const MAX_INPUT_LENGTH = 120;
const HISTORY_LIMIT = 100;
const POSTS_INDEX = 'writing/index.json';
const LINKS = {
  github: 'https://github.com/roshbhatia',
  linkedin: 'https://www.linkedin.com/in/roshan-bhatia-2b1970a7/',
};
const UNAME = { s: 'RBOS', n: 'roshan', r: '1.0.0-desk', m: 'rb8088' };

const BOOT_LINES = ['RB PERSONAL COMPUTER  BIOS v1.0', '640K OK', '', "type 'help' and press enter.", ''];
const HELP_LINES = [
  'commands:',
  '  ls [-la] [path]      list files',
  '  cd [path]            change directory',
  '  pwd                  print working directory',
  '  cat <file...>        print files',
  '  less <file>          page through a file',
  '  head/tail [-n N] <f> first or last lines',
  '  vi/vim [file]        edit a file (saved in this browser)',
  '  uname [-a]           system information',
  '  whoami               about me',
  '  blog [id]            list or read posts',
  '  daw                  open the step sequencer',
  '  github, linkedin     open in a new tab',
  '  reset                put the whole desk back',
  '  clear, help',
  'tab completes, up/down recalls history.',
];

async function fetchPosts() {
  const response = await fetch(POSTS_INDEX);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

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

export function createTerminal({ launch, resetScene = () => {} }) {
  const fileSystem = createFileSystem();
  const lines = [...BOOT_LINES];
  const history = [];
  let historyIndex = 0;
  let input = '';
  let cwd = HOME;
  let overlay = null;
  const closeOverlay = () => (overlay = null);
  const pager = createPager({ close: closeOverlay });
  const vi = createVi({ close: closeOverlay, fileSystem });


  const prompt = () => `guest@roshan:${displayPath(cwd)}$ `;
  const resolve = (path) => normalizePath(cwd, path);
  const print = (...messages) => lines.push(...messages);

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
      if (long) {
        entries.forEach((entry) => {
          const permissions = entry.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--';
          const size = String(entry.size ?? '-').padStart(6);
          print(`${permissions} guest ${size} ${entry.name}${entry.type === 'dir' ? '/' : ''}`);
        });
      } else if (entries.length) {
        print(entries.map((entry) => `${entry.name}${entry.type === 'dir' ? '/' : ''}`).join('  '));
      }
    }
  }

  async function runBlog(argument) {
    let posts;
    try {
      posts = await fetchPosts();
    } catch (error) {
      print(`blog: could not load posts (${error.message})`);
      return;
    }
    if (!argument) {
      print('id    date        title');
      posts.forEach((post) => print(`${post.slug}   ${post.date}  ${post.title}`));
      print("type 'blog <id>' to read.");
      return;
    }
    const post = posts.find((entry) => entry.slug === argument || Number(entry.slug) === Number(argument));
    if (!post) {
      print(`blog: no post '${argument}'`);
      return;
    }
    overlay = pager;
    pager.open(post);
  }

  async function execute(commandLine) {
    print(prompt() + commandLine);
    const [name = '', ...args] = commandLine.trim().split(/\s+/).filter(Boolean);
    switch (name) {
      case '':
        return;
      case 'help':
        print(...HELP_LINES);
        return;
      case 'clear':
        lines.length = 0;
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
        overlay = pager;
        pager.openDocument({ title: displayPath(path), text: content, markdown: path.endsWith('.md'), baseUrl: fileSystem.remoteUrl(path) });
        return;
      }
      case 'vi':
      case 'vim':
        overlay = vi;
        await vi.open(resolve(args[0] ?? 'untitled.txt'));
        return;
      case 'whoami': {
        const readme = await fileSystem.read(`${HOME}/README.txt`);
        print(...readme.split('\n').filter((line) => !line.startsWith('try:')));
        return;
      }
      case 'blog':
        await runBlog(args[0]);
        return;
      case 'reset':
        print('resetting desk...');
        resetScene();
        return;
      case 'daw':
        print('loading SEQ-16...');
        launch('daw');
        return;
      default:
        if (name in LINKS) {
          print(`opening ${LINKS[name]}`);
          window.open(LINKS[name], '_blank', 'noopener');
        } else print(`${name}: command not found`);
    }
  }

  function complete() {
    const tokens = input.split(' ');
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
    if (candidates.length === 1) {
      tokens[tokens.length - 1] = candidates[0];
      input = tokens.join(' ');
    } else if (candidates.length > 1) {
      let prefix = candidates[0];
      for (const candidate of candidates) while (!candidate.startsWith(prefix)) prefix = prefix.slice(0, -1);
      if (prefix.length > partial.length) {
        tokens[tokens.length - 1] = prefix;
        input = tokens.join(' ');
      } else {
        print(prompt() + input, candidates.map((candidate) => candidate.trim()).join('  '));
      }
    }
  }

  return {
    // Called by the scene when the computer powers back on: the session starts over from the BIOS.
    reboot() {
      lines.length = 0;
      lines.push(...BOOT_LINES);
      input = '';
      cwd = HOME;
      overlay = null;
    },
    // Lets the scene write status lines, for example when a floppy is inserted.
    print(...messages) {
      print(...messages);
    },
    handleKey(event) {
      if (overlay) {
        overlay.handleKey(event);
        return;
      }
      const { key } = event;
      if (key === 'Enter') {
        const commandLine = input;
        input = '';
        if (commandLine.trim()) {
          history.push(commandLine);
          if (history.length > HISTORY_LIMIT) history.shift();
        }
        historyIndex = history.length;
        execute(commandLine);
      } else if (key === 'Backspace') {
        input = input.slice(0, -1);
      } else if (key === 'Tab') {
        complete();
      } else if (key === 'ArrowUp' && historyIndex > 0) {
        input = history[(historyIndex -= 1)];
      } else if (key === 'ArrowDown') {
        historyIndex = Math.min(history.length, historyIndex + 1);
        input = history[historyIndex] ?? '';
      } else if (key.length === 1 && input.length < MAX_INPUT_LENGTH) {
        input += key;
      }
    },
    handlePointer() {},
    handleWheel(x, y, deltaY) {
      overlay?.handleWheel?.(x, y, deltaY);
    },
    draw(context, seconds) {
      if (overlay) {
        overlay.draw(context, seconds);
        return;
      }
      context.fillStyle = PHOSPHOR.background;
      context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      prepareText(context, FONT_SIZE);
      const cursor = Math.floor(seconds * 2) % 2 === 0 ? '█' : '';
      const maxWidth = SCREEN_WIDTH - 96;
      const rows = [];
      for (const line of [...lines.slice(-MAX_VISIBLE_LINES), prompt() + input + cursor]) {
        let remaining = line;
        while (context.measureText(remaining).width > maxWidth) {
          let cut = remaining.length - 1;
          while (cut > 1 && context.measureText(remaining.slice(0, cut)).width > maxWidth) cut -= 1;
          const space = remaining.lastIndexOf(' ', cut);
          const breakAt = space > cut / 2 ? space : cut;
          rows.push(remaining.slice(0, breakAt));
          remaining = `    ${remaining.slice(breakAt).trimStart()}`;
        }
        rows.push(remaining);
      }
      rows.slice(-MAX_VISIBLE_LINES).forEach((row, index) => context.fillText(row, 48, 56 + index * LINE_HEIGHT));
    },
  };
}
