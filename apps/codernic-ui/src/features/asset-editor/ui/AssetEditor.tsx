import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectEditingAsset, setEditingAsset } from "../../../entities/assets/model/assets-slice";
import { selectJsonEditorSchemas } from '../../../entities/assets/model/assets-slice';
import { JsonAccordionEditor } from '../../../shared/ui/json-editor/JsonAccordionEditor';
import { useTestId } from '@ai-agencee/ui';

export function AssetEditor() {
  const dispatch = useDispatch();
  const editingAsset = useSelector(selectEditingAsset);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const schemas = useSelector(selectJsonEditorSchemas);
  const schema = schemas?.[editingAsset?.type] || {};
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');

  useEffect(() => {
    if (editingAsset) {
      // Prettify JSON if it's valid
      try {
        const parsed = JSON.parse(editingAsset.content);
        setContent(JSON.stringify(parsed, null, 2));
        setParseError(null);
      } catch (e) {
        setContent(editingAsset.content);
      }
    }
  }, [editingAsset]);

  if (!editingAsset) return null;

  const handleSave = () => {
    try {
      // Validate JSON before saving
      JSON.parse(content);
      setParseError(null);
      
      setIsSaving(true);
      dispatch({ 
        type: 'assets/saveAssetRequest', 
        payload: { type: editingAsset.type, id: editingAsset.id, content } 
      });
      setTimeout(() => setIsSaving(false), 800); // Visual feedback
    } catch (e: unknown) {
      setParseError(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleOpenInVsCode = () => {
    dispatch({ 
      type: 'assets/openAssetRequest', 
      payload: { type: editingAsset.type, id: editingAsset.id } 
    });
  };

  const parsedJson = useMemo(() => {
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }, [content]);

  const handleVisualSave = (values: unknown) => {
    const updatedContent = JSON.stringify(values, null, 2);
    setContent(updatedContent);
    setIsSaving(true);
    dispatch({ 
      type: 'assets/saveAssetRequest', 
      payload: { type: editingAsset.type, id: editingAsset.id, content: updatedContent } 
    });
    setTimeout(() => setIsSaving(false), 800);
  };

  const renderVisualEditor = () => {
    
  const { rootId, getTestId } = useTestId('render-visual-editor', undefined);
if (!parsedJson) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-[#a1a1aa]">
          <p className="mb-4">Invalid JSON. Cannot render visual editor.</p>
          <button onClick={() => setViewMode('json')} className="px-4 py-2 bg-[#27272a] rounded text-white">Switch to JSON Editor</button>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto">
        <JsonAccordionEditor data-testid={getTestId('json-accordion-editor')}
          value={parsedJson}
          onChange={(newVal) => handleVisualSave(newVal)}
          schema={schema}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#09090b] text-[#f1f5f9] font-sans">
      <div className="flex items-center justify-between p-4 border-b border-[#27272a] bg-[#111111]">
        <div>
          <h2 className="text-lg font-bold">Edit {editingAsset.type.charAt(0).toUpperCase() + editingAsset.type.slice(1)}</h2>
          <div className="text-xs text-[#a1a1aa] font-mono mt-1">{editingAsset.id}</div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleOpenInVsCode}
            className="px-3 py-1.5 text-sm bg-transparent text-[#a1a1aa] border border-[#27272a] rounded hover:text-white hover:border-[#a1a1aa] transition-colors"
          >
            Open in VS Code
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            onClick={() => dispatch(setEditingAsset(null))}
            className="px-3 py-1.5 text-sm bg-transparent text-[#a1a1aa] hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto flex flex-col">
        <div className="flex gap-2 mb-4 border-b border-[#27272a] pb-2">
          <button 
            onClick={() => setViewMode('visual')}
            className={`px-3 py-1 text-sm rounded ${viewMode === 'visual' ? 'bg-[#27272a] text-white' : 'text-[#a1a1aa] hover:text-white'}`}
          >
            Visual Form
          </button>
          <button 
            onClick={() => setViewMode('json')}
            className={`px-3 py-1 text-sm rounded ${viewMode === 'json' ? 'bg-[#27272a] text-white' : 'text-[#a1a1aa] hover:text-white'}`}
          >
            Raw JSON
          </button>
        </div>

        {viewMode === 'visual' ? (
          renderVisualEditor()
        ) : (
          <>
            {parseError && (
              <div className="mb-4 p-3 bg-red-950 border border-red-900 text-red-200 rounded text-sm">
                {parseError}
              </div>
            )}
            <textarea 
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (parseError) setParseError(null);
              }}
              className="flex-1 w-full min-h-[500px] bg-[#111111] border border-[#27272a] rounded p-4 font-mono text-sm resize-none focus:outline-none focus:border-blue-500 text-[#e2e8f0]"
              spellCheck={false}
            />
            <div className="mt-4 flex justify-end">
               <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save JSON Changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
