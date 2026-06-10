// vscode mock for jest
const vscode = {
  window: {
    createOutputChannel: () => ({ appendLine: () => {}, dispose: () => {} }),
    showErrorMessage: () => Promise.resolve(undefined),
    showInformationMessage: () => Promise.resolve(undefined),
  },
  workspace: {
    workspaceFolders: undefined,
    fs: {
      readFile: jest.fn().mockRejectedValue({ code: 'FileNotFound' }),
      writeFile: jest.fn().mockResolvedValue(undefined),
      createDirectory: jest.fn().mockResolvedValue(undefined),
      readDirectory: jest.fn().mockResolvedValue([]),
    },
    findFiles: jest.fn().mockResolvedValue([]),
    asRelativePath: jest.fn((uri: { fsPath?: string } | string) =>
      typeof uri === 'string' ? uri : (uri.fsPath ?? ''),
    ),
    applyEdit: jest.fn().mockResolvedValue(true),
    openTextDocument: jest.fn().mockRejectedValue(new Error('not available')),
    getConfiguration: jest.fn().mockReturnValue({
      get: jest.fn((key: string) => {
        if (key === 'toolApprovals') return 'always';
        return undefined;
      }),
      update: jest.fn().mockResolvedValue(undefined),
    }),
  },
  commands: {
    registerCommand: () => ({ dispose: () => {} }),
    executeCommand: jest.fn().mockResolvedValue([]),
  },
  Uri: {
    file: (p: string) => ({ fsPath: p, toString: () => p }),
    joinPath: (...args: { fsPath: string }[]) => ({ fsPath: args.map((a) => a.fsPath).join('/') }),
  },
  FileType: {
    File: 1,
    Directory: 2,
    SymbolicLink: 64,
    Unknown: 0,
  },
  WorkspaceEdit: jest.fn().mockImplementation(() => ({
    createFile: jest.fn(),
    deleteFile: jest.fn(),
    insert: jest.fn(),
    replace: jest.fn(),
    delete: jest.fn(),
  })),
  LanguageModelChatMessage: {
    User: jest.fn((content: unknown) => ({ role: 'user', content })),
    Assistant: jest.fn((content: unknown) => ({ role: 'assistant', content })),
  },
  LanguageModelTextPart: jest.fn().mockImplementation((value: string) => ({ value })),
  LanguageModelToolCallPart: jest.fn(),
  LanguageModelToolResultPart: jest
    .fn()
    .mockImplementation((callId: string, parts: unknown[]) => ({ callId, parts })),
  CancellationTokenSource: jest.fn().mockImplementation(() => ({
    token: { isCancellationRequested: false },
    dispose: jest.fn(),
    cancel: jest.fn(),
  })),
  SymbolKind: { Function: 11, Class: 4, Variable: 12 },
  TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 },
  TreeItem: class TreeItem {
    label: string;
    collapsibleState: number;
    iconPath?: unknown;
    description?: string;
    tooltip?: string;
    command?: unknown;
    contextValue?: string;
    constructor(label: string, collapsibleState = 0) {
      this.label = label;
      this.collapsibleState = collapsibleState;
    }
  },
  ExtensionContext: {},
};

module.exports = vscode;
