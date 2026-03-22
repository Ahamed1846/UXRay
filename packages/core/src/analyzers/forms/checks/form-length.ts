import type { PageContext, Finding } from '../../../schema/types';

/**
 * Check for form length and complexity
 * Longer forms have higher abandonment rates
 * Flag forms with excessive fields as they reduce completion rates
 */
export function checkFormLength(context: PageContext): Finding[] {
  const findings: Finding[] = [];

  // Find all form elements
  const formElements = (context.elements || []).filter(
    (el) => el.tag === 'form',
  );

  const longForms: Array<{ selector: string; fieldCount: number }> = [];

  for (const form of formElements) {
    // Count inputs, textareas, selects within this form scope
    const formId = form.attributes?.id;
    const relatedInputs = (context.elements || []).filter((el) => {
      if (!['input', 'textarea', 'select'].includes(el.tag)) {
        return false;
      }

      // Skip hidden fields
      if (el.attributes?.type === 'hidden') {
        return false;
      }

      // Skip submit/reset buttons
      if (['submit', 'reset', 'button'].includes(el.attributes?.type)) {
        return false;
      }

      // If form has ID and element has form attribute, check if they match
      if (formId && el.attributes?.form) {
        return el.attributes.form === formId;
      }

      return true;
    });

    const fieldCount = relatedInputs.length;

    // Flag forms with >15 fields as complex (high abandon rate)
    // Flag forms with >10 fields as long (medium concern)
    if (fieldCount > 15) {
      longForms.push({
        selector: form.selector || `form#${formId || 'unnamed'}`,
        fieldCount,
      });
    }
  }

  if (longForms.length > 0) {
    // Determine severity based on count
    const severity = longForms.some((f) => f.fieldCount > 15) ? 'high' : 'medium';

    findings.push({
      id: 'forms_excessive_length',
      category: 'forms',
      severity,
      title: `Form(s) with excessive field count detected (${longForms.map((f) => f.fieldCount).join(', ')} fields)`,
      description: `Forms with more than 15 fields significantly increase user abandonment rates. Users are more likely to drop off or make errors when facing lengthy forms.`,
      recommendation: 'Break long forms into multiple pages or steps. Group related fields logically. Consider optional fields vs. required. Aim for ≤10 fields per section.',
      evidence: longForms.map((form) => ({
        selector: form.selector,
        snippet: `Form with ${form.fieldCount} fields`,
      })),
      confidence: 0.8,
    });
  }

  // Flag forms with 10-15 fields as medium concern
  const mediumForms = formElements
    .map((form) => {
      const formId = form.attributes?.id;
      const relatedInputs = (context.elements || []).filter((el) => {
        if (!['input', 'textarea', 'select'].includes(el.tag)) {
          return false;
        }
        if (el.attributes?.type === 'hidden') {
          return false;
        }
        if (['submit', 'reset', 'button'].includes(el.attributes?.type)) {
          return false;
        }
        if (formId && el.attributes?.form) {
          return el.attributes.form === formId;
        }
        return true;
      });
      return { form, fieldCount: relatedInputs.length };
    })
    .filter((f) => f.fieldCount >= 10 && f.fieldCount <= 15);

  if (mediumForms.length > 0) {
    findings.push({
      id: 'forms_long_form_warning',
      category: 'forms',
      severity: 'medium',
      title: `${mediumForms.length} form(s) with many fields (${mediumForms.map((f) => f.fieldCount).join(', ')} fields)`,
      description: `Forms with 10-15 fields are moderately long and may experience higher abandonment. Consider if all fields are truly necessary.`,
      recommendation: 'Review form fields for necessity. Move optional sections to a second page if possible. Use progressive disclosure.',
      evidence: mediumForms.slice(0, 2).map((f) => ({
        selector: f.form.selector || `form#${f.form.attributes?.id || 'unnamed'}`,
        snippet: `Form with ${f.fieldCount} fields`,
      })),
      confidence: 0.75,
    });
  }

  return findings;
}
