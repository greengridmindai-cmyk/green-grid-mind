import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

/** Characters allowed as JSX text: typographic symbols only, never words (all words come from i18n). */
const ALLOWED = [
  '→',
  '←',
  '↔',
  '●',
  '·',
  '/',
  '×',
  '–',
  '—',
  '✓',
  '✕',
  '?',
  '|',
  ':',
  '(',
  ')',
  '%',
  ',',
  '+',
  '[',
  ']',
  '•',
  '↗',
];

export default tseslint.config(
  {
    ignores: [
      'dist',
      'legacy',
      'node_modules',
      'playwright-report',
      'test-results',
      'src/components/cabinet/cabinetScene.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: { globals: globals.browser },
    settings: { react: { version: '19.3' } },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-target-blank': 'error',
      'react/jsx-no-literals': ['error', { noStrings: false, allowedStrings: ALLOWED, ignoreProps: true }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['src/components/cabinet/model/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['scripts/**/*.{js,mjs}', 'tests/**/*.ts', '*.config.{js,ts}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
);
