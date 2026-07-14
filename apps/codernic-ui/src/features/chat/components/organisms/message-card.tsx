import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useDispatch } from 'react-redux';
import type { AssistantMsg, ChatMsg } from '../../../../entities/kernel/model/types';
import type { PlanCtaMsg } from '../../../../entities/kernel/model/types';
import { sendIntent } from '../../../../shared/store/intent';
import { Button, CodeBlock } from '@ai-agencee/ui';
import { vscode } from '../../../../shared';
import { DiagnosticCard } from '../molecules/diagnostic-card';
import { ToolBlock } from '../molecules/tool-block';
import { ThoughtBlock } from '../molecules/thought-block';
import { ErathosCanvas } from '../../../../widgets/dag-pipeline/ui/ErathosCanvas';

import { parseTextWithThoughts } from '../../../../shared/utils/markdown-parser';
import { PlanCtaCard } from './plan-cta-card';
import { PirsigReportWidget } from '../../../diagnostic-dashboard/widget/pirsig-report.widget';
import { useTestId, useHubEvent } from '@ai-agencee/ui';
import { useState } from 'react';

interface MessageCardProps {
  msg: ChatMsg;
  dataTestId?: string;
  'data-demo-desc'?: string;
}

const markdownComponents = {
  code(props: { children?: React.ReactNode; className?: string }) {
    const { children, className } = props;
    const match = /language-([\w-]+)/.exec(className || '');
    if (match && (match[1] === 'erathos-snapshot' || match[1] === 'json' || match[1] === 'structura')) {
      let parsedSchema = undefined;
      let isErathosSchema = false;
      try {
        const rawJson = String(children).replace(/\n$/, '');
        if (rawJson.trim()) {
          parsedSchema = JSON.parse(rawJson);
          if (parsedSchema && typeof parsedSchema === 'object' && (parsedSchema.nodes || parsedSchema.version)) {
            isErathosSchema = true;
          }
        }
      } catch (e) {
        // Fallback silently
      }

      if (isErathosSchema || match[1] === 'erathos-snapshot') {
        return (
          <div data-testid="chat-message-schema" data-demo-desc="[CODER] Interactive schema canvas showing class diagrams and structural components." className="my-2 border border-zinc-800 rounded-xl overflow-hidden h-[300px] bg-black shadow-inner">
            <ErathosCanvas data-testid={`message-erathos-canvas`} readOnly={true} hideHeader={true} appearance="black" allowMouseZoom={false} allowMultipleSchemas={false} disableLocalStorage={true} fitToScreen={true} initialState={parsedSchema} />
          </div>
        );
      }
    }
    if (match && match[1] === 'svg') {
      return (
        <div 
          className="my-2 bg-white rounded-md overflow-hidden flex items-center justify-center p-4"
          dangerouslySetInnerHTML={{ __html: String(children).replace(/\n$/, '') }} 
        />
      );
    }
    if (match && match[1] === 'pirsig-report') {
      return <PirsigReportWidget payloadStr={String(children).replace(/\n$/, '')} />;
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
};

export function MessageCard({ dataTestId, 'data-demo-desc': overrideDesc, msg }: MessageCardProps) {
  
  const { rootId, getTestId } = useTestId('message-card', dataTestId);
  const dispatch = useDispatch();
  const [isHighlighted, setIsHighlighted] = useState(false);

  useHubEvent('codernic:focus-message', (event) => {
    if (event.payload.id === msg.id) {
      const el = document.getElementById(msg.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setIsHighlighted(true);
        setTimeout(() => setIsHighlighted(false), 2000);
      }
    }
  });

  // ── Plan CTA card — rendered inline in chat feed after the streamed plan ──
  if (msg.role === 'plan-cta') {
    const cta = msg as PlanCtaMsg;
    return <PlanCtaCard data-testid={getTestId('plan-cta-card')} cta={cta} />;
  }

  // ── Standard message card ─────────────────────────────────────────────────
  const msgAssistant = msg as AssistantMsg;
  const toolsCalls = msgAssistant?.toolCalls || [];

  const getRoleHeader = () => {
    switch (msg.role) {
      case 'system':
        return 'SYSTEM';
      case 'user':
        return 'YOU';
      default:
        return 'CODERNIC';
    }
  };

  const getRoleColor = () => {
    switch (msg.role) {
      case 'system':
        return 'rgba(129, 140, 248, 0.7)'; // Muted indigo
      case 'user':
        return 'rgba(59, 130, 246, 0.7)'; // Muted blue
      default:
        return 'rgba(16, 185, 129, 0.7)'; // Muted emerald
    }
  };

  return (
    <div
      id={msg.id}
      data-testid={dataTestId || "message-card"}
      data-demo-desc={overrideDesc || (msg as any).demoDesc}
      className={`transition-all duration-300 ${isHighlighted ? 'bg-white/5 ring-1 ring-[var(--accent)] rounded-md' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '8px 0',
        background: 'transparent',
        border: 'none',
        marginBottom: '8px',
        position: 'relative',
      }}
    >
      <div
        title="Click to locate in Introspection Panel"
        onClick={() => {
          import('@ai-agencee/ui').then(({ WidgetHub }) => {
            WidgetHub.publish({
              type: 'codernic:focus-introspection-message',
              payload: { id: msg.id },
              dedupKey: `focus-intro-msg-${msg.id}`
            });
          });
        }}
        className="cursor-pointer hover:opacity-80 transition-opacity"
        style={{
          fontSize: '9px',
          fontWeight: 700,
          color: getRoleColor(),
          letterSpacing: '0.08em',
          fontFamily: 'var(--mono)',
          display: 'inline-block',
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
            return <ThoughtBlock data-testid={getTestId('thought-block')} key={idx} id={`${msg.id}-thought-${block.thoughtIndex}`} content={block.content} streaming={isStreaming} />;
          }

          const textToRender = block.content + (msgAssistant?.streaming && idx === arr.length - 1 ? ' ▊' : '');
          if (!textToRender.trim() && !msgAssistant?.streaming) return null;

          return (
            <ReactMarkdown data-testid={getTestId('react-markdown')}
              key={idx}
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {textToRender}
            </ReactMarkdown>
          );
        })}
      </div>

      {toolsCalls.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
          {toolsCalls.map((tool) => (
            <ToolBlock data-testid={`${typeof rootId !== 'undefined' ? rootId : 'tools-calls-item'}-tool-block`} key={tool.id} tool={tool} />
          ))}
        </div>
      )}

      {msg.diagnostic && <DiagnosticCard data-testid={getTestId('diagnostic-card')} diagnostic={msg.diagnostic} />}

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
          <span title="Tokens Per Second">[{msgAssistant.metrics.tokens_per_second.toFixed(1)} tok/s]</span>
          <span title="Time To First Token">[TTFT: {msgAssistant.metrics.ttft_ms}ms]</span>
          <span title="Context Window Size">[CTX: {msgAssistant.metrics.context_tokens_count.toLocaleString()}]</span>
        </div>
      )}
    </div>
  );
}
