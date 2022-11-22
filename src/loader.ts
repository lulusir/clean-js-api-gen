import fs from 'fs-extra';
import fetch from 'node-fetch';
import { OpenAPI } from 'openapi-types';
import { isAbsolute, join } from 'path';
import { YAPIToSwagger } from './parser/yapiToSwagger2';
import { isYapi } from './utils';

export async function loadDoc(url: string) {
  if (url.startsWith('http')) {
    let doc = await fetch(url).then((r) => r.json());
    return doc as OpenAPI.Document;
  } else {
    let u = isAbsolute(url) ? url : join(process.cwd(), url);
    const text = fs.readFileSync(u, 'utf-8');
    const doc = JSON.parse(text);
    return doc as OpenAPI.Document;
  }
}

export async function processDoc(doc: any, url: string) {
  if (isYapi(doc)) {
    const y2s = new YAPIToSwagger(url);
    const got = await y2s.convertToSwaggerV2Model(doc);
    return got;
  }
  return doc as OpenAPI.Document;
}
