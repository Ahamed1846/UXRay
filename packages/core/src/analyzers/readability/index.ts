/**
 * Readability Analyzer
 * Checks for:
 * - Font size and line height
 * - Paragraph density
 * - Line length
 * - Reading level estimation
 * - Content structure
 */

import type { Analyzer, Finding, PageContext } from '../../schema';

export class ReadabilityAnalyzer implements Analyzer {
  category = 'readability' as const;

  async analyze(context: PageContext): Promise<Finding[]> {
    // Implementation will follow in PR #5
    return [];
  }
}
