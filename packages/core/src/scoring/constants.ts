/**
 * Scoring engine constants and configuration
 */

/**
 * Severity weight mapping
 * Used in deduction formula: deduction = weight(severity) * count * confidence
 */
export const SEVERITY_WEIGHTS = {
  critical: 15,
  high: 8,
  medium: 4,
  low: 2,
} as const;

/**
 * Category weights for overall score calculation
 * These weights reflect relative importance of each UX dimension
 */
export const CATEGORY_WEIGHTS = {
  accessibility: 0.30, // 30% - foundational for all users
  mobile: 0.25, // 25% - critical for modern web
  readability: 0.20, // 20% - core content presentation
  forms: 0.15, // 15% - conversion and task completion
  navigation: 0.10, // 10% - information architecture
} as const;

/**
 * Verify weights sum to 1.0
 */
const totalCategoryWeight = Object.values(CATEGORY_WEIGHTS).reduce((a, b) => a + b, 0);
if (Math.abs(totalCategoryWeight - 1.0) > 0.0001) {
  throw new Error(
    `Category weights must sum to 1.0, got ${totalCategoryWeight}`,
  );
}

/**
 * Base score for each category (starts at 100, deductions applied)
 */
export const BASE_CATEGORY_SCORE = 100;

/**
 * Score range is clamped to [MIN_SCORE, MAX_SCORE]
 */
export const MIN_SCORE = 0;
export const MAX_SCORE = 100;
