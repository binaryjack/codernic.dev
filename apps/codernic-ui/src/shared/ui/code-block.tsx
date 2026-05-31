import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="code-block-container"
      style={{
        position: 'relative',
        margin: '10px 0',
        borderRadius: '6px',
        border: '1px solid var(--border, #27272a)',
        overflow: 'hidden',
      }}
    >
      <div
        className="code-block-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '6px 12px',
          background: '#18181b',
          borderBottom: '1px solid var(--border, #27272a)',
          fontSize: '10px',
          fontFamily: 'var(--mono)',
          textTransform: 'uppercase',
          color: '#a1a1aa',
        }}
      >
        <span>{language}</span>
        <button
          onClick={handleCopy}
          style={{
            background: 'none',
            border: 'none',
            color: copied ? '#10b981' : '#60a5fa',
            cursor: 'pointer',
            fontSize: '10px',
            fontFamily: 'inherit',
            fontWeight: 600,
            transition: 'color 0.2s ease',
          }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre
        className={`language-${language}`}
        style={{
          margin: 0,
          padding: '12px',
          background: '#09090b',
          overflow: 'auto',
          fontSize: '12px',
          fontFamily: 'var(--mono)',
          lineHeight: '1.4',
        }}
      >
        <code style={{ color: '#e4e4e7', background: 'none', padding: 0, fontSize: 'inherit' }}>{code}</code>
      </pre>
    </div>
  );
}
