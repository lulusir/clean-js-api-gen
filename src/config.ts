import jiti from 'jiti';
import path from 'path';

interface IConfig {
  url: string; // http或者文件绝对路径
  outDir?: string;
  type?: 'umi3' | 'axios'; // default axios
  diff?: boolean; // 是否开启diff功能 default true
}

export function defineConfig(options: IConfig) {
  return options;
}

class Config implements IConfig {
  url = ''; // http或者文件绝对路径
  type?: 'umi3' | 'axios' = 'axios'; // default axios
  outDir = 'clean-js';
  diff = true;

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

  getLogPath() {
    return path.join(this.getOutPath(), './log');
  }
}

export const config = new Config();
