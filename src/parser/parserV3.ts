import $RefParser from "@apidevtools/json-schema-ref-parser";
import { OpenAPIV3 } from "openapi-types";
import { isOperationObjectMethod, urlToMethodName } from "src/utils";
import {
  RequestAST,
  RequestBodyAST,
  ResponseAST,
  RootAST,
  SchemaV3AST
} from "../ast";
import { isReferenceObjectV3 } from "../utils";

export class ParserV3 {
  constructor(public doc: OpenAPIV3.Document) {}

  root: RootAST = {
    components: [],
    requests: [],
  };

  async visit() {
    await $RefParser.dereference(this.doc).then((res) => {
      this.doc = res as unknown as OpenAPIV3.Document;
    });
    await this.visit_doc();
    return this.root;
  }

  async visit_doc() {
    this.root.requests = await this.visit_paths(this.doc.paths);
  }

  async parseRef() {
    const doc = await ($RefParser.dereference({
      components: JSON.parse(JSON.stringify(this.doc)),
    }) as Promise<{ doc: OpenAPIV3.Document }>);

    return doc;
  }

  async visit_SchemaObject(
    schema: OpenAPIV3.SchemaObject
  ): Promise<SchemaV3AST> {
    const ast: SchemaV3AST = {
      schema,
      version: "OpenAPIV3",
    };
    return ast;
  }

  async visit_paths(paths: OpenAPIV3.Document["paths"]) {
    const pALl: Promise<RequestAST>[] = [];
    Object.entries(paths).forEach(([url, path]) => {
      if (path) {
        Object.entries(path).forEach(([method, operation]) => {
          if (isOperationObjectMethod(method)) {
            pALl.push(
              this.visit_operationObject(
                operation as OpenAPIV3.OperationObject,
                url,
                method
              )
            );
          } else {
            console.log("等待处理其他方法", method);
          }
        });
      }
    });

    const asts = await Promise.all(pALl);
    return asts;
  }

  async visit_operationObject(
    operation: OpenAPIV3.OperationObject,
    url: string,
    method: OpenAPIV3.HttpMethods
  ) {
    const ast: RequestAST = {
      id: `${urlToMethodName(method + "/" + url)}`,
      url,
      method,
      responses: [],
    };

    const parametersAll: Promise<any>[] =
      operation.parameters?.map(async (parameter) => {
        if (isReferenceObjectV3(parameter)) {
          throw Error("hand");
        } else if (parameter) {
          const parameterAst = await this.visit_ParameterObjectAST(parameter);
          if (parameter.in === "path") {
            if (parameterAst.schema) {
              ast.pathParams = {
                ...ast.pathParams,
                [parameter.name]: parameterAst,
              };
            }
          }
          if (parameter.in === "query") {
            if (parameterAst) {
              ast.queryParams = {
                ...ast.queryParams,
                [parameter.name]: parameterAst,
              };
            }
          }
          if (parameter.in === "header") {
            if (parameterAst) {
              ast.headers = {
                ...ast.headers,
                [parameter.name]: parameterAst,
              };
            }
          }
          if (parameter.in === "cookie") {
            console.error("skip cookie");
            // ast.pathParams[parameter.name] = parameterAst
          }
        }
      }) || [];

    await Promise.all(parametersAll);

    // body

    ast.bodyParams = await this.visit_RequestBodyObject(operation?.requestBody);

    // responses

    const { responses } = operation;
    if (responses) {
      const r = await this.visit_ResponseObject(responses[200]);
      if (r) {
        ast.responses?.push(r);
      }
    }

    return ast;
  }

  async visit_ParameterObjectAST(parameter: OpenAPIV3.ParameterObject) {
    const s = await this.visit_SchemaObject(
      parameter.schema as OpenAPIV3.SchemaObject
    );
    return s;
  }

  async visit_refOrSchema(
    schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject | undefined
  ) {
    if (schema) {
      if (isReferenceObjectV3(schema)) {
        throw Error("Ref，解构失败");
      }
      const s = await this.visit_SchemaObject(schema);
      return s;
    }
    return undefined;
  }

  async visit_RequestBodyObject(
    body?: OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject
  ) {
    if (!body) {
      return undefined;
    }
    // console.log(body, "==body");
    if (isReferenceObjectV3(body)) {
      // skip
      console.log("skip visit_RequestBodyObject isReferenceObject");
      return undefined;
    }

    const ast: RequestBodyAST = {
      type: "json",
    };

    if (body.content["application/json"]) {
      const m = body.content["application/json"];
      ast.type = "json";
      ast.schema = await this.visit_SchemaObject(
        m.schema as OpenAPIV3.SchemaObject
      );
    } else if (body.content["multipart/form-data"]) {
      const m = body.content["multipart/form-data"];
      ast.type = "formData";
      ast.schema = await this.visit_SchemaObject(
        m.schema as OpenAPIV3.SchemaObject
      );
    }

    return ast;
  }

  async visit_ResponseObject(
    body?: OpenAPIV3.ResponseObject | OpenAPIV3.ReferenceObject
  ) {
    if (!body) {
      return undefined;
    }
    if (isReferenceObjectV3(body)) {
      // skip
      console.log("skip visit_RequestBodyObject isReferenceObject");
      return undefined;
    }

    const ast: ResponseAST = {
      status: 200,
      type: "json",
    };

    const content = body?.content;
    if (content) {
      if (content["application/json"] || content["*/*"]) {
        const m = content["application/json"] || content["*/*"];
        ast.type = "json";
        ast.schema = await this.visit_refOrSchema(m.schema);
      } else if (content["text/javascript"]) {
        const m = content["text/javascript"];
        ast.type = "javascript";
        ast.schema = await this.visit_refOrSchema(m.schema);
      } else if (content["application/javascript"]) {
        const m = content["application/javascript"];
        ast.type = "javascript";
        ast.schema = await this.visit_refOrSchema(m.schema);
      }
    }
    return ast;
  }
}
