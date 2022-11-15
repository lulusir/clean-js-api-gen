import { OpenAPIV2, OpenAPIV3 } from "openapi-types";
import { RequestGenerator } from "src/generator/request";
import { Writer } from "src/generator/writer";
import { ParserV2 } from "./parserV2";
import { ParserV3 } from "./parserV3";
import { Yapi, YAPIToSwagger } from "./yapiToSwagger2";
import chalk from "chalk";
const log = console.log;

export class Parser {
  parse(doc: OpenAPIV2.Document | OpenAPIV3.Document | Yapi) {
    try {
      if ((doc as OpenAPIV2.Document)?.swagger?.startsWith("2.0")) {
        this.parseV2(doc as OpenAPIV2.Document);
      } else if ((doc as OpenAPIV3.Document)?.openapi?.startsWith("3.0")) {
        this.parseV3(doc as OpenAPIV3.Document);
      } else if ((doc as Yapi)?.list) {
        this.parseYapi(doc as Yapi);
      } else {
        console.error("Unknown Type" + doc);
      }
    } catch (e) {}
  }

  private async parseV2(doc: OpenAPIV2.Document) {
    log(chalk("Cleaning ..."));
    await Writer.writeOutFolder();
    log(chalk("Parsing ..."));
    const p = new ParserV2(doc);
    const ast = await p.visit();
    log(chalk("Generating ..."));
    const g2 = new RequestGenerator(ast);
    await g2.paint();
    log(chalk("done ..."));
  }

  private async parseV3(doc: OpenAPIV3.Document) {
    log(chalk("Cleaning ..."));
    await Writer.writeOutFolder();
    log(chalk("Parsing ..."));
    const p = new ParserV3(doc);
    const ast = await p.visit();
    log(chalk("Generating ..."));
    const g2 = new RequestGenerator(ast);
    await g2.paint();
    log(chalk("done ..."));
  }

  private async parseYapi(doc: Yapi) {
    const y2s = new YAPIToSwagger();
    const got = await y2s.convertToSwaggerV2Model(doc);
    await this.parseV2(got);
  }
}
