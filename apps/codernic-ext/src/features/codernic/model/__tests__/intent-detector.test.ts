import { detectIntent } from '../intent-detector';

describe('detectIntent — memory slash commands', () => {
  it('detects /read-project-memory intent in all modes', () => {
    const askIntent = detectIntent('/read-project-memory', 'ask');
    expect(askIntent).not.toBeNull();
    expect(askIntent?.type).toBe('read-project-memory');

    const agentIntent = detectIntent('/read_project_memory', 'agent');
    expect(agentIntent).not.toBeNull();
    expect(agentIntent?.type).toBe('read-project-memory');
  });

  it('detects /write-project-memory intent with category and content', () => {
    const intent = detectIntent('/write-project-memory decision Added rate limiting', 'ask');
    expect(intent).not.toBeNull();
    expect(intent?.type).toBe('write-project-memory');
    expect(intent?.spec).toBe('decision Added rate limiting');
  });
});
