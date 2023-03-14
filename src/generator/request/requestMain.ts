import fs from 'fs-extra';
import path from 'path';
import { config } from 'src/config';
import { Project, SourceFile } from 'ts-morph';
export class RequestGeneratorMain {
  sf: SourceFile;

  constructor() {
    this.sf = this.getSourceFile();
    this.addZod(this.sf);
  }
  getSourceFile() {
    const tplPaths = {
      axios: 'axios.tpl.ts',
      umi3: 'umi3.tpl.ts',
    };
    const tplCode = fs.readFileSync(
      path.join(__dirname, '../template/', tplPaths[config.type || 'axios']),
      'utf-8',
    );

    const p = new Project({});
    const s = p.createSourceFile(config.getServicePath(), tplCode, {
      overwrite: true,
    });
    return s;
  }

  insertCode(code: string) {
    this.sf.insertText(this.sf.getEnd(), code);
  }

  async save() {
    await this.sf.save();
  }

  /**
   * 添加 zod的依赖
   */
  async addZod(sf: SourceFile) {
    if (config.zod) {
      sf.addImportDeclaration({
        namedImports: ['Schema', 'z'],
        moduleSpecifier: 'zod',
      });
      sf.insertText(
        sf.getEnd(),
        `function verifyZod(schema: Schema, value:any, url: string) {
  if (schema) {
    try {
      const res = schema?.safeParse?.(value);
      if (res) {
        if (!res.success) {
          console.warn('zod verify error on url: ' + url, res.error);
          Req._zodErrorHandler(res.error, value, url, schema)
        }
      }
    } catch (error) {
      // ignore error
    }
  }
}`,
      );
    }
  }
}
