import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { createSpinner } from '@atomos-web/prime';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 flex flex-col items-center justify-center h-screen w-full bg-[#09090b] text-zinc-300">
          <h2 className="text-xl font-bold mb-4 text-red-400">Codernic UI Crashed</h2>
          <pre className="text-xs text-left bg-black p-4 rounded mb-8 overflow-auto max-w-full border border-red-900/50">
            {this.state.error?.stack || this.state.error?.message}
          </pre>
          <div className="flex flex-col items-center gap-4">
            <div ref={(el) => {
              if (el && el.childNodes.length === 0) {
                const { element } = createSpinner({ size: 'md' });
                el.appendChild(element);
              }
            }} />
            <span className="text-sm text-zinc-500">Attempting to recover...</span>
          </div>
          <button 
            className="mt-8 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm"
            onClick={() => window.location.reload()}
          >
            Reload UI
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
