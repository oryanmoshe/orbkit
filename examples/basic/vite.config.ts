import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const require = createRequire(import.meta.url);
const reactPath = dirname(require.resolve('react/package.json'));
const reactDomPath = dirname(require.resolve('react-dom/package.json'));

export default defineConfig({
  plugins: [
    // Inline GLSL loader — import .glsl files as text strings
    {
      name: 'glsl-loader',
      transform(code, id) {
        const cleanId = id.split('?')[0] ?? id;
        if (cleanId.endsWith('.glsl')) {
          return {
            code: `export default ${JSON.stringify(code)};`,
            map: null,
          };
        }
        return null;
      },
    },
    react(),
  ],
  resolve: {
    alias: {
      orbkit: resolve(__dirname, '../../packages/core/src/index.ts'),
      // Deduplicate React — core source imports must use the same React instance as the app
      react: reactPath,
      'react-dom': reactDomPath,
    },
  },
});
