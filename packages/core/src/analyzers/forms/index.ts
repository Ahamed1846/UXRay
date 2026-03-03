/**
 * Forms Analyzer
 * Checks for:
 * - Missing labels / placeholder-only fields
 * - Required fields not marked
 * - Error message UX heuristics
 * - Password requirements visibility
 * - Form length complexity
 */

import type { Analyzer, Finding, PageContext } from '../../schema';

export class FormsAnalyzer implements Analyzer {
  category = 'forms' as const;

  async analyze(context: PageContext): Promise<Finding[]> {
    // Implementation will follow in PR #7
    return [];
  }
}
