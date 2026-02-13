import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      orbkit: resolve(__dirname, '../../packages/core/src/index.ts'),
    },
  },
});
