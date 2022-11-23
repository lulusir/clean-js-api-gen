export { defineConfig } from './config';

import { OpenAPI } from 'openapi-types';
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

    log('Generating ...');
    const g = new RequestGenerator(ast);
    await g.paint();
    log('done ...');
    console.timeEnd('Time');

    if (config.diff) {
      const { fork } = require('child_process');
      const sender = fork(__dirname + '/diffProcess.js');
      sender.send(JSON.stringify(ast));
    }
  } catch (e) {
    console.error(e);
  }
}

main();
