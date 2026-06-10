# Context Window Widget - Visual Reference & Architecture

## UI Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ CODERNIC │ Ask ▼ │ Journey Phase │ LLM Model ▼ │ Context Widget │ ⊙G │
└──────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
                        ┌──────────────────────────────┐
                        │  ⊚   65% / 8000 tokens       │
                        │  Context                     │
                        └──────────────────────────────┘
                                    │
                    (Hover to reveal popup)
                                    │
                        ┌───────────▼──────────────┐
                        │ ⚠️ WARNING               │
                        │ Token Usage              │
                        ├────────────────────────┤
                        │ Current    5200 tokens  │
                        │ Maximum    8000 tokens  │
                        │ Usage %       65%       │
                        │ Turns         12        │
                        ├────────────────────────┤
                        │ Optimization:           │
                        │ Kept 10 turns,          │
                        │ Removed 2 (ratio: 1.2x) │
                        ├────────────────────────┤
                        │ ⚠️ Context: 5200/8000   │
                        │ (65%) — moderate usage  │
                        ├────────────────────────┤
                        │ 💡 Recommendations:    │
                        │ • Monitor token usage   │
                        │ • Long conversation     │
                        └────────────────────────┘
```

## Component Hierarchy

```
ContextWindowWidget (Organism)
├── CircularProgress (Atom)
│   ├── SVG circle (background)
│   ├── SVG circle (progress)
│   └── Percentage text
└── Info Section
    ├── Label: "Context"
    ├── Value: "5200 / 8000"
    ├── Status Indicator (🟡/🔴)
    └── ContextWindowPopup (Molecule - conditional)
        ├── Header
        │   ├── Severity Icon
        │   └── "Token Usage" label
        ├── Metrics Grid
        │   ├── Current / Maximum
        │   ├── Usage % / Turns
        │   └── ...
        ├── Optimization Stats (conditional)
        ├── Status Message Box
        └── Recommendations List
```

## Color States

### Healthy State (0-50%)
```
Circular Progress: Green (#4EC9B0 / testing-iconPassed)
Background: Transparent
Border: None
Indicator: None
Animation: None
```

### Moderate State (50-85%)
```
Circular Progress: Grey (foreground)
Background: Transparent
Border: None
Indicator: None
Animation: None
```

### Warning State (85-95%)
```
Circular Progress: Yellow (#DCDCAA / list-warningForeground)
Background: rgba(206, 167, 53, 0.08)
Border: 1px solid rgba(206, 167, 53, 0.3)
Indicator: 🟡 (yellow circle)
Animation: None
```

### Critical State (95%+)
```
Circular Progress: Red (#F48771 / errorForeground)
Background: rgba(244, 89, 80, 0.08)
Border: 1px solid rgba(244, 89, 80, 0.3)
Indicator: 🔴 (red circle)
Animation: Pulse (opacity 1 → 0.7, 1s cycle)
```

## Interaction Flow

```
User hovers over widget
        ↓
onMouseEnter triggered
        ↓
setIsPopupVisible(true)
        ↓
Check context thresholds:
├─ If 95%+: onContextWarning('critical')
├─ If 85%+: onContextWarning('warning')
└─ Otherwise: no callback
        ↓
ContextWindowPopup renders with calculated position
        ↓
User hovers away
        ↓
onMouseLeave triggered
        ↓
setIsPopupVisible(false)
        ↓
ContextWindowPopup unmounts
```

## Message Flow (Extension Integration)

```
┌─────────────────────────────────────┐
│ Codernic Orchestrator               │
│ (running in Node/Python process)    │
└────────────────┬────────────────────┘
                 │ calculates token metrics
                 ▼
        ┌────────────────────────┐
        │ Context Window Manager  │
        │ - Token counting       │
        │ - Budget calculation   │
        │ - Metrics aggregation  │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Context Window Reporter     │
        │ createContextWindowReporter │
        │ report(contextUI)           │
        └────────────┬────────────────┘
                     │
                     ▼
        ┌─────────────────────────────────┐
        │ Extension Message Bus           │
        │ postMessage({                   │
        │   type: '...:context-window...' │
        │   payload: ContextWindowUI      │
        │ })                              │
        └────────────┬────────────────────┘
                     │
                     ▼(WebView Bridge)
        ┌─────────────────────────────────┐
        │ React Component (Web)            │
        │ window.addEventListener('message')
        │ setContextWindowUI(payload)      │
        └────────────┬────────────────────┘
                     │
                     ▼
        ┌─────────────────────────────────┐
        │ ContextWindowWidget             │
        │ receives: contextUI prop        │
        │ renders: CircularProgress       │
        │          + ContextWindowPopup   │
        └─────────────────────────────────┘
```

## Props Interface

### ContextWindowWidget
```typescript
interface ContextWindowWidgetProps {
  contextUI: ContextWindowUI | null;           // Live metrics or null
  size?: number;                                // Diameter in pixels (default: 60)
  showLabel?: boolean;                          // Show "Context" label (default: true)
  popupPosition?: 'top' | 'bottom';             // Popup direction (default: 'top')
  onContextWarning?: (severity) => void;        // Callback for warnings
}
```

### CircularProgress
```typescript
interface CircularProgressProps {
  percentage: number;                           // 0-100
  size?: number;                                // Diameter (default: 60)
  strokeWidth?: number;                         // SVG stroke (default: 3)
  showPercentage?: boolean;                     // Show % text (default: true)
  critical?: boolean;                           // Use critical color
  warning?: boolean;                            // Use warning color
}
```

### ContextWindowPopup
```typescript
interface ContextWindowPopupProps {
  contextUI: ContextWindowUI;                   // Data to display
  isVisible: boolean;                           // Show/hide
  position?: 'top' | 'bottom';                  // Above or below (default: 'top')
}
```

## Integration Steps

1. **Component Import**
   ```tsx
   import { ContextWindowWidget } from '../context-x-ray/ui/context-window-widget'
   import type { ContextWindowUI } from '../../../../../../../packages/agent-executor/...'
   ```

2. **State Setup**
   ```tsx
   const [contextUI, setContextUI] = useState<ContextWindowUI | null>(null)
   ```

3. **Message Handler**
   ```tsx
   useEffect(() => {
     const handler = (event: MessageEvent) => {
       if (event.data.type === 'codernic:context-window-update') {
         setContextUI(event.data.payload)
       }
     }
     window.addEventListener('message', handler)
     return () => window.removeEventListener('message', handler)
   }, [])
   ```

4. **Render Widget**
   ```tsx
   <ContextWindowWidget
     contextUI={contextUI}
     size={50}
     showLabel={true}
     popupPosition="bottom"
     onContextWarning={handleWarning}
   />
   ```

## Responsive Behavior

- **Small Screens**: Widget size reduces proportionally, popup stays visible
- **Popup Overflow**: Automatically adjusts position if near viewport edge
- **Mobile**: Touch-friendly, popup shows on first tap
- **Accessibility**: ARIA labels, keyboard navigation support

## Animation Details

### Circular Progress
- **Property**: `stroke-dashoffset`
- **Duration**: 300ms ease
- **Trigger**: Percentage change

### Critical State Pulse
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
animation: pulse 1s infinite;
```

## Tooltip Positioning

**Top Position** (default):
```
Widget Position
      ↑
   Tooltip (8px gap)
```

**Bottom Position**:
```
Widget Position
      ↓
   Tooltip (8px gap)
```

Popup stays centered horizontally on widget, clamped to viewport bounds.
