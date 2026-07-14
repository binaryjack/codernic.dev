import { Button } from '@ai-agencee/ui';
import React from 'react';
import { useTestId } from '@ai-agencee/ui';

export interface EnterpriseChatbotHeroProps {
  onDismiss: () => void;
  dataTestId?: string;
}

export function EnterpriseChatbotHero({ dataTestId, onDismiss }: EnterpriseChatbotHeroProps) {
  const { getTestId } = useTestId('enterprise-chatbot-hero');
  
  const rootId = dataTestId || 'enterprise-chatbot-hero';
  return (
    <div data-testid={rootId} className="flex flex-col items-center justify-center max-w-2xl mx-auto py-16 px-4 text-center">
      <div className="w-16 h-16 bg-[var(--amber-500)]/10 rounded-2xl flex items-center justify-center mb-6 border border-[var(--amber-500)]/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="var(--amber-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-[var(--text-main)] mb-3">
        How can I help you today?
      </h1>
      
      <p className="text-sm text-[var(--text-muted)] mb-10 max-w-lg leading-relaxed">
        I am your intelligent enterprise assistant. You can ask me questions about internal documents, request summaries, or have me draft responses based on our company knowledge base.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left mb-10">
        <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
          <h3 className="text-sm font-semibold text-[var(--text-main)] mb-1">Knowledge Search</h3>
          <p className="text-xs text-[var(--text-muted)]">Instantly retrieve policies, guides, or data from the enterprise corpus.</p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
          <h3 className="text-sm font-semibold text-[var(--text-main)] mb-1">Text Analysis</h3>
          <p className="text-xs text-[var(--text-muted)]">Summarize long emails, reports, or meeting notes automatically.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input 
            type="checkbox" 
            className="w-4 h-4 rounded border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--amber-500)] focus:ring-[var(--amber-500)]/20"
            onChange={(e) => {
              if (e.target.checked) {
                localStorage.setItem('codernic_enterprise_hide_onboarding', 'true');
              } else {
                localStorage.removeItem('codernic_enterprise_hide_onboarding');
              }
            }}
          />
          <span className="text-xs text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">
            Don't show this again
          </span>
        </label>
        <Button data-testid={getTestId('button')} onClick={onDismiss} variant="primary" size="md">
          Start Chatting
        </Button>
      </div>
    </div>
  );
}
