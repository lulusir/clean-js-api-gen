import fs from "fs-extra";
import jiti from "jiti";
import fetch from "node-fetch";
import { OpenAPIV3 } from "openapi-types";
import { isAbsolute, join } from "path";
import { Config } from "./config";
import { Paths } from "./generator/paths";
import { Parser } from "./parser/parser";

async function main() {
  const rootDir = process.cwd();

  const require = jiti(rootDir, { interopDefault: true, esmResolve: true });

  try {
    const { url, outDir } = require("./clean.config") as Config;

    if (outDir) {
      Paths.setOutPath(outDir);
    }
    console.time("Time:");
    if (url.startsWith("http")) {
      let doc = await fetch(url).then((r) => r.json());
      if (Array.isArray(doc)) {
        doc = doc[0];
      }
      const parser = new Parser();
      await parser.parse(doc as OpenAPIV3.Document);
    } else {
      let u = isAbsolute(url) ? url : join(process.cwd(), url);
      const text = fs.readFileSync(u, "utf-8");
      const doc = JSON.parse(text);
      const parser = new Parser();
      await parser.parse(doc as unknown as OpenAPIV3.Document);
    }
    console.timeEnd("Time:");
  } catch (e) {}
}

main();
