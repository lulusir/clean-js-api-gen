export { defineConfig } from './config';

import { OpenAPI } from 'openapi-types';
import { DiffAnalyzer } from './analyzer/diff';
import { config } from './config';
import { RequestGenerator } from './generator/request';
import { loadDoc, processDoc } from './loader';
import { log } from './log';
import { Parser } from './parser';

async function main() {
  try {
    console.time('Time');
    config.loadRuntime();
    const { url } = config;
    let doc = await loadDoc(url);
    doc = await processDoc(doc, url);
    const parser = new Parser();
    const ast = await parser.parse(doc as OpenAPI.Document);

    const diff = new DiffAnalyzer(ast);
    diff.visit();

    log('Generating ...');
    const g = new RequestGenerator(ast);
    await g.paint();
    log('done ...');
    console.timeEnd('Time');
  } catch (e) {
    console.error(e);
  }
}

main();
