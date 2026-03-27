import { SourceFile } from "ts-morph";
import { Issue, Framework } from "../types";

export interface Rule {
  name: string;
  framework: Framework;
  analyze(sourceFile: SourceFile, filePath: string, lines: string[]): Issue[];
}
