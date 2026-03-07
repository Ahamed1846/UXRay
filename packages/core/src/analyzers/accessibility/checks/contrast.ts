import { Finding, PageContext } from '../../../schema/types';

/**
 * Simple contrast heuristic based on common HTML patterns
 * This is not a full WCAG contrast checker, but catches common issues
 */
export function checkContrast(context: PageContext): Finding[] {
  const findings: Finding[] = [];

  // This is a heuristic check - we look for patterns that commonly indicate low contrast
  // Since we're working with static HTML (no computed styles), we check:
  // 1. Text color that might be very light (high hex values)
  // 2. Common gray colors that indicate low contrast

  const htmlLower = context.html.toLowerCase();

  // Check for very light colors: #AAA, #BBB, #CCC, #DDD, #EEE, #FFF (both 3 and 6 char forms)
  const lightColorPattern = /color:\s*#([a-f9]{1}[a-f0-9]{2}|[a-f9]{3})[^a-f0-9]/gi;
  const hasLightText = lightColorPattern.test(htmlLower);

  // Also check for #AAAAAA style 6-char hex codes
  htmlLower.replace(lightColorPattern, '');
  const sixCharLightPattern = /color:\s*#[a-f9]{6}(?:;|}|'|"|\s)/gi;
  const hasSixCharLight = sixCharLightPattern.test(htmlLower);

  if (hasLightText || hasSixCharLight) {
    findings.push({
      id: 'a11y_potential_low_contrast',
      category: 'accessibility',
      severity: 'high',
      title: 'Potential low contrast text detected',
      description:
        'Some text appears to use very light colors that may not meet WCAG AA contrast requirements (4.5:1 for normal text, 3:1 for large text).',
      evidence: [
        {
          text: 'Found inline color styles with light text colors (e.g., #CCC, #DDD, #EEE, #FFF)',
        },
      ],
      recommendation:
        'Use WCAG contrast checker (e.g., WebAIM contrast tool) to verify text-background contrast meets 4.5:1 for normal text. Darken text or lighten background as needed.',
      confidence: 0.6,
    });
  }

  return findings;
}


