/**
 * Crawler module
 * Handles page loading, DOM snapshots, and style extraction using Playwright
 */

import { chromium, Browser, Page } from 'playwright';
import type { PageContext } from '../schema';

export interface CrawlerConfig {
  timeout?: number;
  viewport?: {
    width: number;
    height: number;
  };
  headless?: boolean;
  debug?: boolean;
}

export interface CrawlerResult {
  url: string;
  html: string;
  title: string;
  error?: string;
}

// Default configuration
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_VIEWPORT = { width: 1280, height: 720 };
const DEFAULT_USER_AGENT = 'UXRayBot/0.1 (compatibility test)';

/**
 * Crawls a URL and returns page context for analyzers
 * @param url The URL to crawl
 * @param config Crawler configuration
 * @returns PageContext for analyzers or CrawlerResult with error
 */
export async function crawlPage(
  url: string,
  config?: CrawlerConfig,
): Promise<PageContext | CrawlerResult> {
  // Validate and normalize URL
  const normalizedUrl = validateAndNormalizeUrl(url);

  // Check for SSRF
  const urlObj = new URL(normalizedUrl);
  if (isPrivateIpRange(urlObj.hostname)) {
    return {
      url: normalizedUrl,
      html: '',
      title: '',
      error: 'SSRF protection: Private IP ranges are not allowed',
    };
  }

  const timeout = config?.timeout ?? DEFAULT_TIMEOUT;
  const viewport = config?.viewport ?? DEFAULT_VIEWPORT;
  const debug = config?.debug ?? false;

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    if (debug) {
      console.log(`[UXRay] Starting crawler for: ${normalizedUrl}`);
    }

    // Launch browser
    browser = await chromium.launch({
      headless: config?.headless !== false,
    });

    // Create page with custom user agent
    page = await browser.newPage({
      viewport,
      userAgent: DEFAULT_USER_AGENT,
    });

    // Set navigation timeout
    page.setDefaultTimeout(timeout);
    page.setDefaultNavigationTimeout(timeout);

    if (debug) {
      console.log(`[UXRay] Navigating to: ${normalizedUrl}`);
    }

    // Navigate to URL
    try {
      await page.goto(normalizedUrl, { waitUntil: 'networkidle' });
    } catch (navError) {
      // Some pages might throw but still load partial content
      if (debug) {
        console.warn(`[UXRay] Navigation error (continuing): ${navError}`);
      }
    }

    // Get HTML content
    const html = await page.content();
    const title = await page.title();

    if (debug) {
      console.log(`[UXRay] Successfully crawled: ${normalizedUrl} (${html.length} bytes)`);
    }

    // Extract raw data for PageContext
    const pageContext = extractPageContext(normalizedUrl, html, viewport, debug);

    return pageContext;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (debug) {
      console.error(`[UXRay] Crawler error: ${errorMessage}`);
    }

    return {
      url: normalizedUrl,
      html: '',
      title: '',
      error: `Failed to crawl URL: ${errorMessage}`,
    };
  } finally {
    // Cleanup
    if (page) {
      await page.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

/**
 * Extract PageContext from HTML and page metadata
 * Full DOM extraction utilities will be implemented in PR #3
 */
function extractPageContext(
  url: string,
  html: string,
  viewport: { width: number; height: number },
  debug: boolean,
): PageContext {
  if (debug) {
    console.log(`[UXRay] Extracting page context from ${url}`);
  }

  // For now, return basic context
  // Full DOM extraction will be implemented in PR #3
  return {
    url,
    html,
    dom: null as any, // Will be properly parsed in PR #3
    computedStyles: new Map(),
    headings: [],
    images: [],
    forms: [],
    links: [],
    text: extractTextContent(html),
    viewport,
  };
}

/**
 * Simple text extraction from HTML (basic implementation)
 * Full implementation with proper DOM parsing in PR #3
 */
function extractTextContent(html: string): string {
  // Remove script and style tags
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, '');

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Validates and normalizes a URL
 * @param url The URL to validate
 * @returns The normalized URL or throws an error
 */
export function validateAndNormalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Ensure we have a protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Only HTTP and HTTPS protocols are supported');
    }
    return urlObj.toString();
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`);
  }
}

/**
 * Checks if a URL is in a private IP range (SSRF protection)
 * @param url The URL to check
 * @returns true if the URL is in a private range
 */
export function isPrivateIpRange(hostname: string): boolean {
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
