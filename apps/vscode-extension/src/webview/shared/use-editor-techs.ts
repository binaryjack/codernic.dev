import { useState } from 'react';
import { vscode } from '../vscode-api';
import { SelectOption } from './i-select-options';
import { useWebviewMessages } from './use-webview-messages';

const NOT_APPLICABLE: SelectOption = { value: '', label: 'Not Applicable' };

type TechsMsg = { type: string; payload: SelectOption[] };

export const useEditorTechs = function (msgPrefix: string): SelectOption[] {
  const [techOptions, setTechOptions] = useState<SelectOption[]>([NOT_APPLICABLE]);

  useWebviewMessages<TechsMsg>(
    (msg) => {
      if (msg.type === `${msgPrefix}:techs`) {
        setTechOptions([NOT_APPLICABLE, ...msg.payload]);
      }
    },
    () => {
      vscode.postMessage({ type: `${msgPrefix}:request-techs` });
    },
  );

  return techOptions;
};
