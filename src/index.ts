export { defineConfig } from './config';

import { OpenAPI } from 'openapi-types';
import { config } from './config';
import { RequestVisitor } from './generator/request/visitor';
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

    if (config.diff) {
      const { fork } = require('child_process');
      const sender = fork(__dirname + '/process/diffProcess.js');
      sender.send(JSON.stringify(ast));
    }

    log('Generating ...');
    const g = new RequestVisitor(ast);
    await g.visit();
    log('done ...');
    console.timeEnd('Time');
  } catch (e) {
    console.error(e);
    process.exit();
  }
}

main();
