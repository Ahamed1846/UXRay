/**
 * Recommendation Mapping
 * Maps finding IDs to actionable recommendations with priority levels
 */

export type Priority = 'immediate' | 'important' | 'nice-to-have';

export interface RecommendationEntry {
  findingId: string;
  priority: Priority;
  suggestedFix: string;
  resources?: string[]; // Optional links to docs, tools, etc.
}

/**
 * Centralized recommendation database
 * Organized by category for easy maintenance and extension
 */
export const RECOMMENDATIONS: Record<string, RecommendationEntry> = {
  // ============================================================================
  // ACCESSIBILITY RECOMMENDATIONS
  // ============================================================================

  a11y_missing_alt: {
    findingId: 'a11y_missing_alt',
    priority: 'immediate',
    suggestedFix:
      'Add descriptive alt text to all images. Use `<img src="..." alt="description">`. Alt text should be concise (under 125 characters) and describe the image content and purpose. For decorative images, use `alt=""`.',
    resources: [
      'https://www.w3.org/WAI/tutorials/images/',
      'https://webaim.org/articles/alttext/',
    ],
  },

  a11y_missing_label: {
    findingId: 'a11y_missing_label',
    priority: 'immediate',
    suggestedFix:
      'Add `<label>` elements to all form inputs. Use `<label for="input-id">Label text</label>` with matching `id` attribute. Or wrap the input: `<label>Label text <input></label>`. Labels must be visible to all users.',
    resources: ['https://www.w3.org/WAI/tutorials/forms/labels/'],
  },

  a11y_heading_hierarchy: {
    findingId: 'a11y_heading_hierarchy',
    priority: 'important',
    suggestedFix:
      'Fix heading hierarchy to be sequential (h1 → h2 → h3). Start with one h1 per page describing the main topic. Do not skip heading levels. Use headings for content structure, not for styling.',
    resources: ['https://webaim.org/articles/screenreader/headings/'],
  },

  a11y_low_contrast: {
    findingId: 'a11y_low_contrast',
    priority: 'important',
    suggestedFix:
      'Increase color contrast. Text should have at least 4.5:1 contrast ratio with background (WCAG AA standard). Use online contrast checkers to verify. Avoid light gray text on white or gray on gray.',
    resources: [
      'https://webaim.org/resources/contrastchecker/',
      'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum',
    ],
  },

  a11y_missing_focus: {
    findingId: 'a11y_missing_focus',
    priority: 'important',
    suggestedFix:
      'Ensure interactive elements (buttons, links, inputs) have visible keyboard focus indicators. Add CSS: `:focus { outline: 2px solid #0066cc; }`. Remove `outline: none;` without providing an alternative. Users should see where they are on the page when tabbing.',
    resources: ['https://www.a11y-101.com/design/focus-visible'],
  },

  a11y_missing_aria: {
    findingId: 'a11y_missing_aria',
    priority: 'important',
    suggestedFix:
      'Add ARIA attributes to icon-only buttons and custom components. Use `aria-label="action name"` for icon buttons, `role="alert"` for error messages, `aria-expanded="true/false"` for toggles. Use semantic HTML (button, nav) first, then ARIA as supplement.',
    resources: ['https://www.w3.org/WAI/ARIA/apg/'],
  },

  // ============================================================================
  // READABILITY RECOMMENDATIONS
  // ============================================================================

  readability_flesch_score: {
    findingId: 'readability_flesch_score',
    priority: 'important',
    suggestedFix:
      'Simplify language and sentence structure. Break long sentences into shorter ones. Use common words instead of jargon. Aim for Flesch Reading Ease score 60-70 (general audience) or 50-60 (educated audience). Use active voice and shorter paragraphs.',
    resources: ['https://readabilityformulas.com/flesch-reading-ease-flesch-kincaid.html'],
  },

  readability_long_paragraphs: {
    findingId: 'readability_long_paragraphs',
    priority: 'nice-to-have',
    suggestedFix:
      'Break long paragraphs into shorter ones. Most paragraphs should be 3-4 sentences. Very long paragraphs (8+ sentences) feel overwhelming. Use white space to create visual breaks. Add subheadings to organize content.',
    resources: [
      'https://www.nngroup.com/articles/be-scannable-not-printable/',
    ],
  },

  readability_line_length: {
    findingId: 'readability_line_length',
    priority: 'nice-to-have',
    suggestedFix:
      'Optimize line length between 50-75 characters for body text. Use `max-width: 60ch` or similar CSS. Longer lines require more eye movement and are harder to read. Ensure adequate margins on wide screens.',
    resources: [
      'https://www.nngroup.com/articles/short-paragraphs-web/',
    ],
  },

  readability_small_font: {
    findingId: 'readability_small_font',
    priority: 'important',
    suggestedFix:
      'Increase font size for body text to at least 14px (better: 16px). Use minimum line-height of 1.5 for body text. Ensure sufficient contrast. Very small fonts strain eyes and reduce comprehension.',
    resources: [
      'https://www.smashingmagazine.com/2011/10/16-pixels-body-copy-anything-less-annoying-frustrating/',
    ],
  },

  readability_wall_of_text: {
    findingId: 'readability_wall_of_text',
    priority: 'important',
    suggestedFix:
      'Add visual hierarchy with headings, lists, and white space. Break content into sections with descriptive headings. Use bullet points and numbered lists instead of flowing text. Add images or diagrams to break up text blocks.',
    resources: [
      'https://www.nngroup.com/articles/how-users-read-on-the-web/',
    ],
  },

  // ============================================================================
  // MOBILE USABILITY RECOMMENDATIONS
  // ============================================================================

  mobile_no_viewport: {
    findingId: 'mobile_no_viewport',
    priority: 'immediate',
    suggestedFix:
      'Add viewport meta tag to `<head>`: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`. This enables responsive design and prevents unintended zoom. All modern sites require this to display correctly on mobile.',
    resources: [
      'https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag',
    ],
  },

  mobile_small_tap_targets: {
    findingId: 'mobile_small_tap_targets',
    priority: 'important',
    suggestedFix:
      'Increase tap target sizes to at least 48x48 pixels (WCAG standard). Ensure buttons, links, and form fields have adequate spacing. Space interactive elements at least 8px apart. Test on actual touch devices.',
    resources: [
      'https://www.w3.org/WAI/WCAG21/Understanding/target-size.html',
    ],
  },

  mobile_horizontal_scroll: {
    findingId: 'mobile_horizontal_scroll',
    priority: 'immediate',
    suggestedFix:
      'Fix horizontal overflow. Use `max-width: 100%` on images and large elements. Use CSS media queries to adjust layouts for mobile (`@media (max-width: 768px)`). Test at mobile widths (320px, 375px, 768px).',
    resources: [
      'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design',
    ],
  },

  mobile_not_responsive: {
    findingId: 'mobile_not_responsive',
    priority: 'important',
    suggestedFix:
      'Implement responsive design. Use CSS media queries for different screen sizes. Use flexible layouts (flexbox/grid) instead of fixed widths. Test at multiple breakpoints: 320px (phone), 768px (tablet), 1024px (desktop). Consider mobile-first approach.',
    resources: [
      'https://developer.mozilla.org/en-US/docs/Mobile/Viewport_meta_tag',
      'https://web.dev/responsive-web-design-basics/',
    ],
  },

  // ============================================================================
  // FORM EXPERIENCE RECOMMENDATIONS
  // ============================================================================

  forms_placeholder_only: {
    findingId: 'forms_placeholder_only',
    priority: 'immediate',
    suggestedFix:
      'Never rely on placeholders as labels. Add proper `<label>` elements. Placeholders disappear when users start typing, making fields confusing. Combined approach: `<label>Email</label> <input placeholder="john@example.com">`',
    resources: [
      'https://www.nngroup.com/articles/form-design-patterns/',
      'https://www.smashingmagazine.com/2022/09/inline-validation-web-forms-ux/',
    ],
  },

  forms_required_not_marked: {
    findingId: 'forms_required_not_marked',
    priority: 'important',
    suggestedFix:
      'Visually mark required fields. Use `<label>Email <span aria-label="required">*</span></label>` or add an asterisk with explanation. Mark the input: `<input required>`. Also add error messages when fields are skipped.',
    resources: ['https://www.nngroup.com/articles/required-fields/'],
  },

  forms_excessive_fields: {
    findingId: 'forms_excessive_fields',
    priority: 'important',
    suggestedFix:
      'Reduce form fields. Ask only for essential information in the initial form. Use progressive disclosure: ask follow-up questions only after required fields are filled. Multi-step forms reduce perceived complexity. Typical guideline: 5-7 fields maximum for primary forms.',
    resources: ['https://www.nngroup.com/articles/web-form-design/'],
  },

  forms_password_visibility: {
    findingId: 'forms_password_visibility',
    priority: 'important',
    suggestedFix:
      'Add a "show password" toggle. Use: `<input type="password" id="pwd"> <button onclick="toggle(\'pwd\')">Show</button>`. Display password requirements visibly in real-time. Show checkmarks as user meets requirements (8+ chars, uppercase, numbers, etc.).',
    resources: [
      'https://www.nngroup.com/articles/mobile-password-managers/',
    ],
  },

  // ============================================================================
  // NAVIGATION CLARITY RECOMMENDATIONS
  // ============================================================================

  nav_too_many_items: {
    findingId: 'nav_too_many_items',
    priority: 'important',
    suggestedFix:
      'Reduce top-level navigation items to 8 or fewer. Group related items under dropdown menus or mega-menus. Use "More" link for less common nav items. For large sites, implement search or breadcrumb navigation. Test with real users—more nav items increase cognitive load.',
    resources: [
      'https://www.nngroup.com/articles/navigation-design-breadcrumbs/',
    ],
  },

  nav_broken_anchors: {
    findingId: 'nav_broken_anchors',
    priority: 'immediate',
    suggestedFix:
      'Fix broken anchor links. Ensure every `href="#section-id"` target exists: `<div id="section-id">`. Use valid HTML IDs (no spaces, start with letter). Test all anchor links during development. Consider using a tool to scan for broken links.',
    resources: [
      'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#href',
    ],
  },

  nav_missing_footer: {
    findingId: 'nav_missing_footer',
    priority: 'nice-to-have',
    suggestedFix:
      'Add a semantic `<footer>` element with essential links and info: Copyright, Privacy Policy, Terms, Contact, Sitemap, Social profiles. Include company info and a way to reach support. Footers improve navigation and build credibility.',
    resources: ['https://www.nngroup.com/articles/web-site-architecture/'],
  },

  nav_missing_landmarks: {
    findingId: 'nav_missing_landmarks',
    priority: 'important',
    suggestedFix:
      'Use semantic HTML landmarks: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`. These help screen reader users navigate pages efficiently. Each major section should have a semantic landmark. Avoid using `<div>` for everything.',
    resources: [
      'https://www.w3.org/WAI/tutorials/page-structure/regions/',
    ],
  },

  // ============================================================================
  // GENERAL RECOMMENDATIONS (generic fallback)
  // ============================================================================

  generic_recommendation: {
    findingId: 'generic_recommendation',
    priority: 'important',
    suggestedFix:
      'Review the detailed description in the findings section and implement the suggested fix. Test changes with real users and accessibility tools. Measure improvement by re-running the audit.',
    resources: [
      'https://www.nngroup.com/articles/usability-testing-101/',
    ],
  },
};

/**
 * Get recommendation entry for a finding ID
 * Falls back to generic recommendation if not found
 */
export function getRecommendation(findingId: string): RecommendationEntry {
  return RECOMMENDATIONS[findingId] || RECOMMENDATIONS.generic_recommendation;
}

/**
 * Get all recommendations grouped by priority
 */
export function getRecommendationsByPriority(
  findingIds: string[],
): Record<Priority, RecommendationEntry[]> {
  const result: Record<Priority, RecommendationEntry[]> = {
    immediate: [],
    important: [],
    'nice-to-have': [],
  };

  for (const id of findingIds) {
    const rec = getRecommendation(id);
    result[rec.priority].push(rec);
  }

  return result;
}
