import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectSandboxMode, setSandboxMode } from '../../../entities/app/model/app-slice';
import { useTestId } from '@ai-agencee/ui';

export function SandboxWidget() {
  const dispatch = useDispatch();
  const sandboxMode = useSelector(selectSandboxMode);
  const { rootId, getTestId } = useTestId('sandbox-widget', typeof dataTestId !== 'undefined' ? dataTestId : undefined);

  return (
    <div data-testid={getTestId('root')} className={`w-full h-full p-4 flex flex-col justify-center gap-4 transition-all ${sandboxMode ? 'bg-amber-900/10' : 'bg-transparent'}`}>
      <div className="flex justify-between items-center gap-4">
        <span className={`font-bold text-sm ${sandboxMode ? 'text-amber-400' : 'text-zinc-400'}`}>
          <span className="mr-2">✨</span> Sandbox Mode
        </span>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={sandboxMode}
            onChange={(e) => {
              dispatch(setSandboxMode(e.target.checked));
            }}
            className="w-5 h-5 accent-amber-500 cursor-pointer"
            data-testid={getTestId('toggle')}
          />
        </label>
      </div>
      <p className="text-xs text-zinc-500 leading-tight">
        {sandboxMode ? 'SaaS Interactive Simulator is active.' : 'Enable to bypass local daemon and simulate SaaS environment.'}
      </p>
    </div>
  );
}

export default SandboxWidget;
