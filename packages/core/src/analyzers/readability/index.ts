/**
 * Readability Analyzer
 * Checks for:
 * - Font size and line height
 * - Paragraph density
 * - Line length
 * - Reading level estimation
 * - Content structure
 */

import type { PageContext, Finding } from '../../schema/types';
import { checkFleschScore } from './checks/flesch-score';
import { checkFontSizeHeuristic } from './checks/font-size';
import { checkLineLengthHeuristic } from './checks/line-length';
import { checkContentDensity } from './checks/content-density';

export class ReadabilityAnalyzer {
  async analyze(context: PageContext): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Run all readability checks
    findings.push(...this.runFleschCheck(context));
    findings.push(...this.runFontSizeCheck(context));
    findings.push(...this.runLineLengthCheck(context));
    findings.push(...this.runDensityCheck(context));

    return findings;
  }

  private runFleschCheck(context: PageContext): Finding[] {
    try {
      return checkFleschScore(context);
    } catch (error) {
      console.error('[ReadabilityAnalyzer] Error in Flesch score check:', error);
      return [];
    }
  }

  private runFontSizeCheck(context: PageContext): Finding[] {
    try {
      return checkFontSizeHeuristic(context);
    } catch (error) {
      console.error('[ReadabilityAnalyzer] Error in font size check:', error);
      return [];
    }
  }

  private runLineLengthCheck(context: PageContext): Finding[] {
    try {
      return checkLineLengthHeuristic(context);
    } catch (error) {
      console.error('[ReadabilityAnalyzer] Error in line length check:', error);
      return [];
    }
  }

  private runDensityCheck(context: PageContext): Finding[] {
    try {
      return checkContentDensity(context);
    } catch (error) {
      console.error('[ReadabilityAnalyzer] Error in content density check:', error);
      return [];
    }
  }
}
