import type { PageContext, Finding } from '../../../schema/types';

/**
 * Calculate Flesch Reading Ease score
 * Formula: 206.835 - 1.015(W/S) - 84.6(Sy/W)
 * W = words, S = sentences, Sy = syllables
 *
 * Score interpretation:
 * 90-100: Very Easy (5th grade)
 * 80-90: Easy (6th grade)
 * 70-80: Fairly Easy (7th grade)
 * 60-70: Standard (8th-9th grade)
 * 50-60: Fairly Difficult (10th-12th grade)
 * 30-50: Difficult (College)
 * 0-30: Very Difficult (College graduate)
 */

/**
 * Estimate syllable count using a simple heuristic
 * Counts vowel groups, which correlates to syllables
 */
function estimateSyllables(word: string): number {
  const lowercased = word.toLowerCase();
  const vowelGroups = lowercased.match(/[aeiou]+/g);
  let count = vowelGroups?.length ?? 0;

  // Adjust for silent 'e' at end
  if (lowercased.endsWith('e')) {
    count--;
  }

  // Ensure at least 1 syllable per word
  return Math.max(1, count);
}

/**
 * Count sentences (heuristic: end with . ! ?)
 */
function countSentences(text: string): number {
  const sentences = text.match(/[.!?]+/g);
  return sentences?.length ?? 0;
}

/**
 * Count words
 */
function countWords(text: string): number {
  const words = text.match(/\b\w+\b/g);
  return words?.length ?? 0;
}

/**
 * Calculate Flesch Reading Ease score
 */
function calculateFleschScore(text: string): number {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;
  const sentenceCount = countSentences(text);
  const syllableCount = words.reduce((sum, word) => sum + estimateSyllables(word), 0);

  if (wordCount === 0 || sentenceCount === 0) {
    return 0;
  }

  const score = 206.835 - 1.015 * (wordCount / Math.max(1, sentenceCount)) - 84.6 * (syllableCount / wordCount);

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Check for low reading ease score (too difficult)
 */
export function checkFleschScore(context: PageContext): Finding[] {
  const findings: Finding[] = [];

  // Extract all text content
  const textContent = context.text || '';

  if (textContent.trim().length === 0) {
    return findings;
  }

  const score = calculateFleschScore(textContent);

  // Flags content that's too difficult to read (below 60 = college level)
  if (score < 60) {
    const difficulty =
      score < 30
        ? 'very difficult (college graduate level)'
        : score < 50
          ? 'difficult (college level)'
          : 'fairly difficult (10th-12th grade)';

    findings.push({
      id: 'readability_flesch_score',
      category: 'readability',
      severity: score < 30 ? 'high' : 'medium',
      title: `Content reading level is ${difficulty}`,
      description: `The page content has a Flesch Reading Ease score of ${score.toFixed(1)}, which suggests the content is difficult to understand for typical users. Flesch scores above 60 indicate content suitable for a general audience.`,
      recommendation: `Simplify language and sentence structure. Use shorter paragraphs, common words, and active voice. Aim for a Flesch score of 60-70 for general audiences.`,
      evidence: [],
      confidence: 0.8,
    });
  }

  return findings;
}
