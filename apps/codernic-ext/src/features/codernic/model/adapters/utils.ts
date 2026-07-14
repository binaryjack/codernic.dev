/**
 * Extrait un objet JSON valide même s'il est noyé dans du Markdown.
 */
export function extractJsonFromMarkdown<T>(rawLlmResponse: string): T {
  // 1. Nettoyage des balises Markdown (```json ... ``` ou ``` ... ```)
  const jsonBlockRegex = /```(?:json|JSON)?\s*([\s\S]*?)\s*```/i;
  const match = rawLlmResponse.match(jsonBlockRegex);

  const jsonString = match ? match[1] : rawLlmResponse;

  try {
    return JSON.parse(jsonString.trim()) as T;
  } catch (error) {
    // 2. Fallback aggressif : extraction de tout ce qui ressemble à un objet/tableau
    const fallbackRegex = /(\{[\s\S]*\}|\[[\s\S]*\])/;
    const fallbackMatch = jsonString.match(fallbackRegex);
    if (fallbackMatch) {
      return JSON.parse(fallbackMatch[0]) as T;
    }
    throw error;
  }
}
