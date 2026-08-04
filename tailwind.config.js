/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['CommitMono', 'JetBrains Mono', 'Courier New', 'monospace'],
      },
      // Keys are kebab-case because Tailwind uses them verbatim: a `codeBg`
      // key only answers to `bg-codeBg`, so the `bg-code-bg` in the markup
      // silently resolved to nothing and the highlight backgrounds vanished.
      colors: {
        bg: 'var(--bg)',
        text: 'var(--text)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        link: 'var(--link)',
        visited: 'var(--visited)',
        'cell-bg': 'var(--cell-bg)',
        'cell-border': 'var(--cell-border)',
        'code-bg': 'var(--code-bg)',
        'code-text': 'var(--code-text)',
      },
    },
  },
  plugins: [],
};
