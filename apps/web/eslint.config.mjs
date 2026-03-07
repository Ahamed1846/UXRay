import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';

const config = [
  {
    ignores: ['.next', 'out', 'build', 'next-env.d.ts', 'node_modules'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
];

export default config;




