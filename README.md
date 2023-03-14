[docs](https://lulusir.github.io/clean-js/api-gen/usage)  
[中文文档](https://github.com/lulusir/clean-js-api-gen/blob/main/README-zh.md)

# API Code Generation
## Installation
```bash
npm install @clean-js/api-gen
```
## Features
- Generates request code based on API protocols such as YAPI, Swagger 2, and Swagger 3.
- Declares complete TypeScript input and output parameter types.
- Supports path parameter replacement.
- YAPI writes the interface's address in the comments.
- zod support
- Method naming convention is method+url, for example, /user, method: post, and the generated code looks like this:

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
The axios-generated code looks like this:


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
## Configuration
Interface:


```typescript
export interface Config {
  url: string; // HTTP or absolute file path.
  outDir?: string; // Output file path. Default is ./clean-js.
  type?: "umi3" | "axios"; // The type of generated code. Umi3 is based on umi-request library, and the default is axios.
  zod?: boolean; // Whether to enable zod validation for runtime data type checking.
}
```
Create a new clean.config.ts file:


```typescript
export default {
  url: 'https://petstore3.swagger.io/api/v3/openapi.json', // swagger 3
  url: 'https://petstore.swagger.io/v2/swagger.json', // swagger 2
  url: 'http://yapi.smart-xwork.cn/api/open/plugin/export-full?type=json&pid=186904&status=all&token=59ecff7d43926c3be48f893deba401407f0d819c6c24a99b307a78c0877bc7d2' // yapi
}
```
## YAPI
1. Go to Project -> Settings -> Generate TS Services and copy the remote URL address.
2. Paste the remote URL address into the url field in the clean.config.ts file.
3. Run npm run api-gen.
## Swagger
1. Copy the Swagger JSON online address or the absolute file path (relative path).
2. Paste the Swagger JSON address into the url field in the clean.config.ts file.
3. Run npm run api-gen.
## Runtime
Set the request instance during runtime:


```typescript
import { Req } from '@/clean-js/http.service';
function initCleanJsApi() {
  Req.set(request);
}
```
## Diff
When the document changes, re-running api-gen generates a diff record that shows the number of added, reduced, and changed APIs.


```bash
Date: 2022-11-26 12:26:34

Sum-up: Added 20 APIs Reduce 3 APIs 
```


## Runtime Type Validation


Enabling Zod can be used for type validation of returned data from API to detect issues in production.

To enable Zod, set the zod flag in the configuration file to true.

```typescript
export default {
  ...
  zod: true
}
```
Configure error handling function as follows:
```typescript
import { Req } from '@/clean-js/http.service';

Req.setZodErrorHandler((error, value, url, schema ) => {
    // You can report errors here
    console.log(error)
});
```