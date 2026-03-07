import { Finding, PageContext } from '../../../schema/types';

/**
 * Check for basic ARIA compliance issues
 * - Icon buttons without aria-label
 * - Buttons with no accessible name
 * - Role misuse warnings
 */
export function checkAriaBasics(context: PageContext): Finding[] {
  const findings: Finding[] = [];

  // Parse HTML to find common ARIA issues
  const htmlLower = context.html.toLowerCase();

  // Check for icon buttons without aria-label
  // Look for patterns like <button>icon</button> or <button class="icon">
  const iconButtonMatches = htmlLower.match(/<button[^>]*(?:class="[^"]*icon[^"]*"|class="[^"]*btn-icon[^"]*")[^>]*>[\s\n]*(?:<i|<svg|<span|icon|⚙|✕|☰)/gi);
  const hasIconButtonsWithoutLabel =
    iconButtonMatches &&
    iconButtonMatches.some((match) => !match.toLowerCase().includes('aria-label'));

  // Check for role misuse (common errors)
  const divRoleButtonMatches = htmlLower.match(/<div[^>]*role="button"[^>]*>/gi);
  const spanRoleButtonMatches = htmlLower.match(/<span[^>]*role="button"[^>]*>/gi);

  // Check for links used as buttons
  const linkAsButtonPattern = /<a[^>]*href=["']#["'][^>]*(?:class=["'][^"']*btn[^"']*["'])?[^>]*>/gi;
  const linkButtonMatches = htmlLower.match(linkAsButtonPattern);

  if (hasIconButtonsWithoutLabel) {
    findings.push({
      id: 'a11y_icon_button_no_label',
      category: 'accessibility',
      severity: 'high',
      title: 'Icon button(s) missing aria-label',
      description:
        'Icon-only buttons need aria-label attributes so screen reader users understand their purpose. Without visible text, screen readers cannot communicate the button function.',
      evidence: [
        {
          text: '<button class="icon"><i class="icon-close"></i></button>',
        },
      ],
      recommendation:
        'Add aria-label to icon buttons: <button aria-label="Close dialog" class="icon">...</button>',
      confidence: 0.85,
    });
  }

  if (divRoleButtonMatches || spanRoleButtonMatches) {
    findings.push({
      id: 'a11y_div_role_button',
      category: 'accessibility',
      severity: 'medium',
      title: 'Found <div> or <span> with role="button"',
      description:
        'Using role="button" on non-interactive elements (div/span) requires additional ARIA attributes and event handlers to be fully accessible. Consider using <button> instead for simpler, more semantic HTML.',
      evidence: [
        {
          text: '<div role="button">Click me</div> should be <button>Click me</button>',
        },
      ],
      recommendation:
        'Prefer native HTML elements (<button>, <a>) over divs/spans with ARIA roles. If role="button" is used, ensure proper tabindex, keyboard handlers, and aria-pressed if toggleable.',
      confidence: 0.75,
    });
  }

  if (linkButtonMatches && linkButtonMatches.length > 0) {
    findings.push({
      id: 'a11y_link_as_button',
      category: 'accessibility',
      severity: 'medium',
      title: 'Found link(s) styled as button(s)',
      description:
        'Links with href="#" or onclick handlers that behave as buttons should use <button> instead. This improves semantic clarity and accessibility.',
      evidence: [
        {
          text: '<a href="#" class="btn">Action</a> should be <button>Action</button>',
        },
      ],
      recommendation:
        'Use <button> for clickable actions and <a href="..."> only for navigation. If using <a> as a button, add role="button" and ensure keyboard support.',
      confidence: 0.7,
    });
  }

  return findings;
}
