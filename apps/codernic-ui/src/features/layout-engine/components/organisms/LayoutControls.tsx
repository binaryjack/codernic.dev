import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLayoutEngine, type BlockState } from '@ai-agencee/ui/layout-engine';
import { IconCheck, IconPlus, IconTool, IconLock, IconFolder } from '@ai-agencee/ui';
import { useDispatch, useSelector } from 'react-redux';
import { addNotificationRequest } from '../../../../entities/notifications/model/notifications-slice';
import { selectSandboxMode } from '../../../../entities/app/model/app-slice';
import { getCodernicHttpUrl } from '../../../../shared/config';
import { Button, SelectDropdown } from '@ai-agencee/ui';
import { useTestId } from '@ai-agencee/ui';

export interface LayoutControlsProps {
  savedLayouts: Record<string, Record<string, BlockState>>;
  setSavedLayouts: React.Dispatch<React.SetStateAction<Record<string, Record<string, BlockState>>>>;
  activeLayoutName: string | null;
  setActiveLayoutName: React.Dispatch<React.SetStateAction<string | null>>;
  dataTestId?: string;
}

export function LayoutControls({ dataTestId, savedLayouts, setSavedLayouts, activeLayoutName, setActiveLayoutName }: LayoutControlsProps) {
  
  const { rootId, getTestId } = useTestId('layout-controls', dataTestId);
const { state, dispatch: layoutDispatch } = useLayoutEngine();
  const reduxDispatch = useDispatch();
  const sandboxMode = useSelector(selectSandboxMode);
  const { isEditMode } = state;
  const [saveName, setSaveName] = useState('');

  const handleSave = () => {
    if (!saveName.trim()) return;
    const currentBlocks = JSON.parse(JSON.stringify(state.blocks));
    
    setSavedLayouts(prev => ({ ...prev, [saveName]: currentBlocks }));
    setActiveLayoutName(saveName);

    const baseUrl = getCodernicHttpUrl();
    if (!sandboxMode) {
      fetch(`${baseUrl}/api/layouts/${encodeURIComponent(saveName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentBlocks)
      }).catch(e => console.error('Failed to save layout', e));
    }
    
    setSaveName('');
  };

  const handleLoad = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    // In edit mode we keep the ask‑confirm behaviour, in locked mode we load silently
    if (isDirty && isEditMode) {
      const wantToSave = window.confirm('You have unsaved changes. Do you want to discard them and load the selected layout?');
      if (!wantToSave) {
        return;
      }
    }
    if (name && savedLayouts[name]) {
      layoutDispatch({ type: 'SET_LAYOUT', payload: { blocks: savedLayouts[name] } });
      setActiveLayoutName(name);
    }
  };

  const isDirty = useMemo(() => {
    const blocks = state.blocks;
    if (!blocks) return false;
    if (activeLayoutName && savedLayouts[activeLayoutName]) {
      return JSON.stringify(blocks) !== JSON.stringify(savedLayouts[activeLayoutName]);
    }
    const defaultBlocks = {
      'root': { id: 'root', type: 'vblock', orientation: 'horizontal', childrenIds: [], ratios: [], locked: false }
    };
    return JSON.stringify(blocks) !== JSON.stringify(defaultBlocks);
  }, [savedLayouts, activeLayoutName, state.blocks]);

  // Auto‑save silently when in locked mode (edit mode disabled) and layout is dirty
  useEffect(() => {
    if (!isEditMode && isDirty) {
      // Perform silent save without UI prompts
      handleSaveActive();
    }
  }, [isEditMode, isDirty]);

  // Handle Manual Save of Active Layout
  const handleSaveActive = () => {
    if (!activeLayoutName) return;
    const currentBlocks = JSON.parse(JSON.stringify(state.blocks));
    setSavedLayouts(prev => ({ ...prev, [activeLayoutName]: currentBlocks }));
    
    const baseUrl = getCodernicHttpUrl();
    if (!sandboxMode) {
      fetch(`${baseUrl}/api/layouts/${encodeURIComponent(activeLayoutName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentBlocks)
      }).then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      }).catch(e => {
        console.error('Failed to save layout', e);
        reduxDispatch(addNotificationRequest({
          message: `Failed to save layout "${activeLayoutName}": ${e.message}`,
          level: 'error'
        }));
      });
    }
  };

  const handleNewLayout = () => {
    if (isDirty) {
      const wantToSave = window.confirm('Vous avez des modifications non enregistrées. Voulez-vous les sauvegarder avant de créer un nouveau layout ?');
      if (wantToSave) {
        const name = window.prompt('Entrez un nom pour sauvegarder ce layout :');
        if (name) {
           const currentBlocks = JSON.parse(JSON.stringify(state.blocks));
           setSavedLayouts(prev => ({ ...prev, [name]: currentBlocks }));
           setActiveLayoutName(name);
           const baseUrl = getCodernicHttpUrl();
           if (!sandboxMode) {
             fetch(`${baseUrl}/api/layouts/${encodeURIComponent(name)}`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(currentBlocks)
             }).catch(e => console.error('Failed to save layout', e));
           }
        } else {
           return;
        }
      }
    }
    layoutDispatch({ type: 'RESET_LAYOUT' });
    setActiveLayoutName(null);
  };

  const handleToggleEditMode = () => {
    if (isEditMode && isDirty) {
      const wantToSave = window.confirm('You have unsaved changes. Do you want to save them before exiting design mode?');
      if (wantToSave) {
        if (activeLayoutName) {
          handleSaveActive();
        } else {
          // If it's a new unsaved layout, prompt to save as
          const name = window.prompt('Enter a name to save this layout:');
          if (name) {
             const currentBlocks = JSON.parse(JSON.stringify(state.blocks));
             setSavedLayouts(prev => ({ ...prev, [name]: currentBlocks }));
             setActiveLayoutName(name);
             const baseUrl = getCodernicHttpUrl();
             if (!sandboxMode) {
               fetch(`${baseUrl}/api/layouts/${encodeURIComponent(name)}`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify(currentBlocks)
               }).then((res) => {
                 if (!res.ok) {
                   throw new Error(`HTTP error! status: ${res.status}`);
                 }
               }).catch(e => console.error('Failed to save layout', e));
             }
          } else {
             // User cancelled saving, so don't quit edit mode
             return;
          }
        }
      }
    }
    layoutDispatch({ type: 'TOGGLE_EDIT_MODE' });
  };

  const layoutNames = Object.keys(savedLayouts);

  return (
    <div className="flex items-center gap-2 pl-4 ml-4 border-l border-zinc-800">
      {/* Toggle Mode */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleEditMode}
        className={`${
          isEditMode 
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 hover:text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]' 
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border border-transparent'
        }`}
        title={isEditMode ? 'Disable Layout Editor' : 'Enable Layout Editor'}
        data-testid={getTestId('button')}
      >
        {isEditMode ? <IconTool data-testid={getTestId('icon-tool')} size={16} className="text-amber-400" /> : <IconLock data-testid={getTestId('icon-lock')} size={16} />}
      </Button>

      {/* Load Layout Dropdown */}
      {isEditMode && (
        <div className="flex items-center gap-2">
          <SelectDropdown
            value={activeLayoutName || ''}
            onChange={(val) => handleLoad({ target: { value: val } } as any)}
            options={[
              { value: '', label: 'Load Layout...', disabled: true },
              ...layoutNames.map(name => ({ value: name, label: name }))
            ]}
            width="w-32"
            className="h-6"
            data-testid={getTestId('select-dropdown')}
          />
        </div>
      )}

      {/* New Layout Button */}
      {isEditMode && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleNewLayout}
          className="flex items-center gap-1 uppercase tracking-wider"
          data-testid={getTestId('button-1')}
        >
          <IconPlus data-testid={getTestId('icon-plus')} size={10} /> New
        </Button>
      )}

      {/* Save Button for active layout */}
      {(activeLayoutName && isDirty) && (
        <Button
          variant="primary"
          size="sm"
          onClick={handleSaveActive}
          className="flex items-center gap-1 uppercase tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.3)]"
          title="Save Layout Modifications"
          data-testid={getTestId('button-2')}
        >
          <IconCheck data-testid={getTestId('icon-check')} size={10} /> Save
        </Button>
      )}

      {/* Save Layout (Only in Edit Mode) */}
      {isEditMode && (
        <div className="flex items-center gap-1">
          <input
            type="text"
            placeholder="Layout name..."
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] rounded px-2 py-1 outline-none focus:border-amber-500 w-24"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSave}
            disabled={!saveName.trim()}
            className="uppercase tracking-wider"
            data-testid={getTestId('button-3')}
          >
            Save
          </Button>
        </div>
      )}
    </div>
  );
}
