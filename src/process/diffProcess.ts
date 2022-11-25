import { DiffAnalyzer } from '../analyzer/diff';
import { RootAST } from '../ast';

process.on('message', async (ast: string) => {
  console.log('Diffing...');
  const diff = new DiffAnalyzer(JSON.parse(ast) as RootAST);
  await diff.visit();

  console.log('Diff done...');
  process.exit();
});
