export function parseTextWithThoughts(text: string) {
  const blocks: { type: 'text' | 'thought'; content: string; isClosed?: boolean; thoughtIndex?: number }[] = [];
  let remaining = text;
  let thoughtCount = 0;

  while (remaining.length > 0) {
    const thinkStart = remaining.indexOf('<think>');
    const thoughtStart = remaining.indexOf('<thought>');
    const actionStart = remaining.indexOf('<action>');

    let startIdx = -1;
    let tagLen = 0;
    let endTag = '';
    let isAction = false;

    const indices = [
      { type: 'think', idx: thinkStart, len: 7, end: '</think>' },
      { type: 'thought', idx: thoughtStart, len: 9, end: '</thought>' },
      { type: 'action', idx: actionStart, len: 8, end: '</action>' }
    ].filter(x => x.idx !== -1).sort((a, b) => a.idx - b.idx);

    if (indices.length === 0) {
      blocks.push({ type: 'text', content: remaining });
      break;
    }

    const first = indices[0];
    startIdx = first.idx;
    tagLen = first.len;
    endTag = first.end;
    isAction = first.type === 'action';

    if (startIdx > 0) {
      blocks.push({ type: 'text', content: remaining.slice(0, startIdx) });
    }

    const contentStart = startIdx + tagLen;
    const endIdx = remaining.indexOf(endTag, contentStart);

    if (endIdx === -1) {
      if (!isAction) {
        blocks.push({ type: 'thought', content: remaining.slice(contentStart), isClosed: false, thoughtIndex: thoughtCount++ });
      }
      break;
    } else {
      if (!isAction) {
        blocks.push({ type: 'thought', content: remaining.slice(contentStart, endIdx), isClosed: true, thoughtIndex: thoughtCount++ });
      }
      remaining = remaining.slice(endIdx + endTag.length);
    }
  }
  return blocks;
}
