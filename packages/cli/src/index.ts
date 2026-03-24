#!/usr/bin/env node

import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import { crawlPage } from '@uxray/core/src/crawler';
import { AccessibilityAnalyzer } from '@uxray/core/src/analyzers/accessibility';
import { ReadabilityAnalyzer } from '@uxray/core/src/analyzers/readability';
import { MobileAnalyzer } from '@uxray/core/src/analyzers/mobile';
import { FormAnalyzer } from '@uxray/core/src/analyzers/forms';
import { NavigationAnalyzer } from '@uxray/core/src/analyzers/navigation';
import { generateReportSummary } from '@uxray/core/src/scoring';
import { type AuditReport, type Finding, type PageContext } from '@uxray/core/src/schema/types';

enum ExitCode {
  Success = 0,
  UsageError = 2,
  CrawlFailed = 3,
  AnalyzeFailed = 4,
  WriteFailed = 5,
  UnknownError = 1,
}

interface CliOptions {
  url?: string;
  outFile?: string;
  timeout: number;
  debug: boolean;
  showHelp: boolean;
  showVersion: boolean;
}

function printHelp(): void {
  console.log(`UXRay CLI\n
Usage:
  uxray <url> [options]

Options:
  -o, --out <file>       Output JSON file path (default: uxray-report-<timestamp>.json)
  -t, --timeout <ms>     Crawl timeout in milliseconds (default: 30000)
  -d, --debug            Enable debug logs
  -h, --help             Show this help message
  -v, --version          Show CLI version

Examples:
  uxray https://example.com
  uxray https://example.com --out ./report.json
  uxray https://example.com --timeout 45000 --debug
`);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    timeout: 30000,
    debug: false,
    showHelp: false,
    showVersion: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      options.showHelp = true;
      continue;
    }

    if (arg === '--version' || arg === '-v') {
      options.showVersion = true;
      continue;
    }

    if (arg === '--debug' || arg === '-d') {
      options.debug = true;
      continue;
    }

    if (arg === '--out' || arg === '-o') {
      const value = argv[i + 1];
      if (!value || value.startsWith('-')) {
        throw new Error('Missing value for --out');
      }
      options.outFile = value;
      i += 1;
      continue;
    }

    if (arg === '--timeout' || arg === '-t') {
      const value = argv[i + 1];
      if (!value || value.startsWith('-')) {
        throw new Error('Missing value for --timeout');
      }

      const timeout = Number.parseInt(value, 10);
      if (!Number.isFinite(timeout) || timeout <= 0) {
        throw new Error('--timeout must be a positive integer');
      }

      options.timeout = timeout;
      i += 1;
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (!options.url) {
      options.url = arg;
      continue;
    }

    throw new Error(`Unexpected argument: ${arg}`);
  }

  return options;
}

function getDefaultOutputPath(): string {
  const now = new Date();
  const pad = (value: number): string => value.toString().padStart(2, '0');

  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `uxray-report-${timestamp}.json`;
}

async function runAnalysis(context: PageContext): Promise<Finding[]> {
  const analyzers = [
    new AccessibilityAnalyzer(),
    new ReadabilityAnalyzer(),
    new MobileAnalyzer(),
    new FormAnalyzer(),
    new NavigationAnalyzer(),
  ];

  const findings: Finding[] = [];

  for (const analyzer of analyzers) {
    const analyzerFindings = await analyzer.analyze(context);
    findings.push(...analyzerFindings);
  }

  return findings;
}

function printSummary(url: string, outFile: string, findings: Finding[]): void {
  const summary = generateReportSummary(findings);

  const bySeverity = findings.reduce(
    (acc, finding) => {
      acc[finding.severity] += 1;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0 },
  );

  console.log('UXRay Analysis Complete');
  console.log(`URL: ${url}`);
  console.log(`Overall Score: ${summary.overallScore}/100`);
  console.log('Category Scores:');
  console.log(`  Accessibility: ${summary.categoryScores.accessibility}`);
  console.log(`  Readability:   ${summary.categoryScores.readability}`);
  console.log(`  Mobile:        ${summary.categoryScores.mobile}`);
  console.log(`  Forms:         ${summary.categoryScores.forms}`);
  console.log(`  Navigation:    ${summary.categoryScores.navigation}`);
  console.log('Findings:');
  console.log(`  Critical: ${bySeverity.critical}`);
  console.log(`  High:     ${bySeverity.high}`);
  console.log(`  Medium:   ${bySeverity.medium}`);
  console.log(`  Low:      ${bySeverity.low}`);
  console.log(`Saved report: ${outFile}`);
}

async function main(): Promise<number> {
  let options: CliOptions;

  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Invalid arguments';
    console.error(`Error: ${errorMsg}`);
    console.error('Run `uxray --help` for usage information.');
    return ExitCode.UsageError;
  }

  if (options.showVersion) {
    console.log('uxray-cli 0.1.0');
    return ExitCode.Success;
  }

  if (options.showHelp) {
    printHelp();
    return ExitCode.Success;
  }

  if (!options.url) {
    console.error('Error: URL is required.');
    console.error('Run `uxray --help` for usage information.');
    return ExitCode.UsageError;
  }

  const outFile = resolve(options.outFile ?? getDefaultOutputPath());

  try {
    if (options.debug) {
      console.log(`[UXRay CLI] Crawling: ${options.url}`);
    }

    const crawled = await crawlPage(options.url, {
      timeout: options.timeout,
      debug: options.debug,
      headless: true,
    });

    if (!('dom' in crawled)) {
      console.error(`Crawl failed: ${crawled.error || 'Unknown crawl error'}`);
      return ExitCode.CrawlFailed;
    }

    if (options.debug) {
      console.log('[UXRay CLI] Running analyzers...');
    }

    const findings = await runAnalysis(crawled);
    const summary = generateReportSummary(findings);

    const report: AuditReport = {
      url: crawled.url,
      timestamp: new Date().toISOString(),
      summary,
      findings,
      meta: {
        engine: 'playwright',
        pagesAnalyzed: 1,
        userAgent: 'UXRayBot/0.1 (compatibility test)',
      },
    };

    try {
      await writeFile(outFile, JSON.stringify(report, null, 2), 'utf8');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown write error';
      console.error(`Failed to save output file: ${errorMsg}`);
      return ExitCode.WriteFailed;
    }

    printSummary(crawled.url, outFile, findings);
    return ExitCode.Success;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    if (errorMsg.includes('Invalid URL')) {
      console.error(`Validation error: ${errorMsg}`);
      return ExitCode.UsageError;
    }

    if (errorMsg.includes('Analyzer')) {
      console.error(`Analysis failed: ${errorMsg}`);
      return ExitCode.AnalyzeFailed;
    }

    console.error(`Unexpected error: ${errorMsg}`);
    return ExitCode.UnknownError;
  }
}

main()
  .then((code) => {
    process.exit(code);
  })
  .catch((error) => {
    const errorMsg = error instanceof Error ? error.message : 'Unknown fatal error';
    console.error(`Fatal error: ${errorMsg}`);
    process.exit(ExitCode.UnknownError);
  });
