import type { PageContext, Finding } from '../../../schema/types';

/**
 * Check for footer presence and key footer elements
 * Footers provide important navigation and information
 * Missing footer or sparse footer harms usability
 */
export function checkFooterPresence(context: PageContext): Finding[] {
  const findings: Finding[] = [];

  const html = context.html || '';

  // Check for footer tag
  const hasFooterTag = /<footer[^>]*>/i.test(html);

  // Check for common footer patterns (if no semantic footer tag)
  const hasFooterClass =
    /class=["'][^"']*footer[^"']*["']/i.test(html) ||
    /id=["'][^"']*footer[^"']*["']/i.test(html);

  if (!hasFooterTag && !hasFooterClass) {
    findings.push({
      id: 'nav_missing_footer',
      category: 'navigation',
      severity: 'medium',
      title: 'No footer element found',
      description: `The page lacks a semantic <footer> element or footerlike structure. Footers provide important navigation paths, copyright info, and links to key pages (privacy, contact, sitemap).`,
      recommendation: 'Add a <footer> element at the bottom of the page with copyright info, key links, and contact details.',
      evidence: [],
      confidence: 0.85,
    });
    return findings;
  }

  // If footer exists, check for key footer content
  const footerMatch = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
  if (!footerMatch) {
    return findings; // No footer tag to analyze
  }

  const footerContent = footerMatch[1];

  // Check for important footer elements
  const hasLinks = /<a[^>]*href[^>]*>/i.test(footerContent);
  const hasCopyright =
    /&copy;|copyright|\u00a9/i.test(footerContent);
  const hasContact =
    /contact|email|phone|help|support/i.test(footerContent);

  let missingElements = 0;
  const missing: string[] = [];

  if (!hasLinks) {
    missingElements++;
    missing.push('navigation links');
  }

  if (!hasCopyright) {
    missingElements++;
    missing.push('copyright');
  }

  if (!hasContact) {
    missingElements++;
    missing.push('contact information');
  }

  if (missingElements >= 2) {
    findings.push({
      id: 'nav_sparse_footer',
      category: 'navigation',
      severity: 'low',
      title: `Footer is missing important elements: ${missing.join(', ')}`,
      description: `Footers should include links to other pages, copyright information, and contact details. Missing these elements reduces the footer's usefulness.`,
      recommendation: 'Add key footer elements: navigation links, copyright statement, contact information, and links to legal pages.',
      evidence: [],
      confidence: 0.75,
    });
  }

  return findings;
}
