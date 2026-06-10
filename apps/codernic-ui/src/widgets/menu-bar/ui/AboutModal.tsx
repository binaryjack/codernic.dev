import { useSelector } from 'react-redux';
import { selectAppVersion } from '../../../entities/kernel';
import { Button } from '../../../shared';

export interface IAboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: IAboutModalProps) {
  const version = useSelector(selectAppVersion) || 'Unknown Version';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-[var(--vscode-editor-background)] border border-[var(--vscode-widget-border)] rounded-lg shadow-xl w-96 overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--vscode-widget-border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--vscode-foreground)]">About Codernic</h2>
          <button onClick={onClose} className="text-[var(--vscode-descriptionForeground)] hover:text-[var(--vscode-foreground)]">
            ✕
          </button>
        </div>
        <div className="px-6 py-6 text-sm text-[var(--vscode-descriptionForeground)] space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-2xl text-white font-bold tracking-tighter">AI</span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="font-bold text-[var(--vscode-foreground)] text-base">Codernic Mission Control</p>
            <p className="font-mono text-xs mt-1 text-cyan-400">Core Engine: v{version}</p>
          </div>

          <div className="pt-4 border-t border-[var(--vscode-widget-border)]">
            <p>The Sovereign AI Agency. Built for engineers, by engineers.</p>
          </div>
        </div>
        <div className="px-6 py-3 bg-[var(--vscode-sideBar-background)] flex justify-end">
          <Button onClick={onClose} variant="primary" size="sm">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
