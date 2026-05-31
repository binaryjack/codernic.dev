import { useState } from 'react';
import { vscode } from '../vscode-api';
import { SelectOption } from './i-select-options';
import { useWebviewMessages } from './use-webview-messages';

type LlmsMsg = { type: string; payload: SelectOption[] };

export const useEditorLlms = function (msgPrefix: string): SelectOption[] {
  const [llmOptions, setLlmOptions] = useState<SelectOption[]>([]);

  useWebviewMessages<LlmsMsg>(
    (msg) => {
      if (msg.type === `${msgPrefix}:llms`) {
        setLlmOptions(msg.payload);
      }
    },
    () => {
      vscode.postMessage({ type: `${msgPrefix}:request-llms` });
    },
  );

  return llmOptions;
};
