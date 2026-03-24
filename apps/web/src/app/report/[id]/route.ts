/**
 * GET /report/[id]
 * Retrieve a stored audit report
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReportById } from '../../../../../../packages/core/src/persistence/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const { id } = params;

    // Validate report ID format
    if (!id || typeof id !== 'string' || id.length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid report ID',
          code: 'INVALID_ID',
        },
        { status: 400 },
      );
    }

    // Retrieve report from database
    const report = await getReportById(id);

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          error: 'Report not found',
          code: 'NOT_FOUND',
        },
        { status: 404 },
      );
    }

    // Return report with success flag
    return NextResponse.json(
      {
        success: true,
        report,
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    console.error('[GET /report/[id]] Error:', errorMsg, error);

    return NextResponse.json(
      {
        success: false,
        error: `Failed to retrieve report: ${errorMsg}`,
        code: 'RETRIEVAL_FAILED',
      },
      { status: 500 },
    );
  }
}
