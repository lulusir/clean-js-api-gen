import { existsSync, readJsonSync, writeJsonSync } from 'fs-extra';
import { RequestAST, RootAST } from 'src/ast';
import { config } from 'src/config';
import { log } from 'src/log';
import _, { find } from 'lodash';

export class DiffAnalyzer {
  cache: RootAST | null = null;

  log: {
    apiDecrease: RequestAST[];
    apiIncrease: RequestAST[];
  } = {
    apiDecrease: [],
    apiIncrease: [],
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
    // this.writeCache();
    if (this.cache === null) {
      return;
    }
    await this.visitRootAST(this.root, this.cache);
  }

  async visitRootAST(node: RootAST, cache: RootAST) {
    this.apiDiff(node, cache);
    this.pathParamsDiff(node, cache);
    console.log(this.log);
    // node.requests.forEach((n) => {
    // this.visitRequestAST(n);
    // });
  }

  apiDiff(node: RootAST, cache: RootAST) {
    const lenDiff = cache.requests.length - node.requests.length;
    const equal = (a: RequestAST, b: RequestAST) => {
      if (a.method === b.method) {
        if (a.url === b.url) {
          return true;
        }
      }
      return false;
    };
    let diff: RequestAST[] = [];
    if (lenDiff > 0) {
      // 接口减少
      diff = this.differenceWith(cache.requests, node.requests, equal);
      this.log.apiDecrease = diff;
    } else if (lenDiff < 0) {
      diff = this.differenceWith(node.requests, cache.requests, equal);
      // 接口增加
      this.log.apiIncrease = diff;
    }
  }

  pathParamsDiff(node: RootAST, cache: RootAST) {
    const equal = (a: RequestAST, b: RequestAST) => {
      if (a.method === b.method) {
        if (a.url === b.url) {
          const r = _.isEqual(a.pathParams, b.pathParams);
          console.log(r, a.url);
          return r;
        }
      }
      return true;
    };
    const diff = this.differenceWith(cache.requests, node.requests, equal);
    console.log('diff:', diff);
  }

  differenceWith<T>(a: T[], b: T[], equal: (a: T, b: T) => boolean) {
    const diff: T[] = [];

    a.forEach((v) => {
      for (let i = 0; i < b.length; i++) {
        const w = b[i];
        if (!equal(v, w)) {
          diff.push(_.cloneDeep(v));
          break;
        }
      }
    });
    return diff;
  }

  visitRequestAST(node: RequestAST) {}
}
