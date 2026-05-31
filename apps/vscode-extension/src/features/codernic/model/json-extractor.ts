/** json-extractor.ts — Robust extraction of JSON from LLM markdown responses. */

export function extractJsonFromLlmResponse<T>(raw: string, stepLabel: string): T {
  // 1. Strip extended-thinking blocks
  let text = raw.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');

  // 2. Strip markdown code fences
  const codeFenceMatches = text.matchAll(/```(?:json|JSON)?\s*([\s\S]*?)```/g);
  const codeBlocks = Array.from(codeFenceMatches).map((m) => m[1].trim());

  if (codeBlocks.length > 0) {
    const sortedBlocks = codeBlocks.sort((a, b) => b.length - a.length);
    for (const block of sortedBlocks) {
      try {
        return JSON.parse(block) as T;
      } catch {
        continue;
      }
    }
  }

  text = text.replace(/```(?:json|JSON)?[\s\S]*?```/g, '');
  const trimmed = text.trim();

  // 3. Direct parse attempt
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed) as T;
    } catch {
      /* fall through */
    }
  }

  // 4. Outermost JSON object extraction
  const firstBrace = trimmed.indexOf('{');
  if (firstBrace !== -1) {
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    let endPos = -1;

    for (let i = firstBrace; i < trimmed.length; i++) {
      const char = trimmed[i];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            endPos = i + 1;
            break;
          }
        }
      }
    }

    if (endPos !== -1) {
      const jsonStr = trimmed.slice(firstBrace, endPos);
      try {
        return JSON.parse(jsonStr) as T;
      } catch (e) {
        const preview = jsonStr.slice(0, 200).replace(/\n/g, ' ');
        throw new Error(
          `LLM returned malformed JSON for ${stepLabel}: ${(e as Error).message}\nAttempted to parse: ${preview}...`,
        );
      }
    }
  }

  // 5. Outermost JSON array extraction
  const firstBracket = trimmed.indexOf('[');
  if (firstBracket !== -1) {
    let bracketCount = 0;
    let inString = false;
    let escapeNext = false;
    let endPos = -1;

    for (let i = firstBracket; i < trimmed.length; i++) {
      const char = trimmed[i];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '[') bracketCount++;
        if (char === ']') {
          bracketCount--;
          if (bracketCount === 0) {
            endPos = i + 1;
            break;
          }
        }
      }
    }

    if (endPos !== -1) {
      const jsonStr = trimmed.slice(firstBracket, endPos);
      try {
        return JSON.parse(jsonStr) as T;
      } catch (e) {
        const preview = jsonStr.slice(0, 200).replace(/\n/g, ' ');
        throw new Error(
          `LLM returned malformed JSON array for ${stepLabel}: ${(e as Error).message}\nAttempted to parse: ${preview}...`,
        );
      }
    }
  }

  // 6. Delimiter-based extraction
  const jsonLikeMatch = trimmed.match(/(?:^|\n)\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*(?:\n|$)/);
  if (jsonLikeMatch) {
    try {
      return JSON.parse(jsonLikeMatch[1]) as T;
    } catch {
      /* fall through */
    }
  }

  const preview = raw.slice(0, 500).replace(/\n/g, ' ');
  throw new Error(`LLM did not return valid JSON for ${stepLabel}.\nReceived: ${preview}...`);
}
