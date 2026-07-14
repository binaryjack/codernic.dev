import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../store';
import Ajv from 'ajv';
import { Button } from '@ai-agencee/ui';
import { IconCode, IconArrowLeft } from '@ai-agencee/ui';
import Editor from '@monaco-editor/react';
import { JsonObjectEditor } from '../json-editor/JsonObjectEditor';
import type { AgnosticItem } from './AgnosticJsonEditorWidget';
import { useTestId } from '@ai-agencee/ui';

export interface AgnosticEditorFormProps {
  id?: string;
  selectedItem: AgnosticItem | null;
  isSplitView: boolean;
  activeTab: 'form' | 'json';
  jsonText: string;
  formObj: any;
  schema: any;
  handleBackToList: () => void;
  setActiveTab: (tab: 'form' | 'json') => void;
  onOpenInVSCode: (item: AgnosticItem) => void;
  handleSaveData: () => void;
  setFormObj: (newData: any) => void;
  setJsonText: (text: string) => void;
  dataTestId?: string;
}

export function AgnosticEditorForm({ dataTestId,
  id,
  selectedItem,
  isSplitView,
  activeTab,
  jsonText,
  formObj,
  schema,
  handleBackToList,
  setActiveTab,
  onOpenInVSCode,
  handleSaveData,
  setFormObj,
  setJsonText,
}: AgnosticEditorFormProps) {
  
  const { rootId, getTestId } = useTestId('agnostic-editor-form', dataTestId);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const reduxErrors = useSelector((state: RootState) => id ? state.uiCommands.commands[id]?.validationErrors : undefined);
  const errorsToDisplay = validationErrors.length > 0 ? validationErrors : (reduxErrors || []);
  
  if (!selectedItem) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm italic bg-zinc-950">
        Select an item to edit
      </div>
    );
  }

  const ajv = new Ajv({ strict: false, allErrors: true });

  return (
    <div data-testid={rootId} className="flex-1 flex flex-col h-full bg-zinc-900 overflow-hidden">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-2 bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          {!isSplitView && (
            <Button variant="ghost" size="icon" onClick={handleBackToList} className="text-zinc-400 hover:text-white" title="Back" data-testid={getTestId('button')}>
              <IconArrowLeft data-testid={getTestId('icon-arrow-left')} size={16} />
            </Button>
          )}
          <span className="text-sm font-semibold text-amber-500 truncate max-w-[200px]">{selectedItem.name}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-800 p-0.5 rounded gap-1">
            {typeof selectedItem.content !== 'string' && (
              <Button 
                variant="ghost"
              size="sm"
              onClick={() => {
                if (activeTab !== 'form') {
                  try {
                    setFormObj(JSON.parse(jsonText));
                  } catch (e) {
                    alert("Invalid JSON format. Please fix before switching to Formulaire.");
                    return;
                  }
                }
                setActiveTab('form');
              }}
              className={`${activeTab === 'form' ? 'bg-zinc-600 text-white hover:bg-zinc-500' : 'text-zinc-400 hover:text-zinc-200'}`}
              data-testid={getTestId('button-1')}
            >
                Formulaire
              </Button>
            )}
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => {
                if (activeTab !== 'json') {
                  setJsonText(JSON.stringify(formObj, null, 2));
                }
                setActiveTab('json');
              }}
              className={`${activeTab === 'json' ? 'bg-zinc-600 text-white hover:bg-zinc-500' : 'text-zinc-400 hover:text-zinc-200'}`}
              data-testid={getTestId('button-2')}
            >
              {typeof selectedItem.content === 'string' ? 'Raw XML/Text' : 'JSON'}
            </Button>
          </div>
          
          <Button 
            variant="secondary"
            size="sm"
            onClick={() => onOpenInVSCode(selectedItem)}
            className="flex items-center gap-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 border-blue-500/30"
            data-testid={getTestId('button-3')}
          >
            <IconCode data-testid={getTestId('icon-code')} size={12} />
            VSCode
          </Button>
          
          <Button 
            variant="primary"
            size="sm"
            onClick={() => {
              if (!selectedItem) return;
              try {
                let dataToSave;
                if (activeTab === 'json') {
                  if (typeof selectedItem.content === 'string') {
                    handleSaveData();
                    return;
                  } else {
                    dataToSave = JSON.parse(jsonText);
                  }
                } else {
                  dataToSave = formObj;
                }

                if (schema && typeof selectedItem.content !== 'string') {
                  const validate = ajv.compile(schema);
                  const valid = validate(dataToSave);
                  if (!valid) {
                    const errors = validate.errors?.map((e: any) => `${e.instancePath || 'root'} ${e.message}`) || [];
                    setValidationErrors(errors);
                    return;
                  }
                }
                
                setValidationErrors([]);
                handleSaveData();
              } catch (e) {
                alert("Invalid JSON format");
              }
            }}
            data-testid={getTestId('button-4')}
          >
            Save
          </Button>
        </div>
      </div>

      {errorsToDisplay.length > 0 && (
        <div className="bg-red-900/30 border-b border-red-800 p-2 text-xs text-red-400" data-testid={getTestId('validation-errors')}>
          <div className="font-bold mb-1">Schema Validation Failed:</div>
          <ul className="list-disc pl-4">
            {errorsToDisplay.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Editor Body */}
      <div className="flex-1 overflow-hidden relative @container/form">
        {activeTab === 'form' ? (
          <div className="h-full w-full overflow-y-auto p-2 @md/form:p-4">
            {schema && Object.keys(schema).length > 0 ? (
              <JsonObjectEditor data-testid={getTestId('json-object-editor')} 
                value={formObj} 
                schema={schema.properties || schema} 
                onChange={(newData: any) => setFormObj(newData)} 
                isSplitView={isSplitView}
                rootValue={formObj}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-sm">
                <p>Schema not loaded or empty.</p>
                <p className="mt-2">Please use the JSON tab to edit raw data.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full w-full p-2">
            <div className="w-full h-full rounded border border-zinc-800 overflow-hidden bg-[#1e1e1e]">
              <Editor data-testid={getTestId('editor')}
                height="100%"
                language={typeof selectedItem.content === 'string' ? 'xml' : 'json'}
                theme="vs-dark"
                value={jsonText}
                onChange={(value) => setJsonText(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 16, bottom: 16 },
                  roundedSelection: false,
                  formatOnPaste: true,
                  renderLineHighlight: 'all',
                }}
                loading={
                  <div className="flex h-full w-full items-center justify-center text-zinc-500 text-xs">
                    Loading Editor...
                  </div>
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
