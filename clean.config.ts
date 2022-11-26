import { defineConfig } from './src/config';

export default defineConfig({
  url: './test.json',
  // url: "./swagger2.json",
  // url: 'https://petstore3.swagger.io/api/v3/openapi.json', // swagger 3
  // url: 'https://petstore.swagger.io/v2/swagger.json', // swagger 2
  // url: 'http://yapi.smart-xwork.cn/api/open/plugin/export-full?type=json&pid=186904&status=all&token=59ecff7d43926c3be48f893deba401407f0d819c6c24a99b307a78c0877bc7d2',

  // url: './example/diff/origin.json',
  // url: './example/diff/incApi.json',
  // url: './example/diff/decApi.json',
  // url: './example/diff/path.json',
  // url: './example/diff/query.json',
  // url: './example/diff/body.json',
  // url: './example/diff/response.json',
  // url: './example/diff/bigChange.json',

  // url: './buildSwagger.json',
  // url: './buildSwagger.json',
  type: 'axios',
});
