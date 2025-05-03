import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { name } from './package.json';

export default defineConfig({
  build: {
    lib: {
      name,
      entry: 'src/index.ts',
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
      formats: ['es', 'cjs'],
    },
  },
  plugins: [dts()],
});
