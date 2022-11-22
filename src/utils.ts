import { pascalCase, camelCase } from 'change-case';
import { OpenAPIV3, OpenAPIV2 } from 'openapi-types';

type HttpMethods =
  | 'get'
  | 'delete'
  | 'head'
  | 'options'
  | 'post'
  | 'put'
  | 'patch'
  | 'trace';

export function safeName(name: string) {
  const washName = name.replace(/[«»<>:\\|?*".]/g, '');
  let modeName = pascalCase(washName);
  return modeName;
}

export function isOperationObjectMethod(
  method: string,
): method is OpenAPIV3.HttpMethods {
  const methods: HttpMethods[] = [
    'get',
    'put',
    'post',
    'delete',
    'options',
    'head',
    'patch',
    'trace',
  ];
  return methods.includes(method as HttpMethods);
}

export function isReferenceObjectV3(
  data: any,
): data is OpenAPIV3.ReferenceObject {
  return Boolean(data.$ref);
}

export function isOperationObjectMethodV2(
  method: string,
): method is OpenAPIV2.HttpMethods {
  const methods: HttpMethods[] = [
    'get',
    'put',
    'post',
    'delete',
    'options',
    'head',
    'patch',
    'trace',
  ];
  return methods.includes(method as HttpMethods);
}

export type TsType =
  | 'number'
  | 'string'
  | 'boolean'
  | 'object'
  | 'null'
  | 'array'
  | 'undefined';

export function isSimpleType(schemaType: any) {
  return ['number', 'string', 'boolean', 'null'].includes(schemaType);
}

export const jsTypeMap: Record<string | 'undefined', TsType> = {
  integer: 'number',
  number: 'number',
  string: 'string',
  boolean: 'boolean',
  object: 'object',
  null: 'null',
  array: 'array',
  undefined: 'undefined',
};

export function schemaTypeToJsType(type?: string) {
  if (type === undefined) {
    return jsTypeMap.undefined;
  }
  return jsTypeMap[type];
}

export function urlToMethodName(
  url: string,
  mode: 'camel' | 'pascal' = 'camel',
) {
  const m = mode === 'camel' ? camelCase : pascalCase;
  return m(url.replaceAll(/{}/g, '').replaceAll('/', '_'));
}

export function isYapi(docs: any) {
  return Array.isArray(docs);
}
