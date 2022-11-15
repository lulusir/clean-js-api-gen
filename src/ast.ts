import { OpenAPIV3, OpenAPIV3_1, OpenAPIV2 } from "openapi-types";
/**
 * 这里直接生成 typescript ast
 */
export interface SchemaV3AST {
  version: "OpenAPIV3";

  schema: OpenAPIV3.SchemaObject;
}

export interface SchemaV2AST {
  version: "OpenAPIV2";

  schema: OpenAPIV2.SchemaObject;
}

// export interface RefAST {
//   $ref: string;
// }

/**
 * 复用组件
 */
export interface ComponentAST {
  name: string;

  $ref: string;

  schema: SchemaV3AST;
}

type HttpMethods =
  | "get"
  | "put"
  | "post"
  | "delete"
  | "options"
  | "head"
  | "patch"
  | "trace";

export interface RequestAST {
  // 操作的id 通常是唯一的方法名, 不存在的时候 使用 method + url + bodyMediaType
  id: string;

  // 操作的url
  url: string;

  // 操作的http方法
  method: HttpMethods;

  // 操作的描述
  description?: string;

  // 操作的path参数
  pathParams?: Record<string, SchemaV3AST | SchemaV2AST>; // name : SchemaModel

  // 操作的query参数
  queryParams?: Record<string, SchemaV3AST | SchemaV2AST>; // name : SchemaV3AST

  bodyParams?: RequestBodyAST;

  headers?: Record<string, SchemaV3AST | SchemaV2AST>; // name : SchemaV3AST

  responses?: ResponseAST[]; // 响应 , 依次取200->300
}

export interface RequestBodyAST {
  type: "json" | "formData";

  schema?: SchemaV3AST | SchemaV2AST;
}

export interface ResponseAST {
  type: "json" | "javascript" | "html";

  status: number;

  schema?: SchemaV3AST | SchemaV2AST;
}

export interface RootAST {
  components: ComponentAST[];

  requests: RequestAST[];
}
