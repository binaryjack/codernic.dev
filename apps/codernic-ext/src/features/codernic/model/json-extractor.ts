/** json-extractor.ts — Robust extraction of JSON from LLM markdown responses. */

function sanitizeJsonString(str: string): string {
  let inString = false;
  let escapeNext = false;
  let result = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (escapeNext) {
      // If we see an invalid escape sequence in a string (e.g., \_), we just let JSON.parse complain,
      // or we could sanitize it. But the main issue is usually unescaped newlines.
      result += char;
      escapeNext = false;
      continue;
    }
    if (char === '\\') {
      result += char;
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }
    if (inString) {
      if (char === '\n') {
        result += '\\n';
      } else if (char === '\r') {
        result += '\\r';
      } else if (char === '\t') {
        result += '\\t';
      } else {
        result += char;
      }
    } else {
      result += char;
    }
  }
  return result;
}

export function extractJsonFromLlmResponse<T>(raw: string, stepLabel: string): T {
  // 1. Strip extended-thinking blocks
  let text = raw.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');

  // 2. Strip markdown code fences
  const codeFenceMatches = text.matchAll(/```(?:json|JSON)?\s*([\s\S]*?)(?:```|$)/g);
  const codeBlocks = Array.from(codeFenceMatches).map((m) => m[1].trim());

  if (codeBlocks.length > 0) {
    const sortedBlocks = codeBlocks.sort((a, b) => b.length - a.length);
    for (const block of sortedBlocks) {
      try {
        return JSON.parse(sanitizeJsonString(block)) as T;
      } catch {
        // Try finding outermost braces within the codeblock
        const fb = block.indexOf('{');
        const lb = block.lastIndexOf('}');
        if (fb !== -1 && lb !== -1 && lb > fb) {
          try { return JSON.parse(sanitizeJsonString(block.slice(fb, lb + 1))) as T; } catch {}
        }
        continue;
      }
    }
  }

  text = text.replace(/```(?:json|JSON)?[\s\S]*?```/g, '');
  const trimmed = text.trim();

  // 3. Direct parse attempt
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(sanitizeJsonString(trimmed)) as T;
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
        return JSON.parse(sanitizeJsonString(jsonStr)) as T;
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
        return JSON.parse(sanitizeJsonString(jsonStr)) as T;
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
      return JSON.parse(sanitizeJsonString(jsonLikeMatch[1])) as T;
    } catch {
      /* fall through */
    }
  }

  // 7. Ultimate fallback: First `{` and last `}` or first `[` and last `]`
  const firstFallbackBrace = raw.indexOf('{');
  const lastFallbackBrace = raw.lastIndexOf('}');
  if (firstFallbackBrace !== -1 && lastFallbackBrace !== -1 && lastFallbackBrace > firstFallbackBrace) {
    try {
      return JSON.parse(sanitizeJsonString(raw.slice(firstFallbackBrace, lastFallbackBrace + 1))) as T;
    } catch {}
  }

  const firstFallbackBracket = raw.indexOf('[');
  const lastFallbackBracket = raw.lastIndexOf(']');
  if (firstFallbackBracket !== -1 && lastFallbackBracket !== -1 && lastFallbackBracket > firstFallbackBracket) {
    try {
      return JSON.parse(sanitizeJsonString(raw.slice(firstFallbackBracket, lastFallbackBracket + 1))) as T;
    } catch {}
  }

  const preview = raw.slice(0, 500).replace(/\n/g, ' ');
  throw new Error(`LLM did not return valid JSON for ${stepLabel}.\nReceived: ${preview}...`);
}
