/**
 * Shared utility functions
 */

/**
 * Extract text content from an element
 */
export function getTextContent(element: Element): string {
  return element.textContent?.trim() || '';
}

/**
 * Get all elements matching selector safely
 */
export function querySelectorAll(document: Document, selector: string): Element[] {
  try {
    return Array.from(document.querySelectorAll(selector));
  } catch {
    return [];
  }
}

/**
 * Calculate reading time in minutes
 */
export function calculateReadingTime(text: string, wordsPerMinute = 200): number {
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Check if element is visible
 */
export function isElementVisible(element: Element, styles: CSSStyleDeclaration): boolean {
  if (styles.display === 'none' || styles.visibility === 'hidden') {
    return false;
  }

  const rect = element.getBoundingClientRect?.();
  if (!rect || (rect.width === 0 && rect.height === 0)) {
    return false;
  }

  return true;
}

/**
 * Validate URL for crawling
 */
export function isValidCrawlUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Normalize whitespace in text
 */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}
