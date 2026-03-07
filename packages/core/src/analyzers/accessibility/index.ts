/**
 * Accessibility Analyzer
 * Checks for:
 * - Image alt text presence and quality
 * - Form labels and accessible names
 * - Heading hierarchy consistency
 * - Color contrast
 * - ARIA basics
 */

import type { Analyzer, Finding, PageContext } from '../../schema';
import { checkAltAttributes } from './checks/alt-attributes';
import { checkFormLabels } from './checks/form-labels';
import { checkHeadingHierarchy } from './checks/heading-hierarchy';
import { checkContrast } from './checks/contrast';
import { checkAriaBasics } from './checks/aria-basics';

export class AccessibilityAnalyzer implements Analyzer {
  category = 'accessibility' as const;

  async analyze(context: PageContext): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Run all accessibility checks
    findings.push(...checkAltAttributes(context));
    findings.push(...checkFormLabels(context));
    findings.push(...checkHeadingHierarchy(context));
    findings.push(...checkContrast(context));
    findings.push(...checkAriaBasics(context));

    return findings;
  }
}
