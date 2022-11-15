/**
 * 该文件自动生产，请勿修改
 * The file is produced automatically, do not modify it
 */
import { AxiosInstance } from "axios";

function replaceUrlPath(url: string, pathParams: { [key: string]: any } = {}) {
  return url.replace(/\{([^}]+)\}/g, (_, key) => pathParams[key]);
}

const proxy = new Proxy(
  {},
  {
    get() {
      throw Error("Please set request");
    },
  }
);

class Req {
  static get request(): AxiosInstance {
    return Req._instance;
  }

  static _instance = proxy as AxiosInstance;

  static set(req: AxiosInstance) {
    Req._instance = req;
  }
}

export class HttpService {
  static set(req: AxiosInstance) {
    Req.set(req);
  }
}
