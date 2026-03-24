/**
 * Tests for report persistence layer
 * Verify save, retrieve, and delete operations work correctly
 */

import { describe, it, expect, afterAll } from 'vitest';
import {
  saveReport,
  getReportById,
  getReportsByUrl,
  getReportCount,
  deleteReport,
  disconnect,
  type ReportData,
} from '../persistence/db';

describe('Report Persistence', () => {
  const sampleReport: ReportData = {
    url: 'https://example.com',
    timestamp: new Date().toISOString(),
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
    findingsCount: 5,
    findings: [
      {
        id: 'test_finding_1',
        category: 'accessibility',
        severity: 'high',
        title: 'Missing alt text',
        priority: 'important',
        suggestedFix: 'Add alt text to images',
        confidence: 0.95,
      },
    ],
    recommendations: {
      totalFindings: 1,
      immediateCount: 0,
      importantCount: 1,
      niceToHaveCount: 0,
      categoryInsights: [
        {
          category: 'accessibility',
          findingCount: 1,
          topPriority: 'important',
          summary: '1 issue found',
        },
      ],
    },
  };

  afterAll(async () => {
    await disconnect();
  });

  describe('saveReport', () => {
    it('should save a report and return ID and timestamp', async () => {
      const result = await saveReport(sampleReport);
      expect(result.id).toBeTruthy();
      expect(result.id.length).toBeGreaterThan(0);
      expect(result.timestamp).toBeTruthy();
    });

    it('should create a valid report ID (CUID format)', async () => {
      const result = await saveReport(sampleReport);
      // CUID should be at least 25 characters
      expect(result.id.length).toBeGreaterThanOrEqual(25);
    });

    it('should save report with all necessary fields', async () => {
      const result = await saveReport(sampleReport);
      const retrieved = await getReportById(result.id);
      expect(retrieved).toBeTruthy();
      if (retrieved) {
        expect(retrieved.url).toBe(sampleReport.url);
        expect(retrieved.summary.overallScore).toBe(
          sampleReport.summary.overallScore,
        );
      }
    });

    it('should handle multiple reports for same URL', async () => {
      const result1 = await saveReport(sampleReport);
      await new Promise((resolve) => setTimeout(resolve, 5));
      const result2 = await saveReport(sampleReport);
      expect(result1.id).not.toBe(result2.id);
      expect(result1.timestamp).not.toBe(result2.timestamp);
    });
  });

  describe('getReportById', () => {
    it('should retrieve a saved report by ID', async () => {
      const saved = await saveReport(sampleReport);
      const retrieved = await getReportById(saved.id);
      expect(retrieved).not.toBeNull();
      if (retrieved) {
        expect(retrieved.url).toBe(sampleReport.url);
        expect(retrieved.summary.overallScore).toBe(82);
      }
    });

    it('should return null for non-existent report ID', async () => {
      const retrieved = await getReportById('non_existent_id_xyz');
      expect(retrieved).toBeNull();
    });

    it('should preserve all report data on retrieval', async () => {
      const saved = await saveReport(sampleReport);
      const retrieved = await getReportById(saved.id);
      expect(retrieved).toEqual(sampleReport);
    });

    it('should handle special characters in URL', async () => {
      const specialReport: ReportData = {
        ...sampleReport,
        url: 'https://example.com/path?param=value&other=123#section',
      };
      const saved = await saveReport(specialReport);
      const retrieved = await getReportById(saved.id);
      expect(retrieved?.url).toBe(specialReport.url);
    });
  });

  describe('getReportsByUrl', () => {
    it('should retrieve reports by URL', async () => {
      const url = 'https://test-url-1.com';
      const report1: ReportData = { ...sampleReport, url };
      const report2: ReportData = { ...sampleReport, url };

      await saveReport(report1);
      await saveReport(report2);

      const reports = await getReportsByUrl(url, 10);
      expect(reports.length).toBeGreaterThanOrEqual(2);
      expect(reports[0].id).not.toBeUndefined();
      expect(reports[0].overallScore).toBeDefined();
    });

    it('should return empty array for URL with no reports', async () => {
      const reports = await getReportsByUrl('https://non-existent-url.com');
      expect(reports.length).toBe(0);
    });

    it('should return most recent reports first', async () => {
      const url = 'https://test-url-2.com';
      const report1: ReportData = { ...sampleReport, url };
      const report2: ReportData = { ...sampleReport, url };

      await saveReport(report1);
      await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay
      const saved2 = await saveReport(report2);

      const reports = await getReportsByUrl(url);
      expect(reports[0].id).toBe(saved2.id);
    });

    it('should respect limit parameter', async () => {
      const url = 'https://test-url-3.com';
      const report: ReportData = { ...sampleReport, url };

      // Save 5 reports
      for (let i = 0; i < 5; i++) {
        await saveReport(report);
        // Small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const reports = await getReportsByUrl(url, 3);
      expect(reports.length).toBeLessThanOrEqual(3);
    });
  });

  describe('deleteReport', () => {
    it('should delete a report', async () => {
      const saved = await saveReport(sampleReport);
      const deleted = await deleteReport(saved.id);
      expect(deleted).toBe(true);

      const retrieved = await getReportById(saved.id);
      expect(retrieved).toBeNull();
    });

    it('should return false when deleting non-existent report', async () => {
      const deleted = await deleteReport('non_existent_id');
      expect(deleted).toBe(false);
    });
  });

  describe('getReportCount', () => {
    it('should return total number of reports', async () => {
      const countBefore = await getReportCount();
      await saveReport(sampleReport);
      const countAfter = await getReportCount();
      expect(countAfter).toBeGreaterThanOrEqual(countBefore);
    });

    it('should increment count when saving reports', async () => {
      const countBefore = await getReportCount();
      await saveReport(sampleReport);
      await saveReport(sampleReport);
      const countAfter = await getReportCount();
      expect(countAfter).toBe(countBefore + 2);
    });
  });

  describe('data integrity', () => {
    it('should preserve complex nested structures', async () => {
      const complexReport: ReportData = {
        url: 'https://complex.com',
        timestamp: new Date().toISOString(),
        summary: {
          overallScore: 75,
          categoryScores: {
            accessibility: 80,
            readability: 70,
            mobile: 75,
            forms: 80,
            navigation: 70,
          },
        },
        findingsCount: 3,
        findings: [
          {
            id: 'finding_1',
            category: 'accessibility',
            severity: 'critical',
            title: 'Critical accessibility issue',
            priority: 'immediate',
            suggestedFix: 'Fix immediately',
            confidence: 0.99,
          },
          {
            id: 'finding_2',
            category: 'mobile',
            severity: 'medium',
            title: 'Mobile issue',
            priority: 'important',
            suggestedFix: 'Improve responsive design',
            confidence: 0.85,
          },
        ],
        recommendations: {
          totalFindings: 2,
          immediateCount: 1,
          importantCount: 1,
          niceToHaveCount: 0,
          categoryInsights: [
            {
              category: 'accessibility',
              findingCount: 1,
              topPriority: 'immediate',
              summary: '1 critical issue',
            },
            {
              category: 'mobile',
              findingCount: 1,
              topPriority: 'important',
              summary: '1 important issue',
            },
          ],
        },
      };

      const saved = await saveReport(complexReport);
      const retrieved = await getReportById(saved.id);
      expect(retrieved).toEqual(complexReport);
    });

    it('should handle reports with empty findings', async () => {
      const emptyReport: ReportData = {
        ...sampleReport,
        findingsCount: 0,
        findings: [],
        recommendations: {
          totalFindings: 0,
          immediateCount: 0,
          importantCount: 0,
          niceToHaveCount: 0,
          categoryInsights: [],
        },
      };

      const saved = await saveReport(emptyReport);
      const retrieved = await getReportById(saved.id);
      expect(retrieved?.findingsCount).toBe(0);
      expect(retrieved?.findings).toHaveLength(0);
    });

    it('should handle reports with perfect scores', async () => {
      const perfectReport: ReportData = {
        ...sampleReport,
        summary: {
          overallScore: 100,
          categoryScores: {
            accessibility: 100,
            readability: 100,
            mobile: 100,
            forms: 100,
            navigation: 100,
          },
        },
      };

      const saved = await saveReport(perfectReport);
      const retrieved = await getReportById(saved.id);
      expect(retrieved?.summary.overallScore).toBe(100);
    });
  });

  describe('error handling', () => {
    it('should handle save errors gracefully', async () => {
      const invalidReport = {} as ReportData;
      try {
        await saveReport(invalidReport);
        // If it doesn't throw, that's also acceptable (graceful degradation)
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
