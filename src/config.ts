export interface Config {
  url: string; // http或者文件绝对路径
  outDir?: string;
  type?: "umi3" | "axios"; // default axios
}

export function defineConfig(options: Config) {
  return options;
}

export const config: Config = {
  url: "",
  type: "axios",
  outDir: "clean-js",
};
