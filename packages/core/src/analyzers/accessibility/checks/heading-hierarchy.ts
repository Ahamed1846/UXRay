import { Finding, PageContext } from '../../../schema/types';

/**
 * Check for proper heading hierarchy (h1, h2, h3, etc. order)
 */
export function checkHeadingHierarchy(context: PageContext): Finding[] {
  const findings: Finding[] = [];

  if (context.headings.length === 0) {
    // No headings at all
    findings.push({
      id: 'a11y_no_headings',
      category: 'accessibility',
      severity: 'high',
      title: 'No headings found on page',
      description:
        'Pages without headings lack structure and are difficult for screen reader users to navigate. Headings provide a semantic outline for page content.',
      evidence: [
        {
          text: 'Page has no <h1>, <h2>, <h3>, etc. elements',
        },
      ],
      recommendation: 'Add heading elements to structure page content. Start with an <h1> tag for the main title.',
      confidence: 0.95,
    });
    return findings;
  }

  const missingH1 = !context.headings.some((h) => h.level === 1);
  const multipleH1 = context.headings.filter((h) => h.level === 1).length > 1;
  const hierarchyIssues: string[] = [];

  // Check for missing H1
  if (missingH1) {
    hierarchyIssues.push('missing <h1>');
  }

  // Check for multiple H1s
  if (multipleH1) {
    hierarchyIssues.push('multiple <h1> tags');
  }

  // Check for hierarchy jumps (e.g., h1 -> h3 skipping h2)
  for (let i = 1; i < context.headings.length; i++) {
    const prev = context.headings[i - 1].level;
    const curr = context.headings[i].level;
    if (curr > prev + 1) {
      hierarchyIssues.push(`heading jump from h${prev} to h${curr}`);
      break;
    }
  }

  if (hierarchyIssues.length > 0) {
    findings.push({
      id: 'a11y_heading_hierarchy',
      category: 'accessibility',
      severity: 'high',
      title: `Heading hierarchy issues: ${hierarchyIssues.join(', ')}`,
      description: 'Improper heading hierarchy confuses screen reader users and breaks page structure navigation.',
      evidence: context.headings.slice(0, 5).map((h) => ({
        text: `<h${h.level}>${h.text.substring(0, 50)}</h${h.level}>`,
      })),
      recommendation:
        'Ensure a single <h1> at the top, no level skips (h1→h2→h3, not h1→h3), and use headings to structure content logically.',
      confidence: 0.9,
    });
  }

  return findings;
}
