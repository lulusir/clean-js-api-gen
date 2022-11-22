import fetch from 'node-fetch';
import { isAbsolute, join } from 'path';
import fs from 'fs-extra';
import { OpenAPIV3 } from 'openapi-types';

export async function loadDoc(url: string) {
  if (url.startsWith('http')) {
    let doc = await fetch(url).then((r) => r.json());
    return doc as OpenAPIV3.Document;
  } else {
    let u = isAbsolute(url) ? url : join(process.cwd(), url);
    const text = fs.readFileSync(u, 'utf-8');
    const doc = JSON.parse(text);
    return doc as OpenAPIV3.Document;
  }
}
