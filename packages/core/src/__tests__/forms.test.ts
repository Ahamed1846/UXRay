import { describe, it, expect } from 'vitest';
import { FormAnalyzer } from '../analyzers/forms';
import { checkPlaceholderOnly } from '../analyzers/forms/checks/placeholder-only';
import { checkRequiredFieldMarking } from '../analyzers/forms/checks/required-marking';
import { checkFormLength } from '../analyzers/forms/checks/form-length';
import { checkPasswordVisibility } from '../analyzers/forms/checks/password-visibility';
import type { PageContext } from '../schema/types';

const createMockContext = (overrides: Partial<PageContext> = {}): PageContext => ({
  url: 'https://example.com',
  title: 'Example',
  text: '',
  html: '',
  elements: [],
  dom: {} as any,
  computedStyles: new Map(),
  headings: [],
  images: [],
  forms: [],
  links: [],
  ...overrides,
});

describe('FormAnalyzer', () => {
  const analyzer = new FormAnalyzer();

  describe('Placeholder-Only Detection', () => {
    it('should flag inputs with placeholder but no label', async () => {
      const context = createMockContext({
        elements: [
          {
            tag: 'input',
            selector: 'input#email',
            attributes: {
              type: 'email',
              placeholder: 'Enter your email',
            },
            hasLabel: false,
          },
        ],
      });

      const findings = await analyzer.analyze(context);
      const placeholderFinding = findings.find(
        (f) => f.id === 'forms_placeholder_only',
      );

      expect(placeholderFinding).toBeDefined();
      expect(placeholderFinding?.severity).toBe('high');
      expect(placeholderFinding?.evidence.length).toBeGreaterThan(0);
    });

    it('should not flag inputs with proper labels', async () => {
      const context = createMockContext({
        elements: [
          {
            tag: 'input',
            selector: 'input#email',
            attributes: { type: 'email' },
            label: 'Email Address',
            hasLabel: true,
          },
        ],
      });

      const findings = await analyzer.analyze(context);
      const placeholderFinding = findings.find(
        (f) => f.id === 'forms_placeholder_only',
      );

      expect(placeholderFinding).toBeUndefined();
    });

    it('should skip hidden and button inputs', async () => {
      const context = createMockContext({
        elements: [
          {
            tag: 'input',
            attributes: { type: 'hidden', placeholder: 'hidden' },
          },
          {
            tag: 'input',
            attributes: { type: 'submit', placeholder: 'submit' },
          },
        ],
      });

      const findings = await analyzer.analyze(context);
      const placeholderFinding = findings.find(
        (f) => f.id === 'forms_placeholder_only',
      );

      expect(placeholderFinding).toBeUndefined();
    });
  });

  describe('Required Field Marking', () => {
    it('should flag required inputs without visual indicator', async () => {
      const context = createMockContext({
        elements: [
          {
            tag: 'input',
            selector: 'input#phone',
            attributes: { type: 'tel', required: 'required' },
            label: 'Phone Number',
            hasLabel: true,
          },
        ],
      });

      const findings = await analyzer.analyze(context);
      const requiredFinding = findings.find(
        (f) => f.id === 'forms_missing_required_indicator',
      );

      expect(requiredFinding).toBeDefined();
      expect(requiredFinding?.severity).toBe('high');
    });

    it('should pass for required fields with asterisk indicator', async () => {
      const context = createMockContext({
        elements: [
          {
            tag: 'input',
            selector: 'input#phone',
            attributes: { type: 'tel', required: 'required' },
            label: 'Phone Number *',
            hasLabel: true,
          },
        ],
      });

      const findings = await analyzer.analyze(context);
      const requiredFinding = findings.find(
        (f) => f.id === 'forms_missing_required_indicator',
      );

      expect(requiredFinding).toBeUndefined();
    });

    it('should skip optional fields', async () => {
      const context = createMockContext({
        elements: [
          {
            tag: 'input',
            attributes: { type: 'text' },
            label: 'Optional Notes',
            hasLabel: true,
          },
        ],
      });

      const findings = await analyzer.analyze(context);
      const requiredFinding = findings.find(
        (f) => f.id === 'forms_missing_required_indicator',
      );

      expect(requiredFinding).toBeUndefined();
    });
  });

  describe('Form Length Scoring', () => {
    it('should flag forms with >15 fields as high severity', async () => {
      const elements = [];

      // Create a form
      elements.push({ tag: 'form', selector: 'form#signup', attributes: { id: 'signup' } });

      // Add 16 input fields
      for (let i = 0; i < 16; i++) {
        elements.push({
          tag: 'input',
          selector: `input#field${i}`,
          attributes: { type: 'text', form: 'signup' },
        });
      }

      const context = createMockContext({ elements });

      const findings = await analyzer.analyze(context);
      const lengthFinding = findings.find(
        (f) => f.id === 'forms_excessive_length',
      );

      expect(lengthFinding).toBeDefined();
      expect(lengthFinding?.severity).toBe('high');
    });

    it('should flag forms with 10-15 fields as medium severity', async () => {
      const elements = [];

      elements.push({ tag: 'form', selector: 'form#contact', attributes: { id: 'contact' } });

      // Add 12 input fields
      for (let i = 0; i < 12; i++) {
        elements.push({
          tag: 'input',
          selector: `input#field${i}`,
          attributes: { type: 'text', form: 'contact' },
        });
      }

      const context = createMockContext({ elements });

      const findings = await analyzer.analyze(context);
      const lengthFinding = findings.find(
        (f) => f.id === 'forms_long_form_warning',
      );

      expect(lengthFinding).toBeDefined();
      expect(lengthFinding?.severity).toBe('medium');
    });

    it('should not flag short forms', async () => {
      const elements = [];

      elements.push({ tag: 'form', selector: 'form#login' });

      // Add 3 input fields
      for (let i = 0; i < 3; i++) {
        elements.push({
          tag: 'input',
          selector: `input#field${i}`,
          attributes: { type: 'text' },
        });
      }

      const context = createMockContext({ elements });

      const findings = await analyzer.analyze(context);
      const lengthFinding = findings.find(
        (f) =>
          f.id === 'forms_excessive_length' || f.id === 'forms_long_form_warning',
      );

      expect(lengthFinding).toBeUndefined();
    });

    it('should skip hidden fields when counting', async () => {
      const elements = [];

      elements.push({ tag: 'form', selector: 'form#test' });

      // Add 5 visible + 10 hidden fields
      for (let i = 0; i < 5; i++) {
        elements.push({
          tag: 'input',
          selector: `input#visible${i}`,
          attributes: { type: 'text' },
        });
      }

      for (let i = 0; i < 10; i++) {
        elements.push({
          tag: 'input',
          selector: `input#hidden${i}`,
          attributes: { type: 'hidden' },
        });
      }

      const context = createMockContext({ elements });

      const findings = await analyzer.analyze(context);
      const lengthFinding = findings.find(
        (f) =>
          f.id === 'forms_excessive_length' || f.id === 'forms_long_form_warning',
      );

      expect(lengthFinding).toBeUndefined();
    });
  });

  describe('Password Visibility', () => {
    it('should flag password fields without show/hide toggle', async () => {
      const context = createMockContext({
        elements: [
          {
            tag: 'input',
            selector: 'input#password',
            attributes: { type: 'password' },
            label: 'Password',
            hasLabel: true,
          },
        ],
        text: 'Please enter your password',
      });

      const findings = await analyzer.analyze(context);
      const passwordFinding = findings.find((f) => f.id === 'forms_password_ux');

      expect(passwordFinding).toBeDefined();
      expect(passwordFinding?.severity).toMatch(/high|medium/);
    });

    it('should flag password fields without visible requirements', async () => {
      const context = createMockContext({
        elements: [
          {
            tag: 'input',
            selector: 'input#password',
            attributes: { type: 'password' },
            label: 'Password',
            hasLabel: true,
          },
          {
            tag: 'button',
            text: 'Show password',
            attributes: { 'aria-label': 'Show password' },
          },
        ],
        text: 'Enter your password',
      });

      const findings = await analyzer.analyze(context);
      const passwordFinding = findings.find((f) => f.id === 'forms_password_ux');

      expect(passwordFinding).toBeDefined();
    });

    it('should pass for well-implemented password fields', async () => {
      const context = createMockContext({
        elements: [
          {
            tag: 'input',
            selector: 'input#password',
            attributes: { type: 'password' },
            label: 'Password',
            hasLabel: true,
          },
          {
            tag: 'button',
            text: 'Show password',
            attributes: { 'aria-label': 'Show / hide password' },
          },
        ],
        text: 'Password must contain at least 8 characters, including uppercase, lowercase, and numbers',
      });

      const findings = await analyzer.analyze(context);
      const passwordFinding = findings.find((f) => f.id === 'forms_password_ux');

      expect(passwordFinding).toBeUndefined();
    });

    it('should not flag pages with no password fields', async () => {
      const context = createMockContext({
        elements: [
          {
            tag: 'input',
            attributes: { type: 'email' },
          },
        ],
      });

      const findings = await analyzer.analyze(context);
      const passwordFinding = findings.find((f) => f.id === 'forms_password_ux');

      expect(passwordFinding).toBeUndefined();
    });
  });

  describe('Integration', () => {
    it('should aggregate findings from all checks', async () => {
      const context = createMockContext({
        elements: [
          {
            tag: 'form',
            selector: 'form#signup',
            attributes: { id: 'signup' },
          },
          {
            tag: 'input',
            selector: 'input#email',
            attributes: { type: 'email', placeholder: 'email@example.com' },
            hasLabel: false,
          },
          {
            tag: 'input',
            selector: 'input#password',
            attributes: { type: 'password', required: 'required' },
            label: 'Password',
            hasLabel: true,
          },
          // Add 14 more fields to hit the form length threshold
          ...Array.from({ length: 14 }, (_, i) => ({
            tag: 'input' as const,
            selector: `input#field${i}`,
            attributes: { type: 'text', form: 'signup' },
          })),
        ],
        text: 'Create your account',
      });

      const findings = await analyzer.analyze(context);

      expect(findings.length).toBeGreaterThan(0);
      expect(findings.some((f) => f.category === 'forms')).toBe(true);
    });

    it('should handle empty page gracefully', async () => {
      const context = createMockContext({ elements: [] });

      const findings = await analyzer.analyze(context);

      expect(Array.isArray(findings)).toBe(true);
    });

    it('should return valid Finding objects', async () => {
      const context = createMockContext({
        elements: [
          {
            tag: 'input',
            attributes: { type: 'email', placeholder: 'email' },
            hasLabel: false,
          },
        ],
      });

      const findings = await analyzer.analyze(context);

      for (const finding of findings) {
        expect(finding).toHaveProperty('id');
        expect(finding).toHaveProperty('category', 'forms');
        expect(finding).toHaveProperty('severity');
        expect(finding).toHaveProperty('title');
        expect(finding).toHaveProperty('description');
        expect(finding).toHaveProperty('recommendation');
        expect(finding).toHaveProperty('evidence');
        expect(finding).toHaveProperty('confidence');
      }
    });
  });
});
