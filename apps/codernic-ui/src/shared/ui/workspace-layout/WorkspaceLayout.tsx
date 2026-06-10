import type { ReactNode } from 'react';
import { useResizable } from '../../hooks';

export interface IWorkspaceLayoutProps {
  leftPanel?: ReactNode;
  centerPanel: ReactNode;
  rightPanel?: ReactNode;
  isLeftOpen: boolean;
  isRightOpen: boolean;
  headerBar?: ReactNode;
  footerBar?: ReactNode;
  onToggleLeft?: () => void;
  onToggleRight?: () => void;
}

export function WorkspaceLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  isLeftOpen,
  isRightOpen,
  headerBar,
  footerBar,
  onToggleLeft,
  onToggleRight,
}: IWorkspaceLayoutProps) {
  const {
    width: leftWidth,
    isDragging: isLeftDragging,
    onMouseDown: onLeftMouseDown,
  } = useResizable({
    initialWidth: 260,
    minWidth: 200,
    maxWidth: 600,
    direction: 'left',
  });

  const {
    width: rightWidth,
    isDragging: isRightDragging,
    onMouseDown: onRightMouseDown,
  } = useResizable({
    initialWidth: 300,
    minWidth: 200,
    maxWidth: 800,
    direction: 'right',
  });

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[var(--vscode-editor-background)] text-[var(--vscode-editor-foreground)]">
      {/* Header */}
      {headerBar && <div className="flex-shrink-0 z-20 border-b border-[#27272a] shadow-sm bg-[var(--vscode-editor-background)]">{headerBar}</div>}

      {/* Main Body */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Left Panel */}
        {isLeftOpen && leftPanel && (
          <div
            className="flex-shrink-0 flex flex-col border-r border-[#27272a] bg-[#09090b] relative z-10"
            style={{ width: leftWidth }}
          >
            {leftPanel}
            <div
              className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[var(--vscode-focusBorder)] transition-colors z-20 ${
                isLeftDragging ? 'bg-[var(--vscode-focusBorder)]' : 'bg-transparent'
              }`}
              onMouseDown={onLeftMouseDown}
            />
          </div>
        )}

        {/* Center Panel */}
        <div className="flex-1 min-w-0 flex flex-col bg-[var(--vscode-editor-background)] z-0 relative group/center">
          {/* Cover center when dragging to prevent iframe/selection issues */}
          {(isLeftDragging || isRightDragging) && (
            <div className="absolute inset-0 z-50 cursor-col-resize" />
          )}

          {/* Left Toggle Chevron */}
          {onToggleLeft && (
            <button
              onClick={onToggleLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-4 h-16 bg-[#09090b] border border-[#27272a] border-l-0 rounded-r-md shadow-md text-[var(--vscode-foreground)] opacity-20 hover:opacity-100 group-hover/center:opacity-50 transition-opacity"
              title={isLeftOpen ? "Collapse Left Panel" : "Expand Left Panel"}
            >
              {isLeftOpen ? '‹' : '›'}
            </button>
          )}

          {/* Right Toggle Chevron */}
          {onToggleRight && (
            <button
              onClick={onToggleRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-4 h-16 bg-[#09090b] border border-[#27272a] border-r-0 rounded-l-md shadow-md text-[var(--vscode-foreground)] opacity-20 hover:opacity-100 group-hover/center:opacity-50 transition-opacity"
              title={isRightOpen ? "Collapse Right Panel" : "Expand Right Panel"}
            >
              {isRightOpen ? '›' : '‹'}
            </button>
          )}

          {centerPanel}
        </div>

        {/* Right Panel */}
        {isRightOpen && rightPanel && (
          <div
            className="flex-shrink-0 flex flex-col border-l border-[#27272a] bg-[#09090b] relative z-10"
            style={{ width: rightWidth }}
          >
            <div
              className={`absolute top-0 left-0 w-1 h-full -ml-0.5 cursor-col-resize hover:bg-[var(--vscode-focusBorder)] transition-colors z-20 ${
                isRightDragging ? 'bg-[var(--vscode-focusBorder)]' : 'bg-transparent'
              }`}
              onMouseDown={onRightMouseDown}
            />
            {rightPanel}
          </div>
        )}
      </div>

      {/* Footer */}
      {footerBar && <div className="flex-shrink-0 z-20">{footerBar}</div>}
    </div>
  );
}
