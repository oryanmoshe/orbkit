import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    // Inline GLSL loader — import .glsl files as text strings
    {
      name: 'glsl-loader',
      transform(code, id) {
        if (id.endsWith('.glsl')) {
          return `export default ${JSON.stringify(code)};`;
        }
      },
    },
    react(),
  ],
  resolve: {
    alias: {
      orbkit: resolve(__dirname, '../../packages/core/src/index.ts'),
      // Deduplicate React — core source imports must use the same React instance as the app
      react: resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom'),
    },
  },
});
