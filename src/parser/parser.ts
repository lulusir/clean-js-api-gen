import { RootAST } from '../ast';
export interface IParser {
  visit(): Promise<RootAST>;
}
