/**
 * Mobile Usability Analyzer
 * Checks for:
 * - Viewport meta tag presence
 * - Tap target sizes
 * - Layout overflow / horizontal scroll
 * - Responsive breakpoint behavior
 */

import type { Analyzer, Finding, PageContext } from '../../schema';

export class MobileAnalyzer implements Analyzer {
  category = 'mobile' as const;

  async analyze(_context: PageContext): Promise<Finding[]> {
    // Implementation will follow in PR #6
    return [];
  }
}
