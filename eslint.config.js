import tseslint from 'typescript-eslint';
import coreConfig from './configs/eslint/eslint-core.config.js';
import reactConfig from './configs/eslint/eslint-react.config.js';
import appConfig from './configs/eslint/eslint-app.config.js';

export default tseslint.config(
  ...coreConfig,
  ...reactConfig,
  ...appConfig,
  // Define specific rules if needed.
  {
    files: ['packages/core/**/*.{ts,tsx}'],
  },
  {
    files: ['packages/react/**/*.{ts,tsx}'],
  },
  {
    files: ['apps/playground/**/*.{ts,tsx}'],
  },

  {
    ignores: ['**/node_modules/', '**/dist/', '**/.turbo/', '**/build/'],
  }
);
