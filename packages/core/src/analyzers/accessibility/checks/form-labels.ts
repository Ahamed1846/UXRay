import { Finding, PageContext } from '../../../schema/types';

/**
 * Check for form inputs without associated labels
 */
export function checkFormLabels(context: PageContext): Finding[] {
  const findings: Finding[] = [];
  const inputsWithoutLabels = [];

  for (const form of context.forms) {
    for (const input of form.inputs) {
      // Skip hidden, submit, reset, button inputs
      if (['hidden', 'submit', 'reset', 'button'].includes(input.type)) {
        continue;
      }

      if (!input.hasLabel) {
        inputsWithoutLabels.push({ ...input, formId: form.id });
      }
    }
  }

  // Finding: Missing form labels (Critical)
  if (inputsWithoutLabels.length > 0) {
    findings.push({
      id: 'a11y_missing_form_label',
      category: 'accessibility',
      severity: 'critical',
      title: `${inputsWithoutLabels.length} form input(s) missing labels`,
      description:
        'Form inputs without labels are inaccessible to screen reader users and difficult to use on mobile devices. Each input should have an associated <label> element or aria-label.',
      evidence: inputsWithoutLabels.slice(0, 3).map((input) => ({
        selector: input.id || input.name || input.type,
        text: `<input type="${input.type}" ${input.name ? `name="${input.name}"` : ''} />`,
      })),
      recommendation:
        'Add <label for="inputID">Label text</label> for each input, or use aria-label="Label text" if a visible label is not appropriate.',
      confidence: 0.95,
    });
  }

  return findings;
}
