import { describe, it, expect } from 'vitest';
import { AccessibilityAnalyzer } from '../analyzers/accessibility';
import type { PageContext } from '../schema/types';

describe('Accessibility Analyzer', () => {
  const baseContext: PageContext = {
    url: 'https://example.com',
    html: '',
    headings: [],
    images: [],
    forms: [],
    links: [],
    text: '',
  };

  describe('Alt attributes check', () => {
    it('should find images missing alt text (Critical)', async () => {
      const analyzer = new AccessibilityAnalyzer();
      const context: PageContext = {
        ...baseContext,
        images: [
          { src: 'logo.png', alt: '', element: {} as Element },
          { src: 'hero.jpg', alt: null, element: {} as Element },
        ],
      };

      const findings = await analyzer.analyze(context);
      const altFinding = findings.find((f) => f.id === 'a11y_missing_alt');

      expect(altFinding).toBeDefined();
      expect(altFinding?.severity).toBe('critical');
      expect(altFinding?.title).toContain('2 image(s) missing alt text');
      expect(altFinding?.confidence).toBeGreaterThan(0.9);
    });

    it('should find images with poor alt text (Medium)', async () => {
      const analyzer = new AccessibilityAnalyzer();
      const context: PageContext = {
        ...baseContext,
        images: [{ src: 'icon.png', alt: 'btn', element: {} as Element }],
      };

      const findings = await analyzer.analyze(context);
      const poorAltFinding = findings.find((f) => f.id === 'a11y_poor_alt');

      expect(poorAltFinding).toBeDefined();
      expect(poorAltFinding?.severity).toBe('medium');
      expect(poorAltFinding?.title).toContain('very short alt text');
    });

    it('should not report alt issues for images with good alt text', async () => {
      const analyzer = new AccessibilityAnalyzer();
      const context: PageContext = {
        ...baseContext,
        images: [{ src: 'logo.png', alt: 'Company logo for footer', element: {} as Element }],
      };

      const findings = await analyzer.analyze(context);
      const altFindings = findings.filter((f) => f.id?.includes('alt'));

      expect(altFindings).toHaveLength(0);
    });
  });

  describe('Form labels check', () => {
    it('should find form inputs without labels (Critical)', async () => {
      const analyzer = new AccessibilityAnalyzer();
      const context: PageContext = {
        ...baseContext,
        forms: [
          {
            id: 'login',
            element: {} as Element,
            inputs: [
              {
                type: 'email',
                name: 'email',
                id: 'email-input',
                hasLabel: false,
                required: true,
                element: {} as Element,
              },
              {
                type: 'password',
                name: 'password',
                id: 'password-input',
                hasLabel: false,
                required: true,
                element: {} as Element,
              },
            ],
          },
        ],
      };

      const findings = await analyzer.analyze(context);
      const labelFinding = findings.find((f) => f.id === 'a11y_missing_form_label');

      expect(labelFinding).toBeDefined();
      expect(labelFinding?.severity).toBe('critical');
      expect(labelFinding?.title).toContain('2 form input(s) missing labels');
    });

    it('should not report form issues for inputs with labels', async () => {
      const analyzer = new AccessibilityAnalyzer();
      const context: PageContext = {
        ...baseContext,
        forms: [
          {
            id: 'form',
            element: {} as Element,
            inputs: [
              {
                type: 'email',
                name: 'email',
                id: 'email',
                hasLabel: true,
                required: true,
                element: {} as Element,
              },
            ],
          },
        ],
      };

      const findings = await analyzer.analyze(context);
      const formFindings = findings.filter((f) => f.id === 'a11y_missing_form_label');

      expect(formFindings).toHaveLength(0);
    });

    it('should skip hidden and submit inputs', async () => {
      const analyzer = new AccessibilityAnalyzer();
      const context: PageContext = {
        ...baseContext,
        forms: [
          {
            id: 'form',
            element: {} as Element,
            inputs: [
              {
                type: 'hidden',
                name: 'csrf',
                id: null,
                hasLabel: false,
                required: false,
                element: {} as Element,
              },
              {
                type: 'submit',
                name: 'submit',
                id: null,
                hasLabel: false,
                required: false,
                element: {} as Element,
              },
            ],
          },
        ],
      };

      const findings = await analyzer.analyze(context);
      const formFindings = findings.filter((f) => f.id === 'a11y_missing_form_label');

      expect(formFindings).toHaveLength(0);
    });
  });

  describe('Heading hierarchy check', () => {
    it('should find missing H1 (High)', async () => {
      const analyzer = new AccessibilityAnalyzer();
      const context: PageContext = {
        ...baseContext,
        headings: [
          { level: 2, text: 'Section Title', element: {} as Element },
          { level: 3, text: 'Subsection', element: {} as Element },
        ],
      };

      const findings = await analyzer.analyze(context);
      const h1Finding = findings.find((f) => f.id === 'a11y_heading_hierarchy');

      expect(h1Finding).toBeDefined();
      expect(h1Finding?.severity).toBe('high');
      expect(h1Finding?.title).toContain('missing <h1>');
    });

    it('should find multiple H1s (High)', async () => {
      const analyzer = new AccessibilityAnalyzer();
      const context: PageContext = {
        ...baseContext,
        headings: [
          { level: 1, text: 'Title 1', element: {} as Element },
          { level: 1, text: 'Title 2', element: {} as Element },
          { level: 2, text: 'Section', element: {} as Element },
        ],
      };

      const findings = await analyzer.analyze(context);
      const hierarchyFinding = findings.find((f) => f.id === 'a11y_heading_hierarchy');

      expect(hierarchyFinding).toBeDefined();
      expect(hierarchyFinding?.title).toContain('multiple <h1>');
    });

    it('should find heading hierarchy jumps (High)', async () => {
      const analyzer = new AccessibilityAnalyzer();
      const context: PageContext = {
        ...baseContext,
        headings: [
          { level: 1, text: 'Main Title', element: {} as Element },
          { level: 3, text: 'Jumps to h3', element: {} as Element },
        ],
      };

      const findings = await analyzer.analyze(context);
      const jumpFinding = findings.find((f) => f.id === 'a11y_heading_hierarchy');

      expect(jumpFinding).toBeDefined();
      expect(jumpFinding?.title).toContain('heading jump');
    });

    it('should find no issues with proper structure', async () => {
      const analyzer = new AccessibilityAnalyzer();
      const context: PageContext = {
        ...baseContext,
        headings: [
          { level: 1, text: 'Main Title', element: {} as Element },
          { level: 2, text: 'Section 1', element: {} as Element },
          { level: 3, text: 'Subsection 1a', element: {} as Element },
          { level: 2, text: 'Section 2', element: {} as Element },
        ],
      };

      const findings = await analyzer.analyze(context);
      const hierarchyFindings = findings.filter((f) => f.id === 'a11y_heading_hierarchy');

      expect(hierarchyFindings).toHaveLength(0);
    });

    it('should report no headings at all (High)', async () => {
      const analyzer = new AccessibilityAnalyzer();
      const context: PageContext = {
        ...baseContext,
        headings: [],
      };

      const findings = await analyzer.analyze(context);
      const noHeadingsFinding = findings.find((f) => f.id === 'a11y_no_headings');

      expect(noHeadingsFinding).toBeDefined();
      expect(noHeadingsFinding?.severity).toBe('high');
    });
  });

  describe('Contrast check', () => {
    it('should detect light gray text (High)', async () => {
      const analyzer = new AccessibilityAnalyzer();
      const context: PageContext = {
        ...baseContext,
        html: '<p style="color: #CCC">Gray text</p>',
      };

      const findings = await analyzer.analyze(context);
      const contrastFinding = findings.find((f) => f.id === 'a11y_potential_low_contrast');

      expect(contrastFinding).toBeDefined();
      expect(contrastFinding?.severity).toBe('high');
    });

    it('should not report contrast issues for dark text', async () => {
      const analyzer = new AccessibilityAnalyzer();
      const context: PageContext = {
        ...baseContext,
        html: '<p style="color: #000">Black text</p>',
      };

      const findings = await analyzer.analyze(context);
      const contrastFindings = findings.filter((f) => f.id === 'a11y_potential_low_contrast');

      expect(contrastFindings).toHaveLength(0);
    });
  });

  describe('ARIA basics check', () => {
    it('should find icon buttons without aria-label (High)', async () => {
      const analyzer = new AccessibilityAnalyzer();
      const context: PageContext = {
        ...baseContext,
        html: '<button class="icon"><i class="icon-close"></i></button>',
      };

      const findings = await analyzer.analyze(context);
      const ariaFinding = findings.find((f) => f.id === 'a11y_icon_button_no_label');

      expect(ariaFinding).toBeDefined();
      expect(ariaFinding?.severity).toBe('high');
    });

    it('should detect div with role=button (Medium)', async () => {
      const analyzer = new AccessibilityAnalyzer();
      const context: PageContext = {
        ...baseContext,
        html: '<div role="button">Click me</div>',
      };

      const findings = await analyzer.analyze(context);
      const roleFinding = findings.find((f) => f.id === 'a11y_div_role_button');

      expect(roleFinding).toBeDefined();
      expect(roleFinding?.severity).toBe('medium');
    });

    it('should detect links used as buttons (Medium)', async () => {
      const analyzer = new AccessibilityAnalyzer();
      const context: PageContext = {
        ...baseContext,
        html: '<a href="#" class="btn btn-primary">Action</a>',
      };

      const findings = await analyzer.analyze(context);
      const linkButtonFinding = findings.find((f) => f.id === 'a11y_link_as_button');

      expect(linkButtonFinding).toBeDefined();
      expect(linkButtonFinding?.severity).toBe('medium');
    });
  });

  describe('categorization and confidence', () => {
    it('should always set category to accessibility', async () => {
      const analyzer = new AccessibilityAnalyzer();
      const context: PageContext = {
        ...baseContext,
        images: [{ src: 'test.png', alt: '', element: {} as Element }],
      };

      const findings = await analyzer.analyze(context);
      findings.forEach((f) => {
        expect(f.category).toBe('accessibility');
      });
    });

    it('should have confidence scores between 0 and 1', async () => {
      const analyzer = new AccessibilityAnalyzer();
      const context: PageContext = {
        ...baseContext,
        images: [{ src: 'test.png', alt: '', element: {} as Element }],
        forms: [
          {
            id: 'form',
            element: {} as Element,
            inputs: [
              {
                type: 'text',
                name: 'test',
                id: null,
                hasLabel: false,
                required: false,
                element: {} as Element,
              },
            ],
          },
        ],
      };

      const findings = await analyzer.analyze(context);
      findings.forEach((f) => {
        expect(f.confidence).toBeGreaterThanOrEqual(0);
        expect(f.confidence).toBeLessThanOrEqual(1);
      });
    });
  });
});
