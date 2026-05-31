import React from 'react';
import { createRoot } from 'react-dom/client';
import { AgentEditor } from '../features/agent-editor/ui/agent-editor';
import { TechEditor } from '../features/agent-editor/ui/tech-editor';
import { type DagResult } from '../features/quality-gates/quality-gates-app';
import { WelcomeApp } from '../features/welcome/welcome-app';

import { type DependencyGraphData } from '../../../codernic-ui/src/ui/components/dependency-graph-app';

declare const window: Window &
  typeof globalThis & {
    __PANEL__?: string;
    __DAG_RESULT__?: DagResult;
    __DEPENDENCY_GRAPH_DATA__?: DependencyGraphData;
  };

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '16px', color: 'var(--vscode-errorForeground, #f48771)' }}>
          <strong>Something went wrong</strong>
          <pre style={{ fontSize: 11, whiteSpace: 'pre-wrap', marginTop: 8, opacity: 0.8 }}>
            {this.state.error.message}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ marginTop: 8, padding: '4px 10px', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');
if (root) {
  if (window.__PANEL__ === 'tie') {
    createRoot(root).render(
      <AppErrorBoundary>
        <TechEditor />
      </AppErrorBoundary>,
    );
  } else if (window.__PANEL__ === 'aie') {
    createRoot(root).render(
      <AppErrorBoundary>
        <AgentEditor />
      </AppErrorBoundary>,
    );
  } else if (window.__PANEL__ === 'welcome') {
    createRoot(root).render(
      <AppErrorBoundary>
        <WelcomeApp />
      </AppErrorBoundary>,
    );
  }
}
