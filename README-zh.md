[文档](https://lulusir.github.io/clean-js/api-gen/usage)
# API 代码生成
## install 
```
npm install @clean-js/api-gen
```
## 功能
 - 根据YAPI，swagger2，swagger3等api协议自动生成请求代码
 - 声明完整的Typescript入参和出参类型 
 - 支持路径参数替换
 - YAPI会在注释中写入该接口的地址
 - 方法命名规则为 method+url；如/user，method：post，生成的代码如下
    ```typescript
        /** Yapi link: https://yapi.xxxx.com/project/2055/interface/api/125352 */
    export function postUser(parameter: { body: PostUserBody }) {
      return Req.request<ResponsePostUser>({
        url: '/user',
        method: 'post',
        data: parameter.body,
      });
    }
    ```
- axios 生成代码如下
    ```typescript
    export function postDatasetVersionRecords(
      parameter: {
        body: any;
        path: {
          version: string;
          dataset: string;
        };
      },
      config?: AxiosRequestConfig,
    ) {
      return Req.request<ResponsePostDatasetVersionRecords>({
        url: replaceUrlPath('/{dataset}/{version}/records', parameter?.path),
        method: 'post',
        data: parameter.body,
        ...config,
      });
    }
    ```
## config 
interface
```typescript
export interface Config {
  url: string; // http或者文件绝对路径
  outDir?: string; // 输出文件路径，默认为./clean-js
  type?: "umi3" | "axios"; // 生成的代码类型，umi3是基于umi-request请求库,  默认为 axios
  zod?: boolean; // 是否开启zod校验, 用于运行时校验数据类型
}
```
新建clean.config.ts
```typescript
export default {
  url: 'https://petstore3.swagger.io/api/v3/openapi.json', // swagger 3
  url: 'https://petstore.swagger.io/v2/swagger.json', // swagger 2
  url: 'http://yapi.smart-xwork.cn/api/open/plugin/export-full?type=json&pid=186904&status=all&token=59ecff7d43926c3be48f893deba401407f0d819c6c24a99b307a78c0877bc7d2' // yapi
}
```
## YAPI
1. 项目->设置->生成 ts services ![image](./images/yapi-url.png)
2. 复制remoteUrl地址
3. 在clean.config.ts文件中填入url地址
4. 运行npm run api-gen

## Swagger
1. 复制swagger json在线地址，或者本地文件绝对地址（相对地址）
2. 在clean.config.ts文件中填入url地址
3. 运行npm run api-gen


## 运行时

在代码运行时设置请求实例
```typescript
import { Req } from '@/clean-js/http.service';
function initCleanJsApi() {
  Req.set(request);
}
```

## Diff
当文档发生变化，重新运行api-gen会生成diff记录,格式如下，记录新增，减少，变更多少api
```
Date: 2022-11-26 12:26:34

Sum-up: Added 20 APIs Reduce 3 APIs 
```


## 运行时类型校验
开启zod，可以用于接口返回数据的类型校验，发现线上问题
在config文件中开启zod即可

```typescript
export default {
  ...
  zod: true
}
```
配置错误处理函数
```typescript
import { Req } from '@/clean-js/http.service';

Req.setZodErrorHandler((error, value, url, schema ) => {
    // 你可以在这里上报错误
    console.log(error)
});

```
## mock
依赖于worker-webserver的功能，我们可以使用Service Worker来模拟接口请求。具体步骤如下：

1. 安装依赖项：

```bash
npm install worker-webserver @anatine/zod-mock @faker-js/faker --save
```
2. 使用CLI命令导出sw.js文件，并将其放置在静态资源目录中。如果你正在使用Vite或Umi，对应的目录是public文件夹：

```bash

npx worker-webserver --out public
```

3. 启用API-gen的mock功能

  ```typescript
  // ./clean.config.ts
  import { defineConfig } from './src/config';

  export default defineConfig({
    zod: true,
    url: 'https://petstore3.swagger.io/api/v3/openapi.json', // swagger 3
    type: 'umi3',
    mock: {}, // default false
  });

  ```
4. 在你的业务代码中你可以通过include和exclude来筛选需要的路由：
  ```typescript
  import { apiRoutes, includePath } from "./api/http.mock"; // 生成的文件
   let routes = includePath(apiRoutes, ["/api/*"]);
   routes = excludePath(routes, ["/api/test/*"]);
  ```

4. 在你的业务代码中开启worker服务器：
  ```typescript
    import { App, Route } from "worker-webserver";
    import { apiRoutes, includePath } from "./api/http.mock"; // 生成的文件

    function openMock() {
      const app = new App();
      app.addRoutes(apiRoutes);
      
      // 添加服务的中间件，以下功能为统一业务code为200
      app.use(async (ctx, next) => {
        await next();
      
        // unified code to 200
        if (ctx.res.body) {
          const contentType = ctx.res.headers.get("content-type");
          if (contentType === "application/json") {
            try {
              const body = JSON.parse(ctx.res.body);
              if (body.code) {
                body.code = 200;
              }
              ctx.res.body = JSON.stringify(body);
            } catch {}
          }
        }
      });
      
      // 启动worker服务器
      app.start();
    }
  ```

5. 如果需要关闭，执行以下命令关闭worker服务器：
  ```typescript
    app.stop();
  ```

这样就可以使用Service Worker来模拟接口请求了。