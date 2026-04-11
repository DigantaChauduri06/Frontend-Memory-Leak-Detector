import * as fs from "fs";
import * as path from "path";
import { Project, ScriptKind } from "ts-morph";
import { Issue, Framework, ScanResult } from "./types";
import { getRulesForFramework } from "./rules";

function findPackageJson(startPath: string): string | null {
  let current = path.resolve(startPath);
  while (true) {
    const candidate = path.join(current, "package.json");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

export function detectFramework(targetPath: string): Framework {
  const pkgPath = findPackageJson(targetPath);
  if (!pkgPath) {
    throw new Error(
      "Could not find package.json — unable to detect framework. Make sure the path points to a project with a package.json."
    );
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (deps["@angular/core"]) return "angular";
  if (deps["react"]) return "react";

  throw new Error(
    "Could not detect framework — package.json does not contain @angular/core or react in dependencies."
  );
}

export class Scanner {
  private createProject(framework: Framework): Project {
    return new Project({
      skipAddingFilesFromTsConfig: true,
      skipFileDependencyResolution: true,
      compilerOptions: {
        jsx: framework === "react" ? 2 /* JsxEmit.React */ : undefined,
        allowJs: framework === "react",
      },
    });
  }

  private analyzeProject(
    project: Project,
    resolvedPath: string,
    framework: Framework
  ): ScanResult {
    const rules = getRulesForFramework(framework);
    const issues: Issue[] = [];

    for (const sourceFile of project.getSourceFiles()) {
      const filePath = path.relative(resolvedPath, sourceFile.getFilePath());
      const lines = sourceFile.getFullText().split("\n");

      for (const rule of rules) {
        issues.push(...rule.analyze(sourceFile, filePath, lines));
      }
    }

    return { framework, issues };
  }

  scan(targetPath: string): ScanResult {
    const resolvedPath = path.resolve(targetPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Path does not exist: ${resolvedPath}`);
    }

    const framework = detectFramework(resolvedPath);
    const project = this.createProject(framework);

    if (framework === "react") {
      project.addSourceFilesAtPaths(path.join(resolvedPath, "**/*.{ts,tsx,jsx}"));
    } else {
      project.addSourceFilesAtPaths(path.join(resolvedPath, "**/*.ts"));
    }

    return this.analyzeProject(project, resolvedPath, framework);
  }

  scanFiles(targetPath: string, files: string[]): ScanResult {
    const resolvedPath = path.resolve(targetPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Path does not exist: ${resolvedPath}`);
    }

    const framework = detectFramework(resolvedPath);
    const project = this.createProject(framework);

    for (const file of files) {
      const absolute = path.resolve(resolvedPath, file);
      if (fs.existsSync(absolute)) {
        project.addSourceFileAtPath(absolute);
      }
    }

    return this.analyzeProject(project, resolvedPath, framework);
  }
}
