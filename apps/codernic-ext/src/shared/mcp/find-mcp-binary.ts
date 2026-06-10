/**
 * @file find-mcp-binary.ts
 * @description Utility to locate ai-kit-mcp binary in workspace
 */

import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';
import * as vscode from 'vscode';

const execAsync = promisify(exec);

/**
 * Detects the available GPU hardware on the system.
 * Returns: 'cuda', 'metal', 'vulkan', 'rocm' or 'cpu'
 */
async function detectHardware(): Promise<'cuda' | 'metal' | 'vulkan' | 'rocm' | 'cpu'> {
  if (process.platform === 'darwin') return 'metal';

  try {
    const { stdout: nSmi } = await execAsync('nvidia-smi').catch(() => ({ stdout: '' }));
    if (nSmi.includes('NVIDIA-SMI')) return 'cuda';

    const { stdout: rSmi } = await execAsync('rocm-smi').catch(() => ({ stdout: '' }));
    if (rSmi.includes('ROCm') || rSmi.length > 0) return 'rocm';
  } catch {
    // Fallback to CPU if commands fail
  }

  // We fallback to checking if vulkaninfo is present for AMD/Intel GPUs on Linux/Windows
  try {
    const { stdout: vSmi } = await execAsync('vulkaninfo').catch(() => ({ stdout: '' }));
    if (vSmi.toLowerCase().includes('vulkan')) return 'vulkan';
  } catch {
    // Fallback to cpu
  }

  return 'cpu';
}

/**
 * Searches for a valid Rust engine binary in workspace
 * Priority:
 * 1. ai-agencee.mcpPath configuration setting
 * 2. Optimized hardware binary in extension bin/ folder
 * 3. Developer binaries in target/
 * @param workspaceRoot - Workspace root directory
 * @returns Path to the discovered binary
 */
export const findMcpBinary = async function (
  workspaceRoot: string,
  channel: vscode.OutputChannel,
  extensionPath?: string,
): Promise<string> {
  const configPath = vscode.workspace.getConfiguration('ai-agencee').get<string>('mcpPath');

  // 1. User config override
  if (configPath && (await fileExists(configPath))) {
    return configPath;
  }

  const hardware = await detectHardware();
  const hardwareMsg = `[MCP] Hardware detected: ${hardware}`;
  console.log(hardwareMsg);
  channel.appendLine(hardwareMsg);

  const candidates: string[] = [];

  // 1. Check for Rust binaries in search roots (Developer mode - Priority 1)
  const workspaceFolders = vscode.workspace.workspaceFolders || [];
  const searchRoots = workspaceFolders.map((f) => f.uri.fsPath);
  if (workspaceRoot && !searchRoots.includes(workspaceRoot)) {
    searchRoots.push(workspaceRoot);
  }

  for (const root of searchRoots) {
    candidates.push(
      path.join(root, 'target', 'release', 'ai_agencee_codernic'),
      path.join(root, 'target', 'debug', 'ai_agencee_codernic'),
      path.join(root, 'target', 'release', 'ai_agencee_cli'),
    );
  }

  // 2. Check bundled binaries in the extension (Optimized for end-users)
  if (extensionPath) {
    const suffix = hardware === 'cpu' ? '' : `_${hardware}`;
    const exe = process.platform === 'win32' ? '.exe' : '';

    candidates.push(
      path.join(extensionPath, 'bin', `ai_agencee_codernic${suffix}${exe}`),
      path.join(extensionPath, 'bin', `ai_agencee_cli${suffix}${exe}`),
      // Fallbacks if hardware-specific one is missing
      path.join(extensionPath, 'bin', `ai_agencee_codernic${exe}`),
    );
  }

  for (const p of candidates) {
    const msg = `[MCP] Checking candidate: ${p}`;
    console.log(msg);
    channel.appendLine(msg);

    if (await fileExists(p)) {
      const foundMsg = `[MCP] Found binary at: ${p}`;
      console.log(foundMsg);
      channel.appendLine(foundMsg);
      return p;
    }
  }
  const errorMsg = `[MCP] No binary found in candidates: ${candidates.join(', ')}`;
  console.log(errorMsg);
  channel.appendLine(errorMsg);
  return '';
};

/**
 * Checks if a file exists
 * @param filePath - Path to check
 * @returns True if file exists
 */
const fileExists = async function (filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};
