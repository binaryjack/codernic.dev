import * as vscode from 'vscode';

export interface AssetPathStrategy {
  /**
   * Resolves the primary full path for reading/writing the asset.
   */
  resolveWritePath(workspaceRoot: string, id: string): Promise<string>;
  
  /**
   * Used for 'get-asset' which might look into fallback read paths.
   */
  resolveReadPath(workspaceRoot: string, id: string): Promise<string | null>;

  /**
   * Whether the asset is stored as a directory.
   */
  isDirectory(): boolean;
}
