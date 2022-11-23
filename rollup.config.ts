import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import { defineConfig } from 'rollup';

export default defineConfig([
  {
    input: 'src/index.ts',
    output: [
      {
        file: './dist/index.js',
        format: 'cjs',
        banner: `#!/usr/bin/env node`,
        sourcemap: false,
      },
    ],
    plugins: [typescript(), json(), terser()],
  },
  {
    input: 'src/diffProcess.ts',
    output: [
      {
        file: './dist/diffProcess.js',
        format: 'cjs',
        sourcemap: false,
      },
    ],
    plugins: [typescript(), json()],
  },
]);
