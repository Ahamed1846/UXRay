import type { PageContext, Finding } from '../../../schema/types';

/**
 * Check for inputs using placeholder-only pattern instead of labels
 * WCAG guideline: placeholders alone are insufficient for form accessibility
 * Placeholders disappear when users start typing, causing confusion
 */
export function checkPlaceholderOnly(context: PageContext): Finding[] {
  const findings: Finding[] = [];

  const elements = context.elements || [];

  const placeholderOnlyInputs: Array<{
    selector: string;
    inputType: string;
    placeholder: string;
  }> = [];

  for (const element of elements) {
    if (!element.tag || element.tag !== 'input') {
      continue;
    }

    const inputType = element.attributes?.type || 'text';

    // Skip hidden, submit, button, reset, checkbox, radio inputs
    if (
      ['hidden', 'submit', 'button', 'reset', 'checkbox', 'radio'].includes(
        inputType,
      )
    ) {
      continue;
    }

    const hasLabel = element.hasLabel;
    const hasAriaLabel = element.attributes?.['aria-label'];
    const hasAriaLabelledby = element.attributes?.['aria-labelledby'];
    const placeholder = element.attributes?.placeholder;

    // Check if input has no label but has placeholder
    if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby && placeholder) {
      placeholderOnlyInputs.push({
        selector: element.selector || `input[type="${inputType}"]`,
        inputType,
        placeholder,
      });
    }
  }

  if (placeholderOnlyInputs.length > 0) {
    findings.push({
      id: 'forms_placeholder_only',
      category: 'forms',
      severity: 'high',
      title: `${placeholderOnlyInputs.length} input(s) use placeholder instead of labels`,
      description: `Form inputs should have associated <label> elements, not rely on placeholders alone. Placeholders disappear when users start typing, making it difficult to understand what field they're in. Screen reader users also won't know the field purpose.`,
      recommendation: 'Replace or supplement placeholders with proper <label> elements. Use <label for="inputId">Label text</label> or aria-label="Label text".',
      evidence: placeholderOnlyInputs.slice(0, 3).map((input) => ({
        selector: input.selector,
        snippet: `<input type="${input.inputType}" placeholder="${input.placeholder}" />`,
      })),
      confidence: 0.92,
    });
  }

  return findings;
}
