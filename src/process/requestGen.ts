import { RootAST } from 'src/ast';
import { config, IConfig } from 'src/config';
import { RequestGeneratorSub } from 'src/generator/request/requestSub';

interface IValue {
  config: IConfig;
  ast: RootAST;
}

process.on('message', async (data: string) => {
  if (data === 'done') {
    process.exit();
  } else {
    console.log('Core processing');
    const value = JSON.parse(data) as IValue;
    config.loadConfig(value.config);

    const g = new RequestGeneratorSub(value.ast);
    const code = await g.paint();
    process?.send?.(code);
  }
});
