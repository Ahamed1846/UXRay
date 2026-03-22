import type { PageContext, Finding } from '../../../schema/types';

/**
 * Count top-level navigation items
 * Too many items reduce findability and cognitive clarity
 * WCAG guideline: aim for ≤8 top-level navigation items
 */
export function checkNavItemCount(context: PageContext): Finding[] {
  const findings: Finding[] = [];

  const html = context.html || '';

  // Find nav elements and their links
  const navMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/gi);

  if (!navMatch || navMatch.length === 0) {
    // No explicit nav tag - check for common nav patterns
    findings.push({
      id: 'nav_missing_landmarks',
      category: 'navigation',
      severity: 'medium',
      title: 'No semantic <nav> landmark found',
      description: 'The page lacks a proper <nav> element. Navigation should be wrapped in a semantic <nav> tag for accessibility and clarity.',
      recommendation: 'Wrap top-level navigation in <nav> element.',
      evidence: [],
      confidence: 0.85,
    });
    return findings;
  }

  // Analyze first nav element (primary nav)
  const primaryNav = navMatch[0];

  // Count direct child links (top-level items)
  const linkMatches = primaryNav.match(/<a[^>]*href[^>]*>/gi) || [];
  const topLevelCount = linkMatches.length;

  if (topLevelCount > 12) {
    findings.push({
      id: 'nav_overload_critical',
      category: 'navigation',
      severity: 'high',
      title: `Primary navigation has ${topLevelCount} items (recommended: ≤8)`,
      description: `Navigation with too many top-level items overwhelms users and reduces findability. Studies show that more than 8 items significantly harm usability and increase cognitive load.`,
      recommendation: 'Consolidate navigation items. Use dropdown menus for related items. Group by category or audience.',
      evidence: [{ snippet: `Found ${topLevelCount} top-level navigation items` }],
      confidence: 0.9,
    });
  } else if (topLevelCount > 8) {
    findings.push({
      id: 'nav_overload_medium',
      category: 'navigation',
      severity: 'medium',
      title: `Navigation has ${topLevelCount} items (recommended: ≤8)`,
      description: `Navigation with 9-12 items may be harder for users to scan quickly. Consider if all items are equally important.`,
      recommendation: 'Review if all navigation items are necessary. Consider grouping related items.',
      evidence: [{ snippet: `Found ${topLevelCount} top-level navigation items` }],
      confidence: 0.8,
    });
  }

  return findings;
}
