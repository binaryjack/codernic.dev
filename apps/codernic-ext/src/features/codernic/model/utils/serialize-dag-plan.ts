import * as fs from 'fs/promises';
import * as path from 'path';

export const serializeAndValidateDagPlan = async function (
  rawLlmOutput: string,
  targetJsonPath: string,
  channel: { appendLine: (msg: string) => void },
): Promise<void> {
  let cleanedContent = rawLlmOutput.trim();

  try {
    const debugDumpPath = path.join(
      path.dirname(targetJsonPath),
      '..',
      '..',
      'codernic-raw-llm-dump.log',
    );
    await fs.writeFile(
      debugDumpPath,
      `=== TRACE DU FLUX BRUT ===\n\n${rawLlmOutput}\n\n=== FIN DE LA TRACE ===`,
      'utf-8',
    );
    channel.appendLine(`[DEBUG] Flux brut LLM sauvegardé dans : ${debugDumpPath}`);
  } catch (e) {
    channel.appendLine(`[DEBUG] Impossible d'écrire le dump de log: ${String(e)}`);
  }

  const lookForJson = (text: string): { parsed: any } => {
    let startIdx = text.indexOf('{');
    while (startIdx !== -1) {
      let endIdx = text.lastIndexOf('}');
      while (endIdx !== -1 && endIdx > startIdx) {
        const candidate = text.substring(startIdx, endIdx + 1);
        try {
          const testJson = candidate
            // eslint-disable-next-line no-control-regex
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            .replace(/\/\/.*$/gm, '')
            .replace(/,(\s*[\]}])/g, '$1');

          const parsed = JSON.parse(testJson.trim());
          if (parsed && typeof parsed === 'object') {
            return { parsed };
          }
        } catch {
          // parsing failed, try next inner block
        }
        endIdx = text.lastIndexOf('}', endIdx - 1);
      }
      startIdx = text.indexOf('{', startIdx + 1);
    }
    return { parsed: null };
  };

  const result = lookForJson(cleanedContent);
  if (!result.parsed) {
    throw new Error(
      '[SERIALIZATION CRITICAL] Impossible de localiser le bloc JSON DAG. Format de sortie incompatible.',
    );
  }

  let parsedDag = result.parsed;

  // 3. Normalisation finale et Auto-Healing pour le Kernel Rust
  try {
    if (!parsedDag.name) {
      parsedDag.name = "Plan d'exécution automatique";
    }

    if (!parsedDag.lanes || !Array.isArray(parsedDag.lanes) || parsedDag.lanes.length === 0) {
      parsedDag.lanes = [
        {
          id: "default-lane",
          agentFile: "generic-agent.agent.json",
          dependsOn: [],
          capabilities: [],
        },
      ];
    }

    // --- AUTO-HEALING : Correction des hallucinations fréquentes du LLM ---

    // 1. Correction des Lanes
    if (parsedDag.lanes && Array.isArray(parsedDag.lanes)) {
      parsedDag.lanes = parsedDag.lanes.map((lane: any) => {
        if (lane.agent && !lane.agentFile) {
          lane.agentFile = lane.agent;
          delete lane.agent;
        }
        return lane;
      });
    }

    // 2. Correction des Barrières Globales (id -> name, timeout -> timeoutMs)
    if (parsedDag.globalBarriers && Array.isArray(parsedDag.globalBarriers)) {
      parsedDag.globalBarriers = parsedDag.globalBarriers.map((b: any) => {
        if (b.id && !b.name) {
          b.name = b.id;
          delete b.id;
        }
        if (b.timeout && !b.timeoutMs) {
          b.timeoutMs = b.timeout;
          delete b.timeout;
        }
        if (!b.participants) {
          b.participants = [];
        }
        return b;
      });
    }

    // 3. Correction du Registre de Capacités (String -> Array)
    if (parsedDag.capabilityRegistry && typeof parsedDag.capabilityRegistry === 'object') {
      for (const key of Object.keys(parsedDag.capabilityRegistry)) {
        if (typeof parsedDag.capabilityRegistry[key] === 'string') {
          // Le LLM a mis une description au lieu d'un tableau de dépendances, on corrige
          parsedDag.capabilityRegistry[key] = [];
        }
      }
    }

    cleanedContent = JSON.stringify(parsedDag, null, 2);
  } catch (err) {
    throw new Error(`[MALFORMED JSON] ${(err as Error).message}`);
  }

  const targetDir = path.dirname(targetJsonPath);
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(targetJsonPath, cleanedContent, 'utf-8');
};
