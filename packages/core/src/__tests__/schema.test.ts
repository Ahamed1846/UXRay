/**
 * Test suite for schema validation
 */

import { describe, it, expect } from 'vitest';
import {
  FindingSchema,
  SeveritySchema,
  AuditReportSchema,
  CategoryScoresSchema,
  ReportSummarySchema,
} from '../schema/types';

describe('Schema Validation', () => {
  describe('SeveritySchema', () => {
    it('should accept valid severity values', () => {
      expect(SeveritySchema.parse('critical')).toBe('critical');
      expect(SeveritySchema.parse('high')).toBe('high');
      expect(SeveritySchema.parse('medium')).toBe('medium');
      expect(SeveritySchema.parse('low')).toBe('low');
    });

    it('should reject invalid severity values', () => {
      expect(() => SeveritySchema.parse('invalid')).toThrow();
    });
  });

  describe('FindingSchema', () => {
    it('should validate a complete finding', () => {
      const finding = {
        id: 'test_finding',
        category: 'accessibility' as const,
        severity: 'critical' as const,
        title: 'Test Finding',
        description: 'This is a test finding',
        evidence: [{ selector: '#test', snippet: '<div id="test">' }],
        recommendation: 'Fix this issue',
        confidence: 0.9,
      };

      expect(FindingSchema.parse(finding)).toEqual(finding);
    });

    it('should require all finding fields', () => {
      const incompleteFinding = {
        id: 'test',
        category: 'accessibility',
        severity: 'high',
        title: 'Test',
        description: 'Test description',
        // missing evidence, recommendation, confidence
      };

      expect(() => FindingSchema.parse(incompleteFinding)).toThrow();
    });

    it('should validate confidence between 0 and 1', () => {
      const finding = {
        id: 'test',
        category: 'accessibility' as const,
        severity: 'high' as const,
        title: 'Test',
        description: 'Test',
        evidence: [{ selector: '#test' }],
        recommendation: 'Fix',
        confidence: 1.5, // Invalid
      };

      expect(() => FindingSchema.parse(finding)).toThrow();
    });
  });

  describe('CategoryScoresSchema', () => {
    it('should validate scores between 0 and 100', () => {
      const scores = {
        accessibility: 85,
        readability: 90,
        mobile: 75,
        forms: 80,
        navigation: 88,
      };

      expect(CategoryScoresSchema.parse(scores)).toEqual(scores);
    });

    it('should reject scores outside 0-100 range', () => {
      const invalidScores = {
        accessibility: 150,
        readability: 90,
        mobile: 75,
        forms: 80,
        navigation: 88,
      };

      expect(() => CategoryScoresSchema.parse(invalidScores)).toThrow();
    });
  });

  describe('ReportSummarySchema', () => {
    it('should validate a complete report summary', () => {
      const summary = {
        overallScore: 82,
        categoryScores: {
          accessibility: 78,
          readability: 85,
          mobile: 80,
          forms: 76,
          navigation: 90,
        },
      };

      expect(ReportSummarySchema.parse(summary)).toEqual(summary);
    });
  });

  describe('AuditReportSchema', () => {
    it('should validate a complete audit report', () => {
      const report = {
        url: 'https://example.com',
        timestamp: '2026-03-08T12:00:00Z',
        summary: {
          overallScore: 82,
          categoryScores: {
            accessibility: 78,
            readability: 85,
            mobile: 80,
            forms: 76,
            navigation: 90,
          },
        },
        findings: [
          {
            id: 'test_finding',
            category: 'accessibility' as const,
            severity: 'high' as const,
            title: 'Test Finding',
            description: 'Test description',
            evidence: [{ selector: '#test' }],
            recommendation: 'Fix this',
            confidence: 0.8,
          },
        ],
        meta: {
          engine: 'playwright',
          pagesAnalyzed: 1,
          userAgent: 'UXRayBot/0.1',
        },
      };

      const result = AuditReportSchema.parse(report);
      expect(result.url).toBe('https://example.com');
      expect(result.findings).toHaveLength(1);
    });

    it('should reject invalid URL', () => {
      const invalidReport = {
        url: 'not-a-url',
        timestamp: '2026-03-08T12:00:00Z',
        summary: {
          overallScore: 82,
          categoryScores: {
            accessibility: 78,
            readability: 85,
            mobile: 80,
            forms: 76,
            navigation: 90,
          },
        },
        findings: [],
        meta: {
          engine: 'playwright',
          pagesAnalyzed: 1,
          userAgent: 'UXRayBot/0.1',
        },
      };

      expect(() => AuditReportSchema.parse(invalidReport)).toThrow();
    });
  });
});
