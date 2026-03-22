import type { PageContext, Finding } from '../../../schema/types';

/**
 * Check for required fields that are not clearly marked
 * Users need to know which fields are mandatory
 * Missing visual indicators or aria-required attributes harm usability
 */
export function checkRequiredFieldMarking(context: PageContext): Finding[] {
  const findings: Finding[] = [];

  const elements = context.elements || [];

  const unmarkedRequiredFields: Array<{
    selector: string;
    fieldLabel: string;
  }> = [];

  for (const element of elements) {
    if (!element.tag || !['input', 'textarea', 'select'].includes(element.tag)) {
      continue;
    }

    const isRequired = element.attributes?.required !== undefined;
    const hasAriaRequired =
      element.attributes?.['aria-required'] === 'true';

    // Skip if not required
    if (!isRequired && !hasAriaRequired) {
      continue;
    }

    // Check for visual indicators in form label or nearby text
    const labelText = element.label || '';
    const hasVisualIndicator =
      labelText.includes('*') ||
      labelText.includes('required') ||
      labelText.includes('(required)');

    // If required but no visual indicator, flag it
    if (!hasVisualIndicator) {
      const fieldLabel =
        element.label ||
        element.attributes?.placeholder ||
        element.attributes?.['aria-label'] ||
        `${element.tag}#${element.attributes?.id || 'unnamed'}`;

      unmarkedRequiredFields.push({
        selector: element.selector || element.tag,
        fieldLabel,
      });
    }
  }

  if (unmarkedRequiredFields.length > 0) {
    findings.push({
      id: 'forms_missing_required_indicator',
      category: 'forms',
      severity: 'high',
      title: `${unmarkedRequiredFields.length} required field(s) not visually marked`,
      description: `Required form fields should be clearly marked with a visual indicator (*, "required", or similar). Without this, users may not realize certain fields must be filled in, leading to form submission errors and frustration.`,
      recommendation: 'Add a visual indicator to all required field labels. Use an asterisk (*) or the word "required" in the label. Ensure it\'s also marked with the required attribute or aria-required="true".',
      evidence: unmarkedRequiredFields.slice(0, 3).map((field) => ({
        selector: field.selector,
        snippet: `Field: "${field.fieldLabel}" - missing visual indicator`,
      })),
      confidence: 0.85,
    });
  }

  return findings;
}
