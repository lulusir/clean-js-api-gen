import { OpenAPIV3 } from "openapi-types";
import { RequestAST, RootAST, SchemaV2AST, SchemaV3AST } from "src/ast";
import {
  isSimpleType,
  safeName,
  schemaTypeToJsType,
  urlToMethodName,
} from "src/utils";
import {
  CodeBlockWriter,
  OptionalKind,
  ParameterDeclarationStructure,
  SourceFile,
} from "ts-morph";
import { Writer } from "./writer";
type Alias = {
  alias: string;
};

type PathAlias = {
  name: string;
  alias: Alias;
}[];

type QueryAlias = {
  name: string;
  alias: Alias;
}[];

type BodyAlias = Alias | null;

type Response200Alias = Alias | null;
export class RequestGenerator {
  constructor(public ast: RootAST) {}

  async paint() {
    await this.paintRequestsOneFile(this.ast.requests);
  }

  async paintRequestsOneFile(requests: RequestAST[]) {
    const sf = Writer.getSourceFile();
    if (requests.length) {
      await Promise.all(
        requests.map(async (s) => {
          const { pathAlias, queryAlias, bodyAlias, response200Alias } =
            await this.processPrams(sf, s);

          this.generateFunc(
            s,
            sf,
            bodyAlias,
            queryAlias,
            pathAlias,
            response200Alias
          );
        })
      );
    }

    await sf.save();
  }

  async processPrams(sf: SourceFile, s: RequestAST) {
    let response200Alias: Alias | null = null;
    if (s.responses?.length) {
      const res200 = s.responses.filter((v) => v.status === 200)[0];
      response200Alias = await this.writeSchema(
        sf,
        res200?.schema,
        safeName(`Response_${s.id}`)
      );
    }

    const pathAlias: {
      name: string;
      alias: Alias;
    }[] = [];
    await Promise.all(
      Object.entries(s?.pathParams || {})?.map(async ([name, schema]) => {
        if (schema) {
          const alias = await this.writeSchema(
            sf,
            schema,
            safeName(`PathParams_${s.id}_${name}`)
          );
          pathAlias.push({
            name,
            alias,
          });
        }
      })
    );

    const queryAlias: {
      name: string;
      alias: Alias;
    }[] = [];
    await Promise.all(
      Object.entries(s?.queryParams || {})?.map(async ([name, schema]) => {
        if (schema) {
          const alias = await this.writeSchema(
            sf,
            schema,
            safeName(`PathParams_${s.id}_${name}`)
          );
          queryAlias.push({
            name,
            alias,
          });
        }
      })
    );

    let bodyAlias: Alias | null = null;
    if (s.bodyParams) {
      if (s.bodyParams.type === "json") {
        bodyAlias = await this.writeSchema(
          sf,
          s.bodyParams.schema,
          urlToMethodName(s.method + s.url + "Body", "pascal")
        );
      }
    }

    return {
      bodyAlias,
      queryAlias,
      pathAlias,
      response200Alias,
    };
  }

  async generateCls(
    s: RequestAST,
    sf: SourceFile,
    bodyAlias: BodyAlias,
    queryAlias: QueryAlias,
    pathAlias: PathAlias,
    response200Alias: Response200Alias
  ) {
    const clsSf = sf?.getClass("HttpService");
    if (!clsSf?.getMethod(s.id)) {
      // process parameter
      let parameter: OptionalKind<ParameterDeclarationStructure>[] = [];
      if (bodyAlias || queryAlias.length || pathAlias.length) {
        parameter = [
          {
            name: "parameter",
            type: (writer: CodeBlockWriter) => {
              writer.block(() => {
                if (bodyAlias) {
                  writer.write(`body: ${bodyAlias.alias},`).endsWith(",");
                }
                if (queryAlias.length) {
                  writer
                    .write("params: ")
                    .block(() => {
                      queryAlias.forEach((v) => {
                        writer.write(`'${v.name}': ${v.alias.alias},`);
                      });
                    })
                    .endsWith(",");
                }
                if (pathAlias.length) {
                  writer
                    .write("path: ")
                    .block(() => {
                      pathAlias.forEach((v) => {
                        writer.write(`'${v.name}': ${v.alias.alias},`);
                      });
                    })
                    .endsWith(",");
                }
              });
              // console.log(writer.toString(), '=     writer.toString();');
            },
          },
        ];
      }
      clsSf?.addMethod({
        isStatic: true,
        name: s.id,
        parameters: parameter,
        statements: (writer) => {
          writer.write("return Req.request");
          if (response200Alias) {
            writer.write(`<${response200Alias.alias}>`);
          }
          writer.write("(");
          writer
            .block(() => {
              if (pathAlias.length) {
                writer.writeLine(
                  `url: replaceUrlPath('${s.url}', parameter?.path),`
                );
              } else {
                writer.writeLine(`url: '${s.url}',`);
              }
              writer.writeLine(`method: '${s.method}',`);
              if (queryAlias.length) {
                writer.writeLine(`params: parameter.params,`);
              }
              if (bodyAlias) {
                writer.writeLine(`data: parameter.body,`);
              }
            })
            .write(");");
        },
      });
      // await sf.save();
    } else {
      console.error("方法已存在", s.id);
    }
  }

  async generateFunc(
    s: RequestAST,
    sf: SourceFile,
    bodyAlias: BodyAlias,
    queryAlias: QueryAlias,
    pathAlias: PathAlias,
    response200Alias: Response200Alias
  ) {
    let parameter: OptionalKind<ParameterDeclarationStructure>[] = [];
    if (bodyAlias || queryAlias.length || pathAlias.length) {
      parameter = [
        {
          name: "parameter",
          type: (writer: CodeBlockWriter) => {
            writer.block(() => {
              if (bodyAlias) {
                writer.write(`body: ${bodyAlias.alias},`).endsWith(",");
              }
              if (queryAlias.length) {
                writer
                  .write("params: ")
                  .block(() => {
                    queryAlias.forEach((v) => {
                      writer.write(`'${v.name}': ${v.alias.alias},`);
                    });
                  })
                  .endsWith(",");
              }
              if (pathAlias.length) {
                writer
                  .write("path: ")
                  .block(() => {
                    pathAlias.forEach((v) => {
                      writer.write(`'${v.name}': ${v.alias.alias},`);
                    });
                  })
                  .endsWith(",");
              }
            });
            // console.log(writer.toString(), '=     writer.toString();');
          },
        },
      ];
    }
    const fn = sf?.addFunction({
      isExported: true,
      name: s.id,
      parameters: parameter,
      statements: (writer) => {
        writer.write("return Req.request");
        if (response200Alias) {
          writer.write(`<${response200Alias.alias}>`);
        }
        writer.write("(");
        writer
          .block(() => {
            if (pathAlias.length) {
              writer.writeLine(
                `url: replaceUrlPath('${s.url}', parameter?.path),`
              );
            } else {
              writer.writeLine(`url: '${s.url}',`);
            }
            writer.writeLine(`method: '${s.method}',`);
            if (queryAlias.length) {
              writer.writeLine(`params: parameter.params,`);
            }
            if (bodyAlias) {
              writer.writeLine(`data: parameter.body,`);
            }
          })
          .write(");");
      },
    });

    if (s.description) {
      fn.addJsDoc({
        description: s.description,
      });
    }
  }

  async writeSchema(
    sf: SourceFile,
    schema: SchemaV3AST | SchemaV2AST | undefined,
    SchemaName: string
  ) {
    let alias = "any";
    if (schema) {
      alias = SchemaName;
      const type = schemaTypeToJsType(
        (schema.schema as OpenAPIV3.SchemaObject)?.type
      );
      if (isSimpleType(type)) {
        alias = type;
      } else {
        const code = await Writer.schemaToRenameInterface(schema.schema, alias);
        sf.insertText(sf.getEnd(), code);
      }
    }

    return {
      alias,
    };
  }
}
