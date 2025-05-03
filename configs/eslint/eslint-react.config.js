import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import coreConfig from './eslint-core.config.js';

export default tseslint.config(...coreConfig, {
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    globals: {
      browser: true,
    },
  },
  plugins: {
    react: reactPlugin,
    'react-hooks': reactHooksPlugin,
  },
  rules: {
    ...reactPlugin.configs.recommended.rules,
    ...reactHooksPlugin.configs.recommended.rules,
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
});
