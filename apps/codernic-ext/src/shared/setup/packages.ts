import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { notify, prompt } from '../error-utils';

type CompatiblePackages = Record<string, string>;

function parseVersion(raw: string): [number, number, number] | null {
  const cleaned = raw.replace(/^[\^~>=<\s]+/, '').split('-')[0];
  const parts = cleaned.split('.').map(Number);
  if (parts.length < 2 || parts.some(isNaN)) return null;
  return [parts[0], parts[1] ?? 0, parts[2] ?? 0];
}

function isCompatible(installed: string, range: string): boolean {
  const req = parseVersion(range);
  const ins = parseVersion(installed);
  if (!req || !ins) return true;
  const [rMaj, rMin, rPat] = req;
  const [iMaj, iMin, iPat] = ins;
  if (iMaj !== rMaj) return false;
  if (iMin !== rMin) return iMin > rMin;
  return iPat >= rPat;
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  'ai-agencee'?: {
    compatiblePackages?: Record<string, string>;
  };
}

export async function getMissingRequiredPackages(
  workspaceRoot: string,
  extensionPath: string,
): Promise<string[]> {
  try {
    const extPkg = JSON.parse(
      await fs.readFile(path.join(extensionPath, 'package.json'), 'utf-8'),
    ) as PackageJson;
    const compatiblePackages = extPkg['ai-agencee']?.compatiblePackages ?? {};
    if (Object.keys(compatiblePackages).length === 0) return [];

    const userPkgPath = path.join(workspaceRoot, 'package.json');
    let userPkg: PackageJson = {};
    try {
      userPkg = JSON.parse(await fs.readFile(userPkgPath, 'utf-8'));
    } catch {
      return Object.keys(compatiblePackages);
    }

    const installed: Record<string, string> = {
      ...userPkg.dependencies,
      ...userPkg.devDependencies,
    };

    const missing: string[] = [];
    for (const [pkgName] of Object.entries(compatiblePackages)) {
      if (!installed[pkgName]) missing.push(pkgName);
    }
    return missing;
  } catch {
    return [];
  }
}

/**
 * Check that the workspace has compatible @ai-agencee/* packages.
 * - Missing packages: prompt once per extension version, inject into devDependencies if user agrees.
 * - Mismatched versions: show a warning notification.
 *
 * Prompt guard key: `agencee.pkgPromptVersion` in workspaceState.
 */
export async function checkWorkspacePackages(
  workspaceRoot: string,
  extensionPath: string,
  channel: vscode.OutputChannel,
  workspaceState: vscode.ExtensionContext['workspaceState'],
): Promise<void> {
  channel.appendLine('[PKG-CHECK] Checking @ai-agencee/* packages…');

  // Read compatible packages from extension's own package.json
  let compatiblePackages: CompatiblePackages;
  try {
    const pkgData = await fs.readFile(path.join(extensionPath, 'package.json'), 'utf-8');
    const extPkg = JSON.parse(pkgData) as {
      version: string;
      'ai-agencee'?: { compatiblePackages?: CompatiblePackages };
    };
    compatiblePackages = extPkg['ai-agencee']?.compatiblePackages ?? {};
    const extensionVersion = extPkg.version;

    if (Object.keys(compatiblePackages).length === 0) {
      channel.appendLine('[PKG-CHECK] No compatiblePackages declared — skipping.');
      return;
    }

    // Read user's workspace package.json
    const userPkgPath = path.join(workspaceRoot, 'package.json');
    let userPkg: {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    try {
      userPkg = JSON.parse(await fs.readFile(userPkgPath, 'utf-8'));
    } catch {
      channel.appendLine('[PKG-CHECK] No workspace package.json found — skipping.');
      return;
    }

    // Merge all installed versions
    const installed: Record<string, string> = {
      ...userPkg.dependencies,
      ...userPkg.devDependencies,
    };

    const missing: string[] = [];
    const mismatched: Array<{ name: string; has: string; needs: string }> = [];

    for (const [pkgName, requiredRange] of Object.entries(compatiblePackages)) {
      const installedVersion = installed[pkgName];
      if (!installedVersion) {
        missing.push(pkgName);
      } else if (!isCompatible(installedVersion, requiredRange)) {
        mismatched.push({ name: pkgName, has: installedVersion, needs: requiredRange });
      }
    }

    // ── Version mismatches — warn via toast ──────────────────────────────────
    for (const { name, has, needs } of mismatched) {
      const msg = `${name} ${has} is installed but AI Agencee ${extensionVersion} requires ${needs}. Run: npm install ${name}@latest -D`;
      channel.appendLine(`[PKG-CHECK] ⚠ mismatch: ${msg}`);
      notify('warn', msg);
    }

    // ── Missing packages — prompt once per extension version ─────────────────
    if (missing.length > 0) {
      const alreadyPrompted = workspaceState.get<string>('agencee.pkgPromptVersion');
      if (alreadyPrompted === extensionVersion) {
        channel.appendLine(
          `[PKG-CHECK] Already prompted this version (${extensionVersion}) — skipping.`,
        );
        return;
      }

      const pkgList = missing.join(', ');
      channel.appendLine(`[PKG-CHECK] Missing packages: ${pkgList}`);

      const answer = await prompt(
        'info',
        `AI Agencee: Add ${pkgList} to devDependencies for full indexing and MCP support?`,
        'Add',
        'Not now',
      );

      // Mark as prompted regardless of answer (don't re-ask until version changes)
      await workspaceState.update('agencee.pkgPromptVersion', extensionVersion);

      if (answer === 'Add') {
        try {
          // Re-read to preserve formatting as much as possible
          const raw = await fs.readFile(userPkgPath, 'utf-8');
          const parsed = JSON.parse(raw) as {
            devDependencies?: Record<string, string>;
            [k: string]: unknown;
          };
          if (!parsed.devDependencies) parsed.devDependencies = {};

          for (const pkgName of missing) {
            const range = compatiblePackages[pkgName];
            // Strip caret — inject exact minimum version so user can see what was pinned
            const exactVersion = range.replace(/^[\^~]/, '');
            parsed.devDependencies[pkgName] = `^${exactVersion}`;
            channel.appendLine(
              `[PKG-CHECK] ✓ added ${pkgName}@^${exactVersion} to devDependencies`,
            );
          }

          await fs.writeFile(userPkgPath, JSON.stringify(parsed, null, 2) + '\n', 'utf-8');
          channel.appendLine(
            '[PKG-CHECK] ✓ package.json updated. Run: pnpm install (or npm install) to complete setup.',
          );
          notify(
            'info',
            `AI Agencee: Added ${pkgList} to package.json devDependencies. Run pnpm install to complete setup.`,
          );
        } catch (writeErr) {
          const msg = writeErr instanceof Error ? writeErr.message : String(writeErr);
          channel.appendLine(`[PKG-CHECK] ✗ Failed to write package.json: ${msg}`);
          notify(
            'warn',
            `AI Agencee: Could not update package.json automatically. Add ${pkgList} manually.`,
          );
        }
      }
    } else {
      channel.appendLine('[PKG-CHECK] ✓ All required packages present and compatible.');
    }
  } catch (err) {
    channel.appendLine(
      `[PKG-CHECK] ⚠ Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
    );
    // Non-fatal — extension continues normally
  }
}

