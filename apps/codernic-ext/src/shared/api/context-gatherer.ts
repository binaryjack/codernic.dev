import * as path from 'path';
import * as vscode from 'vscode';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ContextOptions = {
  maxSymbols?: number;
  maxKeywords?: number;
  includeFileContent?: boolean;
  maxFileSnippets?: number;
};

export type FileSnippet = {
  path: string;
  line: number;
  snippet: string;
};

export type EnhancedContext = {
  symbols: string;
  files?: FileSnippet[];
  structure?: string;
};

// ── Query Detection ───────────────────────────────────────────────────────────

/**
 * Detect if user query is asking for file/folder listings vs code symbol search.
 */
const detectQueryType = function (
  query: string,
): 'file-listing' | 'folder-structure' | 'symbol-search' {
  const lower = query.toLowerCase();
  console.log('[detectQueryType] Input query: ' + query);
  console.log('[detectQueryType] Lowercase: ' + lower);

  // File listing patterns
  const filePattern1 =
    /\b(what|list|show|find|get|tell)\s+(files?|typescript|javascript|\.ts|\.js|\.tsx|\.jsx)\b/i.test(
      query,
    );
  const filePattern2 = /\bfiles?\s+(in|under|inside|within)\b/i.test(query);
  const filePattern3 = /\b(\.ts|\.tsx|\.js|\.jsx|\.py|\.java|\.go)\s+files?\b/i.test(query);
  const filePattern4 = /\b(how\s+many|count|number\s+of)\s+files?\b/i.test(query);
  const filePattern5 = /\bfiles?\s+\w+\s+(in|under|inside|within)\b/i.test(query); // "file we have in", "files are in"
  console.log(
    '[detectQueryType] Pattern tests: filePattern1=' +
      filePattern1 +
      ', filePattern2=' +
      filePattern2 +
      ', filePattern3=' +
      filePattern3 +
      ', filePattern4=' +
      filePattern4 +
      ', filePattern5=' +
      filePattern5,
  );

  if (filePattern1 || filePattern2 || filePattern3 || filePattern4 || filePattern5) {
    console.log('[detectQueryType] → Detected: file-listing');
    return 'file-listing';
  }

  // Folder structure patterns
  const folderPattern1 = /\b(structure|tree|hierarchy|layout|organization)\b/i.test(query);
  const folderPattern2 = /\b(folders?|directories|dir)\s+(in|under|inside|within)\b/i.test(query);
  const folderPattern3 = /\b(what's|show|list)\s+(in|inside)\s+\w+\s+(folder|directory)\b/i.test(
    query,
  );
  console.log(
    '[detectQueryType] Folder patterns: folderPattern1=' +
      folderPattern1 +
      ', folderPattern2=' +
      folderPattern2 +
      ', folderPattern3=' +
      folderPattern3,
  );

  if (folderPattern1 || folderPattern2 || folderPattern3) {
    console.log('[detectQueryType] → Detected: folder-structure');
    return 'folder-structure';
  }

  console.log('[detectQueryType] → Detected: symbol-search (default)');
  return 'symbol-search';
};

/**
 * Extract folder path from query (e.g., "files in packages" -> "packages").
 */
const extractFolderPath = function (query: string): string | null {
  // Match patterns like "in packages", "inside src/lib", "under _private"
  // Skip articles (the, a, an) that might appear between preposition and folder name
  const match = query.match(
    /\b(?:in|inside|under|within)\s+(?:the\s+)?([a-z0-9_\-/.]+(?:\s+[a-z0-9_\-/.]+)*?)\s*(?:directory|folder|dir)?\b/i,
  );
  if (!match) return null;

  let folderPath = match[1].trim();

  // Common folder name mappings
  if (folderPath === 'private') folderPath = '_private';
  if (folderPath === 'private staging') folderPath = '_private/.staging';
  if (folderPath === 'staging' && query.includes('private')) folderPath = '_private/.staging';

  return folderPath;
};

/**
 * Extract file extensions from query (e.g., "TypeScript files" -> [".ts", ".tsx"]).
 */
const extractFileExtensions = function (query: string): string[] {
  const extensions: string[] = [];
  const lower = query.toLowerCase();

  // Explicit extensions mentioned with dot (e.g., ".ts", ".ps1", ".json")
  const explicitMatch = query.match(/\.([a-z0-9]+)\b/gi);
  if (explicitMatch) {
    extensions.push(...explicitMatch.map((e) => e.toLowerCase()));
  }

  // Extensions mentioned without dot (e.g., "ps1 files", "xml files")
  const extensionWordMatch = lower.match(/\b([a-z0-9]+)\s+(?:files?|scripts?)\b/gi);
  if (extensionWordMatch) {
    for (const match of extensionWordMatch) {
      const ext = match.match(/\b([a-z0-9]+)\s+(?:files?|scripts?)\b/i)?.[1];
      if (ext && ext.length <= 5) {
        // Reasonable extension length
        extensions.push('.' + ext);
      }
    }
  }

  // Language name mappings (common cases)
  if (/\btypescript\b/i.test(lower)) extensions.push('.ts', '.tsx');
  if (/\bjavascript\b/i.test(lower)) extensions.push('.js', '.jsx');
  if (/\bpython\b/i.test(lower)) extensions.push('.py');
  if (/\bjava\b/i.test(lower)) extensions.push('.java');
  if (/\bgo\b/i.test(lower)) extensions.push('.go');
  if (/\brust\b/i.test(lower)) extensions.push('.rs');
  if (/\bpowershell\b/i.test(lower)) extensions.push('.ps1');
  if (/\bbash\b/i.test(lower)) extensions.push('.sh');
  if (/\bc\+\+\b/i.test(lower)) extensions.push('.cpp', '.hpp');
  if (/\bc#|csharp\b/i.test(lower)) extensions.push('.cs');

  return [...new Set(extensions)]; // Deduplicate
};

// ── File/Folder Gathering ─────────────────────────────────────────────────────

/**
 * List files matching query criteria using VS Code workspace APIs.
 */
const gatherFileList = async function (query: string): Promise<string> {
  console.log('[gatherFileList] Called with query: ' + query);
  try {
    const folderPath = extractFolderPath(query) || '**';
    const extensions = extractFileExtensions(query);
    console.log(
      '[gatherFileList] folderPath: ' + folderPath + ', extensions: ' + extensions.join(', '),
    );

    // Build glob pattern
    let pattern: string;
    if (extensions.length > 0) {
      const extPattern =
        extensions.length === 1
          ? extensions[0].replace('.', '')
          : `{${extensions.map((e) => e.replace('.', '')).join(',')}}`;
      pattern = folderPath === '**' ? `**/*.${extPattern}` : `${folderPath}/**/*.${extPattern}`;
    } else {
      pattern = folderPath === '**' ? '**/*' : `${folderPath}/**/*`;
    }

    console.log('[gatherFileList] Searching with pattern: ' + pattern);
    // Find files (limit to 100 to avoid overwhelming LLM)
    const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 100);
    console.log('[gatherFileList] Found ' + files.length + ' files');

    if (files.length === 0) {
      console.log('[gatherFileList] No files found');
      return `No files found matching pattern: ${pattern}`;
    }

    // Group by directory for cleaner output
    const byDir = new Map<string, string[]>();
    for (const file of files) {
      const relativePath = vscode.workspace.asRelativePath(file);
      const dir = path.dirname(relativePath);
      const fileName = path.basename(relativePath);

      if (!byDir.has(dir)) byDir.set(dir, []);
      byDir.get(dir)!.push(fileName);
    }

    // Format output
    const lines: string[] = [`### Files matching "${pattern}" (${files.length} found)`];
    for (const [dir, fileNames] of Array.from(byDir.entries()).slice(0, 50)) {
      // Limit to 50 directories
      lines.push(`\n**${dir}/**`);
      for (const name of fileNames.slice(0, 20)) {
        // Limit to 20 files per dir
        lines.push(`  - ${name}`);
      }
      if (fileNames.length > 20) {
        lines.push(`  - ... (${fileNames.length - 20} more files)`);
      }
    }

    if (Array.from(byDir.entries()).length > 50) {
      lines.push(`\n... (${byDir.size - 50} more directories)`);
    }

    return lines.join('\n');
  } catch (err) {
    return `Error gathering file list: ${err instanceof Error ? err.message : String(err)}`;
  }
};

/**
 * Show folder structure using VS Code workspace filesystem APIs.
 */
const gatherFolderStructure = async function (query: string): Promise<string> {
  try {
    const targetFolder = extractFolderPath(query) || '';
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;

    if (!workspaceRoot) {
      return 'No workspace folder open';
    }

    const targetUri = targetFolder
      ? vscode.Uri.joinPath(workspaceRoot, targetFolder)
      : workspaceRoot;

    // Read directory contents
    const contents = await vscode.workspace.fs.readDirectory(targetUri);

    if (contents.length === 0) {
      return `Folder "${targetFolder || 'workspace root'}" is empty`;
    }

    // Sort: folders first, then files alphabetically
    contents.sort((a, b) => {
      if (a[1] !== b[1]) return a[1] === vscode.FileType.Directory ? -1 : 1;
      return a[0].localeCompare(b[0]);
    });

    const lines: string[] = [`### Structure of "${targetFolder || 'workspace root'}"`];
    for (const [name, type] of contents.slice(0, 100)) {
      // Limit to 100 entries
      const icon = type === vscode.FileType.Directory ? '📁' : '📄';
      lines.push(`${icon} ${name}${type === vscode.FileType.Directory ? '/' : ''}`);
    }

    if (contents.length > 100) {
      lines.push(`... (${contents.length - 100} more items)`);
    }

    return lines.join('\n');
  } catch (err) {
    return `Error reading folder structure: ${err instanceof Error ? err.message : String(err)}`;
  }
};

// ── Core Context Gatherer ─────────────────────────────────────────────────────

/**
 * Use VS Code workspace APIs to gather codebase context for Codernic mode.
 *
 * Intelligently detects query type:
 * - File listings: "what TypeScript files in packages?" → returns actual file list
 * - Folder structure: "show me the structure of src/" → returns directory tree
 * - Symbol search: "find the handleClick function" → returns matching symbols
 *
 * @param query - Current user query
 * @param conversationContext - Optional conversation summary for multi-turn awareness
 * @returns Markdown-formatted context (file list, folder structure, or symbols)
 */
export const gatherCodeContext = async function (
  query: string,
  conversationContext?: string,
): Promise<string> {
  console.log('[gatherCodeContext] ========== START ==========');
  console.log('[gatherCodeContext] Query: "' + query + '"');
  console.log(
    '[gatherCodeContext] ConversationContext: "' + (conversationContext || '(none)') + '"',
  );
  try {
    // Detect query type
    const queryType = detectQueryType(query);
    console.log('[gatherCodeContext] Query type detected: ' + queryType);

    // Route to appropriate handler
    switch (queryType) {
      case 'file-listing': {
        console.log('[gatherCodeContext] Routing to gatherFileList...');
        const fileResult = await gatherFileList(query);
        console.log('[gatherCodeContext] gatherFileList returned ' + fileResult.length + ' chars');
        console.log('[gatherCodeContext] ========== END (file-listing) ==========');
        return fileResult;
      }

      case 'folder-structure': {
        console.log('[gatherCodeContext] Routing to gatherFolderStructure...');
        const folderResult = await gatherFolderStructure(query);
        console.log('[gatherCodeContext] ========== END (folder-structure) ==========');
        return folderResult;
      }

      case 'symbol-search':
      default: {
        console.log('[gatherCodeContext] Routing to symbol search (fallback)...');
        // Original symbol search implementation
        const queryKeywords = query
          .trim()
          .split(/\s+/)
          .filter((w) => w.length > 3);
        const contextKeywords = conversationContext
          ? conversationContext.split(/\s+/).filter((w) => w.length > 3 && /^[A-Z]/.test(w))
          : [];

        const allKeywords = [...new Set([...queryKeywords, ...contextKeywords])].slice(0, 6);

        if (!allKeywords.length) return '';

        const allSymbols: vscode.SymbolInformation[] = [];
        for (const kw of allKeywords.slice(0, 4)) {
          const symbols =
            (await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
              'vscode.executeWorkspaceSymbolProvider',
              kw,
            )) ?? [];
          allSymbols.push(...symbols.slice(0, 8));
        }

        const seen = new Set<string>();
        const unique = allSymbols
          .filter((s) => {
            const key = `${s.location.uri.fsPath}:${s.name}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .slice(0, 25);

        if (!unique.length) return '';

        const lines = unique.map((s) => {
          const rel = vscode.workspace.asRelativePath(s.location.uri);
          const line = s.location.range.start.line + 1;
          const containerInfo = s.containerName ? ` (in ${s.containerName})` : '';
          return `${rel}:${line} - ${vscode.SymbolKind[s.kind]} ${s.name}${containerInfo}`;
        });
        const symbolResult = '### Relevant codebase symbols\n' + lines.join('\n');
        console.log('[gatherCodeContext] Symbol search returned ' + symbolResult.length + ' chars');
        console.log('[gatherCodeContext] ========== END (symbol-search) ==========');
        return symbolResult;
      }
    }
  } catch (err) {
    console.error('[gatherCodeContext] ========== ERROR ==========');
    console.error('[gatherCodeContext] Error:', err);
    return `Error gathering context: ${err instanceof Error ? err.message : String(err)}`;
  }
};

// ── Enhanced Context Gatherer ─────────────────────────────────────────────────

/** Enhanced context gathering with configurable options. Future expansion for file content, structure, etc. */
export const gatherEnhancedContext = async function (
  query: string,
  options?: ContextOptions,
): Promise<EnhancedContext> {
  const opts = {
    maxSymbols: options?.maxSymbols ?? 20,
    maxKeywords: options?.maxKeywords ?? 3,
    includeFileContent: options?.includeFileContent ?? false,
    maxFileSnippets: options?.maxFileSnippets ?? 5,
  };

  const symbols = await gatherCodeContext(query);
  const result: EnhancedContext = { symbols };

  // Future: Add file content snippets if enabled
  if (opts.includeFileContent) {
    // TODO: Implement file content extraction
    result.files = [];
  }

  // Future: Add workspace structure overview
  // result.structure = await gatherWorkspaceStructure()

  return result;
};
