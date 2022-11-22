export { defineConfig } from './config';

import { OpenAPIV3 } from 'openapi-types';
import { config } from './config';
import { loadDoc } from './loader';
import { Parser } from './parser/parser';

async function main() {
  try {
    console.time('Time');
    config.loadRuntime();
    const { url } = config;
    const doc = await loadDoc(url);
    const parser = new Parser();
    await parser.parse(doc as OpenAPIV3.Document, url);
    console.timeEnd('Time');
  } catch (e) {
    console.error(e);
  }
}

main();
