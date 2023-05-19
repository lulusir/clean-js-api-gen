export { defineConfig } from './config';

import { OpenAPI } from 'openapi-types';
import { config } from './config';
import { RequestVisitor } from './generator/request/visitor';
import { loadDoc, processDoc } from './loader';
import { log } from './log';
import { Parser } from './parser';
import { SwmVisitor } from './generator/serviceWorkerMock/generate';

async function main() {
  try {
    console.time('Time');
    config.loadRuntime();
    const { url } = config;
    let doc = await loadDoc(url);
    doc = await processDoc(doc, url);
    const parser = new Parser();
    const ast = await parser.parse(doc as OpenAPI.Document);

    if (ast.requests.length > 0) {
      if (config.diff) {
        const { fork } = require('child_process');
        const sender = fork(__dirname + '/process/diffProcess.js');
        sender.send(
          JSON.stringify({
            config: config,
            ast: ast,
          }),
        );
      }

      log('Generating ...');
      const g = new RequestVisitor(ast);
      const swm = new SwmVisitor(ast);

      // code gen
      const p1 = g.visit();

      // service mock gen
      const p2 = swm.visit();

      await p1;
      await p2;
      log('done ...');
      console.timeEnd('Time');
    } else {
      throw Error('Has not ast request ');
    }
  } catch (e) {
    console.error(e);
    process.exit();
  }
}

main();
