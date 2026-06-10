import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useDispatch } from 'react-redux';
import type { AssistantMsg, ChatMsg, PlanCtaMsg } from '../../../entities/kernel';
import { sendIntent } from '../../../entities/kernel';
import { Button, CodeBlock, vscode } from '../../../shared';
import { DiagnosticCard } from './diagnostic-card';
import { ToolBlock } from './tool-block';
import { ThoughtBlock } from './thought-block';
import { ErathosCanvas } from '../../dag-pipeline/ui/ErathosCanvas';

function parseTextWithThoughts(text: string) {
  const blocks: { type: 'text' | 'thought'; content: string; isClosed?: boolean }[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const thinkStart = remaining.indexOf('<think>');
    const thoughtStart = remaining.indexOf('<thought>');

    let startIdx = -1;
    let tagLen = 0;
    let endTag = '';

    if (thinkStart !== -1 && (thoughtStart === -1 || thinkStart < thoughtStart)) {
      startIdx = thinkStart;
      tagLen = 7;
      endTag = '</think>';
    } else if (thoughtStart !== -1) {
      startIdx = thoughtStart;
      tagLen = 9;
      endTag = '</thought>';
    }

    if (startIdx === -1) {
      blocks.push({ type: 'text', content: remaining });
      break;
    }

    if (startIdx > 0) {
      blocks.push({ type: 'text', content: remaining.slice(0, startIdx) });
    }

    const contentStart = startIdx + tagLen;
    const endIdx = remaining.indexOf(endTag, contentStart);

    if (endIdx === -1) {
      blocks.push({ type: 'thought', content: remaining.slice(contentStart), isClosed: false });
      break;
    } else {
      blocks.push({ type: 'thought', content: remaining.slice(contentStart, endIdx), isClosed: true });
      remaining = remaining.slice(endIdx + endTag.length);
    }
  }
  return blocks;
}

interface MessageCardProps {
  msg: ChatMsg;
}

export function MessageCard({ msg }: MessageCardProps) {
  const dispatch = useDispatch();

  // ── Plan CTA card — rendered inline in chat feed after the streamed plan ──
  if (msg.role === 'plan-cta') {
    const cta = msg as PlanCtaMsg;
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '12px 14px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.07) 0%, rgba(99,102,241,0.07) 100%)',
          border: '1px solid rgba(16,185,129,0.25)',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#10b981',
              fontFamily: 'var(--mono)',
              letterSpacing: '0.06em',
            }}
          >
            ✅ PLAN READY
          </span>
          <span style={{ fontSize: '10px', color: '#71717a', fontFamily: 'var(--mono)' }}>
            {cta.duration} · {cta.cost}
          </span>
        </div>

        <div style={{ fontSize: '11px', color: '#a1a1aa', fontStyle: 'italic', lineHeight: 1.5 }}>
          {cta.task.slice(0, 140)}{cta.task.length > 140 ? '…' : ''}
        </div>

        <Button
          variant="primary"
          size="sm"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => {
            dispatch(
              sendIntent({
                type: 'codernic:run-dag-direct',
                payload: { plan: cta.text, task: cta.task },
              }),
            );
          }}
        >
          ⚡ Start Implementation
        </Button>
      </div>
    );
  }

  // ── Standard message card ─────────────────────────────────────────────────
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
        background: 'transparent',
        border: 'none',
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

      <div
        className="markdown-content flex flex-col gap-2"
        style={{ fontSize: '12px', color: '#e4e4e7', overflowWrap: 'break-word' }}
      >
        {parseTextWithThoughts(msg.text).map((block, idx, arr) => {
          if (block.type === 'thought') {
            const isStreaming = !block.isClosed && msgAssistant?.streaming && idx === arr.length - 1;
            return <ThoughtBlock key={idx} content={block.content} streaming={isStreaming} />;
          }

          const textToRender = block.content + (msgAssistant?.streaming && idx === arr.length - 1 ? ' ▊' : '');
          if (!textToRender.trim() && !msgAssistant?.streaming) return null;

          return (
            <ReactMarkdown
              key={idx}
              remarkPlugins={[remarkGfm]}
              components={{
                code(props: { children?: React.ReactNode; className?: string }) {
                  const { children, className } = props;
                  const match = /language-(\w+)/.exec(className || '');
                  if (match && match[1] === 'erathos-snapshot') {
                    return (
                      <div className="my-2 border border-[var(--vscode-widget-border)] rounded-md overflow-hidden">
                        <ErathosCanvas id={`erathos-snapshot-${msg.id}`} readOnly={true} />
                      </div>
                    );
                  }
                  return match ? (
                    <CodeBlock code={String(children).replace(/\n$/, '')} language={match[1]} />
                  ) : (
                    <code
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: '11px',
                        background: '#18181b',
                        padding: '2px 4px',
                        borderRadius: '4px',
                      }}
                    >
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
                          vscode.postMessage({
                            type: 'codernic:open-file',
                            payload: { filePath: cleanPath },
                          });
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
                  return (
                    <a
                      href={href}
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#60a5fa', textDecoration: 'underline' }}
                    />
                  );
                },
              }}
            >
              {textToRender}
            </ReactMarkdown>
          );
        })}
      </div>

      {toolsCalls.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
          {toolsCalls.map((tool) => (
            <ToolBlock key={tool.id} tool={tool} />
          ))}
        </div>
      )}

      {msg.diagnostic && <DiagnosticCard diagnostic={msg.diagnostic} />}

      {msgAssistant?.metrics && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '8px',
            paddingTop: '6px',
            borderTop: '1px dashed var(--border, #27272a)',
            fontSize: '10px',
            color: '#71717a',
            fontFamily: 'var(--mono)',
            opacity: 0.8,
          }}
        >
          <span title="Tokens Per Second">⚡ {msgAssistant.metrics.tokens_per_second.toFixed(1)} tok/s</span>
          <span title="Time To First Token">⏱ TTFT: {msgAssistant.metrics.ttft_ms}ms</span>
          <span title="Context Window Size">📚 Context: {msgAssistant.metrics.context_tokens_count.toLocaleString()} tk</span>
        </div>
      )}
    </div>
  );
}
