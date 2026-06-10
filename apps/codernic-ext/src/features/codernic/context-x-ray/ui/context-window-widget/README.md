# Context Window Widget

A real-time UI component for monitoring token consumption in the Codernic AI assistant. Features a circular progress indicator and detailed popup with token usage metrics and recommendations.

## Features

- **Circular Progress Indicator**: Visual representation of context window usage (0-100%)
- **Real-time Updates**: Receives live updates from the orchestrator
- **Severity Levels**: Color-coded status (healthy → warning → critical)
- **Detailed Popup**: Hover to see token breakdown, turn count, and recommendations
- **Warning Alerts**: Triggers system alerts when nearing capacity (85%+)
- **Compression Tracking**: Shows conversation optimization metrics

## Components

### CircularProgress (Atom)
Low-level circular progress component with customizable size and stroke width.

```tsx
import { CircularProgress } from './atoms/circular-progress'

<CircularProgress
  percentage={65}
  size={60}
  strokeWidth={3}
  showPercentage={true}
  critical={false}
  warning={false}
/>
```

### ContextWindowPopup (Molecule)
Detailed popup showing token consumption breakdown and recommendations.

```tsx
import { ContextWindowPopup } from './molecules/context-window-popup'

<ContextWindowPopup
  contextUI={contextUI}
  isVisible={true}
  position="top"
/>
```

### ContextWindowWidget (Organism)
Complete widget combining progress indicator and popup.

```tsx
import { ContextWindowWidget } from './organisms/context-window-widget'

<ContextWindowWidget
  contextUI={contextWindowUI}
  size={50}
  showLabel={true}
  popupPosition="bottom"
  onContextWarning={(severity) => {
    console.log('Context warning:', severity)
  }}
/>
```

## Integration

### In VS Code Extension

1. **Import in your component:**
```tsx
import { ContextWindowWidget } from '../context-x-ray/ui/context-window-widget'
import type { ContextWindowUI } from '../../../../../../packages/agent-executor/src/code-assistant/orchestrator/context'
```

2. **Add state and message handler:**
```tsx
const [contextWindowUI, setContextWindowUI] = useState<ContextWindowUI | null>(null)

useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    const msg = event.data
    if (msg.type === 'codernic:context-window-update') {
      setContextWindowUI(msg.payload)
    }
  }
  
  window.addEventListener('message', handleMessage)
  return () => window.removeEventListener('message', handleMessage)
}, [])
```

3. **Render the widget:**
```tsx
<ContextWindowWidget
  contextUI={contextWindowUI}
  size={50}
  showLabel={true}
  onContextWarning={(severity) => {
    if (severity === 'critical') {
      pushSystem('🔴 Critical: Context window is 95%+ full!')
    }
  }}
/>
```

### In Orchestrator

Use the telemetry module to send context window updates:

```tsx
import { createContextWindowReporter } from './telemetry/context-window-telemetry'

// In your execute function:
const reporter = createContextWindowReporter(vscode.postMessage)

// After each execution:
const contextUI = {
  currentTokens: totalPromptTokens,
  maxTokens: maxContextWindowTokens,
  usagePercent: contextWindowUsagePercent,
  turnCount: messages.length,
  // ... other fields
}

await reporter.report(contextUI)
```

## Data Structure

```typescript
interface ContextWindowUI {
  // Token metrics
  currentTokens: number        // Current token count
  maxTokens: number            // Max available tokens
  usagePercent: number         // Percentage used (0-100)
  
  // Conversation metrics
  turnCount: number            // Total turns in conversation
  optimizedTurnCount: number   // Turns after optimization
  removedTurnsCount: number    // Turns removed during pruning
  
  // Optimization metrics
  compressionRatio: number     // Compression achieved
  
  // UI state
  statusMessage: string        // User-friendly status text
  atCapacity: boolean          // True if usage > 85%
  recommendations: string[]    // Actionable recommendations
}
```

## Severity Levels

- **Healthy** (0-50%): Green indicator, informational status
- **Moderate** (50-85%): Grey indicator, moderate usage notice
- **Warning** (85-95%): Yellow indicator, system alert recommended
- **Critical** (95%+): Red indicator, pulsing animation, critical alert

## Color Scheme

Uses VSCode theme colors for seamless integration:

- **Healthy**: `var(--vscode-testing-iconPassed)` (green)
- **Warning**: `var(--vscode-list-warningForeground)` (yellow)
- **Critical**: `var(--vscode-errorForeground)` (red)
- **Text**: `var(--vscode-foreground)`
- **Background**: `var(--vscode-editor-background)`

## Usage Patterns

### Track context usage during long conversations
```tsx
const handleContextWarning = useCallback((severity) => {
  if (severity === 'critical') {
    // Prompt user to start new session
    // or summarize and clear history
  }
}, [])
```

### Customize popup position
```tsx
// Show popup above the widget
<ContextWindowWidget popupPosition="top" />

// Show popup below the widget
<ContextWindowWidget popupPosition="bottom" />
```

### Respond to capacity warnings
```tsx
const [hasWarned, setHasWarned] = useState(false)

<ContextWindowWidget
  onContextWarning={(severity) => {
    if (severity === 'critical' && !hasWarned) {
      pushSystem('Consider starting a new session')
      setHasWarned(true)
    }
  }}
/>
```

## Example: CodernicApp Integration

See [codernic-app.tsx](./codernic-app.tsx) for a full example of integrating the context window widget into a production component.

The widget is displayed in the header bar next to the LLM selector and provides real-time feedback about token consumption as users interact with the AI assistant.
