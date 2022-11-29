import { config, IConfig } from 'src/config';
import { DiffAnalyzer } from '../analyzer/diff';
import { RootAST } from '../ast';

interface IValue {
  config: IConfig;
  ast: RootAST;
}

process.on('message', async (data: string) => {
  const value = JSON.parse(data) as IValue;
  config.loadConfig(value.config);

  console.log('Diffing...');
  const diff = new DiffAnalyzer(value.ast);
  await diff.visit();

  console.log('Diff done...');
  process.exit();
});
