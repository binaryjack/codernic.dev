declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare interface Window {
  testMcpConnection: () => Promise<void>;
  refreshCanvas: () => void;
  __structuraCleanup?: () => void;
}
