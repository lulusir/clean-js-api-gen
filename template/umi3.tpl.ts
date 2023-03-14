/* eslint-disable */
/**
 * 该文件自动生产，请勿修改
 * The file is produced automatically, do not modify it
 */
import {
  RequestOptionsInit,
  RequestOptionsWithoutResponse,
  RequestOptionsWithResponse,
  RequestResponse,
} from 'umi-request';

interface RequestMethodInUmi<R = false> {
  <T = any>(
    url: string,
    options: RequestOptionsWithResponse & { skipErrorHandler?: boolean },
  ): Promise<RequestResponse<T>>;
  <T = any>(
    url: string,
    options: RequestOptionsWithoutResponse & { skipErrorHandler?: boolean },
  ): Promise<T>;
  <T = any>(
    url: string,
    options?: RequestOptionsInit & { skipErrorHandler?: boolean },
  ): R extends true ? Promise<RequestResponse<T>> : Promise<T>;
}

type RequestUmiOptions = Parameters<RequestMethodInUmi>[1];

function replaceUrlPath(url: string, pathParams: { [key: string]: any } = {}) {
  return url.replace(/\{([^}]+)\}/g, (_, key) => pathParams[key]);
}

function handleFormData(data: Record<string, any>) {
  const f = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    f.append(k, v);
  });
  return f;
}

const proxy = new Proxy(
  {},
  {
    get() {
      throw Error(`
      Please set request
      
      import { Req } from '@/clean-js/http.service';
      function initCleanJsApi() {
        Req.set(request);
      }`);
    },
  },
);

type ZodErrorHandler = (error: Error, value: any, url: string, schema) => void;
export class Req {
  static get request(): RequestMethodInUmi {
    return Req._instance;
  }

  static _instance = proxy as RequestMethodInUmi;

  static set(req: RequestMethodInUmi) {
    Req._instance = req;
  }

  static _zodErrorHandler: ZodErrorHandler = () => {};

  static setZodErrorHandler(handler: ZodErrorHandler) {
    if (typeof handler === 'function') {
      Req._zodErrorHandler = handler;
    } else {
      console.log('setZodErrorHandler need a function parameters');
    }
  }
}
