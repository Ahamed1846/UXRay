/**
 * Recommendation Engine
 * Transforms findings into actionable recommendations with priorities
 */

import { Finding } from '../schema/types';
import { getRecommendation, Priority, RecommendationEntry } from './mapping';

/**
 * Finding with associated recommendation and priority
 */
export interface FindingWithRecommendation extends Finding {
  priority: Priority;
  suggestedFix: string;
  resources?: string[];
}

/**
 * Category recommendations summary
 */
export interface CategoryInsight {
  category: string;
  findingCount: number;
  topPriority: Priority;
  summary: string;
}

/**
 * Complete recommendations report
 */
export interface RecommendationsReport {
  totalFindings: number;
  immediateCount: number;
  importantCount: number;
  niceToHaveCount: number;
  findings: FindingWithRecommendation[];
  categoryInsights: CategoryInsight[];
}

/**
 * Enhance findings with recommendations and priority levels
 */
export function enhanceWithRecommendations(
  findings: Finding[],
): FindingWithRecommendation[] {
  return findings.map((finding) => {
    const rec = getRecommendation(finding.id);
    return {
      ...finding,
      priority: rec.priority,
      suggestedFix: rec.suggestedFix,
      resources: rec.resources,
    };
  });
}

/**
 * Count findings by priority level
 */
function countByPriority(
  findings: FindingWithRecommendation[],
): Record<Priority, number> {
  return {
    immediate: findings.filter((f) => f.priority === 'immediate').length,
    important: findings.filter((f) => f.priority === 'important').length,
    'nice-to-have': findings.filter((f) => f.priority === 'nice-to-have').length,
  };
}

/**
 * Determine top priority for a category
 */
function getTopPriority(
  findings: FindingWithRecommendation[],
): Priority {
  if (findings.some((f) => f.priority === 'immediate')) {
    return 'immediate';
  }
  if (findings.some((f) => f.priority === 'important')) {
    return 'important';
  }
  return 'nice-to-have';
}

/**
 * Generate summary insight for a category
 */
function generateCategoryInsight(
  category: string,
  findings: FindingWithRecommendation[],
): CategoryInsight {
  const count = findings.length;
  const topPriority = getTopPriority(findings);
  const immediate = findings.filter((f) => f.priority === 'immediate').length;
  const important = findings.filter((f) => f.priority === 'important').length;

  let summary = '';
  if (immediate > 0) {
    summary = `${count} issue${count > 1 ? 's' : ''} found: ${immediate} critical (immediate action required), ${important} important, ${count - immediate - important} minor.`;
  } else if (important > 0) {
    summary = `${count} issue${count > 1 ? 's' : ''} found: ${important} important issue${important > 1 ? 's' : ''} to address, ${count - important} minor improvement${count - important !== 1 ? 's' : ''}.`;
  } else {
    summary = `${count} minor improvement${count > 1 ? 's' : ''} suggested to optimize experience.`;
  }

  return {
    category,
    findingCount: count,
    topPriority,
    summary,
  };
}

/**
 * Generate complete recommendations report from findings
 */
export function generateRecommendationsReport(
  findings: Finding[],
): RecommendationsReport {
  // Enhance findings with recommendations
  const enhancedFindings = enhanceWithRecommendations(findings);

  // Count by priority
  const priorityCounts = countByPriority(enhancedFindings);

  // Group by category
  const findingsByCategory = enhancedFindings.reduce(
    (acc, finding) => {
      if (!acc[finding.category]) {
        acc[finding.category] = [];
      }
      acc[finding.category].push(finding);
      return acc;
    },
    {} as Record<string, FindingWithRecommendation[]>,
  );

  // Generate category insights
  const categoryInsights = Object.entries(findingsByCategory).map(
    ([category, categoryFindings]) =>
      generateCategoryInsight(category, categoryFindings),
  );

  // Sort category insights by priority level (immediate > important > nice-to-have)
  const priorityOrder: Record<Priority, number> = {
    immediate: 0,
    important: 1,
    'nice-to-have': 2,
  };
  categoryInsights.sort(
    (a, b) => priorityOrder[a.topPriority] - priorityOrder[b.topPriority],
  );

  return {
    totalFindings: enhancedFindings.length,
    immediateCount: priorityCounts.immediate,
    importantCount: priorityCounts.important,
    niceToHaveCount: priorityCounts['nice-to-have'],
    findings: enhancedFindings,
    categoryInsights,
  };
}

/**
 * Get top recommendations to focus on (by priority and severity)
 */
export function getTopRecommendations(
  findings: FindingWithRecommendation[],
  limit: number = 5,
): FindingWithRecommendation[] {
  // Sort by priority (immediate first), then by severity
  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  const priorityOrder: Record<Priority, number> = {
    immediate: 0,
    important: 1,
    'nice-to-have': 2,
  };

  return findings
    .sort((a, b) => {
      // First sort by priority
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by severity
      return (
        severityOrder[a.severity] - severityOrder[b.severity]
      );
    })
    .slice(0, limit);
}

/**
 * Get action plan organized by priority
 */
export function getActionPlan(
  findings: FindingWithRecommendation[],
): Record<Priority, FindingWithRecommendation[]> {
  return {
    immediate: findings.filter((f) => f.priority === 'immediate'),
    important: findings.filter((f) => f.priority === 'important'),
    'nice-to-have': findings.filter((f) => f.priority === 'nice-to-have'),
  };
}
