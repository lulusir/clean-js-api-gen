import path from "path";

export class Paths {
  static outPath = path.join(process.cwd(), `./clean-api`);

  static setOutPath (id: string) {
    Paths.outPath = path.join(process.cwd(), id);
  }

  static servicesPath = path.join(Paths.outPath, "./");

  static getServicePath(serviceName = "http") {
    return path.join(Paths.servicesPath, `./${serviceName}.service.ts`);
  }
}
