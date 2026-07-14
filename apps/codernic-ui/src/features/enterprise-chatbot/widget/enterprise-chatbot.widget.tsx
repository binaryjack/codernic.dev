import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MessageFeed } from '../../../features/chat/components/organisms/message-feed';
import { ChatInput } from '../../../features/chat/components/organisms/chat-input';
import { EnterpriseChatbotHero } from '../../../features/chat/components/organisms/EnterpriseChatbotHero';
import { selectEnterpriseMessages, selectEnterpriseSending, submitEnterpriseMessage } from '../store/enterprise-chatbot.slice';
import { useTestId } from '@ai-agencee/ui';

/**
 * EnterpriseChatbotWidget
 * 
 * A decoupled orchestrator for the Enterprise RAG Chatbot.
 * It reuses the internal chat feature components but routes communication 
 * through the modular ApiClient strategy rather than the standard Daemon WebSocket, 
 * injecting IAM validation headers as required.
 */
export function EnterpriseChatbotWidget({ dataTestId }: { dataTestId?: string }) {
  const dispatch = useDispatch();
  const messages = useSelector(selectEnterpriseMessages);
  const sending = useSelector(selectEnterpriseSending);
  
  const { rootId, getTestId } = useTestId('enterprise-chatbot-widget', dataTestId);

  const handleSend = useCallback((text: string) => {
    if (!text.trim()) return;
    dispatch(submitEnterpriseMessage({ text }));
  }, [dispatch]);

  return (
    <div className="flex flex-col h-full bg-[var(--background)] relative" data-testid={getTestId('root')}>
      <div className="flex-1 overflow-y-auto">
        <MessageFeed data-testid={getTestId('message-feed')}
          data-demo-desc="[ENTERPRISE] The conversational event feed showing recent queries and fetched context citations."
          mode="agent"
          messages={messages}
          agentRun={null}
          onAgentRunDismiss={() => {}}
          phaseGate={null}
          onPhaseGateConfirm={() => {}}
          onPhaseGateDismiss={() => {}}
          sending={sending}
          thinking={{ phase: 'idle', currentAction: '' }}
          messagesEndRef={{ current: null }}
          onSuggestionClick={() => {}}
          onboardingStorageKey="codernic_enterprise_hide_onboarding"
          renderWelcomeHero={(onDismiss) => <EnterpriseChatbotHero data-testid={`${typeof rootId !== 'undefined' ? rootId : 'anonymous'}-enterprise-chatbot-hero`} onDismiss={onDismiss} />}
        />
      </div>
      <ChatInput data-testid={getTestId('chat-input')}
        data-demo-desc="[ENTERPRISE] Chat input pre-configured for RAG mode — no LLM switching needed. Routes to the enterprise API."
        mode="agent"
        onSend={handleSend}
        onAbort={() => {}}
        sending={sending}
        onModeChange={() => {}}
        journeyPhase="init"
        llmLoading={false}
        llmOptions={[{ label: 'Enterprise RAG', value: 'rag-model' }]}
        sessionLlm="rag-model"
        onLlmChange={() => {}}
        routeProfiles={[]}
        routeProfile=""
        onRouteProfileChange={() => {}}
        isAutoPilot={true}
        onAutopilotToggle={() => {}}
        useRag={true}
        onUseRagToggle={() => {}}
        metrics={null}
      />
    </div>
  );
}

export default EnterpriseChatbotWidget;
