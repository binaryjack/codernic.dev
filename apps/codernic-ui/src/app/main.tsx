import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { App } from './App.tsx';
import '../index.css';
import { store } from '../store';
import { ErrorBoundary } from './ErrorBoundary.tsx';

// Introspection Engine (For TDD & Scripting Validation)
import '../../../../packages/ui/src/introspection/core/IntrospectionRegistry';
import '../../../../packages/ui/src/introspection/tests/validateIntrospection';

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </Provider>,
);
