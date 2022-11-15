export interface Config {
  url: string; // http或者文件绝对路径
  outDir?: string;
}

export function defineConfig(options: Config) {
  return options;
}
