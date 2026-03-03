/**
 * Accessibility Analyzer
 * Checks for:
 * - Image alt text presence and quality
 * - Form labels and accessible names
 * - Heading hierarchy consistency
 * - Keyboard focus visibility
 * - ARIA basics
 * - Color contrast
 */

import type { Analyzer, Finding, PageContext } from '../../schema';

export class AccessibilityAnalyzer implements Analyzer {
  category = 'accessibility' as const;

  async analyze(context: PageContext): Promise<Finding[]> {
    // Implementation will follow in PR #4
    return [];
  }
}
