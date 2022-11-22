import jiti from 'jiti';
import path from 'path';

interface IConfig {
  url: string; // http或者文件绝对路径
  outDir?: string;
  type?: 'umi3' | 'axios'; // default axios
}

export function defineConfig(options: IConfig) {
  return options;
}

class Config implements IConfig {
  url = ''; // http或者文件绝对路径
  type?: 'umi3' | 'axios' = 'axios'; // default axios
  outDir = 'clean-js';

  // ---

  loadRuntime() {
    const rootDir = process.cwd();
    const require = jiti(rootDir, { interopDefault: true, esmResolve: true });

    const runtimeConfig = require('./clean.config') as Config;
    Object.assign(this, runtimeConfig);
  }

  getOutPath() {
    return path.join(process.cwd(), this.outDir);
  }

  getServicePath(serviceName = 'http') {
    return path.join(this.getOutPath(), `./${serviceName}.service.ts`);
  }

  getAstCachePath() {
    return path.join(this.getOutPath(), '.ast.cache.json');
  }
}

export const config = new Config();
