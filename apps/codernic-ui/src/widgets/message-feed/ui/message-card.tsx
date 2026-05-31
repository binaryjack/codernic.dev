import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AssistantMsg, ChatMsg } from '../../../entities/kernel';
import { CodeBlock, vscode } from '../../../shared';
import { DiagnosticCard } from './diagnostic-card';
import { ToolBlock } from './tool-block';

interface MessageCardProps {
  msg: ChatMsg;
}

export function MessageCard({ msg }: MessageCardProps) {
  const msgAssistant = msg as AssistantMsg;
  const toolsCalls = msgAssistant?.toolCalls || [];

  const getRoleHeader = () => {
    switch (msg.role) {
      case 'system':
        return '⚡ SYSTEM';
      case 'user':
        return 'YOU';
      default:
        return 'CODERNIC';
    }
  };

  const getRoleColor = () => {
    switch (msg.role) {
      case 'system':
        return '#818cf8';
      case 'user':
        return '#3b82f6';
      default:
        return '#10b981';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '10px 12px',
        borderRadius: '6px',
        background: msg.role === 'user' ? '#18181b' : 'transparent',
        border: msg.role === 'user' ? '1px solid var(--border, #27272a)' : 'none',
        marginBottom: '12px',
        position: 'relative',
      }}
    >
      <div
        style={{
          fontSize: '9px',
          fontWeight: 700,
          color: getRoleColor(),
          letterSpacing: '0.08em',
          fontFamily: 'var(--mono)',
        }}
      >
        {getRoleHeader()}
      </div>

      <div className="markdown-content" style={{ fontSize: '12px', color: '#e4e4e7', overflowWrap: 'break-word' }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code(props: { children?: React.ReactNode; className?: string }) {
              const { children, className } = props;
              const match = /language-(\w+)/.exec(className || '');
              return match ? (
                <CodeBlock code={String(children).replace(/\n$/, '')} language={match[1]} />
              ) : (
                <code style={{ fontFamily: 'var(--mono)', fontSize: '11px', background: '#18181b', padding: '2px 4px', borderRadius: '4px' }}>
                  {children}
                </code>
              );
            },
            a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
              if (href && href.startsWith('file://')) {
                const cleanPath = href.replace('file://', '');
                return (
                  <a
                    {...props}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      vscode.postMessage({ type: 'codernic:open-file', payload: { filePath: cleanPath } });
                    }}
                    style={{
                      color: '#60a5fa',
                      textDecoration: 'underline',
                      fontFamily: 'var(--mono)',
                      fontSize: '11px',
                    }}
                  >
                    {children}
                  </a>
                );
              }
              return <a href={href} {...props} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }} />;
            },
          }}
        >
          {msg.text + (msgAssistant?.streaming ? ' ▊' : '')}
        </ReactMarkdown>
      </div>

      {toolsCalls.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
          {toolsCalls.map((tool) => (
            <ToolBlock key={tool.id} tool={tool} />
          ))}
        </div>
      )}

      {msg.diagnostic && <DiagnosticCard diagnostic={msg.diagnostic} />}
    </div>
  );
}
