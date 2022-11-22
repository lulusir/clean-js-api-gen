import { OpenAPI, OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import { Writer } from 'src/generator/writer';
import { log } from 'src/log';
import { ParserV2 } from './parserV2';
import { ParserV3 } from './parserV3';

export class Parser {
  async parse(doc: OpenAPI.Document) {
    const p = this.getParser(doc);
    log('Cleaning ...');
    await Writer.writeOutFolder();
    log('Parsing ...');
    const ast = await p.visit();
    return ast;
  }

  getParser(doc: OpenAPI.Document) {
    if ((doc as OpenAPIV2.Document)?.swagger?.startsWith('2.0')) {
      return new ParserV2(doc as OpenAPIV2.Document);
    }
    return new ParserV3(doc as OpenAPIV3.Document);
  }
}
