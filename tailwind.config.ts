import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Warm cream surface
        parchment: 'var(--parchment)',
        'parchment-dark': 'var(--parchment-dark)',
        // Pale yellow ruled-note panel
        notepad: 'var(--notepad)',
        'notepad-rule': 'var(--notepad-rule)',
        // Ink blue accent
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
          muted: 'var(--ink-muted)',
          faint: 'var(--ink-faint)',
        },
        // Accent — muted ink-blue
        accent: {
          DEFAULT: 'var(--accent)',
          light: 'var(--accent-light)',
          dark: 'var(--accent-dark)',
        },
        rule: 'var(--rule)',
        'rule-soft': 'var(--rule-soft)',
      },
      fontFamily: {
        display: ['var(--font-lora)', 'Georgia', 'serif'],
        body: ['var(--font-karla)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        'ruled-lines':
          'repeating-linear-gradient(transparent, transparent calc(var(--line-height) - 1px), var(--notepad-rule) calc(var(--line-height) - 1px), var(--notepad-rule) var(--line-height))',
      },
    },
  },
  plugins: [],
};

export default config;
