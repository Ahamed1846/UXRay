/**
 * Scoring Engine
 * Transforms findings into category and overall scores
 */

import type { CategoryScores, Finding, ReportSummary, Severity } from '../schema';

/**
 * Severity to weight mapping
 * These values determine score deductions
 */
export const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 15,
  high: 8,
  medium: 4,
  low: 2,
};

/**
 * Category weight in overall score calculation
 */
export const CATEGORY_WEIGHTS: Record<keyof CategoryScores, number> = {
  accessibility: 0.3,
  readability: 0.2,
  mobile: 0.25,
  forms: 0.15,
  navigation: 0.1,
};

/**
 * Calculate score deduction for a finding
 * Formula: weight(severity) * count * confidence
 */
export function calculateFindingDeduction(
  severity: Severity,
  confidence: number,
  count: number = 1,
): number {
  const weight = SEVERITY_WEIGHTS[severity];
  return weight * count * confidence;
}

/**
 * Calculate category score from findings
 * Starts at 100, deducts based on findings
 */
export function calculateCategoryScore(findings: Finding[]): number {
  let score = 100;

  for (const finding of findings) {
    const deduction = calculateFindingDeduction(
      finding.severity,
      finding.confidence,
      1, // Individual finding count
    );
    score -= deduction;
  }

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate overall score with weighted categories
 */
export function calculateOverallScore(categoryScores: CategoryScores): number {
  return (
    categoryScores.accessibility * CATEGORY_WEIGHTS.accessibility +
    categoryScores.readability * CATEGORY_WEIGHTS.readability +
    categoryScores.mobile * CATEGORY_WEIGHTS.mobile +
    categoryScores.forms * CATEGORY_WEIGHTS.forms +
    categoryScores.navigation * CATEGORY_WEIGHTS.navigation
  );
}

/**
 * Calculate category scores from categorized findings
 */
export function calculateCategoryScores(
  findingsByCategory: Record<string, Finding[]>,
): CategoryScores {
  const defaultScore = 100;

  return {
    accessibility: calculateCategoryScore(findingsByCategory.accessibility || []) || defaultScore,
    readability: calculateCategoryScore(findingsByCategory.readability || []) || defaultScore,
    mobile: calculateCategoryScore(findingsByCategory.mobile || []) || defaultScore,
    forms: calculateCategoryScore(findingsByCategory.forms || []) || defaultScore,
    navigation: calculateCategoryScore(findingsByCategory.navigation || []) || defaultScore,
  };
}

/**
 * Generate complete report summary from all findings
 */
export function generateReportSummary(findings: Finding[]): ReportSummary {
  // Group findings by category
  const findingsByCategory = findings.reduce(
    (acc, finding) => {
      if (!acc[finding.category]) {
        acc[finding.category] = [];
      }
      acc[finding.category].push(finding);
      return acc;
    },
    {} as Record<string, Finding[]>,
  );

  // Calculate category scores
  const categoryScores = calculateCategoryScores(findingsByCategory);

  // Calculate overall score
  const overallScore = calculateOverallScore(categoryScores);

  return {
    overallScore: Math.round(overallScore),
    categoryScores: {
      accessibility: Math.round(categoryScores.accessibility),
      readability: Math.round(categoryScores.readability),
      mobile: Math.round(categoryScores.mobile),
      forms: Math.round(categoryScores.forms),
      navigation: Math.round(categoryScores.navigation),
    },
  };
}
