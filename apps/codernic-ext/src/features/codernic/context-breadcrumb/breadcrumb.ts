/**
 * @file breadcrumb.ts
 * @description Context breadcrumb — collapses MCP code-search-context results into a
 * terse inline header showing which files were used to ground the response.
 */

const MAX_VISIBLE = 3;

/**
 * Extracts distinct relative file paths from a `code-search-context` MCP result.
 *
 * The result text contains sections like:
 *   `#### src/features/auth/handler.ts:42 - function \`parseToken\``
 *
 * We extract the path portion before the first `:` (plus optional line number).
 */
export function parseContextBreadcrumb(contextText: string): string[] {
  if (!contextText) return [];

  const seen = new Set<string>();
  const paths: string[] = [];

  // Match markdown section headers: #### <path>:<line> - <kind> `<name>`
  const headerRe = /^####\s+([^\s:]+):\d+/gm;
  let match: RegExpExecArray | null;

  while ((match = headerRe.exec(contextText)) !== null) {
    const filePath = match[1];
    if (filePath && !seen.has(filePath)) {
      seen.add(filePath);
      paths.push(filePath);
    }
  }

  return paths;
}

/**
 * Formats an array of paths into a compact breadcrumb line.
 *
 * - Empty input  → empty string (caller should skip rendering)
 * - ≤ MAX_VISIBLE → `📎 *Context: a.ts · b.ts · c.ts*`
 * - > MAX_VISIBLE → `📎 *Context: a.ts · b.ts · c.ts · +N more*`
 */
export function formatBreadcrumb(paths: string[]): string {
  if (paths.length === 0) return '';

  const visible = paths.slice(0, MAX_VISIBLE).map((p) => {
    // Show only the file name for brevity
    const parts = p.replace(/\\/g, '/').split('/');
    return parts[parts.length - 1] ?? p;
  });

  const extra = paths.length - MAX_VISIBLE;
  const label = extra > 0 ? `${visible.join(' · ')} · +${extra} more` : visible.join(' · ');

  return `📎 *Context: ${label}*`;
}
