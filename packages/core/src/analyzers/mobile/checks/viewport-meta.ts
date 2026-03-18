import type { PageContext, Finding } from '../../../schema/types';

/**
 * Check for viewport meta tag configuration
 * WCAG and mobile best practice: viewport meta tag should be present
 * Should contain: width=device-width, initial-scale=1
 */
export function checkViewportMeta(context: PageContext): Finding[] {
  const findings: Finding[] = [];

  const html = context.html || '';

  // Check for viewport meta tag
  const viewportMatch = html.match(/<meta\s+name=["']viewport["'][^>]*>/i);

  if (!viewportMatch) {
    findings.push({
      id: 'mobile_missing_viewport',
      category: 'mobile',
      severity: 'high',
      title: 'Missing viewport meta tag',
      description: 'The page lacks a viewport meta tag, which is essential for mobile devices. Without it, mobile browsers may render the page at desktop width, forcing users to zoom and scroll horizontally.',
      recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the <head> section.',
      evidence: [],
      confidence: 0.95,
    });
    return findings;
  }

  // Parse viewport content
  const contentMatch = viewportMatch[0].match(/content=["']([^"']*)["']/i);
  if (!contentMatch) {
    findings.push({
      id: 'mobile_viewport_malformed',
      category: 'mobile',
      severity: 'high',
      title: 'Viewport meta tag is malformed',
      description: 'The viewport meta tag exists but is not properly configured. It should contain width=device-width and initial-scale=1.',
      recommendation: 'Ensure the viewport meta tag has: content="width=device-width, initial-scale=1"',
      evidence: [{ snippet: viewportMatch[0] }],
      confidence: 0.9,
    });
    return findings;
  }

  const content = contentMatch[1].toLowerCase();
  const hasDeviceWidth = /width\s*=\s*device-width/i.test(content);
  const hasInitialScale = /initial-scale\s*=\s*1/i.test(content);

  if (!hasDeviceWidth || !hasInitialScale) {
    findings.push({
      id: 'mobile_viewport_incomplete',
      category: 'mobile',
      severity: 'medium',
      title: 'Viewport meta tag is incomplete',
      description: `The viewport meta tag is missing critical settings. Found: "${content}". Should include width=device-width and initial-scale=1.`,
      recommendation: 'Update to: <meta name="viewport" content="width=device-width, initial-scale=1">',
      evidence: [{ snippet: viewportMatch[0] }],
      confidence: 0.85,
    });
  }

  return findings;
}
