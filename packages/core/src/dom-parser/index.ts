/**
 * DOM Parser and Extractor
 * Uses Cheerio to parse HTML and extract page elements
 */

import { load, CheerioAPI } from 'cheerio';
import type { PageContext, HeadingInfo, ImageInfo, FormInfo, FormInputInfo, LinkInfo } from '../schema';

/**
 * Parse HTML and extract page context
 */
export function parsePageFromHtml(url: string, html: string): PageContext {
  const $ = load(html);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return {
    url,
    html,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dom: $ as any, // Store Cheerio instance for advanced queries
    computedStyles: new Map(), // Will be enhanced in future PRs with jsdom
    headings: extractHeadings($),
    images: extractImages($),
    forms: extractForms($),
    links: extractLinks($),
    text: extractTextContent($),
    viewport: undefined, // Can be enhanced with meta tag detection
  };
}

/**
 * Extract all headings from the page
 */
export function extractHeadings($: CheerioAPI): HeadingInfo[] {
  const headings: HeadingInfo[] = [];

  $('h1, h2, h3, h4, h5, h6').each((_, element) => {
    const level = parseInt(element.name[1], 10);
    const text = $(element).text().trim();

    if (text) {
      headings.push({
        level,
        text,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        element: element as any,
      });
    }
  });

  return headings;
}

/**
 * Extract all images from the page
 */
export function extractImages($: CheerioAPI): ImageInfo[] {
  const images: ImageInfo[] = [];

  $('img').each((_, element) => {
    const src = $(element).attr('src') || '';
    const alt = $(element).attr('alt') || null;

    if (src) {
      images.push({
        src,
        alt,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        element: element as any,
      });
    }
  });

  return images;
}

/**
 * Extract all forms from the page
 */
export function extractForms($: CheerioAPI): FormInfo[] {
  const forms: FormInfo[] = [];

  $('form').each((_, formElement) => {
    const $form = $(formElement);
    const id = $form.attr('id') || null;
    const inputs: FormInputInfo[] = [];

    // Get all inputs in this form
    $form.find('input, textarea, select').each((_, inputElement) => {
      const $input = $(inputElement);
      const type = $input.attr('type') || $input.prop('tagName')?.toLowerCase();
      const name = $input.attr('name') || null;
      const inputId = $input.attr('id') || null;
      const required = $input.attr('required') !== undefined;

      // Check if input has associated label
      let hasLabel = false;
      if (inputId) {
        hasLabel = $form.find(`label[for="${inputId}"]`).length > 0;
      }
      if (!hasLabel && name) {
        hasLabel = $form.find(`label:contains("${name}")`).length > 0;
      }

      inputs.push({
        type: String(type),
        name,
        id: inputId,
        hasLabel,
        required,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        element: inputElement as any,
      });
    });

    forms.push({
      id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      element: formElement as any,
      inputs,
    });
  });

  return forms;
}

/**
 * Extract all links from the page
 */
export function extractLinks($: CheerioAPI): LinkInfo[] {
  const links: LinkInfo[] = [];

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href') || '';
    const text = $(element).text().trim();

    if (href) {
      links.push({
        href,
        text,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        element: element as any,
      });
    }
  });

  return links;
}

/**
 * Extract plain text content from the page
 */
export function extractTextContent($: CheerioAPI): string {
  // Remove script and style elements
  $('script, style').remove();

  // Get text content and normalize whitespace
  const text = $.text().replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Get viewport information from meta tags
 */
export function extractViewportInfo($: CheerioAPI): { width: number; height: number } | undefined {
  const viewport = $('meta[name="viewport"]').attr('content');

  if (!viewport) {
    return undefined;
  }

  // Parse viewport string: "width=device-width, initial-scale=1"
  const widthMatch = /width=(\d+)/.exec(viewport);
  const heightMatch = /height=(\d+)/.exec(viewport);

  if (widthMatch || heightMatch) {
    return {
      width: widthMatch ? parseInt(widthMatch[1], 10) : 1280,
      height: heightMatch ? parseInt(heightMatch[1], 10) : 720,
    };
  }

  return undefined;
}

/**
 * Count various page statistics
 */
export function getPageStats($: CheerioAPI): {
  wordCount: number;
  paragraphCount: number;
  headingCount: number;
  imageCount: number;
  linkCount: number;
  formCount: number;
} {
  return {
    wordCount: $.text().split(/\s+/).length,
    paragraphCount: $('p').length,
    headingCount: $('h1, h2, h3, h4, h5, h6').length,
    imageCount: $('img').length,
    linkCount: $('a[href]').length,
    formCount: $('form').length,
  };
}
