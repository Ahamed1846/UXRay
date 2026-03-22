import type { PageContext, Finding } from '../../../schema/types';

/**
 * Detect broken/invalid anchor links
 * Broken links frustrate users and harm navigation UX
 * Check for anchor links (#id) that don't have corresponding elements
 */
export function checkBrokenAnchors(context: PageContext): Finding[] {
  const findings: Finding[] = [];

  const html = context.html || '';

  // Extract all anchor links (href="#something")
  const anchorLinkMatches = html.match(/href=["']#([a-zA-Z0-9_-]+)["']/gi) || [];

  if (anchorLinkMatches.length === 0) {
    return findings; // No anchor links to validate
  }

  // Extract the anchor IDs from matches
  const referencedAnchors = new Set<string>();
  for (const match of anchorLinkMatches) {
    const id = match.match(/#([a-zA-Z0-9_-]+)/)?.[1];
    if (id) {
      referencedAnchors.add(id);
    }
  }

  // Extract all IDs that exist on the page
  const existingIds = new Set<string>();
  const idMatches = html.match(/id=["']([a-zA-Z0-9_-]+)["']/gi) || [];
  for (const match of idMatches) {
    const id = match.match(/id=["']([a-zA-Z0-9_-]+)["']/)?.[1];
    if (id) {
      existingIds.add(id);
    }
  }

  // Find broken anchors
  const brokenAnchors: string[] = [];
  for (const anchorId of referencedAnchors) {
    if (!existingIds.has(anchorId)) {
      brokenAnchors.push(anchorId);
    }
  }

  if (brokenAnchors.length > 0) {
    findings.push({
      id: 'nav_broken_anchors',
      category: 'navigation',
      severity: 'medium',
      title: `${brokenAnchors.length} broken anchor link(s) detected`,
      description: `Links point to anchors (#${brokenAnchors.slice(0, 2).join(', #')}) that don't exist on the page. These links will not work, frustrating users.`,
      recommendation: `Verify that referenced elements have matching IDs. Either fix the href to point to valid IDs or create the missing elements.`,
      evidence: brokenAnchors.slice(0, 3).map((anchor) => ({
        selector: `href="#${anchor}"`,
        snippet: `Anchor "#${anchor}" not found on page`,
      })),
      confidence: 0.95,
    });
  }

  return findings;
}
