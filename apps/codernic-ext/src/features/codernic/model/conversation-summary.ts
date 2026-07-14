/**
 * Conversation Summarizer - Extract context from message history
 * Enables Codernic to remember topics and entities across conversation turns
 */

export type ChatMsg = {
  role: 'system' | 'user' | 'assistant';
  text: string;
  streaming?: boolean;
};

/**
 * Build a compact conversation summary from message history
 * Extracts last N user messages and assistant responses for context
 *
 * @param messages - Complete message history
 * @param maxUserMessages - Maximum user messages to include (default: 5)
 * @param maxAssistantMessages - Maximum assistant summaries to include (default: 3)
 * @returns Compact summary string for context injection
 */
export function buildConversationSummary(
  messages: ChatMsg[],
  maxUserMessages: number = 5,
  maxAssistantMessages: number = 3,
): string {
  // Skip system messages for summary
  const nonSystemMessages = messages.filter((m) => m.role !== 'system');

  if (nonSystemMessages.length === 0) {
    return '';
  }

  // Extract recent user messages (reversed to get most recent first, then reverse back)
  const userMessages = nonSystemMessages.filter((m) => m.role === 'user').slice(-maxUserMessages);

  // Extract recent assistant messages and take first sentence only
  const assistantMessages = nonSystemMessages
    .filter((m) => m.role === 'assistant' && !m.streaming)
    .slice(-maxAssistantMessages)
    .map((m) => {
      // Extract first sentence (up to first ., !, or ? followed by space or end)
      const firstSentence = m.text.match(/^[^.!?]+[.!?](?:\s|$)/);
      return firstSentence ? firstSentence[0].trim() : m.text.slice(0, 100);
    });

  // Extract key topics from user messages (capitalized words 3+ chars, not common words)
  const commonWords = new Set([
    'the',
    'and',
    'for',
    'are',
    'but',
    'not',
    'you',
    'all',
    'can',
    'her',
    'was',
    'one',
    'our',
    'out',
    'day',
    'get',
    'has',
    'him',
    'his',
    'how',
    'man',
    'new',
    'now',
    'old',
    'see',
    'two',
    'way',
    'who',
    'boy',
    'did',
    'its',
    'let',
    'put',
    'say',
    'she',
    'too',
    'use',
  ]);
  const topics = new Set<string>();

  for (const msg of userMessages) {
    // Find capitalized words or phrases
    const words = msg.text.match(/\b[A-Z][a-zA-Z]{2,}\b/g);
    if (words) {
      for (const word of words) {
        if (!commonWords.has(word.toLowerCase()) && topics.size < 8) {
          topics.add(word);
        }
      }
    }
  }

  // Build compact summary
  const parts: string[] = [];

  if (topics.size > 0) {
    parts.push(`Topics discussed: ${Array.from(topics).join(', ')}`);
  }

  if (userMessages.length > 0) {
    // Include last 2 user messages for immediate context
    const recentUser = userMessages.slice(-2).map((m) => m.text);
    parts.push(`Recent questions: "${recentUser.join('", "')}"`);
  }

  if (assistantMessages.length > 0) {
    parts.push(`Context: ${assistantMessages.join(' ')}`);
  }

  return parts.join('. ');
}
