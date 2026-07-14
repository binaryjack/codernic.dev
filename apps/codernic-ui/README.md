# Codernic UI

**Modern React + TypeScript UI library for the Codernic AI development platform** — Built with Vite, featuring real-time updates, optimized performance, and accessible components.

**Status**: Active Development | **License**: AGPLv3

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Development](#development)
- [Building & Deployment](#building--deployment)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Codernic UI is a modern React application providing the user interface for the Codernic AI development assistant. It handles real-time chat, workflow visualization, code analysis, and multi-agent orchestration.

### Key Responsibilities

- **Chat Interface** — Multi-modal conversation with AI agents
- **Workflow Visualization** — DAG execution monitoring and control
- **Code Analysis Dashboard** — Symbol exploration and impact analysis
- **Settings & Configuration** — User preferences and model selection
- **Responsive Design** — Works seamlessly across devices

---

## Features

| Feature                      | Description                                            |
| ---------------------------- | ------------------------------------------------------ |
| **Vite + React 19**       | Lightning-fast builds and HMR (Hot Module Replacement) |
| **TypeScript Strict**     | 100% type-safe with zero `any` types                   |
| **Tailwind CSS**          | Utility-first styling with PostCSS                     |
| **Playwright E2E**        | Comprehensive end-to-end test coverage                 |
| **WebSocket Integration** | Real-time updates from backend services                |
| **Accessibility**         | WCAG 2.1 compliant components and interactions         |
| **Component Library**     | Reusable, tested UI components                         |
| **Code Splitting**        | Optimized bundle with dynamic imports                  |

---

## Tech Stack

| Layer               | Technology   | Version |
| ------------------- | ------------ | ------- |
| **Runtime**         | React        | 19.x    |
| **Language**        | TypeScript   | 5.x     |
| **Build Tool**      | Vite         | 5.x     |
| **Styling**         | Tailwind CSS | 3.x     |
| **CSS Processor**   | PostCSS      | 8.x     |
| **Linting**         | ESLint       | Latest  |
| **Testing**         | Playwright   | Latest  |
| **Package Manager** | pnpm         | ≥ 10    |

---

## Getting Started

### Prerequisites

- **Node.js**: `≥ 20.x`
- **pnpm**: `≥ 10.x`
- **Git**: For version control

### Installation

```bash
# Clone the repository
git clone https://github.com/binaryjack/ai-agencee.git
cd ai-agencee/apps/codernic-ui

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will be available at `http://localhost:5173` with HMR enabled.

### Connecting to Backend

By default, the UI connects to:

- **Backend WebSocket**: `ws://localhost:8080`
- **API Endpoint**: `http://localhost:8080/api`

Configure these in `.env.local`:

```bash
VITE_WS_URL=ws://localhost:8080
VITE_API_URL=http://localhost:8080/api
VITE_MODEL=copilot-gpt-4o
```

---

## Development

### Project Structure

```
codernic-ui/
├── src/
│   ├── app/
│   │   ├── App.tsx           # Root component
│   │   └── main.tsx          # Entry point
│   ├── features/
│   │   ├── chat-input/       # Chat input component
│   │   ├── context-files/    # File context selection
│   │   ├── mode-selector/    # ASK/PLAN/AGENT mode picker
│   │   ├── model-selector/   # LLM model selection
│   │   └── settings/         # User settings panel
│   ├── widgets/
│   │   ├── agent-run/        # Agent execution display
│   │   ├── dag-pipeline/     # DAG visualization
│   │   ├── message-feed/     # Chat message history
│   │   └── header-bar/       # Top navigation
│   ├── shared/
│   │   ├── api/              # API client utilities
│   │   ├── ui/               # Reusable UI components
│   │   └── types/            # Shared TypeScript types
│   ├── store/                # State management
│   └── styles/               # Global CSS
├── e2e/                       # Playwright tests
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind customization
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies
```

### Common Development Tasks

#### Run Development Server with HMR

```bash
pnpm dev
```

#### Build for Production

```bash
pnpm build
```

#### Preview Production Build Locally

```bash
pnpm preview
```

#### Lint Code

```bash
pnpm lint
```

#### Fix Linting Issues

```bash
pnpm lint:fix
```

---

## Testing

### Run All E2E Tests

```bash
pnpm test:e2e
```

### Run Tests in Watch Mode

```bash
pnpm test:e2e:watch
```

### Run Specific Test File

```bash
pnpm test:e2e -- erathos-integration.spec.ts
```

### Generate Test Report

```bash
pnpm test:e2e:report
```

#### Testing Guidelines

- Use Playwright for end-to-end testing
- Test user interactions, not implementation details
- Mock WebSocket and API responses
- Keep tests deterministic and isolated
- Aim for >80% coverage of user workflows

---

## Building & Deployment

### Build for Production

```bash
pnpm build
```

This creates an optimized production build in `dist/`:

- Minified JavaScript bundles
- CSS extraction and optimization
- Tree-shaking of unused code
- Source maps for debugging

### Deploy to Static Host

```bash
# Build
pnpm build

# Deploy dist/ folder to your host
# Examples:
# - Vercel: git push to main branch
# - Netlify: connect GitHub repo
# - GitHub Pages: deploy dist/ to gh-pages branch
```

### Environment-Specific Builds

```bash
# Development
VITE_ENV=development pnpm build

# Staging
VITE_ENV=staging pnpm build

# Production
VITE_ENV=production pnpm build
```

---

## Code Standards

### Naming Conventions

| Element    | Convention  | Example                              |
| ---------- | ----------- | ------------------------------------ |
| Files      | kebab-case  | `chat-input.tsx`, `message-feed.tsx` |
| Components | PascalCase  | `ChatInput`, `MessageFeed`           |
| Functions  | camelCase   | `handleSendMessage`, `parseResponse` |
| Constants  | UPPER_SNAKE | `MAX_MESSAGE_LENGTH`, `API_TIMEOUT`  |
| Types      | PascalCase  | `ChatMessage`, `AgentConfig`         |

### Component Guidelines

```typescript
// Declare as function expression
export const MyComponent = function({ prop }: Props) {
  return <div>{prop}</div>
}

// Type definitions in separate file
// my-component.types.ts
export interface Props {
  prop: string
}
```

### TypeScript Best Practices

- Use `strict: true` in tsconfig
- No `any` types — use `unknown` and narrow
- All functions and components must be typed
- Use discriminated unions for complex state
- Prefer `const` over `let`

---

## Community & Contributing

Codernic UI is part of the larger Codernic ecosystem. For information on contributing, code of conduct, licensing, and support, please refer to the main repository documents:

- [Main Repository](https://github.com/binaryjack/ai-agencee)
- [Contributing Guidelines](../../CONTRIBUTING.md)
- [License Information](./LICENSE)
