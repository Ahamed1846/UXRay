/**
 * POST /api/reports
 * Save an audit report and return shareable link
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  saveReport,
  type ReportData,
} from '../../../../../packages/core/src/persistence/db';
import { AuditReportSchema } from '../../../../../packages/core/src/schema/types';

const EMPTY_RECOMMENDATIONS: ReportData['recommendations'] = {
  totalFindings: 0,
  immediateCount: 0,
  importantCount: 0,
  niceToHaveCount: 0,
  categoryInsights: [],
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate report data structure
    const validation = AuditReportSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid report data',
          code: 'INVALID_REPORT',
        },
        { status: 400 },
      );
    }

    const reportData = validation.data;
    const requestData = body as { recommendations?: ReportData['recommendations'] };

    // Save report to database
    const { id, timestamp } = await saveReport({
      url: reportData.url,
      timestamp: reportData.timestamp,
      summary: reportData.summary,
      findingsCount: reportData.findings.length,
      findings: reportData.findings.map((f) => ({
        id: f.id,
        category: f.category,
        severity: f.severity,
        title: f.title,
        priority:
          'priority' in f && typeof f.priority === 'string'
            ? f.priority
            : 'important',
        suggestedFix:
          'suggestedFix' in f && typeof f.suggestedFix === 'string'
            ? f.suggestedFix
            : f.recommendation,
        confidence: f.confidence,
      })),
      recommendations: requestData.recommendations || EMPTY_RECOMMENDATIONS,
    });

    // Return shareable report link
    return NextResponse.json(
      {
        success: true,
        reportId: id,
        timestamp,
        reportUrl: `/report/${id}`,
        shareUrl: `${process.env.VERCEL_URL || 'http://localhost:3000'}/report/${id}`,
      },
      { status: 201 },
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    console.error('[POST /api/reports] Error:', errorMsg, error);

    return NextResponse.json(
      {
        success: false,
        error: `Failed to save report: ${errorMsg}`,
        code: 'SAVE_FAILED',
      },
      { status: 500 },
    );
  }
}
