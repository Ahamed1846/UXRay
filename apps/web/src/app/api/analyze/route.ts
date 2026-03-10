import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { parsePageFromHtml } from '../../../../../../packages/core/src/dom-parser';
import { AccessibilityAnalyzer } from '../../../../../../packages/core/src/analyzers/accessibility';

/**
 * URL validation and normalization
 */
function validateAndNormalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Ensure we have a protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Only HTTP and HTTPS protocols are supported');
    }
    return urlObj.toString();
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}

/**
 * SSRF protection - check for private IP ranges
 */
function isPrivateIpRange(hostname: string): boolean {
  const privateRanges = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^::1$/,
    /^fc00:/,
    /^fe80:/,
  ];

  return privateRanges.some((range) => range.test(hostname));
}

/**
 * Crawl a page using Playwright
 */
async function crawlPage(
  url: string,
  timeout: number = 30000,
  debug: boolean = false,
): Promise<{ html: string; error?: string }> {
  let browser = null;
  let page = null;

  try {
    if (debug) {
      console.log(`[crawl] Starting for: ${url}`);
    }

    browser = await chromium.launch({ headless: true });
    page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
      userAgent: 'UXRayBot/0.1 (compatibility test)',
    });

    page.setDefaultTimeout(timeout);
    page.setDefaultNavigationTimeout(timeout);

    try {
      await page.goto(url, { waitUntil: 'networkidle' });
    } catch (navError) {
      if (debug) {
        console.warn(`[crawl] Navigation error (continuing): ${navError}`);
      }
    }

    const html = await page.content();

    if (debug) {
      console.log(`[crawl] Success: ${html.length} bytes`);
    }

    return { html };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (debug) {
      console.error(`[crawl] Error: ${errorMessage}`);
    }

    return { html: '', error: `Failed to crawl: ${errorMessage}` };
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

/**
 * Request validation schema
 */
const AnalyzeRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
  timeout: z.number().int().positive().optional().default(30000),
  debug: z.boolean().optional().default(false),
});

type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

/**
 * Response schema for successful analysis
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AnalyzeResponseSchema = z.object({
  success: z.boolean(),
  url: z.string(),
  htmlLength: z.number(),
  timestamp: z.string().datetime(),
  debug: z.record(z.string(), z.any()).optional(),
});

type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;

/**
 * Error response schema
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string(),
  url: z.string().optional(),
});

/**
 * POST /api/analyze
 * Analyzes a URL and returns raw HTML snapshot with metadata
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = AnalyzeRequestSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.flatten();
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: ' + JSON.stringify(errors.fieldErrors),
          code: 'VALIDATION_ERROR',
        } satisfies z.infer<typeof ErrorResponseSchema>,
        { status: 400 },
      );
    }

    const { url, timeout, debug }: AnalyzeRequest = validation.data;

    // Log request if debug enabled
    if (debug) {
      console.log(`[/api/analyze] Request for: ${url}`);
    }

    // Validate and normalize URL
    let normalizedUrl: string;
    try {
      normalizedUrl = validateAndNormalizeUrl(url);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Invalid URL';
      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
          code: 'INVALID_URL',
          url,
        } satisfies z.infer<typeof ErrorResponseSchema>,
        { status: 400 },
      );
    }

    // Check for SSRF
    const urlObj = new URL(normalizedUrl);
    if (isPrivateIpRange(urlObj.hostname)) {
      return NextResponse.json(
        {
          success: false,
          error: 'SSRF protection: Private IP ranges are not allowed',
          code: 'SSRF_BLOCKED',
          url: normalizedUrl,
        } satisfies z.infer<typeof ErrorResponseSchema>,
        { status: 403 },
      );
    }

    // Crawl the page
    const crawlResult = await crawlPage(normalizedUrl, timeout, debug);

    // Check if crawl resulted in error
    if (crawlResult.error) {
      if (debug) {
        console.log(`[/api/analyze] Crawl error: ${crawlResult.error}`);
      }

      return NextResponse.json(
        {
          success: false,
          error: crawlResult.error,
          code: 'CRAWL_FAILED',
          url: normalizedUrl,
        } satisfies z.infer<typeof ErrorResponseSchema>,
        { status: 500 },
      );
    }

    // Success response
    const response: AnalyzeResponse = {
      success: true,
      url: normalizedUrl,
      htmlLength: crawlResult.html.length,
      timestamp: new Date().toISOString(),
      ...(debug && {
        debug: {
          timestamp: new Date().toISOString(),
        },
      }),
    };

    if (debug) {
      console.log(
        `[/api/analyze] Success: ${normalizedUrl} (${response.htmlLength} bytes)`,
      );
    }

    // Parse and analyze the HTML for accessibility issues
    let findings = [];
    try {
      const context = parsePageFromHtml(normalizedUrl, crawlResult.html);
      const analyzer = new AccessibilityAnalyzer();
      findings = await analyzer.analyze(context);
      
      if (debug) {
        console.log(`[/api/analyze] Found ${findings.length} accessibility issues`);
      }
    } catch (analyzerError) {
      if (debug) {
        console.warn(`[/api/analyze] Analyzer error: ${analyzerError}`);
      }
      // Continue without findings on analyzer error
    }

    // Include findings in response
    return NextResponse.json(
      {
        ...response,
        findingsCount: findings.length,
        findings: findings.map((f) => ({
          id: f.id,
          category: f.category,
          severity: f.severity,
          title: f.title,
          description: f.description,
          recommendation: f.recommendation,
          confidence: f.confidence,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    console.error(`[/api/analyze] Error: ${errorMsg}`, error);

    return NextResponse.json(
      {
        success: false,
        error: `Internal server error: ${errorMsg}`,
        code: 'INTERNAL_ERROR',
      } satisfies z.infer<typeof ErrorResponseSchema>,
      { status: 500 },
    );
  }
}
