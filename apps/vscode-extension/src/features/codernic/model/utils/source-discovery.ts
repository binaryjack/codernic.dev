/** source-discovery.ts — Scans workspace for relevant configuration and source files. */

import * as vscode from 'vscode';

export const SOURCE_GLOBS = [
  'package.json',
  'pyproject.toml',
  'Cargo.toml',
  'go.mod',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  '*.csproj',
  '*.fsproj',
  'composer.json',
  'Gemfile',
  'mix.exs',
  'pubspec.yaml',
  'tsconfig.json',
  '.eslintrc*',
  '.eslintrc.json',
  '.eslintrc.js',
  '.prettierrc*',
  '.editorconfig',
  'vite.config.*',
  'webpack.config.*',
  'rollup.config.*',
  'jest.config.*',
  'vitest.config.*',
  'tailwind.config.*',
  'postcss.config.*',
  'babel.config.*',
  'setup.cfg',
  'mypy.ini',
  '.flake8',
  'Dockerfile*',
  'docker-compose*.yml',
  '.github/workflows/*.yml',
  'azure-pipelines.yml',
  'Jenkinsfile',
  'terraform/*.tf',
  'infra/*.tf',
  'bicep/*.bicep',
  'kubernetes/*.yaml',
  'k8s/*.yaml',
  'helm/*/Chart.yaml',
];

export async function discoverSourceFiles(_workspaceRoot: string): Promise<string[]> {
  const found: string[] = [];
  const uris = await vscode.workspace.findFiles(
    `{${SOURCE_GLOBS.join(',')}}`,
    '{node_modules/**,dist/**,build/**,.git/**}',
    200,
  );
  for (const uri of uris) {
    found.push(uri.fsPath);
  }
  return found;
}
