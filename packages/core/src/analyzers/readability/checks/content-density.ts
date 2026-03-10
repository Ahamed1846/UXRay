import type { PageContext, Finding } from '../../../schema/types';

/**
 * Check for excessive paragraph density and wall-of-text patterns
 * Paragraphs that are too dense (very long without breaks) hamper readability
 */
export function checkContentDensity(context: PageContext): Finding[] {
  const findings: Finding[] = [];

  const elements = context.elements || [];

  let veryDenseParagraphs = 0;
  const denseExamples: string[] = [];

  for (const element of elements) {
    if (element.tag === 'p' && element.text) {
      const text = element.text.trim();
      const wordCount = text.split(/\s+/).length;

      // Flag paragraphs with more than 200 words (very dense)
      if (wordCount > 200) {
        veryDenseParagraphs++;
        if (denseExamples.length < 2) {
          denseExamples.push(text.substring(0, 100) + '...');
        }
      }
    }
  }

  if (veryDenseParagraphs > 0) {
    findings.push({
      id: 'readability_dense_paragraphs',
      category: 'readability',
      severity: 'medium',
      title: `${veryDenseParagraphs} paragraph(s) are excessively long (>200 words)`,
      description: `Very long paragraphs without visual breaks create a "wall of text" that is intimidating and hard to read. Users often lose their place or stop reading dense content.`,
      recommendation: `Break long paragraphs into shorter ones (aim for 40-80 words per paragraph). Use subheadings, bullet points, and white space to improve scannability.`,
      evidence: denseExamples.map((text) => ({
        snippet: text,
      })),
      confidence: 0.85,
    });
  }

  return findings;
}

/**
 * Extract paragraphs from page context
 */
export function extractParagraphs(context: PageContext): Array<{ text: string; wordCount: number }> {
  const paragraphs: Array<{ text: string; wordCount: number }> = [];

  const elements = context.elements || [];

  for (const element of elements) {
    if (element.tag === 'p' && element.text) {
      const text = element.text.trim();
      if (text.length > 0) {
        const wordCount = text.split(/\s+/).length;
        paragraphs.push({ text, wordCount });
      }
    }
  }

  return paragraphs;
}
