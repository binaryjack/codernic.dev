import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useVBlockContext } from '@ai-agencee/ui/layout-engine';
import { IconPlus } from '@ai-agencee/ui';
import { WidgetSearchInput } from '../../../search/components/widget-search-input';
import { Button } from '@ai-agencee/ui';
import { AgnosticEditorList } from './AgnosticEditorList';
import { AgnosticEditorForm } from './AgnosticEditorForm';
import { scaffoldFromSchema } from '../../utils/schemaScaffold';
import { useTestId } from '@ai-agencee/ui';

export interface AgnosticItem {
  id: string;
  name: string;
  content: any;
}

export interface AgnosticJsonEditorWidgetProps {
  id: string;
  title: string;
  items: AgnosticItem[];
  schema?: any; // For formular.dev if needed
  onCreate: (name: string, scaffoldedData?: any) => void;
  onDelete: (item: AgnosticItem) => void;
  onSave: (id: string, newContent: any) => void;
  onOpenInVSCode: (item: AgnosticItem) => void;
  dataTestId?: string;
}

export function AgnosticJsonEditorWidget({ dataTestId,
  id,
  title,
  items,
  schema,
  onCreate,
  onDelete,
  onSave,
  onOpenInVSCode
}: AgnosticJsonEditorWidgetProps) {
  
  const { rootId, getTestId } = useTestId('agnostic-json-editor-widget', dataTestId);
const { behavior, setExpanded } = useVBlockContext();
  const [selectedItem, setSelectedItem] = useState<AgnosticItem | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Editor tabs state
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
  const [jsonText, setJsonText] = useState('');
  const [formObj, setFormObj] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [searchPortalRoot, setSearchPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalRoot(document.getElementById(`widget-header-actions-${id}`));
    setSearchPortalRoot(document.getElementById(`search-portal-placeholder-${id}`));
  }, [id]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Split view condition
  const isSplitView = behavior === 'full-screen' || containerWidth > 600;

  useEffect(() => {
    if (selectedItem) {
      if (typeof selectedItem.content === 'string') {
        setJsonText(selectedItem.content);
        setFormObj({});
        setActiveTab('json');
      } else {
        setJsonText(JSON.stringify(selectedItem.content, null, 2));
        setFormObj(selectedItem.content || {});
        setActiveTab('form');
      }
    }
  }, [selectedItem]);

  const isDirty = useMemo(() => {
    if (!selectedItem) return false;
    if (typeof selectedItem.content === 'string') {
      return selectedItem.content !== jsonText;
    }
    try {
      const currentContent = activeTab === 'form' ? formObj : JSON.parse(jsonText);
      return JSON.stringify(selectedItem.content) !== JSON.stringify(currentContent);
    } catch {
      return true; // if JSON is invalid, assume dirty
    }
  }, [selectedItem, formObj, jsonText, activeTab]);

  const handleSelectItem = async (item: AgnosticItem) => {
    if (isDirty && selectedItem && selectedItem.id !== item.id) {
      const { store } = await import('../../../../store');
      const { dispatchPromiseModal } = await import('../../../../features/modal/store/modal.saga');
      const shouldDiscard = await dispatchPromiseModal({
        title: 'Unsaved Changes',
        message: `You have unsaved changes in ${selectedItem.name}. Do you want to discard them?`,
        type: 'confirm',
        confirmText: 'Discard',
        cancelText: 'Cancel'
      })(store.dispatch, store.getState);

      if (!shouldDiscard) return;
    }

    setSelectedItem(item);
    if (!isSplitView && behavior !== 'full-screen') {
      // If user clicked Edit in a small panel, expand it
      setExpanded(true);
    }
  };

  const handleBackToList = async () => {
    if (isDirty && selectedItem) {
      const { store } = await import('../../../../store');
      const { dispatchPromiseModal } = await import('../../../../features/modal/store/modal.saga');
      const shouldDiscard = await dispatchPromiseModal({
        title: 'Unsaved Changes',
        message: `You have unsaved changes in ${selectedItem.name}. Do you want to discard them?`,
        type: 'confirm',
        confirmText: 'Discard',
        cancelText: 'Cancel'
      })(store.dispatch, store.getState);

      if (!shouldDiscard) return;
    }
    setSelectedItem(null);
  };

  const handleSaveData = () => {
    if (!selectedItem) return;
    try {
      if (activeTab === 'json') {
        if (typeof selectedItem.content === 'string') {
          onSave(selectedItem.id, jsonText);
        } else {
          const parsed = JSON.parse(jsonText);
          onSave(selectedItem.id, parsed);
          setFormObj(parsed);
        }
      } else {
        onSave(selectedItem.id, formObj);
        setJsonText(JSON.stringify(formObj, null, 2));
      }
    } catch (e) {
      alert("Invalid format");
    }
  };

  const handleCreateNew = () => {
    const scaffolded = scaffoldFromSchema(schema) || {};
    onCreate('', scaffolded);
  };

  // Portal for Header Actions
  const headerActions = portalRoot ? createPortal(
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => { e.stopPropagation(); handleCreateNew(); }}
      className="text-zinc-500 hover:text-amber-500 hover:bg-zinc-800 transition-colors"
      title={`Create new ${title}`}
      data-testid={getTestId('create-new-button')}
    >
      <IconPlus data-testid={getTestId('icon-plus')} size={14} />
    </Button>,
    portalRoot
  ) : null;

  // Search Portal
  const searchActions = searchPortalRoot ? createPortal(
    <WidgetSearchInput widgetId={id} value={searchTerm} onChange={setSearchTerm} placeholder={`Filter ${title.toLowerCase()}...`} />,
    searchPortalRoot
  ) : null;

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [items, searchTerm]);

  return (
    <div ref={containerRef} className="flex h-full relative overflow-hidden">
      {headerActions}
      {searchActions}
      {isSplitView ? (
        <>
          <AgnosticEditorList data-testid={getTestId('agnostic-editor-list')}
            title={title}
            items={items}
            filteredItems={filteredItems}
            selectedItem={selectedItem}
            isSplitView={isSplitView}
            handleSelectItem={handleSelectItem}
            onDelete={onDelete}
            onCreate={handleCreateNew}
          />
          <AgnosticEditorForm data-testid={getTestId('agnostic-editor-form')}
            id={id}
            selectedItem={selectedItem}
            isSplitView={isSplitView}
            activeTab={activeTab}
            jsonText={jsonText}
            formObj={formObj}
            schema={schema}
            handleBackToList={handleBackToList}
            setActiveTab={setActiveTab}
            onOpenInVSCode={onOpenInVSCode}
            handleSaveData={handleSaveData}
            setFormObj={setFormObj}
            setJsonText={setJsonText}
          />
        </>
      ) : (
        <>
          {!selectedItem ? (
            <AgnosticEditorList data-testid={getTestId('agnostic-editor-list-1')}
              title={title}
              items={items}
              filteredItems={filteredItems}
              selectedItem={selectedItem}
              isSplitView={isSplitView}
              handleSelectItem={handleSelectItem}
              onDelete={onDelete}
              onCreate={handleCreateNew}
            />
          ) : (
            <AgnosticEditorForm data-testid={getTestId('agnostic-editor-form-1')}
              id={id}
              selectedItem={selectedItem}
              isSplitView={isSplitView}
              activeTab={activeTab}
              jsonText={jsonText}
              formObj={formObj}
              schema={schema}
              handleBackToList={handleBackToList}
              setActiveTab={setActiveTab}
              onOpenInVSCode={onOpenInVSCode}
              handleSaveData={handleSaveData}
              setFormObj={setFormObj}
              setJsonText={setJsonText}
            />
          )}
        </>
      )}
    </div>
  );
}
