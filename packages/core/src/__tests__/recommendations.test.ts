import { describe, it, expect } from 'vitest';
import {
  enhanceWithRecommendations,
  generateRecommendationsReport,
  getTopRecommendations,
  getActionPlan,
} from '../recommendations';
import { Finding } from '../schema/types';

describe('Recommendation Engine', () => {
  /**
   * Test data: sample findings
   */
  const sampleFindings: Finding[] = [
    {
      id: 'a11y_missing_alt',
      category: 'accessibility',
      severity: 'critical',
      title: 'Missing image alt text',
      description: 'Some images lack alt attributes',
      evidence: [{ selector: 'img', snippet: '<img src="logo.png">' }],
      recommendation: 'Add alt text',
      confidence: 0.95,
    },
    {
      id: 'readability_flesch_score',
      category: 'readability',
      severity: 'high',
      title: 'Difficult reading level',
      description: 'Content is too difficult',
      evidence: [{ text: 'Lorem ipsum' }],
      recommendation: 'Simplify content',
      confidence: 0.8,
    },
    {
      id: 'mobile_no_viewport',
      category: 'mobile',
      severity: 'critical',
      title: 'No viewport meta tag',
      description: 'Missing viewport configuration',
      evidence: [{ selector: 'head', snippet: '<head></head>' }],
      recommendation: 'Add viewport meta tag',
      confidence: 0.99,
    },
    {
      id: 'forms_placeholder_only',
      category: 'forms',
      severity: 'high',
      title: 'Placeholder-only labels',
      description: 'Input fields use placeholders as labels',
      evidence: [{ selector: 'input', snippet: '<input placeholder="...">' }],
      recommendation: 'Add proper labels',
      confidence: 0.92,
    },
    {
      id: 'nav_broken_anchors',
      category: 'navigation',
      severity: 'high',
      title: 'Broken anchor links',
      description: 'Some anchor links target non-existent IDs',
      evidence: [{ selector: 'a[href="#"]', snippet: '<a href="#missing">' }],
      recommendation: 'Fix anchor targets',
      confidence: 0.95,
    },
  ];

  describe('enhanceWithRecommendations', () => {
    it('should enhance findings with recommendations', () => {
      const enhanced = enhanceWithRecommendations([sampleFindings[0]]);
      expect(enhanced).toHaveLength(1);
      expect(enhanced[0].priority).toBeDefined();
      expect(enhanced[0].suggestedFix).toBeDefined();
    });

    it('should add priority to findings', () => {
      const enhanced = enhanceWithRecommendations(sampleFindings);
      expect(enhanced.every((f) => ['immediate', 'important', 'nice-to-have'].includes(f.priority))).toBe(true);
    });

    it('should add suggested fix text', () => {
      const enhanced = enhanceWithRecommendations([sampleFindings[0]]);
      expect(enhanced[0].suggestedFix).toBeTruthy();
      expect(enhanced[0].suggestedFix.length).toBeGreaterThan(0);
    });

    it('should preserve original finding data', () => {
      const enhanced = enhanceWithRecommendations([sampleFindings[0]]);
      expect(enhanced[0].id).toBe(sampleFindings[0].id);
      expect(enhanced[0].title).toBe(sampleFindings[0].title);
      expect(enhanced[0].severity).toBe(sampleFindings[0].severity);
    });

    it('should map all finding IDs to recommendations', () => {
      const enhanced = enhanceWithRecommendations(sampleFindings);
      expect(enhanced).toHaveLength(5);
      enhanced.forEach((finding) => {
        expect(finding.priority).toBeDefined();
        expect(finding.suggestedFix).toBeDefined();
      });
    });

    it('should add resources for certain findings', () => {
      const enhanced = enhanceWithRecommendations([sampleFindings[0]]);
      expect(enhanced[0].resources).toBeDefined();
      if (enhanced[0].resources) {
        expect(Array.isArray(enhanced[0].resources)).toBe(true);
      }
    });
  });

  describe('generateRecommendationsReport', () => {
    it('should generate report with total findings count', () => {
      const report = generateRecommendationsReport(sampleFindings);
      expect(report.totalFindings).toBe(5);
    });

    it('should count findings by priority', () => {
      const report = generateRecommendationsReport(sampleFindings);
      expect(report.immediateCount).toBeGreaterThanOrEqual(0);
      expect(report.importantCount).toBeGreaterThanOrEqual(0);
      expect(report.niceToHaveCount).toBeGreaterThanOrEqual(0);
      expect(
        report.immediateCount + report.importantCount + report.niceToHaveCount,
      ).toBe(report.totalFindings);
    });

    it('should include all findings in report', () => {
      const report = generateRecommendationsReport(sampleFindings);
      expect(report.findings).toHaveLength(5);
      expect(report.findings.every((f) => f.priority)).toBe(true);
    });

    it('should generate category insights', () => {
      const report = generateRecommendationsReport(sampleFindings);
      expect(report.categoryInsights.length).toBeGreaterThan(0);
      report.categoryInsights.forEach((insight) => {
        expect(insight.category).toBeTruthy();
        expect(insight.findingCount).toBeGreaterThan(0);
        expect(insight.topPriority).toBeDefined();
        expect(insight.summary).toBeTruthy();
      });
    });

    it('should order category insights by priority', () => {
      const report = generateRecommendationsReport(sampleFindings);
      const priorityOrder: Record<string, number> = {
        immediate: 0,
        important: 1,
        'nice-to-have': 2,
      };
      for (let i = 1; i < report.categoryInsights.length; i++) {
        expect(
          priorityOrder[report.categoryInsights[i - 1].topPriority],
        ).toBeLessThanOrEqual(
          priorityOrder[report.categoryInsights[i].topPriority],
        );
      }
    });

    it('should generate meaningful summaries', () => {
      const report = generateRecommendationsReport(sampleFindings);
      report.categoryInsights.forEach((insight) => {
        expect(insight.summary).toContain(insight.findingCount.toString());
      });
    });

    it('should handle empty findings', () => {
      const report = generateRecommendationsReport([]);
      expect(report.totalFindings).toBe(0);
      expect(report.immediateCount).toBe(0);
      expect(report.categoryInsights).toHaveLength(0);
    });

    it('should handle single finding', () => {
      const report = generateRecommendationsReport([sampleFindings[0]]);
      expect(report.totalFindings).toBe(1);
      expect(report.findings).toHaveLength(1);
      expect(report.categoryInsights).toHaveLength(1);
      expect(report.categoryInsights[0].category).toBe('accessibility');
    });
  });

  describe('getTopRecommendations', () => {
    it('should return top N recommendations', () => {
      const enhanced = enhanceWithRecommendations(sampleFindings);
      const top3 = getTopRecommendations(enhanced, 3);
      expect(top3).toHaveLength(3);
    });

    it('should return fewer than limit if not enough findings', () => {
      const enhanced = enhanceWithRecommendations([sampleFindings[0]]);
      const top5 = getTopRecommendations(enhanced, 5);
      expect(top5).toHaveLength(1);
    });

    it('should prioritize immediate recommendations first', () => {
      const enhanced = enhanceWithRecommendations(sampleFindings);
      const top = getTopRecommendations(enhanced, 10);
      const immediateIndex = top.findIndex((f) => f.priority === 'immediate');
      const importantIndex = top.findIndex((f) => f.priority === 'important');
      if (immediateIndex !== -1 && importantIndex !== -1) {
        expect(immediateIndex).toBeLessThan(importantIndex);
      }
    });

    it('should sort by severity within same priority', () => {
      const twoHighSeverity: Finding[] = [
        {
          ...sampleFindings[0],
          id: 'test_1',
          severity: 'critical',
          priority: 'important',
        } as any,
        {
          ...sampleFindings[1],
          id: 'test_2',
          severity: 'medium',
          priority: 'important',
        } as any,
      ];
      const enhanced = enhanceWithRecommendations(twoHighSeverity);
      const sorted = getTopRecommendations(enhanced, 2);
      expect(sorted[0].severity).toBe('critical');
      expect(sorted[1].severity).toBe('medium');
    });

    it('should default to limit of 5', () => {
      const manyFindings = Array.from({ length: 20 }, (_, i) => ({
        ...sampleFindings[0],
        id: `finding_${i}`,
      })) as Finding[];
      const enhanced = enhanceWithRecommendations(manyFindings);
      const top = getTopRecommendations(enhanced);
      expect(top).toHaveLength(5);
    });
  });

  describe('getActionPlan', () => {
    it('should organize findings by priority', () => {
      const enhanced = enhanceWithRecommendations(sampleFindings);
      const plan = getActionPlan(enhanced);
      expect(plan.immediate).toBeDefined();
      expect(plan.important).toBeDefined();
      expect(plan['nice-to-have']).toBeDefined();
    });

    it('should include all findings in action plan', () => {
      const enhanced = enhanceWithRecommendations(sampleFindings);
      const plan = getActionPlan(enhanced);
      const total =
        plan.immediate.length +
        plan.important.length +
        plan['nice-to-have'].length;
      expect(total).toBe(enhanced.length);
    });

    it('should correctly categorize findings by priority', () => {
      const enhanced = enhanceWithRecommendations(sampleFindings);
      const plan = getActionPlan(enhanced);
      expect(
        plan.immediate.every((f) => f.priority === 'immediate'),
      ).toBe(true);
      expect(
        plan.important.every((f) => f.priority === 'important'),
      ).toBe(true);
      expect(
        plan['nice-to-have'].every((f) => f.priority === 'nice-to-have'),
      ).toBe(true);
    });

    it('should handle empty findings', () => {
      const plan = getActionPlan([]);
      expect(plan.immediate).toHaveLength(0);
      expect(plan.important).toHaveLength(0);
      expect(plan['nice-to-have']).toHaveLength(0);
    });

    it('should return empty arrays for missing priorities', () => {
      const onlyImmediate: Finding[] = [
        {
          ...sampleFindings[0],
          id: 'a11y_missing_alt',
        },
      ];
      const enhanced = enhanceWithRecommendations(onlyImmediate);
      const plan = getActionPlan(enhanced);
      expect(plan.important).toHaveLength(0);
      expect(plan['nice-to-have']).toHaveLength(0);
    });
  });

  describe('recommendation accuracy', () => {
    it('should recommend critical priority for a11y_missing_label', () => {
      const finding: Finding = {
        id: 'a11y_missing_label',
        category: 'accessibility',
        severity: 'critical',
        title: 'Missing labels',
        description: 'Test',
        evidence: [{ text: 'test' }],
        recommendation: 'Add labels',
        confidence: 0.9,
      };
      const enhanced = enhanceWithRecommendations([finding]);
      expect(enhanced[0].priority).toBe('immediate');
    });

    it('should recommend important for readability issues', () => {
      const finding: Finding = {
        id: 'readability_flesch_score',
        category: 'readability',
        severity: 'high',
        title: 'Reading level',
        description: 'Test',
        evidence: [{ text: 'test' }],
        recommendation: 'Simplify',
        confidence: 0.8,
      };
      const enhanced = enhanceWithRecommendations([finding]);
      expect(enhanced[0].priority).toBe('important');
    });

    it('should provide meaningful suggested fixes', () => {
      const finding: Finding = {
        id: 'mobile_no_viewport',
        category: 'mobile',
        severity: 'critical',
        title: 'No viewport',
        description: 'Test',
        evidence: [{ text: 'test' }],
        recommendation: 'Add viewport',
        confidence: 0.99,
      };
      const enhanced = enhanceWithRecommendations([finding]);
      expect(enhanced[0].suggestedFix).toContain('viewport');
      expect(enhanced[0].suggestedFix).toBeTruthy();
    });

    it('should handle unknown finding IDs gracefully', () => {
      const finding: Finding = {
        id: 'unknown_finding_id_xyz',
        category: 'accessibility',
        severity: 'low',
        title: 'Unknown',
        description: 'Test',
        evidence: [{ text: 'test' }],
        recommendation: 'Unknown',
        confidence: 0.5,
      };
      const enhanced = enhanceWithRecommendations([finding]);
      expect(enhanced[0].priority).toBeDefined();
      expect(enhanced[0].suggestedFix).toBeDefined();
    });
  });

  describe('integration scenarios', () => {
    it('should generate complete report for complex findings', () => {
      const report = generateRecommendationsReport(sampleFindings);
      expect(report.totalFindings).toBe(5);
      expect(report.categoryInsights.length).toBeGreaterThan(0);
      expect(report.findings.every((f) => f.suggestedFix)).toBe(true);
    });

    it('should support action planning workflow', () => {
      const enhanced = enhanceWithRecommendations(sampleFindings);
      const plan = getActionPlan(enhanced);
      const topImmediate = plan.immediate.slice(0, 3);
      expect(topImmediate.length).toBeGreaterThanOrEqual(0);
      topImmediate.forEach((f) => {
        expect(f.priority).toBe('immediate');
        expect(f.suggestedFix).toBeTruthy();
      });
    });

    it('should prioritize critical issues in recommendations', () => {
      const enhanced = enhanceWithRecommendations(sampleFindings);
      const top = getTopRecommendations(enhanced);
      if (top.length > 0) {
        // At least one of the top recommendations should be immediate (if any exist)
        const hasImmediate = enhanced.some((f) => f.priority === 'immediate');
        if (hasImmediate) {
          expect(top.some((f) => f.priority === 'immediate')).toBe(true);
        }
      }
    });
  });
});
