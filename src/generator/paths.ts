import path from "path";

export class Paths {
  static outPath = path.join(process.cwd(), `./clean-js`);

  static setOutPath (id: string) {
    Paths.outPath = path.join(process.cwd(), id);
    Paths.servicesPath = Paths.outPath
  }

  static servicesPath = Paths.outPath

  static getServicePath(serviceName = "http") {
    return path.join(Paths.servicesPath, `./${serviceName}.service.ts`);
  }
}
