import type { PageContext, Finding } from '../../../schema/types';

/**
 * Check for horizontal scroll issues
 * Detects when content overflows viewport width
 * Horizontal scrolling is frustrating on mobile devices
 */
export function checkHorizontalScroll(context: PageContext): Finding[] {
  const findings: Finding[] = [];

  const elements = context.elements || [];

  let overflowElements = 0;
  const offendingElements: Array<{ selector: string; overflow: string }> = [];

  for (const element of elements) {
    if (!element.tag || !element.computedStyle) {
      continue;
    }

    const style = element.computedStyle;
    const overflow = style.overflow || '';
    const overflowX = style.overflowX || '';
    const width = parseFloat(style.width || '0');
    const maxWidth = parseFloat(style.maxWidth || '100%');

    // Check for explicit overflow settings
    if (
      overflow === 'auto' ||
      overflow === 'scroll' ||
      overflowX === 'auto' ||
      overflowX === 'scroll'
    ) {
      // Check if element would overflow on mobile (< 768px)
      if (width > 375 || (width > 0 && !style.maxWidth)) {
        overflowElements++;
        if (offendingElements.length < 3) {
          offendingElements.push({
            selector: element.selector || element.tag,
            overflow: `width: ${width.toFixed(0)}px, overflow: ${overflowX || overflow}`,
          });
        }
      }
    }

    // Check for large fixed-width elements on small viewports
    if (width > 375 && style.position === 'fixed') {
      overflowElements++;
      if (offendingElements.length < 3) {
        offendingElements.push({
          selector: element.selector || element.tag,
          overflow: `fixed width: ${width.toFixed(0)}px (exceeds mobile viewport)`,
        });
      }
    }
  }

  if (overflowElements > 0) {
    findings.push({
      id: 'mobile_horizontal_overflow',
      category: 'mobile',
      severity: 'medium',
      title: `${overflowElements} element(s) may cause horizontal scrolling`,
      description: `Some elements have fixed widths or overflow settings that exceed typical mobile viewport widths (375px). This forces users to scroll horizontally, which is frustrating and breaks the mobile experience.`,
      recommendation: 'Use CSS media queries for mobile breakpoints. Set max-width: 100% on containers. Use flexible layouts (flexbox, grid) instead of fixed widths. Test at common mobile breakpoints (320px, 375px, 768px).',
      evidence: offendingElements.map((el) => ({
        selector: el.selector,
        snippet: el.overflow,
      })),
      confidence: 0.75,
    });
  }

  return findings;
}
