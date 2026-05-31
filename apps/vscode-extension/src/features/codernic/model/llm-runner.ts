/** llm-runner.ts — Executes LLM requests with automated tool-call loops. */

import * as vscode from 'vscode';
import { executeWorkspaceTool, WORKSPACE_TOOLS } from '../../../shared/api/workspace-tools';

export interface LlmResponse {
  text: string;
  costHint: number;
}

export async function callLlm(
  llmId: string,
  systemPrompt: string,
  userMessage: string,
  workspaceRoot: string,
  onLog: (line: string) => void,
): Promise<LlmResponse> {
  const cts = new vscode.CancellationTokenSource();
  try {
    const [model] = await vscode.lm.selectChatModels({ id: llmId });
    if (!model) throw new Error(`Model "${llmId}" not available`);

    const messages = [
      vscode.LanguageModelChatMessage.User(systemPrompt),
      vscode.LanguageModelChatMessage.User(userMessage),
    ];

    const response = await model.sendRequest(messages, { tools: WORKSPACE_TOOLS }, cts.token);

    let text = '';
    const toolCalls: vscode.LanguageModelToolCallPart[] = [];
    const assistantParts: (vscode.LanguageModelTextPart | vscode.LanguageModelToolCallPart)[] = [];

    for await (const part of response.stream) {
      if (part instanceof vscode.LanguageModelTextPart) {
        text += part.value;
        assistantParts.push(part);
      } else if (part instanceof vscode.LanguageModelToolCallPart) {
        toolCalls.push(part);
        assistantParts.push(part);
      }
    }

    onLog(`[llm-runner] Initial response: ${text.length} chars, ${toolCalls.length} tool calls`);

    const loopMessages = [...messages];
    let loopCount = 0;
    let currentToolCalls = toolCalls;
    let currentParts = assistantParts;

    while (currentToolCalls.length > 0 && loopCount < 3) {
      loopCount++;
      loopMessages.push(vscode.LanguageModelChatMessage.Assistant(currentParts));

      const toolResults: vscode.LanguageModelToolResultPart[] = [];
      for (const tc of currentToolCalls) {
        onLog(`[llm-runner] tool: ${tc.name}(${JSON.stringify(tc.input).slice(0, 80)})`);
        try {
          const result = await executeWorkspaceTool(
            tc.name,
            tc.input as Record<string, unknown>,
            workspaceRoot,
          );
          toolResults.push(
            new vscode.LanguageModelToolResultPart(tc.callId, [
              new vscode.LanguageModelTextPart(result),
            ]),
          );
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          onLog(`[llm-runner] tool error: ${errorMsg}`);
          toolResults.push(
            new vscode.LanguageModelToolResultPart(tc.callId, [
              new vscode.LanguageModelTextPart(`Error: ${errorMsg}`),
            ]),
          );
        }
      }

      loopMessages.push(vscode.LanguageModelChatMessage.User(toolResults));

      const followup = await model.sendRequest(loopMessages, { tools: WORKSPACE_TOOLS }, cts.token);
      const nextParts: (vscode.LanguageModelTextPart | vscode.LanguageModelToolCallPart)[] = [];
      const nextToolCalls: vscode.LanguageModelToolCallPart[] = [];
      let loopText = '';

      for await (const part of followup.stream) {
        if (part instanceof vscode.LanguageModelTextPart) {
          text += part.value;
          loopText += part.value;
          nextParts.push(part);
        } else if (part instanceof vscode.LanguageModelToolCallPart) {
          nextToolCalls.push(part);
          nextParts.push(part);
        }
      }

      onLog(
        `[llm-runner] Loop ${loopCount}: ${loopText.length} chars, ${nextToolCalls.length} tool calls`,
      );

      currentToolCalls = nextToolCalls;
      currentParts = nextParts;
    }

    if (currentToolCalls.length > 0) {
      onLog(
        `[llm-runner] Max loops reached with ${currentToolCalls.length} pending tool calls — final synthesis`,
      );
      loopMessages.push(vscode.LanguageModelChatMessage.Assistant(currentParts));
      const finalToolResults: vscode.LanguageModelToolResultPart[] = [];
      for (const tc of currentToolCalls) {
        try {
          const result = await executeWorkspaceTool(
            tc.name,
            tc.input as Record<string, unknown>,
            workspaceRoot,
          );
          finalToolResults.push(
            new vscode.LanguageModelToolResultPart(tc.callId, [
              new vscode.LanguageModelTextPart(result),
            ]),
          );
        } catch {
          finalToolResults.push(
            new vscode.LanguageModelToolResultPart(tc.callId, [
              new vscode.LanguageModelTextPart('Error'),
            ]),
          );
        }
      }
      loopMessages.push(vscode.LanguageModelChatMessage.User(finalToolResults));
      loopMessages.push(
        vscode.LanguageModelChatMessage.User([
          new vscode.LanguageModelTextPart(
            'Please synthesize the above information and provide your final JSON response now.',
          ),
        ]),
      );

      const finalResponse = await model.sendRequest(loopMessages, {}, cts.token);
      for await (const part of finalResponse.stream) {
        if (part instanceof vscode.LanguageModelTextPart) {
          text += part.value;
        }
      }
    }

    const costHint = (text.length / 4 / 1_000_000) * 3;
    return { text, costHint };
  } finally {
    cts.dispose();
  }
}
