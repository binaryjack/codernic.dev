/** prompt-loader.ts — Loads XML system prompts from disk. */

import * as fs from 'fs/promises';
import * as path from 'path';
import { type AnalyseStep } from './analyse-manifest';
import { ConfigPaths } from '../../../shared/utils/config-paths';

export async function loadAnalysePrompt(
  step: AnalyseStep,
  workspaceRoot: string,
  extensionPath: string,
): Promise<string> {
  const candidates: string[] = [];
  const customPrompt = ConfigPaths.resolveFile(workspaceRoot, path.join('config', 'codernic', 'prompts', `${step}.xml`));
  if (customPrompt) {
    candidates.push(customPrompt);
  }
  candidates.push(path.join(extensionPath, 'media', 'prompts', `${step}.xml`));

  for (const filePath of candidates) {
    try {
      const xml = await fs.readFile(filePath, 'utf-8');
      const match = xml.match(/<system>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/system>/);
      if (match?.[1]) return match[1].trim();
      const plain = xml.match(/<system>([\s\S]*?)<\/system>/);
      if (plain?.[1]) return plain[1].trim();
    } catch {
      continue;
    }
  }

  throw new Error(`[prompt-loader] Could not load prompt for step "${step}"`);
}
