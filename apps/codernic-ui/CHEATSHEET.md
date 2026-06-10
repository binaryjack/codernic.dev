# Codernic UI — Developer Cheatsheet

## 🚀 Quick Start

```bash
# Install and run
cd apps/codernic-ui
pnpm install
pnpm dev

# Build for production
pnpm build
pnpm preview
```

Open `http://localhost:5173` — HMR enabled by default.

---

## 📁 File Organization

| Path                | Purpose             | Examples                       |
| ------------------- | ------------------- | ------------------------------ |
| `src/app/`          | Entry points        | `App.tsx`, `main.tsx`          |
| `src/features/`     | Feature modules     | `chat-input/`, `settings/`     |
| `src/widgets/`      | Composed components | `message-feed/`, `header-bar/` |
| `src/shared/ui/`    | Reusable components | `Button`, `Input`, `Modal`     |
| `src/shared/api/`   | API client          | `useFetchMessages()`           |
| `src/shared/types/` | TypeScript types    | `Message`, `Agent`             |
| `src/store/`        | State management    | Redux, Zustand, etc.           |
| `e2e/`              | Tests               | `*.spec.ts` files              |

---

## 🧩 Creating a Component

### File Structure

```
src/features/my-feature/
├── my-feature.tsx          # Component implementation
├── my-feature.types.ts     # TypeScript interfaces
├── my-feature.module.css   # Optional styles
└── index.ts                # Public export
```

### Component Template

```typescript
// my-feature.tsx
import { Props } from './my-feature.types'

export const MyFeature = function({ title, onClose }: Props) {
  return (
    <div className="my-feature">
      <h2>{title}</h2>
      <button onClick={onClose}>Close</button>
    </div>
  )
}
```

### Types File

```typescript
// my-feature.types.ts
export interface Props {
  title: string;
  onClose: () => void;
  /** Optional description */
  description?: string;
}
```

### Export

```typescript
// index.ts
export { MyFeature } from './my-feature';
export type { Props } from './my-feature.types';
```

---

## 🎨 Styling Guide

### Tailwind CSS (Preferred)

```typescript
<div className="flex gap-4 p-6 bg-neutral-900 rounded-lg">
  <h1 className="text-xl font-bold text-white">Title</h1>
</div>
```

### CSS Modules (Fallback)

```typescript
// my-component.module.css
.container {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
}

// my-component.tsx
import styles from './my-component.module.css'

export const MyComponent = function() {
  return <div className={styles.container} />
}
```

### Avoiding Inline Styles

```typescript
// ❌ Avoid
<div style={{ color: 'red', fontSize: '16px' }} />

// ✅ Prefer
<div className="text-red-500 text-base" />
```

---

## 🔗 API Integration

### Fetching Data

```typescript
// Using fetch with error handling
async function fetchMessages(chatId: string) {
  const response = await fetch(`/api/chats/${chatId}/messages`);
  if (!response.ok) throw new Error('Failed to fetch messages');
  return response.json();
}

// Using async hook
export const useMessages = (chatId: string) => {
  const [messages, setMessages] = React.useState([]);
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchMessages(chatId)
      .then(setMessages)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [chatId]);

  return { messages, error, loading };
};
```

### WebSocket Integration

```typescript
export const useWebSocket = (url: string) => {
  const [connected, setConnected] = React.useState(false);
  const wsRef = React.useRef<WebSocket | null>(null);

  React.useEffect(() => {
    const ws = new WebSocket(url);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    wsRef.current = ws;
    return () => ws.close();
  }, [url]);

  const send = (data: unknown) => {
    wsRef.current?.send(JSON.stringify(data));
  };

  return { connected, send };
};
```

---

## 📘 TypeScript Best Practices

### Strict Types

```typescript
// ✅ Always type function parameters and returns
export const formatMessage = (msg: Message): string => {
  return `${msg.author}: ${msg.text}`;
};

// ❌ Avoid any
export const formatMessage = (msg: any): any => {
  return `${msg.author}: ${msg.text}`;
};
```

### Discriminated Unions

```typescript
// ✅ Use discriminated unions for state
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Message[] }
  | { status: 'error'; error: Error };

// ❌ Avoid optional properties
type State = {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: Message[];
  error?: Error;
};
```

### Proper Typing

```typescript
// ✅ Use unknown and narrow
try {
  // ... code
} catch (e: unknown) {
  const error = e instanceof Error ? e : new Error(String(e));
}

// ❌ Avoid any
try {
  // ... code
} catch (e: any) {
  console.error(e.message);
}
```

---

## 🧪 Testing with Playwright

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('ChatInput', () => {
  test('should send message when button clicked', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('input[placeholder="Type message..."]');
    await input.fill('Hello');

    const sendBtn = page.locator('button:has-text("Send")');
    await sendBtn.click();

    const message = page.locator('text=Hello');
    await expect(message).toBeVisible();
  });
});
```

### Common Selectors

```typescript
// Text content
page.locator('button:has-text("Click me")');

// Attributes
page.locator('input[type="email"]');

// Role
page.locator('role=button');

// CSS classes
page.locator('.my-button');

// Data attributes
page.locator('[data-testid="submit-btn"]');
```

### Running Tests

```bash
# Run all tests
pnpm test:e2e

# Run specific file
pnpm test:e2e -- chat-input.spec.ts

# Watch mode
pnpm test:e2e:watch

# Generate report
pnpm test:e2e:report
```

---

## 🔧 Development Commands

| Command           | Purpose                   |
| ----------------- | ------------------------- |
| `pnpm dev`        | Start dev server with HMR |
| `pnpm build`      | Production build          |
| `pnpm preview`    | Preview production build  |
| `pnpm lint`       | Run ESLint                |
| `pnpm lint:fix`   | Fix linting issues        |
| `pnpm test:e2e`   | Run Playwright tests      |
| `pnpm type-check` | TypeScript type checking  |

---

## 🐛 Common Issues & Solutions

### Vite HMR Not Working

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    middlewareMode: false,
  },
});
```

### Tailwind Classes Not Applying

1. Check `tailwind.config.js` includes your source files
2. Restart dev server: `pnpm dev`
3. Check CSS file is imported in root component

### TypeScript Errors

```bash
# Force TypeScript recompile
npx tsc --noEmit

# Clear TypeScript cache
rm -rf node_modules/.vite
```

### Import Issues

```typescript
// ✅ Use absolute paths from vite.config.ts
import { Button } from '@/shared/ui/Button';

// ✅ Or relative paths
import { Button } from '../../../shared/ui/Button';
```

---

## 📊 Performance Tips

### Code Splitting

```typescript
// ✅ Lazy load heavy components
const HeavyChart = React.lazy(() => import('./HeavyChart'))

export const Dashboard = function() {
  return (
    <React.Suspense fallback={<Spinner />}>
      <HeavyChart />
    </React.Suspense>
  )
}
```

### Memoization

```typescript
// ✅ Prevent unnecessary re-renders
export const ExpensiveComponent = React.memo(function({ data }: Props) {
  return <div>{data.length}</div>
})
```

### Image Optimization

```typescript
// ✅ Use Next.js Image or optimized format
<img src="/image.webp" alt="Description" />

// ✅ Include dimensions to prevent CLS
<img src="/image.png" alt="Description" width={100} height={100} />
```

---

## 🔐 Security Checklist

- ✅ Sanitize user input before displaying
- ✅ Validate API responses
- ✅ Use HTTPS for API calls
- ✅ Store tokens securely (not localStorage)
- ✅ Validate environment variables
- ✅ Never commit secrets to git

---

## 📚 Resources

- **Vite Docs**: [vitejs.dev](https://vitejs.dev)
- **React Docs**: [react.dev](https://react.dev)
- **Tailwind Docs**: [tailwindcss.com](https://tailwindcss.com)
- **TypeScript Handbook**: [typescriptlang.org](https://www.typescriptlang.org/docs)
- **Playwright Docs**: [playwright.dev](https://playwright.dev)

---

**Last Updated**: June 2026 | Version: 1.0
