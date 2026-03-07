import { Finding, PageContext } from '../../../schema/types';
import type { ImageInfo } from '../../../schema/types';

/**
 * Check for missing or low-quality alt attributes on images
 */
export function checkAltAttributes(context: PageContext): Finding[] {
  const findings: Finding[] = [];
  const missingAlt: ImageInfo[] = [];
  const poorAlt: ImageInfo[] = [];

  for (const img of context.images) {
    const alt = img.alt?.trim() || '';

    if (!alt) {
      missingAlt.push(img);
    } else if (alt.length < 5) {
      // Very short alt text might be insufficient
      poorAlt.push(img);
    }
  }

  // Finding: Missing alt attributes (Critical)
  if (missingAlt.length > 0) {
    findings.push({
      id: 'a11y_missing_alt',
      category: 'accessibility',
      severity: 'critical',
      title: `${missingAlt.length} image(s) missing alt text`,
      description:
        'Images without alt attributes prevent screen reader users from understanding the content and harm SEO. Every meaningful image should have descriptive alt text.',
      evidence: missingAlt.slice(0, 3).map((img) => ({
        selector: img.src?.substring(0, 50),
        snippet: `<img src="${img.src?.substring(0, 30)}..." />`,
      })),
      recommendation: 'Add descriptive alt text to all images. For decorative images, use alt="".',
      confidence: 0.95,
    });
  }

  // Finding: Poor quality alt text (Medium)
  if (poorAlt.length > 0 && missingAlt.length === 0) {
    findings.push({
      id: 'a11y_poor_alt',
      category: 'accessibility',
      severity: 'medium',
      title: `${poorAlt.length} image(s) have very short alt text`,
      description: 'Alt text shorter than 5 characters may be too vague to be helpful for screen reader users.',
      evidence: poorAlt.slice(0, 2).map((img) => ({
        text: `alt="${img.alt}"`,
      })),
      recommendation: 'Expand alt text to be more descriptive (typically 10-125 characters).',
      confidence: 0.7,
    });
  }

  return findings;
}
