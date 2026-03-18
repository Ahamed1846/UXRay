import type { PageContext, Finding } from '../../../schema/types';

/**
 * Check for adequate tap target sizes
 * WCAG 2.1 Level AAA: minimum 44x44 CSS pixels
 * This is a heuristic check based on element dimensions
 */
export function checkTapTargetSize(context: PageContext): Finding[] {
  const findings: Finding[] = [];

  const elements = context.elements || [];

  let smallTargets = 0;
  const offendingElements: Array<{ selector: string; size: string }> = [];

  for (const element of elements) {
    if (!element.tag || !element.computedStyle) {
      continue;
    }

    // Check interactive elements: button, a, input[type=checkbox/radio], select
    const isInteractive = [
      'button',
      'a',
      'input',
      'textarea',
      'select',
      'label',
    ].includes(element.tag);

    if (!isInteractive) {
      continue;
    }

    const style = element.computedStyle;
    const width = parseFloat(style.width || '0');
    const height = parseFloat(style.height || '0');

    // Check if element is actually clickable (has dimensions)
    if (width === 0 || height === 0) {
      continue;
    }

    // Convert pixels to numbers and check against WCAG AAA minimum (44x44)
    // Use 36px as a more practical threshold for mobile usability
    if (width < 36 || height < 36) {
      smallTargets++;
      if (offendingElements.length < 3) {
        offendingElements.push({
          selector: element.selector || element.tag,
          size: `${width.toFixed(0)}x${height.toFixed(0)}px`,
        });
      }
    }
  }

  if (smallTargets > 0) {
    findings.push({
      id: 'mobile_small_tap_targets',
      category: 'mobile',
      severity: 'high',
      title: `${smallTargets} tap target(s) are smaller than 36x36 pixels`,
      description: `Interactive elements (buttons, links, inputs) should be at least 36x36 pixels (ideally 44x44px per WCAG AAA). Small targets are difficult to tap accurately on mobile devices and frustrate users.`,
      recommendation: 'Increase button/link sizes to at least 36x36px. Add padding around smaller elements. Ensure spacing between targets (min 8px) to prevent accidental taps.',
      evidence: offendingElements.map((el) => ({
        selector: el.selector,
        snippet: `Size: ${el.size} (min 36x36px)`,
      })),
      confidence: 0.8,
    });
  }

  return findings;
}
