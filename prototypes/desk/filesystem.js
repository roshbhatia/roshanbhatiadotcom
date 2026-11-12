// In-memory file tree for the terminal. Files written by the visitor are stored in localStorage
// as an overlay on top of the base tree, so edits survive reloads without changing the base content.
const STORAGE_KEY = 'desk-filesystem-v1';
export const HOME = '/home/guest';

export const BUILTIN_COMMANDS = [
  'blog', 'cat', 'cd', 'clear', 'daw', 'github', 'head', 'help', 'less', 'linkedin',
  'ls', 'pwd', 'reset', 'tail', 'uname', 'vi', 'vim', 'whoami',
];

const README = `roshan bhatia

currently:
  backend, platform, and site reliability @ ping (staff software engineer)
formerly:
  kubernetes control planes @ nike (senior software engineer)
  observability integrations and site reliability @ virtual instruments
also formerly (but short lived):
  kubernetes controllers, multicloud k8s, react @ shipyard
  site reliability, multicloud and baremetal kubernetes @ dgraph
i like:
  distributed systems
  platform and infrastructure
  designing for scale

try: ls, cd blog, less <file>, vim notes.txt, cat /etc/credits
`;

const LINKS = `github    https://github.com/roshbhatia
linkedin  https://www.linkedin.com/in/roshan-bhatia-2b1970a7/
`;

const CQC = `CQC (Portland, Oregon)

LIVE @ S1                  https://ccqqcc.bandcamp.com/track/live-s1
SUSTAIN                    https://ccqqcc.bandcamp.com/track/sustain
BACKHAND/FRONTHAND SPLIT   https://ccqqcc.bandcamp.com/album/backhand-fronthand-split

the floppies on the desk hold these. put one in a drive to listen.
`;

const CREDITS = `credits and licenses

three.js            MIT          https://threejs.org
cannon-es           MIT          https://github.com/pmndrs/cannon-es
VT323, Michroma     OFL-1.1      https://fonts.google.com
xkcd 1168 and 378   CC BY-NC 2.5 https://xkcd.com (Randall Munroe)
`;

const file = (content, extra = {}) => ({ type: 'file', content, ...extra });
const directory = (children = {}) => ({ type: 'dir', children });

function createBaseTree() {
  return directory({
    bin: directory(Object.fromEntries(BUILTIN_COMMANDS.map((name) => [name, file('(rbsh builtin)\n')]))),
    etc: directory({
      credits: file(CREDITS),
      hostname: file('roshan\n'),
      motd: file("welcome to the rb personal computer.\ntype 'help' for commands.\n"),
      'os-release': file('NAME="RBOS"\nVERSION="1.0"\nPRETTY_NAME="RBOS 1.0 (desk)"\n'),
    }),
    home: directory({
      guest: directory({
        '.profile': file('export EDITOR=vi\nexport PAGER=less\n'),
        'README.txt': file(README),
        'links.txt': file(LINKS),
        blog: directory({
          '000-keyboard-designing-for-the-egotistical.md': file(null, { remote: 'writing/000/post.md' }),
        }),
        music: directory({ 'cqc.txt': file(CQC) }),
      }),
    }),
    tmp: directory(),
  });
}

function loadOverlay() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved.files === 'object' && Array.isArray(saved.directories)) return saved;
  } catch {
    // Unreadable storage falls back to an empty overlay.
  }
  return { files: {}, directories: [] };
}

export function normalizePath(cwd, input = '') {
  const expanded = input === '~' || input.startsWith('~/') ? HOME + input.slice(1) : input;
  const absolute = expanded.startsWith('/') ? expanded : `${cwd}/${expanded}`;
  const parts = [];
  for (const part of absolute.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return `/${parts.join('/')}`;
}

export const displayPath = (path) => (path === HOME ? '~' : path.startsWith(`${HOME}/`) ? `~${path.slice(HOME.length)}` : path);

export function createFileSystem() {
  const root = createBaseTree();
  const overlay = loadOverlay();

  function nodeAt(path) {
    let node = root;
    for (const part of path.split('/').filter(Boolean)) {
      if (node?.type !== 'dir') return null;
      node = node.children[part];
    }
    return node ?? null;
  }

  function parentAndName(path) {
    const index = path.lastIndexOf('/');
    return { parent: nodeAt(path.slice(0, index) || '/'), name: path.slice(index + 1) };
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(overlay));
    } catch {
      // Storage may be full or disabled; the edit stays in memory for this session.
    }
  }

  function applyWrite(path, content) {
    const { parent, name } = parentAndName(path);
    if (parent?.type !== 'dir' || !name) return false;
    if (parent.children[name]?.type === 'dir') return false;
    parent.children[name] = file(content);
    return true;
  }

  for (const path of overlay.directories) {
    const { parent, name } = parentAndName(path);
    if (parent?.type === 'dir' && !parent.children[name]) parent.children[name] = directory();
  }
  for (const [path, content] of Object.entries(overlay.files)) applyWrite(path, content);

  return {
    stat: nodeAt,
    list(path) {
      const node = nodeAt(path);
      if (node?.type !== 'dir') return null;
      return Object.entries(node.children)
        .map(([name, child]) => ({ name, type: child.type, size: child.type === 'file' ? child.content?.length ?? null : 4096 }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    async read(path) {
      const node = nodeAt(path);
      if (!node) throw new Error('No such file or directory');
      if (node.type === 'dir') throw new Error('Is a directory');
      if (node.content === null && node.remote) {
        const response = await fetch(node.remote);
        if (!response.ok) throw new Error(`could not load (HTTP ${response.status})`);
        node.content = await response.text();
      }
      return node.content;
    },
    remoteUrl(path) {
      const node = nodeAt(path);
      return node?.remote ? new URL(node.remote, location.href) : new URL(location.href);
    },
    write(path, content) {
      if (!applyWrite(path, content)) return false;
      overlay.files[path] = content;
      persist();
      return true;
    },
    mkdir(path) {
      const { parent, name } = parentAndName(path);
      if (parent?.type !== 'dir' || !name) return false;
      if (parent.children[name]) return parent.children[name].type === 'dir';
      parent.children[name] = directory();
      overlay.directories.push(path);
      persist();
      return true;
    },
    // Lists every directory and file under a path, loading remote file contents, for syncing into the VM.
    async walk(path) {
      const directories = [];
      const files = [];
      const visit = async (current) => {
        for (const entry of this.list(current) ?? []) {
          const child = `${current}/${entry.name}`;
          if (entry.type === 'dir') {
            directories.push(child);
            await visit(child);
          } else {
            files.push({ path: child, content: await this.read(child) });
          }
        }
      };
      await visit(path);
      return { directories, files };
    },
  };
}
