import tseslint from 'typescript-eslint';
import coreConfig from './configs/eslint/eslint-core.config.js';
import reactConfig from './configs/eslint/eslint-react.config.js';
import appConfig from './configs/eslint/eslint-app.config.js';

export default tseslint.config(
  // Spread the imported config arrays directly
  ...coreConfig,
  ...reactConfig,
  ...appConfig,

  // Apply file specific scopes if not handled by imported configs
  // (Or remove these if the imported configs already specify files)
  {
    files: ['packages/core/**/*.{ts,tsx}'],
    // You might need specific rules here if coreConfig is too general
  },
  {
    files: ['packages/react/**/*.{ts,tsx}'],
    // You might need specific rules here if reactConfig is too general
  },
  {
    files: ['apps/playground/**/*.{ts,tsx}'],
    // You might need specific rules here if appConfig is too general
  },

  // Global ignores
  {
    ignores: ['**/node_modules/', '**/dist/', '**/.turbo/', '**/build/'],
  }
);
