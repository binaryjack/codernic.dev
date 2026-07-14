interface AutocompleteMenuProps {
  suggestions: string[];
  suggestionIdx: number;
  onApply: (idx: number) => void;
  onHover: (idx: number) => void;
}

export function AutocompleteMenu({
  suggestions,
  suggestionIdx,
  onApply,
  onHover,
}: AutocompleteMenuProps) {
  if (suggestions.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '8px',
        background: 'var(--vscode-editor-background, #1e1e1e)',
        border: '1px solid var(--vscode-widget-border, #454545)',
        borderRadius: '4px',
        padding: '4px 0',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        minWidth: '200px',
      }}
    >
      {suggestions.map((s, i) => (
        <div
          key={i}
          onClick={() => onApply(i)}
          style={{
            padding: '4px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            background:
              i === suggestionIdx
                ? 'var(--vscode-list-activeSelectionBackground, #094771)'
                : 'transparent',
            color:
              i === suggestionIdx
                ? 'var(--vscode-list-activeSelectionForeground, #ffffff)'
                : 'var(--vscode-editor-foreground, #cccccc)',
          }}
          onMouseEnter={() => onHover(i)}
        >
          {s}
        </div>
      ))}
    </div>
  );
}
