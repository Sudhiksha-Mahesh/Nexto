import { defineConfig } from 'vite';
import { resolve } from 'node:path';

/** Separate IIFE bundle — Chrome content scripts are not ES modules. */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/content/content.ts'),
      name: 'NextoContent',
      formats: ['iife'],
      fileName: () => 'content.js',
    },
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
  },
});
