import type { PageContext, Finding } from '../../../schema/types';

/**
 * Check for adequate font sizes for readability
 * WCAG guideline: minimum 12px for body text is recommended
 * Detecting small font sizes that harm readability
 */
export function checkFontSizeHeuristic(context: PageContext): Finding[] {
  const findings: Finding[] = [];

  // Get all elements from the context
  const elements = context.elements || [];

  // Track elements with small font sizes
  const smallFontElements: Array<{ selector: string; fontSize: string }> = [];

  for (const element of elements) {
    if (!element.tag || element.tag === 'script' || element.tag === 'style') {
      continue;
    }

    const computedStyle = element.computedStyle || {};
    const fontSize = computedStyle.fontSize || '';

    if (!fontSize) {
      continue;
    }

    // Parse font size (e.g., "12px" -> 12)
    const sizeMatch = fontSize.match(/^(\d+(?:\.\d+)?)/);
    if (!sizeMatch) {
      continue;
    }

    const size = parseFloat(sizeMatch[1]);

    // Flag body text with font size < 12px
    // Check if it's likely body text (not heading, not very small element)
    if (
      size < 12 &&
      element.tag &&
      ['p', 'span', 'div', 'li', 'td', 'a'].includes(element.tag) &&
      element.text &&
      element.text.length > 20
    ) {
      smallFontElements.push({
        selector: element.selector || element.tag,
        fontSize: fontSize,
      });
    }
  }

  if (smallFontElements.length > 0) {
    findings.push({
      id: 'readability_small_font',
      category: 'readability',
      severity: 'medium',
      title: `${smallFontElements.length} element(s) have font sizes below 12px`,
      description: `Small font sizes (below 12px) are difficult to read, especially for users with vision impairments or on mobile devices. Body text should generally be at least 12-14px for comfortable reading.`,
      recommendation: `Increase font size for body text to at least 12px (preferably 14-16px). Ensure sufficient contrast regardless of size.`,
      evidence: smallFontElements
        .slice(0, 3)
        .map((el) => ({
          selector: el.selector,
          snippet: `font-size: ${el.fontSize}`,
        })),
      confidence: 0.75,
    });
  }

  return findings;
}
