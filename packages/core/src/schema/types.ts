import { z } from 'zod';

/**
 * Severity levels for findings
 */
export const SeveritySchema = z.enum(['critical', 'high', 'medium', 'low']);
export type Severity = z.infer<typeof SeveritySchema>;

/**
 * A single audit finding with evidence and recommendations
 */
export const FindingSchema = z.object({
  id: z.string().describe('Unique identifier for the finding'),
  category: z.enum(['accessibility', 'readability', 'mobile', 'forms', 'navigation']),
  severity: SeveritySchema,
  title: z.string().describe('Human-readable title'),
  description: z.string().describe('Detailed description of the issue'),
  evidence: z
    .array(
      z.object({
        selector: z.string().optional().describe('CSS selector for the element'),
        snippet: z.string().optional().describe('HTML snippet'),
        text: z.string().optional().describe('Text content'),
      }),
    )
    .min(1)
    .describe('Evidence from the page'),
  recommendation: z.string().describe('Actionable recommendation'),
  confidence: z.number().min(0).max(1).describe('Confidence score (0-1)'),
});
export type Finding = z.infer<typeof FindingSchema>;

/**
 * Category scores
 */
export const CategoryScoresSchema = z.object({
  accessibility: z.number().min(0).max(100),
  readability: z.number().min(0).max(100),
  mobile: z.number().min(0).max(100),
  forms: z.number().min(0).max(100),
  navigation: z.number().min(0).max(100),
});
export type CategoryScores = z.infer<typeof CategoryScoresSchema>;

/**
 * Full report summary
 */
export const ReportSummarySchema = z.object({
  overallScore: z.number().min(0).max(100),
  categoryScores: CategoryScoresSchema,
});
export type ReportSummary = z.infer<typeof ReportSummarySchema>;

/**
 * Complete audit report
 */
export const AuditReportSchema = z.object({
  url: z.string().url(),
  timestamp: z.string().datetime(),
  summary: ReportSummarySchema,
  findings: z.array(FindingSchema),
  meta: z.object({
    engine: z.string(),
    pagesAnalyzed: z.number().int().positive(),
    userAgent: z.string(),
  }),
});
export type AuditReport = z.infer<typeof AuditReportSchema>;

/**
 * Context passed to analyzers containing DOM and style information
 */
export interface PageContext {
  url: string;
  html: string;
  dom: Document;
  computedStyles: Map<Element, CSSStyleDeclaration>;
  headings: HeadingInfo[];
  images: ImageInfo[];
  forms: FormInfo[];
  links: LinkInfo[];
  text: string;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface HeadingInfo {
  level: number;
  text: string;
  element: Element;
}

export interface ImageInfo {
  src: string;
  alt: string | null;
  element: Element;
}

export interface FormInfo {
  id: string | null;
  element: Element;
  inputs: FormInputInfo[];
}

export interface FormInputInfo {
  type: string;
  name: string | null;
  id: string | null;
  hasLabel: boolean;
  required: boolean;
  element: Element;
}

export interface LinkInfo {
  href: string;
  text: string;
  element: Element;
}

/**
 * Analyzer interface that all category analyzers must implement
 */
export interface Analyzer {
  analyze(context: PageContext): Promise<Finding[]>;
  category: 'accessibility' | 'readability' | 'mobile' | 'forms' | 'navigation';
}
