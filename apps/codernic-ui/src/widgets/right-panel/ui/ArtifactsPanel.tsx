import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { Button } from '@ai-agencee/ui';
import { IconFileText, IconRefresh, IconArrowLeft, IconArrowRight } from '@ai-agencee/ui';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentSessionName } from '../../../features/sessions/store/sessions.slice';
import {
  fetchArtifactsRequest,
  fetchArtifactContentRequest,
  selectArtifactsList,
  selectArtifactsLoading,
  selectArtifactContentMap,
  selectArtifactContentLoading
} from '../../../entities/artifacts/model/artifacts-slice';
import { WidgetSearchInput } from '../../../features/search/components/widget-search-input';
import { useTestId } from '@ai-agencee/ui';

export function ArtifactsPanel({ dataTestId, sessionId, widgetId }: { sessionId?: string | null, widgetId?: string; dataTestId?: string; }) {
  
  const { rootId, getTestId } = useTestId('artifacts-panel', dataTestId);
const dispatch = useDispatch();
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const allArtifacts = useSelector(selectArtifactsList);
  const isListLoading = useSelector(selectArtifactsLoading);
  const contentMap = useSelector(selectArtifactContentMap);
  const content = selectedArtifact ? contentMap[selectedArtifact] : null;
  const isContentLoading = useSelector(selectArtifactContentLoading);
  const sessionName = useSelector(selectCurrentSessionName);
  
  const [headerNode, setHeaderNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (widgetId) {
      setHeaderNode(document.getElementById(`widget-header-actions-${widgetId}`));
    }
  }, [widgetId]);

  const fetchArtifacts = () => {
    dispatch(fetchArtifactsRequest());
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchArtifacts(); }, [sessionId]);

  const openArtifact = (filename: string) => {
    setSelectedArtifact(filename);
    // dispatch(fetchArtifactContentRequest(filename)); // Disabled for now (Not yet implemented)
  };

  /* ── Detail view ── */
  if (selectedArtifact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
        {/* Back bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <Button data-testid={getTestId('button')}
            variant="ghost"
            size="xs"
            onClick={() => setSelectedArtifact(null)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <IconArrowLeft data-testid={getTestId('icon-arrow-left')} size={11} />
            Back
          </Button>
          <div style={{ height: '12px', width: '1px', background: 'var(--border)' }} />
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-body)',
              fontFamily: 'var(--mono)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {selectedArtifact}
          </span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
            <IconFileText size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Not yet implemented</div>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>Artifact rendering is planned for a future update.</div>
          </div>
        </div>
      </div>
    );
  }

  const refreshBtn = (
    <Button
      variant="ghost"
      size="xs"
      onClick={fetchArtifacts}
      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
      disabled={isListLoading}
    >
      <IconRefresh size={11} className={isListLoading ? 'animate-spin text-amber-500' : ''} />
      Refresh
    </Button>
  );

  // Filter artifacts
  const filtered = allArtifacts.filter(name => {
    if (sessionId && !name.startsWith(sessionId)) return false;
    if (searchTerm && !name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  /* ── List view ── */
  return (
    <div data-testid={rootId} style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
      <WidgetSearchInput data-testid={getTestId('widget-search-input')} widgetId={widgetId} value={searchTerm} onChange={setSearchTerm} placeholder="Filter artifacts..." />
      {headerNode ? createPortal(refreshBtn, headerNode) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 }}>
          {refreshBtn}
        </div>
      )}

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {filtered.length === 0 ? (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
            {allArtifacts.length === 0 ? 'No artifacts generated yet.' : 'No artifacts found.'}
          </div>
        ) : (
          filtered.map((filename, index) => (
            <div
              key={filename}
              data-testid={`artifact-item-${index}`}
              onClick={() => openArtifact(filename)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                transition: 'all 0.14s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-active)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              }}
            >
              <IconFileText data-testid={`${typeof rootId !== 'undefined' ? rootId : 'filtered-item'}-icon-file-text`} size={12} color="var(--amber-400)" />
              <span
                style={{
                  flex: 1,
                  fontSize: '11px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--mono)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {filename}
              </span>
              <IconArrowRight data-testid={`${typeof rootId !== 'undefined' ? rootId : 'filtered-item'}-icon-arrow-right`} size={10} color="var(--text-muted)" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
