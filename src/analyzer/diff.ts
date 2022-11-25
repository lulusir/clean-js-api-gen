import dayjs from 'dayjs';
import {
  existsSync,
  mkdirsSync,
  readJsonSync,
  writeFileSync,
  writeJsonSync,
} from 'fs-extra';
import _ from 'lodash';
import { OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import { join } from 'path';
import { RequestAST, RootAST } from 'src/ast';
import { config } from 'src/config';
export class DiffAnalyzer {
  cache: RootAST | null = null;

  log: {
    api: {
      data: string[]; // method url
      addLen: number;
      reduceLen: number;
    };
    pathParameter: {
      data: string[];
    };
    queryParameter: {
      data: string[];
    };
    bodyParameter: {
      data: string[];
    };
    responseParameter: {
      datas: string[][];
    };
  } = {
    api: {
      data: [],
      addLen: 0,
      reduceLen: 0,
    },
    pathParameter: {
      data: [],
    },
    queryParameter: {
      data: [],
    },
    bodyParameter: {
      data: [],
    },
    responseParameter: {
      datas: [],
    },
  };

  constructor(public root: RootAST) {}

  readCache() {
    const dir = config.getAstCachePath();
    if (existsSync(dir)) {
      const data = readJsonSync(dir);
      this.cache = data;
    }
  }

  writeCache() {
    const dir = config.getAstCachePath();
    writeJsonSync(dir, this.root);
  }

  async visit() {
    this.readCache();
    this.writeCache();
    if (this.cache === null) {
      return;
    }
    await this.visitRootAST(this.root, this.cache);
  }

  async visitRootAST(node: RootAST, cache: RootAST) {
    this.apiDiff(node, cache);
    this.pathParamsDiff(node, cache);
    this.queryParamsDiff(node, cache);
    this.bodyParamsDiff(node, cache);
    this.responsesDiff(node, cache);
    if (this.hasDiff()) {
      this.writeLog();
    }
  }

  apiDiff(node: RootAST, cache: RootAST) {
    const cacheApi = cache.requests.map((v) => {
      return `${v.method.toUpperCase()} ${v.url}`;
    });

    const cacheApiMap = cacheApi.reduce((p, c) => {
      p[c] = p[c] ? p[c] + 1 : 1;
      return p;
    }, {} as Record<string, number>);

    const nodeApi = node.requests.map((v) => {
      return `${v.method.toUpperCase()} ${v.url}`;
    });

    const nodeApiMap = nodeApi.reduce((p, c) => {
      p[c] = p[c] ? p[c] + 1 : 1;
      return p;
    }, {} as Record<string, number>);

    for (let i = 0; i < cacheApi.length; i++) {
      const a = cacheApi[i];
      if (!nodeApiMap[a]) {
        this.log.api.reduceLen += 1;
        this.log.api.data.push('Reduce API ' + a);
      }
    }
    for (let i = 0; i < nodeApi.length; i++) {
      const a = nodeApi[i];
      if (!cacheApiMap[a]) {
        this.log.api.addLen += 1;
        this.log.api.data.push('Add API ' + a);
      }
    }
  }

  pathParamsDiff(node: RootAST, cache: RootAST) {
    // Parameters Change in path POST /api {"name": string} -> {"username": string}
    const cacheAPiMap: Record<string, RequestAST> = cache.requests.reduce(
      (p, c) => {
        const k = c.method + c.url;
        p[k] = c;
        return p;
      },
      {} as Record<string, RequestAST>,
    );

    for (let i = 0; i < node.requests.length; i++) {
      const req = node.requests[i];
      const k = req.method + req.url;
      const cacheReq = cacheAPiMap[k];

      if (cacheReq) {
        const isEqual = _.isEqual(cacheReq.pathParams, req.pathParams);
        if (!isEqual) {
          function clean(p: RequestAST['pathParams']) {
            if (p) {
              const r = Object.entries(_.cloneDeep(p)).reduce((p, [k, v]) => {
                p[k] = v.schema;
                return p;
              }, {} as Record<string, OpenAPIV3.SchemaObject | OpenAPIV2.SchemaObject>);
              return r;
            }
            return p;
          }
          this.log.pathParameter.data.push(
            `Parameters Change in path ${req.method} ${
              req.url
            }  ${JSON.stringify(
              clean(cacheReq.pathParams),
            )} -> ${JSON.stringify(clean(req.pathParams))}`,
          );
        }
      }
    }
  }

  queryParamsDiff(node: RootAST, cache: RootAST) {
    // Parameters Change in query POST /api  {"name": string} -> {"username": string}
    const cacheAPiMap: Record<string, RequestAST> = cache.requests.reduce(
      (p, c) => {
        const k = c.method + c.url;
        p[k] = c;
        return p;
      },
      {} as Record<string, RequestAST>,
    );

    for (let i = 0; i < node.requests.length; i++) {
      const req = node.requests[i];
      const k = req.method + req.url;
      const cacheReq = cacheAPiMap[k];

      if (cacheReq) {
        const isEqual = _.isEqual(cacheReq.queryParams, req.queryParams);
        if (!isEqual) {
          function clean(p: RequestAST['queryParams']) {
            if (p) {
              const r = Object.entries(_.cloneDeep(p)).reduce((p, [k, v]) => {
                p[k] = v.schema;
                return p;
              }, {} as Record<string, OpenAPIV3.SchemaObject | OpenAPIV2.SchemaObject>);
              return r;
            }
            return p;
          }
          this.log.queryParameter.data.push(
            `Parameters Change in query ${req.method} ${
              req.url
            }  ${JSON.stringify(
              clean(cacheReq.queryParams),
            )} -> ${JSON.stringify(clean(req.queryParams))}`,
          );
        }
      }
    }
  }

  bodyParamsDiff(node: RootAST, cache: RootAST) {
    const cacheAPiMap: Record<string, RequestAST> = cache.requests.reduce(
      (p, c) => {
        const k = c.method + c.url;
        p[k] = c;
        return p;
      },
      {} as Record<string, RequestAST>,
    );

    for (let i = 0; i < node.requests.length; i++) {
      const req = node.requests[i];
      const k = req.method + req.url;
      const cacheReq = cacheAPiMap[k];

      if (cacheReq) {
        const isEqual = _.isEqual(cacheReq.bodyParams, req.bodyParams);
        if (!isEqual) {
          function clean(p: RequestAST['bodyParams']) {
            if (p) {
              const r = Object.entries(_.cloneDeep(p)).reduce((p, [k, v]) => {
                p[k] = v.schema;
                return p;
              }, {} as Record<string, OpenAPIV3.SchemaObject | OpenAPIV2.SchemaObject>);
              return r;
            }
            return p;
          }
          this.log.bodyParameter.data.push(
            `Parameters Change in body ${req.method} ${
              req.url
            }  ${JSON.stringify(
              clean(cacheReq.bodyParams),
            )} -> ${JSON.stringify(clean(req.bodyParams))}`,
          );
        }
      }
    }
  }

  responsesDiff(node: RootAST, cache: RootAST) {
    const cacheAPiMap: Record<string, RequestAST> = cache.requests.reduce(
      (p, c) => {
        const k = c.method + c.url;
        p[k] = c;
        return p;
      },
      {} as Record<string, RequestAST>,
    );

    for (let i = 0; i < node.requests.length; i++) {
      const req = node.requests[i];
      const k = req.method + req.url;
      const cacheReq = cacheAPiMap[k];

      if (cacheReq) {
        const cacheRes200 = cacheReq.responses?.[0];
        const nodeRes200 = req.responses?.[0];

        const isEqual = _.isEqual(cacheRes200, nodeRes200);
        if (!isEqual) {
          this.log.responseParameter.datas.push([
            `Parameters Change in response ${req.method} ${
              req.url
            }  \n${JSON.stringify(cacheRes200, null, 2)}\n->\n${JSON.stringify(
              nodeRes200,
              null,
              2,
            )}`,
          ]);
        }
      }
    }
  }

  writeLog() {
    const dir = config.getLogPath();
    const date = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const fileName = date + '.log';

    const apiText = (() => {
      let text = '';
      if (this.log.api.addLen > 0) {
        text += `Added ${this.log.api.addLen} APIs`;
      }
      if (this.log.api.reduceLen > 0) {
        text += ` Reduce ${this.log.api.reduceLen} APIs`;
      }
      return text;
    })();

    const apiDiffText = (() => {
      if (this.log.api.data.length) {
        return this.log.api.data.join('\n');
      }
      return '';
    })();

    const modifyText = (() => {
      const len =
        this.log.bodyParameter.data.length +
        this.log.pathParameter.data.length +
        this.log.queryParameter.data.length +
        this.log.responseParameter.datas.length;

      if (len > 0) {
        return `Modified ${len} APIs `;
      }
      return '';
    })();

    const pathText = (() => {
      return this.log.pathParameter.data.join('\n') || '';
    })();

    const queryText = (() => {
      return this.log.queryParameter.data.join('\n') || '';
    })();

    const bodyText = (() => {
      return this.log.bodyParameter.data.join('\n') || '';
    })();

    const responseText = (() => {
      return this.log.responseParameter.datas?.[0]?.join('\n') || '';
    })();

    let text = `
@clean-js/api-gen

Date: ${date}

Sum-up: ${apiText} ${modifyText}

${apiDiffText}

${pathText}
${queryText}
${bodyText}
${responseText}
    `;

    if (!existsSync(dir)) {
      mkdirsSync(dir);
    }
    writeFileSync(join(dir, fileName), text, 'utf-8');
  }

  hasDiff() {
    if (this.log.api.addLen > 0) {
      return true;
    }
    if (this.log.api.reduceLen > 0) {
      return true;
    }
    const len =
      this.log.bodyParameter.data.length +
      this.log.pathParameter.data.length +
      this.log.queryParameter.data.length +
      this.log.responseParameter.datas.length;
    if (len > 0) {
      return true;
    }
    return false;
  }
}
