import tseslint from 'typescript-eslint';
import coreConfig from './configs/eslint/eslint-core.config.js';
import reactConfig from './configs/eslint/eslint-react.config.js';

const coreFiles = ['packages/core/**/*.{ts,tsx}'];
const reactFiles = [
  'packages/react/**/*.{ts,tsx}',
  'apps/**/*.{ts,tsx}',
];

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/.turbo/',
      '**/build/',
      '**/*.d.ts',
    ],
  },
  ...coreConfig.map((config) => ({
    ...config,
    files: config.files ?? coreFiles,
  })),
  ...reactConfig.map((config) => ({
    ...config,
    files: config.files ?? reactFiles,
  })),
);
