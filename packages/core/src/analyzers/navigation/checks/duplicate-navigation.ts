import type { PageContext, Finding } from '../../../schema/types';

/**
 * Detect duplicate navigation elements
 * Repeated navigation patterns waste space and confuse users
 * Check for multiple nav elements with similar structure
 */
export function checkDuplicateNavigation(context: PageContext): Finding[] {
  const findings: Finding[] = [];

  const html = context.html || '';

  // Find all nav elements
  const navMatches = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/gi) || [];

  if (navMatches.length < 2) {
    return findings; // No duplicates possible with <1 nav
  }

  // Check for multiple navs with similar link counts (potential duplicates)
  const navStructures: Array<{ count: number; position: number }> = [];

  for (let i = 0; i < navMatches.length; i++) {
    const nav = navMatches[i];
    const linkCount = (nav.match(/<a[^>]*>/gi) || []).length;
    navStructures.push({ count: linkCount, position: i });
  }

  // Check for similar nav structures (within ±1 link count)
  let hasDuplicates = false;
  for (let i = 0; i < navStructures.length - 1; i++) {
    for (let j = i + 1; j < navStructures.length; j++) {
      const diff = Math.abs(navStructures[i].count - navStructures[j].count);
      if (diff <= 2) {
        // Similar structure = potential duplicate
        hasDuplicates = true;
      }
    }
  }

  if (hasDuplicates && navMatches.length > 1) {
    findings.push({
      id: 'nav_duplicate_navigation',
      category: 'navigation',
      severity: 'low',
      title: `Multiple similar navigation structures found (${navMatches.length} nav elements)`,
      description: `The page has multiple navigation areas with similar structure and link counts. This may indicate redundant navigation that wastes space and creates maintenance burden.`,
      recommendation: 'Consolidate navigation into a single primary nav element. Use CSS to show/hide nav for different viewport sizes instead of duplicating.',
      evidence: navStructures.map((nav, idx) => ({
        selector: `nav:nth-of-type(${idx + 1})`,
        snippet: `Navigation element with ${nav.count} links`,
      })),
      confidence: 0.75,
    });
  }

  return findings;
}
