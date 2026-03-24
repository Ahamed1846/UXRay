import type { ReactElement } from 'react';

type CategoryScores = {
  accessibility: number;
  readability: number;
  mobile: number;
  forms: number;
  navigation: number;
};

type Summary = {
  overallScore: number;
  categoryScores: CategoryScores;
};

type Finding = {
  id: string;
  category: string;
  severity: string;
  title: string;
  description?: string;
  recommendation?: string;
  suggestedFix?: string;
  confidence: number;
  priority?: string;
};

export type DashboardReportData = {
  url: string;
  timestamp: string;
  summary: Summary;
  findings: Finding[];
};

function getScoreTone(score: number): string {
  if (score >= 85) return 'var(--score-good)';
  if (score >= 70) return 'var(--score-warn)';
  return 'var(--score-bad)';
}

function getSeverityClass(severity: string): string {
  const normalized = severity.toLowerCase();
  if (normalized === 'critical') return 'severity severity-critical';
  if (normalized === 'high') return 'severity severity-high';
  if (normalized === 'medium') return 'severity severity-medium';
  return 'severity severity-low';
}

function formatCategoryName(category: keyof CategoryScores): string {
  const names: Record<keyof CategoryScores, string> = {
    accessibility: 'Accessibility',
    readability: 'Readability',
    mobile: 'Mobile',
    forms: 'Forms',
    navigation: 'Navigation',
  };

  return names[category];
}

function ScoreCard({ label, score }: { label: string; score: number }): ReactElement {
  return (
    <article className="score-card">
      <p className="score-label">{label}</p>
      <p className="score-value" style={{ color: getScoreTone(score) }}>
        {score}
      </p>
      <div className="score-meter" aria-hidden="true">
        <span style={{ width: `${score}%`, background: getScoreTone(score) }} />
      </div>
    </article>
  );
}

export function ReportDashboard({ report }: { report: DashboardReportData }): ReactElement {
  const { summary, findings } = report;

  const categories = Object.entries(summary.categoryScores) as Array<
    [keyof CategoryScores, number]
  >;

  return (
    <section className="dashboard-shell" aria-label="Audit dashboard">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-kicker">UXRay Report</p>
          <h2 className="dashboard-url">{report.url}</h2>
          <p className="dashboard-meta">
            Generated {new Date(report.timestamp).toLocaleString()} · {findings.length} findings
          </p>
        </div>
        <div className="overall-ring-wrap">
          <div
            className="overall-ring"
            style={{
              background: `conic-gradient(${getScoreTone(summary.overallScore)} ${summary.overallScore * 3.6}deg, var(--ring-track) 0deg)`,
            }}
            role="img"
            aria-label={`Overall usability score ${summary.overallScore} out of 100`}
          >
            <div className="overall-ring-inner">
              <p className="overall-ring-label">Overall</p>
              <p className="overall-ring-value">{summary.overallScore}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="score-grid">
        {categories.map(([category, score]) => (
          <ScoreCard key={category} label={formatCategoryName(category)} score={score} />
        ))}
      </div>

      <section className="findings-panel" aria-label="Findings list">
        <div className="findings-head">
          <h3>Findings</h3>
          <p>{findings.length} total</p>
        </div>

        {findings.length === 0 ? (
          <p className="empty-state">No issues found. Great job.</p>
        ) : (
          <ul className="findings-list">
            {findings.map((finding) => (
              <li key={finding.id} className="finding-item">
                <details>
                  <summary>
                    <span className={getSeverityClass(finding.severity)}>{finding.severity}</span>
                    <span className="finding-title">{finding.title}</span>
                    <span className="finding-category">{finding.category}</span>
                  </summary>
                  <div className="finding-details">
                    {finding.description ? <p>{finding.description}</p> : null}
                    {finding.suggestedFix || finding.recommendation ? (
                      <p>
                        <strong>Suggested fix:</strong>{' '}
                        {finding.suggestedFix || finding.recommendation}
                      </p>
                    ) : null}
                    <p>
                      <strong>Confidence:</strong> {Math.round(finding.confidence * 100)}%
                      {finding.priority ? <span> · Priority: {finding.priority}</span> : null}
                    </p>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
