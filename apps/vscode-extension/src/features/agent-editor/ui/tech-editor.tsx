import { Button } from '@ai-agencee/ui/atoms';
import { EmptyState, FormField } from '@ai-agencee/ui/molecules';
import { useState } from 'react';
import { Accordion } from '../../../webview/shared/accordion';
import { ConfirmDialog } from '../../../webview/shared/confirm-dialog';
import { EditableList } from '../../../webview/shared/editable-list';
import { EditorActionBar } from '../../../webview/shared/editor-action-bar';
import { FIELD_STYLE, INPUT_STYLE } from '../../../webview/shared/form-styles';
import { SectionDivider } from '../../../webview/shared/section-divider';
import { useConfirm } from '../../../webview/shared/use-confirm';
import { useFormEntry } from '../../../webview/shared/use-form-entry';
import { useWebviewMessages } from '../../../webview/shared/use-webview-messages';
import { trunc } from '../../../webview/shared/utils';
import { vscode } from '../../../webview/vscode-api';
import type { TechEntry, TechRuleFileData } from '../../tech-catalog/model/tech-store';

type OpenTechMsg = { type: 'open-tech'; payload: TechEntry };
type InboundMsg = OpenTechMsg;

type SaveTechMsg = { type: 'save-tech'; payload: TechEntry };
type CancelMsg = { type: 'cancel' };
type OutboundMsg = SaveTechMsg | CancelMsg;

const postMsg = (msg: OutboundMsg) => vscode.postMessage(msg);

const EMPTY_RULE: TechRuleFileData = {
  do: [],
  doNot: [],
  rationale: { summary: '', reasoning: [], references: [] },
};

const EMPTY: TechEntry = { id: '', name: '', icon: '', description: '', version: '' };

export function TechEditor() {
  const { entry, setEntry, field } = useFormEntry<TechEntry>(EMPTY);
  const [frameworksText, setFrameworks] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const { pending, ask, confirm, cancel } = useConfirm();

  useWebviewMessages<InboundMsg>((msg) => {
    if (msg.type === 'open-tech') {
      setEntry(msg.payload);
      setFrameworks((msg.payload.frameworks ?? []).join(', '));
      setShowAddCat(false);
      setNewCatName('');
    }
  });

  // ── Rule helpers ──────────────────────────────────────────────────────────

  const setRuleItem = (cat: string, field: 'do' | 'doNot', idx: number, val: string) =>
    setEntry((prev) => {
      const rules = { ...(prev.rules ?? {}) };
      const rule = { ...EMPTY_RULE, ...(rules[cat] ?? {}) };
      const list = [...rule[field]];
      list[idx] = val;
      rules[cat] = { ...rule, [field]: list };
      return { ...prev, rules };
    });

  const addRuleItem = (cat: string, ruleField: 'do' | 'doNot') =>
    setEntry((prev) => {
      const rules = { ...(prev.rules ?? {}) };
      const rule = { ...EMPTY_RULE, ...(rules[cat] ?? {}) };
      rules[cat] = { ...rule, [ruleField]: [...rule[ruleField], ''] };
      return { ...prev, rules };
    });

  const removeRuleItem = (cat: string, ruleField: 'do' | 'doNot', idx: number) =>
    setEntry((prev) => {
      const rules = { ...(prev.rules ?? {}) };
      const rule = { ...EMPTY_RULE, ...(rules[cat] ?? {}) };
      rules[cat] = { ...rule, [ruleField]: rule[ruleField].filter((_, i) => i !== idx) };
      return { ...prev, rules };
    });

  const setRationaleField = (cat: string, key: 'summary', val: string) =>
    setEntry((prev) => {
      const rules = { ...(prev.rules ?? {}) };
      const rule = { ...EMPTY_RULE, ...(rules[cat] ?? {}) };
      rules[cat] = { ...rule, rationale: { ...rule.rationale, [key]: val } };
      return { ...prev, rules };
    });

  const setRationaleListItem = (
    cat: string,
    listField: 'reasoning' | 'references',
    idx: number,
    val: string,
  ) =>
    setEntry((prev) => {
      const rules = { ...(prev.rules ?? {}) };
      const rule = { ...EMPTY_RULE, ...(rules[cat] ?? {}) };
      const list = [...rule.rationale[listField]];
      list[idx] = val;
      rules[cat] = { ...rule, rationale: { ...rule.rationale, [listField]: list } };
      return { ...prev, rules };
    });

  const addRationaleListItem = (cat: string, listField: 'reasoning' | 'references') =>
    setEntry((prev) => {
      const rules = { ...(prev.rules ?? {}) };
      const rule = { ...EMPTY_RULE, ...(rules[cat] ?? {}) };
      rules[cat] = {
        ...rule,
        rationale: { ...rule.rationale, [listField]: [...rule.rationale[listField], ''] },
      };
      return { ...prev, rules };
    });

  const removeRationaleListItem = (
    cat: string,
    listField: 'reasoning' | 'references',
    idx: number,
  ) =>
    setEntry((prev) => {
      const rules = { ...(prev.rules ?? {}) };
      const rule = { ...EMPTY_RULE, ...(rules[cat] ?? {}) };
      rules[cat] = {
        ...rule,
        rationale: {
          ...rule.rationale,
          [listField]: rule.rationale[listField].filter((_, i) => i !== idx),
        },
      };
      return { ...prev, rules };
    });

  const commitAddCategory = () => {
    const cat = newCatName.trim();
    if (!cat) return;
    setEntry((prev) => {
      const rules = { ...(prev.rules ?? {}), [cat]: { ...EMPTY_RULE } };
      return { ...prev, rules };
    });
    setNewCatName('');
    setShowAddCat(false);
  };

  const removeCategory = (cat: string) =>
    setEntry((prev) => {
      const rules = { ...(prev.rules ?? {}) };
      delete rules[cat];
      return { ...prev, rules };
    });

  // ── Guarded deletes ───────────────────────────────────────────────────────

  const askRemoveRuleItem = (cat: string, ruleField: 'do' | 'doNot', idx: number, val: string) =>
    ask(
      `Remove ${ruleField === 'do' ? 'Do' : 'Do Not'} item "${trunc(val || '(empty)')}" from "${cat}"?`,
      () => removeRuleItem(cat, ruleField, idx),
    );

  const askRemoveRationaleItem = (
    cat: string,
    listField: 'reasoning' | 'references',
    idx: number,
    val: string,
  ) =>
    ask(
      `Remove ${listField === 'reasoning' ? 'Reasoning' : 'Reference'} item "${trunc(val || '(empty)')}" from "${cat}"?`,
      () => removeRationaleListItem(cat, listField, idx),
    );

  const askRemoveCategory = (cat: string) =>
    ask(`Remove the entire "${cat}" category and all its rules?`, () => removeCategory(cat));

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!entry.id) return;
    const frameworks = frameworksText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    postMsg({ type: 'save-tech', payload: { ...entry, frameworks } });
  };

  const handleCancel = () => postMsg({ type: 'cancel' });

  // ── Render ────────────────────────────────────────────────────────────────

  if (!entry.id) {
    return (
      <EmptyState
        title="No technology selected"
        description="Select a technology from the tree to inspect it."
        style={{ padding: 16, opacity: 0.5 }}
      />
    );
  }

  const categories = Object.keys(entry.rules ?? {});

  return (
    <>
      {pending && <ConfirmDialog message={pending.label} onConfirm={confirm} onCancel={cancel} />}

      <form
        style={{ padding: 12 }}
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        {/* ── Meta ─────────────────────────────────────────────────────────── */}
        <FormField style={FIELD_STYLE} htmlFor="tie-name" label="Name">
          <input id="tie-name" style={INPUT_STYLE} value={entry.name} onChange={field('name')} />
        </FormField>

        <FormField style={FIELD_STYLE} htmlFor="tie-icon" label="Icon">
          <input
            id="tie-icon"
            style={INPUT_STYLE}
            value={entry.icon ?? ''}
            onChange={field('icon')}
            placeholder="$(symbol-misc)"
          />
        </FormField>

        <FormField style={FIELD_STYLE} htmlFor="tie-desc" label="Description">
          <textarea
            id="tie-desc"
            style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: 60 }}
            value={entry.description ?? ''}
            onChange={field('description')}
            rows={3}
          />
        </FormField>

        <FormField style={FIELD_STYLE} htmlFor="tie-version" label="Version">
          <input
            id="tie-version"
            style={INPUT_STYLE}
            value={entry.version ?? ''}
            onChange={field('version')}
            placeholder="e.g. 18.0.0 or ^5.x"
          />
        </FormField>

        <FormField style={FIELD_STYLE} htmlFor="tie-frameworks" label="Frameworks">
          <input
            id="tie-frameworks"
            style={INPUT_STYLE}
            value={frameworksText}
            onChange={(e) => setFrameworks(e.target.value)}
            placeholder="Comma-separated, e.g. React, Next.js"
          />
        </FormField>

        {/* ── Rules ────────────────────────────────────────────────────────── */}
        <SectionDivider
          label="Rules"
          action={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddCat((v) => !v)}
            >
              + Category
            </Button>
          }
        >
          {showAddCat && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <input
                autoFocus
                style={INPUT_STYLE}
                placeholder="Category name (e.g. variables)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitAddCategory();
                  }
                }}
              />
              <Button type="button" variant="primary" size="sm" onClick={commitAddCategory}>
                Add
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddCat(false);
                  setNewCatName('');
                }}
              >
                ✕
              </Button>
            </div>
          )}

          {categories.map((cat) => {
            const rule = entry.rules![cat];
            return (
              <Accordion key={cat} label={cat}>
                <div
                  style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  <EditableList
                    label="Do"
                    addLabel="+ Do item"
                    items={rule.do}
                    onChange={(i, v) => setRuleItem(cat, 'do', i, v)}
                    onRemove={(i, v) => askRemoveRuleItem(cat, 'do', i, v)}
                    onAdd={() => addRuleItem(cat, 'do')}
                  />

                  <EditableList
                    label="Do Not"
                    addLabel="+ Do Not item"
                    items={rule.doNot}
                    onChange={(i, v) => setRuleItem(cat, 'doNot', i, v)}
                    onRemove={(i, v) => askRemoveRuleItem(cat, 'doNot', i, v)}
                    onAdd={() => addRuleItem(cat, 'doNot')}
                  />

                  {/* Rationale */}
                  <div>
                    <div
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        color: 'var(--vscode-input-foreground)',
                        opacity: 0.75,
                        marginBottom: 4,
                      }}
                    >
                      Rationale — Summary
                    </div>
                    <textarea
                      style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: 48 }}
                      value={rule.rationale.summary}
                      onChange={(e) => setRationaleField(cat, 'summary', e.target.value)}
                      rows={2}
                    />

                    <div style={{ marginTop: 8 }}>
                      <EditableList
                        label="Reasoning"
                        addLabel="+ Reasoning"
                        items={rule.rationale.reasoning}
                        onChange={(i, v) => setRationaleListItem(cat, 'reasoning', i, v)}
                        onRemove={(i, v) => askRemoveRationaleItem(cat, 'reasoning', i, v)}
                        onAdd={() => addRationaleListItem(cat, 'reasoning')}
                      />
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <EditableList
                        label="References"
                        addLabel="+ Reference"
                        items={rule.rationale.references}
                        onChange={(i, v) => setRationaleListItem(cat, 'references', i, v)}
                        onRemove={(i, v) => askRemoveRationaleItem(cat, 'references', i, v)}
                        onAdd={() => addRationaleListItem(cat, 'references')}
                      />
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--vscode-panel-border)', paddingTop: 8 }}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => askRemoveCategory(cat)}
                    >
                      ✕ Remove category
                    </Button>
                  </div>
                </div>
              </Accordion>
            );
          })}
        </SectionDivider>

        <EditorActionBar onCancel={handleCancel} />
      </form>
    </>
  );
}
