/* eslint-disable */
/**
 * 该文件自动生产，请勿修改
 * The file is produced automatically, do not modify it
 */
import { AxiosInstance, AxiosRequestConfig } from 'axios';

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
  static get request(): AxiosInstance {
    return Req._instance;
  }
  static _instance = proxy as AxiosInstance;

  static set(req: AxiosInstance) {
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
