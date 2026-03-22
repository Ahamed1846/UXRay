/**
 * Form Experience Analyzer
 * Checks for:
 * - Placeholder-only input detection (accessibility issue)
 * - Required field marking visibility
 * - Form length / field count heuristics
 * - Password field UX (visibility toggle, requirements visibility)
 */

import type { PageContext, Finding } from '../../schema/types';
import { checkPlaceholderOnly } from './checks/placeholder-only';
import { checkRequiredFieldMarking } from './checks/required-marking';
import { checkFormLength } from './checks/form-length';
import { checkPasswordVisibility } from './checks/password-visibility';

export class FormAnalyzer {
  async analyze(context: PageContext): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Run all form experience checks
    findings.push(...this.runPlaceholderCheck(context));
    findings.push(...this.runRequiredFieldCheck(context));
    findings.push(...this.runFormLengthCheck(context));
    findings.push(...this.runPasswordCheck(context));

    return findings;
  }

  private runPlaceholderCheck(context: PageContext): Finding[] {
    try {
      return checkPlaceholderOnly(context);
    } catch (error) {
      console.error('[FormAnalyzer] Error in placeholder check:', error);
      return [];
    }
  }

  private runRequiredFieldCheck(context: PageContext): Finding[] {
    try {
      return checkRequiredFieldMarking(context);
    } catch (error) {
      console.error('[FormAnalyzer] Error in required field check:', error);
      return [];
    }
  }

  private runFormLengthCheck(context: PageContext): Finding[] {
    try {
      return checkFormLength(context);
    } catch (error) {
      console.error('[FormAnalyzer] Error in form length check:', error);
      return [];
    }
  }

  private runPasswordCheck(context: PageContext): Finding[] {
    try {
      return checkPasswordVisibility(context);
    } catch (error) {
      console.error('[FormAnalyzer] Error in password visibility check:', error);
      return [];
    }
  }
}
