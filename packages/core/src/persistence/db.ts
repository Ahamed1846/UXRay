/**
 * Database utilities for report persistence
 * Handles saving and retrieving audit reports from SQLite
 */

import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { existsSync } from 'fs';
import { dirname, join } from 'path';

// Singleton Prisma client
let prisma: PrismaClient;
let initPromise: Promise<PrismaClient> | null = null;

function resolveWorkspaceRoot(): string {
  let currentDir = process.cwd();

  for (let i = 0; i < 8; i += 1) {
    if (existsSync(join(currentDir, 'prisma', 'schema.prisma'))) {
      return currentDir;
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  return process.cwd();
}

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  return `file:${join(resolveWorkspaceRoot(), 'uxray.db')}`;
}

function getPrismaClient(): PrismaClient {
  if (!prisma) {
    const databaseUrl = resolveDatabaseUrl();

    const adapter = new PrismaBetterSqlite3({
      url: databaseUrl,
    });

    prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    });
  }
  return prisma;
}

async function ensureInitializedClient(): Promise<PrismaClient> {
  if (!initPromise) {
    const prismaClient = getPrismaClient();

    initPromise = (async () => {
      await prismaClient.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Report" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "url" TEXT NOT NULL,
          "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "data" TEXT NOT NULL
        )
      `);
      await prismaClient.$executeRawUnsafe(
        'CREATE INDEX IF NOT EXISTS "Report_url_idx" ON "Report"("url")',
      );
      await prismaClient.$executeRawUnsafe(
        'CREATE INDEX IF NOT EXISTS "Report_timestamp_idx" ON "Report"("timestamp")',
      );

      return prismaClient;
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }

  return initPromise;
}

/**
 * Type for report data
 */
export interface ReportData {
  url: string;
  timestamp: string;
  summary: {
    overallScore: number;
    categoryScores: {
      accessibility: number;
      readability: number;
      mobile: number;
      forms: number;
      navigation: number;
    };
  };
  findingsCount: number;
  findings: Array<{
    id: string;
    category: string;
    severity: string;
    title: string;
    priority: string;
    suggestedFix: string;
    confidence: number;
  }>;
  recommendations: {
    totalFindings: number;
    immediateCount: number;
    importantCount: number;
    niceToHaveCount: number;
    categoryInsights: Array<{
      category: string;
      findingCount: number;
      topPriority: string;
      summary: string;
    }>;
  };
}

/**
 * Save a report to the database
 * @param reportData - The complete report data to save
 * @returns Report ID and timestamp
 */
export async function saveReport(reportData: ReportData): Promise<{
  id: string;
  timestamp: string;
}> {
  const prismaClient = await ensureInitializedClient();

  try {
    const report = await prismaClient.report.create({
      data: {
        url: reportData.url,
        data: JSON.stringify(reportData),
      },
      select: {
        id: true,
        timestamp: true,
      },
    });

    return {
      id: report.id,
      timestamp: report.timestamp.toISOString(),
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to save report: ${errorMsg}`);
  }
}

/**
 * Retrieve a report by ID
 * @param id - Report ID
 * @returns Report data or null if not found
 */
export async function getReportById(id: string): Promise<ReportData | null> {
  const prismaClient = await ensureInitializedClient();

  try {
    const report = await prismaClient.report.findUnique({
      where: { id },
    });

    if (!report) {
      return null;
    }

    return JSON.parse(report.data) as ReportData;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to retrieve report: ${errorMsg}`);
  }
}

/**
 * Get all reports for a URL (most recent first)
 * @param url - Website URL
 * @param limit - Maximum number of reports to return
 * @returns Array of report summaries
 */
export async function getReportsByUrl(
  url: string,
  limit: number = 10,
): Promise<
  Array<{
    id: string;
    timestamp: string;
    overallScore: number;
  }>
> {
  const prismaClient = await ensureInitializedClient();

  try {
    const reports = await prismaClient.report.findMany({
      where: { url },
      take: limit,
      orderBy: { timestamp: 'desc' },
      select: { id: true, timestamp: true, data: true },
    });

    return reports.map((report) => {
      const data = JSON.parse(report.data) as ReportData;
      return {
        id: report.id,
        timestamp: report.timestamp.toISOString(),
        overallScore: data.summary.overallScore,
      };
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to retrieve reports: ${errorMsg}`);
  }
}

/**
 * Delete a report by ID
 * @param id - Report ID
 * @returns true if deleted, false if not found
 */
export async function deleteReport(id: string): Promise<boolean> {
  const prismaClient = await ensureInitializedClient();

  try {
    const result = await prismaClient.report.delete({
      where: { id },
    });

    return !!result;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('Record to delete does not exist') ||
        error.message.includes('No record was found for a delete'))
    ) {
      return false;
    }
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to delete report: ${errorMsg}`);
  }
}

/**
 * Get total number of reports in database
 * @returns Report count
 */
export async function getReportCount(): Promise<number> {
  const prismaClient = await ensureInitializedClient();

  try {
    return await prismaClient.report.count();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to count reports: ${errorMsg}`);
  }
}

/**
 * Clean up Prisma connection
 */
export async function disconnect(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    initPromise = null;
  }
}
