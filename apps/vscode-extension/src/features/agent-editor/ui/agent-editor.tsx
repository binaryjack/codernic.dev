import { Button, LlmSelect, TechSelect } from '@ai-agencee/ui/atoms';
import { EmptyState, FormField } from '@ai-agencee/ui/molecules';
import { useState } from 'react';
import { EditorActionBar } from '../../../webview/shared/editor-action-bar';
import { FIELD_STYLE, INPUT_STYLE } from '../../../webview/shared/form-styles';
import { useEditorLlms } from '../../../webview/shared/use-editor-llms';
import { useEditorTechs } from '../../../webview/shared/use-editor-techs';
import { useFormEntry } from '../../../webview/shared/use-form-entry';
import { useWebviewMessages } from '../../../webview/shared/use-webview-messages';
import { vscode } from '../../../webview/vscode-api';
import type { AgentEntry } from '../../tech-catalog/model/agent-store';

type OpenAgentMsg = { type: 'open-agent'; payload: AgentEntry };
type TechGeneratedMsg = { type: 'aie:tech-generated'; payload: { id: string; name: string } };
type TechGenErrorMsg = { type: 'aie:tech-generate-error'; payload: { text: string } };
type InboundMsg = OpenAgentMsg | TechGeneratedMsg | TechGenErrorMsg;
type SaveAgentMsg = { type: 'save-agent'; payload: AgentEntry };
type CancelMsg = { type: 'cancel' };
type GenerateTechMsg = { type: 'aie:generate-tech'; payload: { name: string; llm: string } };
type OutboundMsg = SaveAgentMsg | CancelMsg | GenerateTechMsg;

const postMsg = (msg: OutboundMsg) => vscode.postMessage(msg);

const EMPTY: AgentEntry = {
  id: '',
  name: '',
  icon: '',
  description: '',
  taskType: '',
  checkMode: '',
  focusPath: '',
};

export function AgentEditor() {
  const { entry, setEntry, field } = useFormEntry<AgentEntry>(EMPTY);
  const llmOptions = useEditorLlms('aie');
  const techOptions = useEditorTechs('aie');
  const [newTechName, setNewTechName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  useWebviewMessages<InboundMsg>((msg) => {
    if (msg.type === 'open-agent') {
      setEntry(msg.payload);
    }
    if (msg.type === 'aie:tech-generated') {
      setEntry((prev) => ({ ...prev, tech: msg.payload.id }));
      setNewTechName('');
      setGenerating(false);
      setGenError('');
      vscode.postMessage({ type: 'aie:request-techs' });
    }
    if (msg.type === 'aie:tech-generate-error') {
      setGenerating(false);
      setGenError(msg.payload.text);
    }
  });

  const handleSave = () => {
    if (!entry.id) return;
    postMsg({ type: 'save-agent', payload: entry });
  };

  const handleCancel = () => postMsg({ type: 'cancel' });

  const handleGenerateTech = () => {
    if (!newTechName.trim() || !entry.llm || generating) return;
    setGenerating(true);
    setGenError('');
    postMsg({ type: 'aie:generate-tech', payload: { name: newTechName.trim(), llm: entry.llm } });
  };

  if (!entry.id) {
    return (
      <EmptyState
        title="No agent selected"
        description="Select an agent from the tree to inspect it."
        style={{ padding: 16, opacity: 0.5 }}
      />
    );
  }

  return (
    <form
      style={{ padding: 12 }}
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
    >
      <FormField style={FIELD_STYLE} htmlFor="aie-name" label="Name">
        <input id="aie-name" style={INPUT_STYLE} value={entry.name} onChange={field('name')} />
      </FormField>

      <FormField style={FIELD_STYLE} htmlFor="aie-icon" label="Icon">
        <input
          id="aie-icon"
          style={INPUT_STYLE}
          value={entry.icon ?? ''}
          onChange={field('icon')}
          placeholder="$(robot)"
        />
      </FormField>

      <FormField style={FIELD_STYLE} htmlFor="aie-desc" label="Description">
        <textarea
          id="aie-desc"
          aria-label=""
          style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: 60 }}
          value={entry.description ?? ''}
          onChange={field('description')}
          rows={3}
        />
      </FormField>

      <FormField style={FIELD_STYLE} htmlFor="aie-focusPath" label="Focus Path">
        <input
          id="aie-focusPath"
          style={INPUT_STYLE}
          value={entry.focusPath ?? ''}
          onChange={field('focusPath')}
          placeholder="src/ — blank for whole project"
        />
      </FormField>

      <FormField style={FIELD_STYLE} htmlFor="aie-taskType" label="Task Type">
        <select
          id="aie-taskType"
          style={INPUT_STYLE}
          value={entry.taskType ?? ''}
          onChange={(e) => setEntry((prev) => ({ ...prev, taskType: e.target.value }))}
        >
          <option value="">— select —</option>
          <option value="code-generation">Code generation — write source files</option>
          <option value="analysis">Analysis — understand a codebase or data</option>
          <option value="review">Review — validate and flag issues</option>
          <option value="documentation">Documentation — generate docs/reports</option>
          <option value="none">None — structural checks only (no LLM)</option>
        </select>
      </FormField>

      <FormField style={FIELD_STYLE} htmlFor="aie-checkMode" label="Check Mode">
        <select
          id="aie-checkMode"
          style={INPUT_STYLE}
          value={entry.checkMode ?? ''}
          onChange={(e) => setEntry((prev) => ({ ...prev, checkMode: e.target.value }))}
        >
          <option value="">— select —</option>
          <option value="llm-tool-write">Tool-use loop — LLM can read AND write files</option>
          <option value="llm-tool-read">Tool-use loop — LLM can read files only</option>
          <option value="llm-generate">Generate — LLM produces text/plan output</option>
          <option value="llm-review">Review — LLM analyses a path and flags issues</option>
          <option value="checks-only">Checks only — no LLM, structural guards</option>
        </select>
      </FormField>

      <FormField style={FIELD_STYLE} htmlFor="aie-tech" label="Technology">
        <TechSelect
          value={entry.tech ?? ''}
          onChange={(v: string) => setEntry((prev) => ({ ...prev, tech: v }))}
          options={techOptions}
        />
      </FormField>

      <FormField style={FIELD_STYLE} htmlFor="aie-llm" label="LLM Model">
        <LlmSelect
          value={entry.llm ?? ''}
          onChange={(v: string) => setEntry((prev) => ({ ...prev, llm: v }))}
          options={llmOptions}
        />
      </FormField>

      {entry.llm && !entry.tech && (
        <FormField style={FIELD_STYLE} label="No technology linked — generate one">
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              style={{ ...INPUT_STYLE, flex: 1 }}
              placeholder="Technology name (e.g. TypeScript, React…)"
              value={newTechName}
              onChange={(e) => setNewTechName(e.target.value)}
              disabled={generating}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleGenerateTech();
                }
              }}
            />
            <Button onClick={handleGenerateTech} disabled={!newTechName.trim() || generating}>
              {generating ? 'Generating…' : 'Generate & assign'}
            </Button>
          </div>
          {genError && (
            <div style={{ color: 'var(--vscode-errorForeground)', fontSize: 11, marginTop: 4 }}>
              {genError}
            </div>
          )}
        </FormField>
      )}

      <EditorActionBar onCancel={handleCancel} />
    </form>
  );
}
