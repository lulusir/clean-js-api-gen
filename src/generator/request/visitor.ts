import { RequestAST, RootAST } from 'src/ast';
import { cpus } from 'node:os';
import { RequestGeneratorMain } from './requestMain';
import { RequestGeneratorSub } from './requestSub';
import { config } from 'src/config';

export class RequestVisitor {
  constructor(public ast: RootAST) {}

  singleMax = 100;

  async visit() {
    if (this.ast.requests.length < this.singleMax) {
      const code = await new RequestGeneratorSub(this.ast).paint();
      const r = new RequestGeneratorMain();
      r.insertCode(code);
      await r.save();
    } else {
      await this.processGen();
    }
  }

  processGen() {
    return new Promise((resolve) => {
      // 每个进程最多处理100条, 总数超过核心*100再平分
      const numCPUs = cpus().length;

      const singleMax = this.singleMax;
      const maxNum = numCPUs * singleMax;

      let queue: RequestAST[][] = [];
      if (this.ast.requests.length > maxNum) {
        // 平分
        queue = Array(numCPUs)
          .fill(0)
          .map(() => []);
        this.ast.requests.forEach((v, i) => {
          const j = i % numCPUs;
          queue[j].push(v);
        });
      } else {
        let i = 0;
        while (i < this.ast.requests.length) {
          const q: RequestAST[] = [];
          while (q.length < singleMax) {
            const r = this.ast.requests[i];
            i += 1;
            q.push(r);
            if (i >= this.ast.requests.length) {
              break;
            }
          }
          queue.push(q);
        }
      }

      const main = new RequestGeneratorMain();

      let finishNum = 0;
      queue.forEach((v) => {
        const { fork } = require('child_process');
        const sender = fork(__dirname + '/process/requestGen.js');
        sender.send(
          JSON.stringify({
            config: config,
            ast: {
              requests: v,
            },
          }),
        );

        sender.on('message', async (code: any) => {
          finishNum += 1;
          main.insertCode(code);
          sender.send('done');
          if (finishNum === queue.length) {
            await main.save();
            resolve(null);
          }
        });
      });
    });
  }
}
