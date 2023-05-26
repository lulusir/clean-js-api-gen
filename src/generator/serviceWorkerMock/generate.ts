import fs from 'fs-extra';
import { JSONSchema7 } from 'json-schema';
import { parseSchema } from 'json-schema-to-zod';
import path from 'path';
import { RequestAST, RootAST } from 'src/ast';
import { config } from 'src/config';
import { Project, SyntaxKind } from 'ts-morph';

export class SwmVisitor {
  constructor(public ast: RootAST) {
    this.realAst = this.filterAst();
  }

  realAst: RootAST;

  async visit() {
    await this.paint();
  }

  getSourceFile() {
    const tplPaths = {
      apimock: 'apimock.tpl.ts',
    };
    const tplCode = fs.readFileSync(
      path.join(__dirname, '../template/', tplPaths['apimock']),
      'utf-8',
    );

    const p = new Project({});
    const s = p.createSourceFile(config.getMockPath(), tplCode, {
      overwrite: true,
    });
    return s;
  }

  async paint() {
    const sf = this.getSourceFile();
    if (this.realAst.requests.length) {
      const apiRoutesDeclaration = sf.getVariableDeclaration('apiRoutes');
      if (apiRoutesDeclaration) {
        const apiRoutesArrayLiteral = apiRoutesDeclaration.getInitializerIfKind(
          SyntaxKind.ArrayLiteralExpression,
        );
        if (apiRoutesArrayLiteral) {
          this.realAst.requests.forEach((req) => {
            const url = req.url;
            const method = req.method;
            const res200 = req.responses?.filter((v) => v.status === 200)[0];
            if (res200) {
              const isJson = res200.type === 'json';
              const sText = `const s = ${parseSchema(
                res200?.schema?.schema as JSONSchema7,
              )};`;
              const newRouteObject = `
    {
      path: '${url}',
      method: '${method}',
      handler: async (ctx) => {
${sText}

const mockData = generateMock(s);


${isJson ? 'ctx.res.headers.set("content-type", "application/json");' : ''}

${
  isJson
    ? 'ctx.res.body = JSON.stringify(mockData);'
    : 'ctx.res.body = mockData;'
}
      },
    }
  `;

              apiRoutesArrayLiteral.addElement(newRouteObject);
            }
          });
        }
      }
      sf.formatText();
    }
    await sf.save();
  }

  /**
   * 过滤需要生成mock的ast
   * 先匹配include
   * 然后根据exclude剔除
   * @returns
   */
  filterAst() {
    if (typeof config.mock !== 'boolean') {
      const originIncludes = config.mock?.includePath || [];

      const originExcludes = config.mock?.excludePath || [];

      if (!originIncludes?.length && !originExcludes?.length) {
        return this.ast;
      }

      const filteredData: RequestAST[] = [];

      this.ast.requests.forEach((request) => {
        const path = request.url;
        let includeMatch = false;
        let excludeMatch = false;

        if (originIncludes?.includes(path)) {
          includeMatch = true;
        }

        for (const includePattern of originIncludes) {
          if (includePattern.endsWith('*')) {
            const prefix = includePattern.slice(0, -1);
            if (path.startsWith(prefix)) {
              includeMatch = true;
              break;
            }
          }
        }

        if (originExcludes?.includes(path)) {
          excludeMatch = true;
        }

        for (const excludePattern of originExcludes) {
          if (excludePattern.endsWith('*')) {
            const prefix = excludePattern.slice(0, -1);
            if (path.startsWith(prefix)) {
              excludeMatch = true;
              break;
            }
          }
        }

        if (!excludeMatch && includeMatch) {
          filteredData.push(request);
        }
      });

      // console.log(this.ast.requests);
      // console.log('========');
      // console.log(filteredData);

      const ast: RootAST = {
        requests: filteredData,
      };
      return ast;
    } else {
      const ast: RootAST = {
        requests: [],
      };
      return ast;
    }
  }
}
