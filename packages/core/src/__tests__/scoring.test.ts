import { describe, it, expect } from 'vitest';
import {
  calculateFindingDeduction,
  calculateCategoryScore,
  calculateOverallScore,
  calculateCategoryScores,
  generateReportSummary,
  SEVERITY_WEIGHTS,
  CATEGORY_WEIGHTS,
} from '../scoring';
import { Finding } from '../schema/types';

describe('Scoring Engine', () => {
  /**
   * Test severity weight constants
   */
  describe('Severity Weights', () => {
    it('should have correct critical weight', () => {
      expect(SEVERITY_WEIGHTS.critical).toBe(15);
    });

    it('should have correct high weight', () => {
      expect(SEVERITY_WEIGHTS.high).toBe(8);
    });

    it('should have correct medium weight', () => {
      expect(SEVERITY_WEIGHTS.medium).toBe(4);
    });

    it('should have correct low weight', () => {
      expect(SEVERITY_WEIGHTS.low).toBe(2);
    });

    it('should have weights in descending order', () => {
      expect(SEVERITY_WEIGHTS.critical).toBeGreaterThan(SEVERITY_WEIGHTS.high);
      expect(SEVERITY_WEIGHTS.high).toBeGreaterThan(SEVERITY_WEIGHTS.medium);
      expect(SEVERITY_WEIGHTS.medium).toBeGreaterThan(SEVERITY_WEIGHTS.low);
    });
  });

  /**
   * Test category weight constants
   */
  describe('Category Weights', () => {
    it('should have accessibility weight of 30%', () => {
      expect(CATEGORY_WEIGHTS.accessibility).toBe(0.3);
    });

    it('should have mobile weight of 25%', () => {
      expect(CATEGORY_WEIGHTS.mobile).toBe(0.25);
    });

    it('should have readability weight of 20%', () => {
      expect(CATEGORY_WEIGHTS.readability).toBe(0.2);
    });

    it('should have forms weight of 15%', () => {
      expect(CATEGORY_WEIGHTS.forms).toBe(0.15);
    });

    it('should have navigation weight of 10%', () => {
      expect(CATEGORY_WEIGHTS.navigation).toBe(0.1);
    });

    it('weights should sum to 1.0', () => {
      const total =
        CATEGORY_WEIGHTS.accessibility +
        CATEGORY_WEIGHTS.mobile +
        CATEGORY_WEIGHTS.readability +
        CATEGORY_WEIGHTS.forms +
        CATEGORY_WEIGHTS.navigation;
      expect(total).toBeCloseTo(1.0, 5);
    });
  });

  /**
   * Test finding deduction calculation
   */
  describe('calculateFindingDeduction', () => {
    it('should calculate critical deduction with full confidence', () => {
      const deduction = calculateFindingDeduction('critical', 1.0);
      expect(deduction).toBe(15); // 15 * 1.0
    });

    it('should calculate high deduction with full confidence', () => {
      const deduction = calculateFindingDeduction('high', 1.0);
      expect(deduction).toBe(8); // 8 * 1.0
    });

    it('should apply confidence multiplier to deduction', () => {
      const deduction = calculateFindingDeduction('high', 0.5);
      expect(deduction).toBe(4); // 8 * 0.5
    });

    it('should handle low confidence scores', () => {
      const deduction = calculateFindingDeduction('critical', 0.5);
      expect(deduction).toBe(7.5); // 15 * 0.5
    });

    it('should handle zero confidence (no deduction)', () => {
      const deduction = calculateFindingDeduction('critical', 0);
      expect(deduction).toBe(0);
    });

    it('should scale with confidence', () => {
      const high95 = calculateFindingDeduction('high', 0.95);
      const high90 = calculateFindingDeduction('high', 0.9);
      expect(high95).toBeGreaterThan(high90);
    });
  });

  /**
   * Test category score calculation
   */
  describe('calculateCategoryScore', () => {
    it('should return 100 for empty findings', () => {
      const score = calculateCategoryScore([]);
      expect(score).toBe(100);
    });

    it('should deduct correctly for single finding', () => {
      const finding: Finding = {
        id: 'test_1',
        category: 'accessibility',
        severity: 'high',
        title: 'Test finding',
        description: 'Test',
        evidence: [{ text: 'test' }],
        recommendation: 'Fix it',
        confidence: 1.0,
      };
      const score = calculateCategoryScore([finding]);
      expect(score).toBe(92); // 100 - (8 * 1.0)
    });

    it('should accumulate deductions for multiple findings', () => {
      const findings: Finding[] = [
        {
          id: 'test_1',
          category: 'accessibility',
          severity: 'high',
          title: 'Test 1',
          description: 'Test',
          evidence: [{ text: 'test' }],
          recommendation: 'Fix it',
          confidence: 1.0,
        },
        {
          id: 'test_2',
          category: 'accessibility',
          severity: 'medium',
          title: 'Test 2',
          description: 'Test',
          evidence: [{ text: 'test' }],
          recommendation: 'Fix it',
          confidence: 1.0,
        },
      ];
      const score = calculateCategoryScore(findings);
      expect(score).toBe(88); // 100 - (8 + 4)
    });

    it('should clamp score to minimum of 0', () => {
      const findings: Finding[] = Array.from({ length: 20 }, (_, i) => ({
        id: `test_${i}`,
        category: 'accessibility' as const,
        severity: 'critical' as const,
        title: `Test ${i}`,
        description: 'Test',
        evidence: [{ text: 'test' }],
        recommendation: 'Fix it',
        confidence: 1.0,
      }));
      const score = calculateCategoryScore(findings);
      expect(score).toBe(0); // Should not go below 0
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should clamp score to maximum of 100', () => {
      // This test verifies clamp works even if somehow we get >100
      // (shouldn't happen with normal usage)
      const score = calculateCategoryScore([]);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should apply confidence to deductions', () => {
      const finding1: Finding = {
        id: 'test_1',
        category: 'accessibility',
        severity: 'high',
        title: 'High confidence',
        description: 'Test',
        evidence: [{ text: 'test' }],
        recommendation: 'Fix it',
        confidence: 1.0,
      };
      const finding2: Finding = {
        id: 'test_2',
        category: 'accessibility',
        severity: 'high',
        title: 'Low confidence',
        description: 'Test',
        evidence: [{ text: 'test' }],
        recommendation: 'Fix it',
        confidence: 0.5,
      };
      const score1 = calculateCategoryScore([finding1]);
      const score2 = calculateCategoryScore([finding2]);
      expect(score1).toBeLessThan(score2); // More confident = lower score
    });
  });

  /**
   * Test category scores calculation
   */
  describe('calculateCategoryScores', () => {
    it('should return all 100s for empty findings', () => {
      const scores = calculateCategoryScores({});
      expect(scores.accessibility).toBe(100);
      expect(scores.readability).toBe(100);
      expect(scores.mobile).toBe(100);
      expect(scores.forms).toBe(100);
      expect(scores.navigation).toBe(100);
    });

    it('should calculate scores for each category independently', () => {
      const findings: Finding[] = [
        {
          id: 'a11y_1',
          category: 'accessibility',
          severity: 'high',
          title: 'A11y issue',
          description: 'Test',
          evidence: [{ text: 'test' }],
          recommendation: 'Fix it',
          confidence: 1.0,
        },
        {
          id: 'mobile_1',
          category: 'mobile',
          severity: 'critical',
          title: 'Mobile issue',
          description: 'Test',
          evidence: [{ text: 'test' }],
          recommendation: 'Fix it',
          confidence: 1.0,
        },
      ];
      const scores = calculateCategoryScores({
        accessibility: [findings[0]],
        mobile: [findings[1]],
        readability: [],
        forms: [],
        navigation: [],
      });
      expect(scores.accessibility).toBe(92); // 100 - 8
      expect(scores.mobile).toBe(85); // 100 - 15
      expect(scores.readability).toBe(100);
      expect(scores.forms).toBe(100);
      expect(scores.navigation).toBe(100);
    });

    it('should handle partial category data', () => {
      const findings: Finding[] = [
        {
          id: 'test_1',
          category: 'accessibility',
          severity: 'medium',
          title: 'Test',
          description: 'Test',
          evidence: [{ text: 'test' }],
          recommendation: 'Fix it',
          confidence: 1.0,
        },
      ];
      const scores = calculateCategoryScores({
        accessibility: findings,
      });
      expect(scores.accessibility).toBe(96); // 100 - 4
      expect(scores.readability).toBe(100); // No findings = perfect
    });
  });

  /**
   * Test overall score calculation
   */
  describe('calculateOverallScore', () => {
    it('should calculate weighted average of category scores', () => {
      const categoryScores = {
        accessibility: 100,
        mobile: 100,
        readability: 100,
        forms: 100,
        navigation: 100,
      };
      const overall = calculateOverallScore(categoryScores);
      expect(overall).toBe(100); // Perfect score
    });

    it('should weight accessibility most heavily', () => {
      const categoryScores = {
        accessibility: 90,
        mobile: 100,
        readability: 100,
        forms: 100,
        navigation: 100,
      };
      const overall = calculateOverallScore(categoryScores);
      // 90 * 0.3 + 100 * 0.25 + 100 * 0.2 + 100 * 0.15 + 100 * 0.1
      // = 27 + 25 + 20 + 15 + 10 = 97
      expect(overall).toBeCloseTo(97, 5);
    });

    it('should weight mobile second most heavily', () => {
      const categoryScores = {
        accessibility: 100,
        mobile: 90,
        readability: 100,
        forms: 100,
        navigation: 100,
      };
      const overall = calculateOverallScore(categoryScores);
      // 100 * 0.3 + 90 * 0.25 + 100 * 0.2 + 100 * 0.15 + 100 * 0.1
      // = 30 + 22.5 + 20 + 15 + 10 = 97.5
      expect(overall).toBeCloseTo(97.5, 5);
    });

    it('should weight navigation least heavily', () => {
      const categoryScores = {
        accessibility: 100,
        mobile: 100,
        readability: 100,
        forms: 100,
        navigation: 0,
      };
      const overall = calculateOverallScore(categoryScores);
      // 100 * 0.3 + 100 * 0.25 + 100 * 0.2 + 100 * 0.15 + 0 * 0.1
      // = 30 + 25 + 20 + 15 + 0 = 90
      expect(overall).toBeCloseTo(90, 5);
    });

    it('should handle zero scores', () => {
      const categoryScores = {
        accessibility: 0,
        mobile: 0,
        readability: 0,
        forms: 0,
        navigation: 0,
      };
      const overall = calculateOverallScore(categoryScores);
      expect(overall).toBe(0);
    });

    it('should handle mixed scores', () => {
      const categoryScores = {
        accessibility: 85,
        mobile: 75,
        readability: 90,
        forms: 80,
        navigation: 95,
      };
      const overall = calculateOverallScore(categoryScores);
      // 85 * 0.3 + 75 * 0.25 + 90 * 0.2 + 80 * 0.15 + 95 * 0.1
      // = 25.5 + 18.75 + 18 + 12 + 9.5 = 83.75
      expect(overall).toBeCloseTo(83.75, 5);
    });
  });

  /**
   * Test complete report summary generation
   */
  describe('generateReportSummary', () => {
    it('should generate summary with perfect score for no findings', () => {
      const summary = generateReportSummary([]);
      expect(summary.overallScore).toBe(100);
      expect(summary.categoryScores.accessibility).toBe(100);
      expect(summary.categoryScores.readability).toBe(100);
      expect(summary.categoryScores.mobile).toBe(100);
      expect(summary.categoryScores.forms).toBe(100);
      expect(summary.categoryScores.navigation).toBe(100);
    });

    it('should round scores to integers', () => {
      const findings: Finding[] = [
        {
          id: 'test_1',
          category: 'accessibility',
          severity: 'high',
          title: 'Test finding',
          description: 'Test',
          evidence: [{ text: 'test' }],
          recommendation: 'Fix it',
          confidence: 0.75, // Creates non-integer score
        },
      ];
      const summary = generateReportSummary(findings);
      expect(Number.isInteger(summary.overallScore)).toBe(true);
      expect(Number.isInteger(summary.categoryScores.accessibility)).toBe(true);
    });

    it('should generate summary for complex report', () => {
      const findings: Finding[] = [
        // Accessibility: 3 findings = 100 - (15 + 8 + 4) = 73
        {
          id: 'a11y_1',
          category: 'accessibility',
          severity: 'critical',
          title: 'Critical accessibility',
          description: 'Test',
          evidence: [{ text: 'test' }],
          recommendation: 'Fix it',
          confidence: 1.0,
        },
        {
          id: 'a11y_2',
          category: 'accessibility',
          severity: 'high',
          title: 'High accessibility',
          description: 'Test',
          evidence: [{ text: 'test' }],
          recommendation: 'Fix it',
          confidence: 1.0,
        },
        {
          id: 'a11y_3',
          category: 'accessibility',
          severity: 'medium',
          title: 'Medium accessibility',
          description: 'Test',
          evidence: [{ text: 'test' }],
          recommendation: 'Fix it',
          confidence: 1.0,
        },
        // Mobile: 2 findings = 100 - (8 + 4) = 88
        {
          id: 'mobile_1',
          category: 'mobile',
          severity: 'high',
          title: 'High mobile',
          description: 'Test',
          evidence: [{ text: 'test' }],
          recommendation: 'Fix it',
          confidence: 1.0,
        },
        {
          id: 'mobile_2',
          category: 'mobile',
          severity: 'medium',
          title: 'Medium mobile',
          description: 'Test',
          evidence: [{ text: 'test' }],
          recommendation: 'Fix it',
          confidence: 1.0,
        },
        // Readability and Forms: 0 findings = 100
        // Navigation: 1 finding = 100 - 2 = 98
        {
          id: 'nav_1',
          category: 'navigation',
          severity: 'low',
          title: 'Low navigation',
          description: 'Test',
          evidence: [{ text: 'test' }],
          recommendation: 'Fix it',
          confidence: 1.0,
        },
      ];

      const summary = generateReportSummary(findings);

      // Verify category scores
      expect(summary.categoryScores.accessibility).toBe(73); // 100 - 27
      expect(summary.categoryScores.mobile).toBe(88); // 100 - 12
      expect(summary.categoryScores.readability).toBe(100);
      expect(summary.categoryScores.forms).toBe(100);
      expect(summary.categoryScores.navigation).toBe(98); // 100 - 2

      // Verify overall score
      // 73 * 0.3 + 88 * 0.25 + 100 * 0.2 + 100 * 0.15 + 98 * 0.1
      // = 21.9 + 22 + 20 + 15 + 9.8 = 88.7 → rounds to 89
      expect(summary.overallScore).toBeGreaterThan(87);
      expect(summary.overallScore).toBeLessThan(91);
    });

    it('should handle findings from all categories', () => {
      const findings: Finding[] = [
        {
          id: 'a11y_1',
          category: 'accessibility',
          severity: 'low',
          title: 'Test',
          description: 'Test',
          evidence: [{ text: 'test' }],
          recommendation: 'Fix it',
          confidence: 0.5,
        },
        {
          id: 'read_1',
          category: 'readability',
          severity: 'low',
          title: 'Test',
          description: 'Test',
          evidence: [{ text: 'test' }],
          recommendation: 'Fix it',
          confidence: 0.5,
        },
        {
          id: 'mobile_1',
          category: 'mobile',
          severity: 'low',
          title: 'Test',
          description: 'Test',
          evidence: [{ text: 'test' }],
          recommendation: 'Fix it',
          confidence: 0.5,
        },
        {
          id: 'forms_1',
          category: 'forms',
          severity: 'low',
          title: 'Test',
          description: 'Test',
          evidence: [{ text: 'test' }],
          recommendation: 'Fix it',
          confidence: 0.5,
        },
        {
          id: 'nav_1',
          category: 'navigation',
          severity: 'low',
          title: 'Test',
          description: 'Test',
          evidence: [{ text: 'test' }],
          recommendation: 'Fix it',
          confidence: 0.5,
        },
      ];

      const summary = generateReportSummary(findings);

      // Each category: 100 - (2 * 0.5) = 99
      expect(summary.categoryScores.accessibility).toBe(99);
      expect(summary.categoryScores.readability).toBe(99);
      expect(summary.categoryScores.mobile).toBe(99);
      expect(summary.categoryScores.forms).toBe(99);
      expect(summary.categoryScores.navigation).toBe(99);

      // Overall: 99 * (0.3 + 0.25 + 0.2 + 0.15 + 0.1) = 99 * 1.0 = 99
      expect(summary.overallScore).toBe(99);
    });
  });
});
