import type { PageContext, Finding } from '../../../schema/types';

/**
 * Check for responsive design issues across viewports
 * Analyzes viewport width from page context
 * Flags sites that may not be mobile-optimized
 */
export function checkResponsiveDesign(context: PageContext): Finding[] {
  const findings: Finding[] = [];

  const elements = context.elements || [];

  // Heuristic indicators of poor responsive design
  let hasFluidLayout = false;
  let hasMediaQueries = false;
  let hasFixedLayoutIssues = 0;

  // Check viewport configuration
  const html = context.html || '';

  // Look for media queries in style tags
  if (/<style[^>]*>[\s\S]*@media/i.test(html)) {
    hasMediaQueries = true;
  }

  // Check for CSS viewport-related attributes
  if (/width:\s*100%|max-width:/i.test(html)) {
    hasFluidLayout = true;
  }

  // Scan elements for responsive patterns
  for (const element of elements) {
    if (!element.tag || !element.computedStyle) {
      continue;
    }

    const style = element.computedStyle;

    // Check for inflexible layouts
    if (style.width && !style.width.includes('%') && !style.width.includes('auto')) {
      const widthValue = parseFloat(style.width);
      // Fixed widths > 600px likely problematic on mobile
      if (widthValue > 600) {
        hasFixedLayoutIssues++;
      }
    }
  }

  // Flag lack of responsive design indicators
  if (!hasMediaQueries && !hasFluidLayout) {
    findings.push({
      id: 'mobile_not_responsive',
      category: 'mobile',
      severity: 'high',
      title: 'No responsive design indicators detected',
      description: 'The page does not appear to use responsive design techniques (media queries, fluid layouts). This suggests the site may not adapt well to different screen sizes, particularly mobile devices.',
      recommendation: 'Implement responsive design: use CSS media queries for different breakpoints (320px, 768px, 1024px), use flexible layouts (flexbox/grid), set viewport meta tag, and test on actual mobile devices.',
      evidence: [],
      confidence: 0.8,
    });
  }

  // Flag excessive fixed-width layouts
  if (hasFixedLayoutIssues > 3 && !hasMediaQueries) {
    findings.push({
      id: 'mobile_fixed_layout',
      category: 'mobile',
      severity: 'medium',
      title: `${hasFixedLayoutIssues} large fixed-width container(s) detected`,
      description: 'The page uses multiple fixed-width containers (> 600px) without responsive breakpoints. These will cause overflow on mobile devices.',
      recommendation: 'Convert fixed widths to max-width with flexible fallbacks. Use CSS media queries to adjust layouts for mobile. Example: @media (max-width: 768px) { max-width: 100%; }',
      evidence: [],
      confidence: 0.75,
    });
  }

  return findings;
}
