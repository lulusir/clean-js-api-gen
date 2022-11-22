import fs from 'fs-extra';
import { JSONSchema4 } from 'json-schema';
import { compile } from 'json-schema-to-typescript';
import mkdirp from 'mkdirp';
import { OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import path from 'path';
import { config } from 'src/config';
import { Project } from 'ts-morph';

export class Writer {
  static async schemaToRenameInterface(
    schema: OpenAPIV3.SchemaObject | OpenAPIV2.SchemaObject,
    name: string,
  ) {
    const title = name;
    const s = {
      ...schema,
      title,
    };
    const code = await compile(s as JSONSchema4, title, {
      bannerComment: '',
      format: false,
      additionalProperties: false,
    });
    return code;
  }

  static getSourceFile() {
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

  static cleanOut() {
    return fs.rm(config.getOutPath(), { recursive: true }).catch((err) => {
      console.log(err);
    });
  }

  static async writeOutFolder() {
    if (fs.existsSync(config.getOutPath())) {
      await mkdirp(config.getOutPath(), {});
    }
    // if (fs.existsSync(config.getOutPath())) {
    //   await this.cleanOut();
    // }
    // await mkdirp(config.getOutPath(), {});
  }

  static async writeFile(filePath: string, content: any) {
    const fileName = path.basename(filePath);
    const folder = path.dirname(filePath);
    try {
      await mkdirp(folder, {});
      fs.writeFileSync(path.join(folder, fileName), content);
    } catch (err) {
      console.log(err);
    }
  }
}
