// 自动生成的route
import { z } from 'zod';
import { Route } from 'worker-webserver';
import { generateMock } from '@anatine/zod-mock';

export const apiRoutes: Route[] = [];

export function includePath(
  apiRoutes: Route[],
  includePaths: string[],
): Route[] {
  return apiRoutes.filter((r) => {
    const path = r.path;

    if (includePaths.includes(path)) {
      return true;
    }

    for (const includePattern of includePaths) {
      if (includePattern.endsWith('*')) {
        const prefix = includePattern.slice(0, -1);
        if (path.startsWith(prefix)) {
          return true;
        }
      }
    }

    return false;
  });
}

export function excludePath(
  apiRoutes: Route[],
  excludePaths: string[],
): Route[] {
  return apiRoutes.filter((r) => {
    const path = r.path;

    if (excludePaths.includes(path)) {
      return false;
    }

    for (const excludePattern of excludePaths) {
      if (excludePattern.endsWith('*')) {
        const prefix = excludePattern.slice(0, -1);
        if (path.startsWith(prefix)) {
          return false;
        }
      }
    }

    return true;
  });
}
