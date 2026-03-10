import { NextRequest, NextResponse } from 'next/server';
import { parsePageFromHtml } from '../../../../../../packages/core/src/dom-parser';
import { AccessibilityAnalyzer } from '../../../../../../packages/core/src/analyzers/accessibility';

/**
 * Demo API endpoint for testing
 * Returns accessibility findings for a mock HTML page
 */
export async function GET(request: NextRequest) {
  try {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <h2>Welcome</h2>
          <img src="test.png" />
          <form>
            <input type="email" placeholder="Email" />
          </form>
          <button class="icon"><i></i></button>
          <p style="color: #DDD">Light text</p>
        </body>
      </html>
    `;

    const context = parsePageFromHtml('https://example.com', mockHtml);
    const analyzer = new AccessibilityAnalyzer();
    const findings = await analyzer.analyze(context);

    return NextResponse.json({
      success: true,
      url: 'https://example.com',
      timestamp: new Date().toISOString(),
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
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
