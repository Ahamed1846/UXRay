/**
 * Quick test of the AccessibilityAnalyzer with mock HTML
 * Run with: node test-analyzer.js
 */

const { parsePageFromHtml } = require('./packages/core/src/dom-parser/index.ts');
const { AccessibilityAnalyzer } = require('./packages/core/src/analyzers/accessibility/index.ts');

// Mock HTML with various accessibility issues
const mockHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>Test Page</title>
  </head>
  <body>
    <!-- Missing H1 - only has h2 -->
    <h2>Welcome to Our Site</h2>
    
    <!-- Image without alt text -->
    <img src="logo.png" />
    <img src="hero.jpg" alt=""/>
    
    <!-- Form with unlabeled inputs -->
    <form id="contact">
      <input type="email" name="email" placeholder="Email" />
      <input type="text" name="name" id="name" />
      <label for="name">Full Name</label>
      
      <input type="password" name="password" placeholder="Password" />
      <textarea name="message"></textarea>
      
      <button type="submit">Send</button>
    </form>
    
    <!-- Icon button without aria-label -->
    <button class="icon"><i class="icon-menu"></i></button>
    
    <!-- Light text color (low contrast) -->
    <p style="color: #CCC">This text is very light gray</p>
    
    <!-- Div used as button (ARIA misuse) -->
    <div role="button">Click me</div>
    
    <!-- Link acting as a button -->
    <a href="#" class="btn btn-primary">Action</a>
  </body>
</html>
`;

async function testAnalyzer() {
  try {
    console.log('🔍 Testing AccessibilityAnalyzer\n');
    console.log('HTML Input:');
    console.log('  - Missing H1 (only h2)');
    console.log('  - Images without/with empty alt');
    console.log('  - Form inputs (one labeled, two unlabeled, one with label after)');
    console.log('  - Icon button without aria-label');
    console.log('  - Light text (#CCC)');
    console.log('  - Div with role="button"');
    console.log('  - Link styled as button\n');

    // Parse the mock HTML
    const context = parsePageFromHtml('https://example.com', mockHtml);
    
    // Run accessibility analyzer
    const analyzer = new AccessibilityAnalyzer();
    const findings = await analyzer.analyze(context);

    console.log(`✅ Found ${findings.length} accessibility issues:\n`);
    console.log('='.repeat(80));

    findings.forEach((finding, index) => {
      console.log(`\n${index + 1}. ${finding.title}`);
      console.log(`   Category: ${finding.category}`);
      console.log(`   Severity: ${finding.severity.toUpperCase()}`);
      console.log(`   Confidence: ${(finding.confidence * 100).toFixed(0)}%`);
      console.log(`   Description: ${finding.description}`);
      console.log(`   Recommendation: ${finding.recommendation}`);
      if (finding.evidence.length > 0) {
        console.log(`   Evidence: ${finding.evidence[0].text || finding.evidence[0].snippet || finding.evidence[0].selector}`);
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`   Total Findings: ${findings.length}`);
    
    const bySeverity = {
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length,
    };
    
    console.log(`   Critical: ${bySeverity.critical}`);
    console.log(`   High: ${bySeverity.high}`);
    console.log(`   Medium: ${bySeverity.medium}`);
    console.log(`   Low: ${bySeverity.low}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testAnalyzer();
