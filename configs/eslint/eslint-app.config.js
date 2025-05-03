import tseslint from 'typescript-eslint';
import reactConfig from './eslint-react.config.js';

export default tseslint.config(...reactConfig, {});
