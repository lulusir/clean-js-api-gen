import $RefParser from '@apidevtools/json-schema-ref-parser';
import { OpenAPIV2 } from 'openapi-types';
import { isOperationObjectMethodV2, urlToMethodName } from 'src/utils';
import {
  RequestAST,
  RequestBodyAST,
  ResponseAST,
  RootAST,
  SchemaV2AST,
} from '../ast';

import { IParser } from './parser';

export class ParserV2 implements IParser {
  constructor(public doc: OpenAPIV2.Document) {}

  root: RootAST = {
    requests: [],
  };

  async visit() {
    await $RefParser.dereference(this.doc as unknown as string).then((res) => {
      this.doc = res as unknown as OpenAPIV2.Document;
    });
    await this.visit_doc();
    return this.root;
  }

  async visit_doc() {
    this.root.requests = await this.visit_paths(this.doc.paths);
  }

  async visit_SchemaObject(
    schema: OpenAPIV2.SchemaObject,
  ): Promise<SchemaV2AST> {
    const ast: SchemaV2AST = {
      schema,
      version: 'OpenAPIV2',
    };
    return ast;
  }

  async visit_paths(paths: OpenAPIV2.Document['paths']) {
    const pALl: Promise<RequestAST>[] = [];
    Object.entries(paths).forEach(([url, path]) => {
      if (path) {
        Object.entries(path).forEach(([method, operation]) => {
          if (isOperationObjectMethodV2(method)) {
            pALl.push(
              this.visit_operationObject(
                operation as OpenAPIV2.OperationObject,
                url,
                method,
              ),
            );
          } else {
            console.log('等待处理其他方法', method);
          }
        });
      }
    });

    const asts = await Promise.all(pALl);
    return asts;
  }

  async visit_operationObject(
    operation: OpenAPIV2.OperationObject,
    url: string,
    method: OpenAPIV2.HttpMethods,
  ) {
    const ast: RequestAST = {
      id: `${urlToMethodName(method + '/' + url)}`,
      url,
      method,
      responses: [],
      description: operation.description,
    };

    const parametersAll: Promise<any>[] =
      operation.parameters?.map(async (parameter: OpenAPIV2.Parameter) => {
        if (parameter) {
          const parameterAst = await this.visit_ParameterObjectAST(parameter);
          if (parameter.in === 'path') {
            if (parameterAst.schema) {
              ast.pathParams = {
                ...ast.pathParams,
                [parameter.name]: parameterAst,
              };
            }
          }
          if (parameter.in === 'query') {
            if (parameterAst) {
              ast.queryParams = {
                ...ast.queryParams,
                [parameter.name]: parameterAst,
              };
            }
          }
          if (parameter.in === 'body') {
            ast.bodyParams = await this.visit_RequestBodyObject(parameter);
          }
          if (parameter.in === 'header') {
            if (parameterAst) {
              ast.headers = {
                ...ast.headers,
                [parameter.name]: parameterAst,
              };
            }
          }
          if (parameter.in === 'cookie') {
            console.error('skip cookie');
            // ast.pathParams[parameter.name] = parameterAst
          }
        }
      }) || [];

    await Promise.all(parametersAll);

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

  async visit_ParameterObjectAST(parameter: OpenAPIV2.ParameterObject) {
    if (parameter?.type) {
      const s: SchemaV2AST = {
        schema: {
          type: parameter.type,
          required: parameter.required ? [parameter.name] : [],
        },
        version: 'OpenAPIV2',
      };
      return s;
    }

    const s = await this.visit_SchemaObject(
      parameter.schema as OpenAPIV2.SchemaObject,
    );
    return s;
  }

  async visit_refOrSchema(
    schema: OpenAPIV2.ReferenceObject | OpenAPIV2.SchemaObject | undefined,
  ) {
    if (schema) {
      const s = await this.visit_SchemaObject(schema);
      return s;
    }
    return undefined;
  }

  async visit_RequestBodyObject(body?: OpenAPIV2.Parameter) {
    if (!body) {
      return undefined;
    }

    const ast: RequestBodyAST = {
      type: 'json',
    };

    ast.schema = await this.visit_SchemaObject(
      body.schema as OpenAPIV2.SchemaObject,
    );

    return ast;
  }

  async visit_ResponseObject(body?: OpenAPIV2.Response) {
    if (!body) {
      return undefined;
    }

    const ast: ResponseAST = {
      status: 200,
      type: 'json',
    };

    ast.schema = await this.visit_refOrSchema(
      (body as OpenAPIV2.ResponseObject).schema,
    );
    return ast;
  }
}
