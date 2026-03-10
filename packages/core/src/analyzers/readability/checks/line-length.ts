import type { PageContext, Finding } from '../../../schema/types';

/**
 * Check for appropriate line lengths
 * Optimal: 45-75 characters per line
 * Too long lines (>100 chars) reduce readability
 * Too short lines (<35 chars) cause excessive line breaks and eye strain
 */
export function checkLineLengthHeuristic(context: PageContext): Finding[] {
  const findings: Finding[] = [];

  const elements = context.elements || [];

  let longLineCount = 0;
  let shortLineCount = 0;
  const longLineExamples: string[] = [];

  for (const element of elements) {
    if (!element.tag || !element.text) {
      continue;
    }

    // Check text content elements
    if (['p', 'div', 'span', 'article', 'section', 'li'].includes(element.tag)) {
      const text = element.text.trim();

      // Only check meaningful text (>20 chars)
      if (text.length < 20) {
        continue;
      }

      // Split into lines (rough estimate)
      const computedStyle = element.computedStyle || {};
      const width = computedStyle.width;

      // Rough estimate: chars per line based on container width and font size
      // Assuming average character width is ~8-10px
      if (width) {
        const widthValue = parseFloat(width);
        const estimatedCharsPerLine = Math.floor(widthValue / 8.5); // Average char width

        // Flag if too long or too short
        if (estimatedCharsPerLine > 100) {
          longLineCount++;
          if (longLineExamples.length < 2) {
            longLineExamples.push(text.substring(0, 80));
          }
        } else if (estimatedCharsPerLine > 0 && estimatedCharsPerLine < 35) {
          shortLineCount++;
        }
      }
    }
  }

  // Report long lines
  if (longLineCount > 0) {
    findings.push({
      id: 'readability_long_lines',
      category: 'readability',
      severity: 'medium',
      title: `${longLineCount} container(s) have excessively long line lengths (>100 chars)`,
      description: `Lines that are too long (over 100 characters) reduce readability by making it harder for users to track lines visually and continue reading. Optimal line length is 45-75 characters per line.`,
      recommendation: `Limit the maximum width of text containers to achieve 45-75 characters per line. Use CSS max-width property on paragraph containers (typically 500-650px depending on font size).`,
      evidence: longLineExamples.map((text) => ({
        snippet: text,
      })),
      confidence: 0.7,
    });
  }

  // Report short lines (less severe)
  if (shortLineCount > 0) {
    findings.push({
      id: 'readability_short_lines',
      category: 'readability',
      severity: 'low',
      title: `${shortLineCount} container(s) have very short line lengths (<35 chars)`,
      description: `Very short line lengths create excessive line breaks and can tire readers' eyes as they jump between lines frequently.`,
      recommendation: `Increase container width slightly or reduce font size marginally to achieve optimal line length of 45-75 characters.`,
      evidence: [],
      confidence: 0.65,
    });
  }

  return findings;
}
