// https://www.npmjs.com/package/path-to-regexp 路由的正则匹配可以使用这个库

type Params = Record<string, string>;

export interface Route {
  path: string;
  handler: ((params: Params) => any) | null;
}

enum Priority {
  wildcard = 0, // 通配符
  param = 1, // 参数
  static = 2, // 全匹配的字符串
}

class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isParam: boolean = false;
  paramName: string = '';
  handler: Route['handler'] = null;
  isEnd = false;
  priority = Priority.static; // 越大优先级越高, * < :id
  isOptionl = false;

  log() {
    return JSON.stringify(
      {
        children: Array.from(this.children.keys()),
        isParam: this.isParam,
        paramName: this.paramName,
      },
      null,
      2,
    );
  }
}

export class Router {
  private root: TrieNode = new TrieNode();

  constructor(routes: Route[]) {
    this.buildTrie(routes);
  }

  private dfs(node: TrieNode, level: number, prefix: string): void {
    console.log(
      `${'-'.repeat(level)}${prefix}(${
        node.children.size === 0 ? 'end' : ''
      }) ${node.log()}`,
    );
    for (const [char, child] of node.children.entries()) {
      this.dfs(child, level + 1, char);
    }
  }

  log(): void {
    console.log('-------- Trie ---------');
    this.dfs(this.root, 0, '');
    console.log('------------------------');
  }

  public add(route: Route): void {
    this._insert(route);
  }

  private _insert(route: Route) {
    const segments = route.path.split('/');
    let node = this.root;
    for (const segment of segments) {
      if (segment === '') continue;
      const isParam = segment.startsWith(':');
      const isOptionl = isParam && segment.endsWith('?');
      const key = isParam ? '*' : segment;
      if (!node.children.has(key)) {
        const n = new TrieNode();
        n.isParam = isParam;
        n.paramName = isParam ? segment.slice(1) : ''; // /:id -> id
        n.isOptionl = isOptionl;
        if (isParam) {
          n.priority = Priority.param;
        } else {
          if (key === '*') {
            n.priority = Priority.wildcard;
          }
        }
        node.children.set(key, n);
      }
      node = node.children.get(key)!;
    }
    node.handler = route.handler;
    node.isEnd = true;
  }

  private buildTrie(routes: Route[]): void {
    for (const route of routes) {
      this._insert(route);
    }
  }

  public match(path: string): {
    handler: Route['handler'];
    params: Params;
  } {
    // 按 / 切割路径
    const segments = path.split('/');
    // 记录参数路径的映射
    const params: Params = {};
    // 遍历节点
    let node: TrieNode = this.root;

    for (const segment of segments) {
      // 空字符就跳过 比如这样的路径//
      if (segment === '') continue;
      // 是否匹配到路径
      let found = false;

      // 遍历排序后的数组
      for (const [key, child] of node.children) {
        if (key === segment) {
          node = child;
          found = true;
          // 找到节点就跳出这个循环，匹配下一个segment
          break;
        }
        if (child.isParam) {
          params[child.paramName] = segment;
          node = child;
          found = true;
          break;
        }

        if (key === '*') {
          if (child.isEnd) {
            // 如果是结尾节点，就直接返回
            return { handler: child.handler, params };
          }
        }
      }
      // 如果没有找到节点，就返回null
      if (!found) {
        console.log('not found', segment);
        return { handler: null, params: {} };
      }
    }

    // 如果子节点存在可选参数节点，就返回可选参数节点的handler
    for (const [key, child] of node.children) {
      if (child.isParam) {
        if (child.isOptionl) {
          node = child;
          break;
        }
      }
    }

    return { handler: node ? node.handler : null, params };
  }
}
