/**
 * Navigation Clarity Analyzer
 * Checks for:
 * - Navigation item overload (too many top-level items)
 * - Broken anchors and dead links
 * - Footer presence and key links
 * - Duplicate navigation detection
 */

import type { PageContext, Finding } from '../../schema/types';
import { checkNavItemCount } from './checks/nav-item-count';
import { checkBrokenAnchors } from './checks/broken-anchors';
import { checkFooterPresence } from './checks/footer-presence';
import { checkDuplicateNavigation } from './checks/duplicate-navigation';

export class NavigationAnalyzer {
  async analyze(context: PageContext): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Run all navigation clarity checks
    findings.push(...this.runNavCountCheck(context));
    findings.push(...this.runBrokenAnchorCheck(context));
    findings.push(...this.runFooterCheck(context));
    findings.push(...this.runDuplicateNavCheck(context));

    return findings;
  }

  private runNavCountCheck(context: PageContext): Finding[] {
    try {
      return checkNavItemCount(context);
    } catch (error) {
      console.error('[NavigationAnalyzer] Error in nav count check:', error);
      return [];
    }
  }

  private runBrokenAnchorCheck(context: PageContext): Finding[] {
    try {
      return checkBrokenAnchors(context);
    } catch (error) {
      console.error('[NavigationAnalyzer] Error in broken anchor check:', error);
      return [];
    }
  }

  private runFooterCheck(context: PageContext): Finding[] {
    try {
      return checkFooterPresence(context);
    } catch (error) {
      console.error('[NavigationAnalyzer] Error in footer check:', error);
      return [];
    }
  }

  private runDuplicateNavCheck(context: PageContext): Finding[] {
    try {
      return checkDuplicateNavigation(context);
    } catch (error) {
      console.error('[NavigationAnalyzer] Error in duplicate navigation check:', error);
      return [];
    }
  }
}
