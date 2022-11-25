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
    input: 'src/process/diffProcess.ts',
    output: [
      {
        file: './dist/process/diffProcess.js',
        format: 'cjs',
        sourcemap: false,
      },
    ],
    plugins: [typescript(), json()],
  },
  {
    input: 'src/process/requestGen.ts',
    output: [
      {
        file: './dist/process/requestGen.js',
        format: 'cjs',
        sourcemap: false,
      },
    ],
    plugins: [typescript(), json()],
  },
]);
