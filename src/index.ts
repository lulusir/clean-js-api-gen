import { pathCase } from "change-case";
import fs from "fs-extra";
import jiti from "jiti";
import fetch from "node-fetch";
import { OpenAPIV3 } from "openapi-types";
import { Parser } from "./parser/parser";
import { isAbsolute, join } from "path";

async function main() {
  const rootDir = process.cwd();

  const require = jiti(rootDir, { interopDefault: true, esmResolve: true });

  try {
    const { url } = require("./clean.config");
    if (url.startsWith("http")) {
      let doc = await fetch(url).then((r) => r.json());
      // yapi maybe is array
      if (Array.isArray(doc)) {
        doc = doc[0];
      }
      const parser = new Parser();
      parser.parse(doc as OpenAPIV3.Document);
    } else {
      let u = isAbsolute(url) ? url : join(process.cwd(), url);
      const text = fs.readFileSync(u, "utf-8");
      const doc = JSON.parse(text);
      const parser = new Parser();
      parser.parse(doc as unknown as OpenAPIV3.Document);
    }
  } catch (e) {}
}

main();
