import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  outDir: 'build',
  format: ['cjs'],
  minify: process.env.NODE_ENV === 'production',
  sourcemap: true,
  clean: true,
});
