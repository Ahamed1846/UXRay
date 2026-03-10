import { describe, it, expect } from 'vitest';
import { ReadabilityAnalyzer } from '../analyzers/readability';
import { checkFleschScore } from '../analyzers/readability/checks/flesch-score';
import { checkFontSizeHeuristic } from '../analyzers/readability/checks/font-size';
import { checkLineLengthHeuristic } from '../analyzers/readability/checks/line-length';
import { checkContentDensity } from '../analyzers/readability/checks/content-density';
import type { PageContext } from '../schema/types';

const createMockContext = (overrides: Partial<PageContext> = {}): PageContext => ({
  url: 'https://example.com',
  title: 'Example',
  text: '',
  html: '',
  elements: [],
  ...overrides,
});

describe('ReadabilityAnalyzer', () => {
  describe('Flesch Reading Score', () => {
    it('should flag content with very difficult reading level (score < 30)', () => {
      const complexText = `
        The multifaceted paradigm juxtaposition necessitates comprehensive 
        hermeneutical substantiation paradigmatically delineated. Circumlocution 
        inadvertently obfuscates perspicuous communicative transmission. 
        Polysyllabic lexical instantiation contravenes conventional pedagogical 
        methodologies predicated upon accessibility parameters.
      `;

      const context = createMockContext({ text: complexText });
      const findings = checkFleschScore(context);

      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].id).toBe('readability_flesch_score');
      expect(findings[0].severity).toBe('high');
    });

    it('should flag content with difficult reading level (score 30-50)', () => {
      const difficultText = `
        Educational methodologies require comprehension capacities from participants. 
        Information architecture needs organizational frameworks for processing. 
        Technological integration demands prerequisite knowledge always.
      `;

      const context = createMockContext({ text: difficultText });
      const findings = checkFleschScore(context);

      expect(findings.length).toBeGreaterThan(0);
      // Score might be high or medium depending on actual calculation
      expect(['high', 'medium']).toContain(findings[0].severity);
    });

    it('should not flag content with readable score (>60)', () => {
      const easyText = `
        This is easy to read. We use short words. The sentences are short too. 
        Each paragraph talks about one idea. This helps readers understand. 
        Short paragraphs work well. Everyone can read them easily.
      `;

      const context = createMockContext({ text: easyText });
      const findings = checkFleschScore(context);

      expect(findings.length).toBe(0);
    });

    it('should handle empty text gracefully', () => {
      const context = createMockContext({ text: '' });
      const findings = checkFleschScore(context);

      expect(findings.length).toBe(0);
    });
  });

  describe('Font Size Heuristic', () => {
    it('should flag elements with font size < 12px', () => {
      const context = createMockContext({
        elements: [
          {
            tag: 'p',
            selector: 'p.small',
            text: 'This is some body text that should be larger for readability.',
            computedStyle: { fontSize: '10px' },
          },
        ],
      });

      const findings = checkFontSizeHeuristic(context);

      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].id).toBe('readability_small_font');
      expect(findings[0].severity).toBe('medium');
    });

    it('should not flag elements with adequate font size', () => {
      const context = createMockContext({
        elements: [
          {
            tag: 'p',
            selector: 'p.normal',
            text: 'This is body text with appropriate font size.',
            computedStyle: { fontSize: '14px' },
          },
        ],
      });

      const findings = checkFontSizeHeuristic(context);

      expect(findings.length).toBe(0);
    });

    it('should ignore small font in non-body elements', () => {
      const context = createMockContext({
        elements: [
          {
            tag: 'script',
            selector: 'script',
            text: 'small text',
            computedStyle: { fontSize: '8px' },
          },
        ],
      });

      const findings = checkFontSizeHeuristic(context);

      expect(findings.length).toBe(0);
    });
  });

  describe('Line Length Heuristic', () => {
    it('should flag containers with very long lines (>100 chars)', () => {
      const longText = 'This is a very long line of text that exceeds one hundred characters in total length.';

      const context = createMockContext({
        elements: [
          {
            tag: 'p',
            selector: 'p.long',
            text: longText,
            computedStyle: { width: '1000px' }, // Will estimate ~117 chars per line
          },
        ],
      });

      const findings = checkLineLengthHeuristic(context);

      const longLineFindings = findings.filter((f) => f.id === 'readability_long_lines');
      expect(longLineFindings.length).toBeGreaterThan(0);
    });

    it('should flag containers with very short lines (<35 chars)', () => {
      const context = createMockContext({
        elements: [
          {
            tag: 'div',
            selector: 'div.narrow',
            text: 'This text is in a narrow container.',
            computedStyle: { width: '200px' }, // Will estimate ~23 chars per line
          },
        ],
      });

      const findings = checkLineLengthHeuristic(context);

      const shortLineFindings = findings.filter((f) => f.id === 'readability_short_lines');
      expect(shortLineFindings.length).toBeGreaterThan(0);
      expect(shortLineFindings[0].severity).toBe('low');
    });
  });

  describe('Content Density', () => {
    it('should flag very long paragraphs (>200 words)', () => {
      const longParagraph = 'word '.repeat(205);

      const context = createMockContext({
        elements: [
          {
            tag: 'p',
            selector: 'p.dense',
            text: longParagraph,
          },
        ],
      });

      const findings = checkContentDensity(context);

      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].id).toBe('readability_dense_paragraphs');
      expect(findings[0].severity).toBe('medium');
    });

    it('should not flag normal-length paragraphs', () => {
      const normalParagraph = 'word '.repeat(80);

      const context = createMockContext({
        elements: [
          {
            tag: 'p',
            selector: 'p.normal',
            text: normalParagraph,
          },
        ],
      });

      const findings = checkContentDensity(context);

      expect(findings.length).toBe(0);
    });
  });

  describe('Full ReadabilityAnalyzer', () => {
    it('should run all checks and return combined findings', async () => {
      const complexText = `
        The multifaceted implementation paradigm necessitates substantive 
        circumlocution delineation. Polysyllabic lexicon instantiation 
        contravenes conventional pedagogical approaches systematically 
        throughout organizational frameworks perpetually established.
      `;

      const context = createMockContext({
        text: complexText,
        elements: [
          {
            tag: 'p',
            selector: 'p.complex',
            text: complexText,
            computedStyle: { fontSize: '11px', width: '1200px' },
          },
          {
            tag: 'p',
            selector: 'p.dense',
            text: 'word '.repeat(250),
            computedStyle: { fontSize: '12px' },
          },
        ],
      });

      const analyzer = new ReadabilityAnalyzer();
      const findings = await analyzer.analyze(context);

      // Should have multiple findings from different checks
      expect(findings.length).toBeGreaterThan(0);

      // Verify findings have required structure
      for (const finding of findings) {
        expect(finding.id).toBeDefined();
        expect(finding.category).toBe('readability');
        expect(finding.severity).toBeDefined();
        expect(finding.title).toBeDefined();
        expect(finding.description).toBeDefined();
        expect(finding.recommendation).toBeDefined();
        expect(finding.confidence).toBeGreaterThanOrEqual(0);
        expect(finding.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should handle empty context gracefully', async () => {
      const context = createMockContext();
      const analyzer = new ReadabilityAnalyzer();
      const findings = await analyzer.analyze(context);

      expect(Array.isArray(findings)).toBe(true);
      expect(findings).not.toThrow;
    });

    it('should handle null elements gracefully', async () => {
      const context = createMockContext({ elements: null });
      const analyzer = new ReadabilityAnalyzer();
      const findings = await analyzer.analyze(context);

      expect(Array.isArray(findings)).toBe(true);
    });
  });

  describe('Confidence Scores', () => {
    it('should assign appropriate confidence scores to all findings', async () => {
      const context = createMockContext({
        text: 'complex sophisticated polysyllabic '.repeat(100),
        elements: [
          {
            tag: 'p',
            selector: 'p',
            text: 'word '.repeat(250),
            computedStyle: { fontSize: '10px', width: '1200px' },
          },
        ],
      });

      const analyzer = new ReadabilityAnalyzer();
      const findings = await analyzer.analyze(context);

      for (const finding of findings) {
        expect(finding.confidence).toBeGreaterThanOrEqual(0.6);
        expect(finding.confidence).toBeLessThanOrEqual(0.95);
      }
    });
  });

  describe('Evidence in Findings', () => {
    it('should include evidence for findings when available', async () => {
      const context = createMockContext({
        text: 'word '.repeat(250),
        elements: [
          {
            tag: 'p',
            selector: 'p.offender',
            text: 'word '.repeat(250),
            computedStyle: { fontSize: '10px' },
          },
        ],
      });

      const analyzer = new ReadabilityAnalyzer();
      const findings = await analyzer.analyze(context);

      // Find findings with evidence
      const findingsWithEvidence = findings.filter((f) => f.evidence && f.evidence.length > 0);

      for (const finding of findingsWithEvidence) {
        expect(Array.isArray(finding.evidence)).toBe(true);
        for (const evidence of finding.evidence) {
          expect(evidence.selector || evidence.snippet).toBeDefined();
        }
      }
    });
  });
});
