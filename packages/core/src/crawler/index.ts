/**
 * Crawler module - Will be implemented with Playwright
 * Handles page loading, DOM snapshots, and style extraction
 */

import type { PageContext } from '../schema';

export interface CrawlerConfig {
  timeout?: number;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface CrawlerResult {
  url: string;
  html: string;
  title: string;
  error?: string;
}

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
  // Implementation will follow in PR #2
  throw new Error('Not implemented yet');
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
