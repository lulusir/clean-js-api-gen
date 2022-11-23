import { DiffAnalyzer } from './analyzer/diff';
import { RootAST } from './ast';

process.on('message', (ast: string) => {
  const diff = new DiffAnalyzer(JSON.parse(ast) as RootAST);
  diff.visit();
  process.exit();
});
