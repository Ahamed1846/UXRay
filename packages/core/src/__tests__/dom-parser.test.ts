/**
 * Test suite for DOM parser and extraction utilities
 */

import { describe, it, expect } from 'vitest';
import { load } from 'cheerio';
import {
  extractHeadings,
  extractImages,
  extractForms,
  extractLinks,
  extractTextContent,
  getPageStats,
  parsePageFromHtml,
} from '../dom-parser';

// Mock HTML fixture
const mockHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Page</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <h1>Main Heading</h1>
  <h2>Sub Heading</h2>
  <p>This is a paragraph with some text content.</p>
  
  <img src="/image1.jpg" alt="Test image">
  <img src="/image2.jpg">
  
  <form>
    <label for="email">Email</label>
    <input type="email" id="email" name="email" required>
    
    <label for="password">Password</label>
    <input type="password" id="password" name="password" required>
    
    <input type="submit" value="Submit">
  </form>
  
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
  </nav>
</body>
</html>
`;

describe('DOM Parser', () => {
  const $ = load(mockHtml);

  describe('extractHeadings', () => {
    it('should extract all headings', () => {
      const headings = extractHeadings($);

      expect(headings).toHaveLength(2);
      expect(headings[0].level).toBe(1);
      expect(headings[0].text).toBe('Main Heading');
      expect(headings[1].level).toBe(2);
      expect(headings[1].text).toBe('Sub Heading');
    });

    it('should skip empty headings', () => {
      const emptyHtml = '<h1></h1><h2>Content</h2>';
      const $empty = load(emptyHtml);
      const headings = extractHeadings($empty);

      expect(headings).toHaveLength(1);
      expect(headings[0].text).toBe('Content');
    });
  });

  describe('extractImages', () => {
    it('should extract all images', () => {
      const images = extractImages($);

      expect(images).toHaveLength(2);
      expect(images[0].src).toBe('/image1.jpg');
      expect(images[0].alt).toBe('Test image');
      expect(images[1].src).toBe('/image2.jpg');
      expect(images[1].alt).toBeNull();
    });
  });

  describe('extractForms', () => {
    it('should extract form information', () => {
      const forms = extractForms($);

      expect(forms).toHaveLength(1);
      expect(forms[0].inputs).toHaveLength(3);
    });

    it('should detect form inputs', () => {
      const forms = extractForms($);
      const inputs = forms[0].inputs;

      expect(inputs[0].type).toBe('email');
      expect(inputs[0].name).toBe('email');
      expect(inputs[0].required).toBe(true);
      expect(inputs[0].hasLabel).toBe(true);

      expect(inputs[1].type).toBe('password');
      expect(inputs[1].required).toBe(true);

      expect(inputs[2].type).toBe('submit');
    });
  });

  describe('extractLinks', () => {
    it('should extract all links', () => {
      const links = extractLinks($);

      expect(links).toHaveLength(3);
      expect(links[0].href).toBe('/');
      expect(links[0].text).toBe('Home');
      expect(links[1].href).toBe('/about');
      expect(links[1].text).toBe('About');
      expect(links[2].href).toBe('/contact');
      expect(links[2].text).toBe('Contact');
    });
  });

  describe('extractTextContent', () => {
    it('should extract and clean text content', () => {
      const text = extractTextContent($);

      expect(text).toContain('Main Heading');
      expect(text).toContain('This is a paragraph');
      expect(text).not.toContain('<');
      expect(text).not.toContain('>');
    });

    it('should remove script and style tags', () => {
      const html = `
        <h1>Title</h1>
        <script>console.log('hidden')</script>
        <style>.hidden { display: none; }</style>
        <p>Content</p>
      `;
      const $test = load(html);
      const text = extractTextContent($test);

      expect(text).toContain('Title');
      expect(text).toContain('Content');
      expect(text).not.toContain('console.log');
      expect(text).not.toContain('display: none');
    });
  });

  describe('getPageStats', () => {
    it('should calculate page statistics', () => {
      const stats = getPageStats($);

      expect(stats.headingCount).toBe(2);
      expect(stats.imageCount).toBe(2);
      expect(stats.linkCount).toBe(3);
      expect(stats.formCount).toBe(1);
      expect(stats.paragraphCount).toBe(1);
      expect(stats.wordCount).toBeGreaterThan(0);
    });
  });

  describe('parsePageFromHtml', () => {
    it('should create complete PageContext from HTML', () => {
      const context = parsePageFromHtml('https://example.com', mockHtml);

      expect(context.url).toBe('https://example.com');
      expect(context.html).toBe(mockHtml);
      expect(context.headings).toHaveLength(2);
      expect(context.images).toHaveLength(2);
      expect(context.forms).toHaveLength(1);
      expect(context.links).toHaveLength(3);
      expect(context.text).toContain('Main Heading');
    });
  });
});
