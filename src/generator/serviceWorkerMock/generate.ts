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
    if (this.realAst.requests.length) {
      const sf = this.getSourceFile();
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
      handler: async (params) => {
${sText}

const mockData = generateMock(s);

${isJson ? 'return JSON.stringify(mockData);' : 'return mockData;'}
      },
    }
  `;

              apiRoutesArrayLiteral.addElement(newRouteObject);
            }
          });
        }
      }
      sf.formatText();
      sf.save();
    }
  }

  /**
   * 过滤需要生成mock的ast
   * 先匹配include
   * 然后根据exclude剔除
   * @returns
   */
  filterAst() {
    const originIncludes = config.mock.includePath;

    const originExcludes = config.mock.excludePath;

    if (!originIncludes.length && !originExcludes.length) {
      return this.ast;
    }

    const filteredData: RequestAST[] = [];

    this.ast.requests.forEach((request) => {
      const path = request.url;
      let includeMatch = false;
      let excludeMatch = false;

      // 检查是否存在匹配的全匹配项
      if (originIncludes?.includes(path)) {
        includeMatch = true;
      }

      // 检查是否存在匹配的模糊匹配项
      for (const includePattern of originIncludes) {
        if (includePattern.endsWith('*')) {
          const prefix = includePattern.slice(0, -1);
          if (path.startsWith(prefix)) {
            includeMatch = true;
            break;
          }
        }
      }

      // 检查是否存在匹配的排除项
      if (originExcludes?.includes(path)) {
        excludeMatch = true;
      }

      // 如果既不匹配排除项也不匹配包含项，则将路径添加到过滤后的数组中
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
  }
}
