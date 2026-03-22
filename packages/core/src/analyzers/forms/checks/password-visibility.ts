import type { PageContext, Finding } from '../../../schema/types';

/**
 * Check for password field visibility requirements heuristic
 * Password requirements should be visible and clear to users
 * Users can't follow rules they can't see
 * Also checks for adequate password field labeling
 */
export function checkPasswordVisibility(context: PageContext): Finding[] {
  const findings: Finding[] = [];

  const elements = context.elements || [];

  // Find all password inputs
  const passwordInputs = elements.filter(
    (el) => el.tag === 'input' && el.attributes?.type === 'password',
  );

  if (passwordInputs.length === 0) {
    return findings;
  }

  // Check for password visibility toggle button (show/hide password)
  const hasVisibilityToggle = elements.some(
    (el) =>
      el.attributes?.['aria-label']?.toLowerCase().includes('show') ||
      el.attributes?.['aria-label']?.toLowerCase().includes('visibility') ||
      el.text?.toLowerCase().includes('show password') ||
      el.text?.toLowerCase().includes('reveal'),
  );

  // Check for nearby password requirements text
  const pageText = context.text || '';
  const hasVisibleRequirements =
    /password.*(?:must|should|require)/i.test(pageText) &&
    /(?:uppercase|lowercase|number|special|character|length|[0-9]+ ?char)/i.test(
      pageText,
    );

  // Check password field labeling
  const poorlyLabeledPasswords = passwordInputs.filter(
    (pwd) => !pwd.label && !pwd.attributes?.['aria-label'],
  );

  let issueCount = 0;
  const issues: string[] = [];

  if (!hasVisibilityToggle) {
    issueCount++;
    issues.push('password visibility toggle');
  }

  if (!hasVisibleRequirements) {
    issueCount++;
    issues.push('visible requirements');
  }

  if (poorlyLabeledPasswords.length > 0) {
    issueCount++;
    issues.push('poor password field labels');
  }

  if (issueCount === 0) {
    return findings;
  }

  findings.push({
    id: 'forms_password_ux',
    category: 'forms',
    severity: issueCount >= 2 ? 'high' : 'medium',
    title: `Password field(s) missing ${issueCount > 1 ? 'multiple UX features' : 'UX features'}: ${issues.join(', ')}`,
    description: `Password fields should have: (1) A show/hide password toggle for visibility, (2) Clear visible password requirements, (3) Proper labels. Without these, users struggle to create valid passwords and may abandon the form.`,
    recommendation: 'Add a show/hide password toggle button. Display password requirements near the input. Ensure password field has a clear label. Consider password strength meter.',
    evidence: [
      ...(poorlyLabeledPasswords.length > 0
        ? [
            {
              selector:
                poorlyLabeledPasswords[0].selector ||
                'input[type="password"]',
              snippet: 'Password input without label or aria-label',
            },
          ]
        : []),
      ...(!hasVisibilityToggle
        ? [{ selector: 'password-input', snippet: 'No show/hide toggle found' }]
        : []),
      ...(!hasVisibleRequirements
        ? [{ selector: 'page', snippet: 'Requirements not visible on page' }]
        : []),
    ],
    confidence: 0.78,
  });

  return findings;
}
