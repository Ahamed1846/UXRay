/**
 * Mobile Usability Analyzer
 * Checks for:
 * - Viewport meta tag presence
 * - Tap target sizes
 * - Layout overflow / horizontal scroll
 * - Responsive breakpoint behavior
 */

import type { PageContext, Finding } from '../../schema/types';
import { checkViewportMeta } from './checks/viewport-meta';
import { checkTapTargetSize } from './checks/tap-targets';
import { checkHorizontalScroll } from './checks/horizontal-scroll';
import { checkResponsiveDesign } from './checks/responsive-design';

export class MobileAnalyzer {
  async analyze(context: PageContext): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Run all mobile usability checks
    findings.push(...this.runViewportCheck(context));
    findings.push(...this.runTapTargetCheck(context));
    findings.push(...this.runScrollCheck(context));
    findings.push(...this.runResponsiveCheck(context));

    return findings;
  }

  private runViewportCheck(context: PageContext): Finding[] {
    try {
      return checkViewportMeta(context);
    } catch (error) {
      console.error('[MobileAnalyzer] Error in viewport check:', error);
      return [];
    }
  }

  private runTapTargetCheck(context: PageContext): Finding[] {
    try {
      return checkTapTargetSize(context);
    } catch (error) {
      console.error('[MobileAnalyzer] Error in tap target check:', error);
      return [];
    }
  }

  private runScrollCheck(context: PageContext): Finding[] {
    try {
      return checkHorizontalScroll(context);
    } catch (error) {
      console.error('[MobileAnalyzer] Error in horizontal scroll check:', error);
      return [];
    }
  }

  private runResponsiveCheck(context: PageContext): Finding[] {
    try {
      return checkResponsiveDesign(context);
    } catch (error) {
      console.error('[MobileAnalyzer] Error in responsive design check:', error);
      return [];
    }
  }
}
