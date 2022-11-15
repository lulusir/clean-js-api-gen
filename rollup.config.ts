import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";

import { defineConfig } from "rollup";

export default defineConfig({
  input: "src/index.ts",
  output: [
    {
      file: "./dist/index.js",
      format: "cjs",
      banner: `#!/usr/bin/env node`,
      sourcemap: false,
    },
  ],
  plugins: [typescript(), json()],
});
