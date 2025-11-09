/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      colors: {
        bg: 'var(--bg)',
        text: 'var(--text)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        link: 'var(--link)',
        visited: 'var(--visited)',
        codeBg: 'var(--code-bg)',
        codeText: 'var(--code-text)',
      },
      // Remove animations for Web 1.0
      keyframes: {},
      animation: {},
    },
  },
  plugins: [],
};