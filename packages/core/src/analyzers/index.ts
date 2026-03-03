/**
 * Analyzer Registry
 * Central export point for all analyzers
 */

export { AccessibilityAnalyzer } from './accessibility';
export { ReadabilityAnalyzer } from './readability';
export { MobileAnalyzer } from './mobile';
export { FormsAnalyzer } from './forms';
export { NavigationAnalyzer } from './navigation';

import type { Analyzer } from '../schema';
import { AccessibilityAnalyzer } from './accessibility';
import { ReadabilityAnalyzer } from './readability';
import { MobileAnalyzer } from './mobile';
import { FormsAnalyzer } from './forms';
import { NavigationAnalyzer } from './navigation';

/**
 * Get all available analyzers
 */
export function getAllAnalyzers(): Analyzer[] {
  return [
    new AccessibilityAnalyzer(),
    new ReadabilityAnalyzer(),
    new MobileAnalyzer(),
    new FormsAnalyzer(),
    new NavigationAnalyzer(),
  ];
}

/**
 * Get analyzers by category
 */
export function getAnalyzersByCategory(
  category: 'accessibility' | 'readability' | 'mobile' | 'forms' | 'navigation',
): Analyzer[] {
  return getAllAnalyzers().filter((a) => a.category === category);
}
