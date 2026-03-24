'use client';

import { FormEvent, useState } from 'react';
import { ReportDashboard, type DashboardReportData } from '../components/report-dashboard';

type AnalyzeSuccess = DashboardReportData & {
  success: true;
  reportId?: string;
  reportUrl?: string;
  shareUrl?: string;
};

type AnalyzeError = {
  success: false;
  error: string;
  code: string;
};

type AnalyzeResponse = AnalyzeSuccess | AnalyzeError;

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeSuccess | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!url.trim()) {
      setError('Please enter a URL to analyze.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          persist: true,
        }),
      });

      const data = (await response.json()) as AnalyzeResponse;

      if (!response.ok || !data.success) {
        const message = !data.success ? data.error : 'Failed to analyze URL';
        throw new Error(message);
      }

      setResult(data);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unexpected error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="hero-kicker">UXRay</p>
        <h1>Audit Website Usability With Actionable Scores</h1>
        <p>
          Run accessibility, readability, mobile, forms, and navigation checks in one pass.
        </p>

        <form className="analyze-form" onSubmit={handleSubmit}>
          <label htmlFor="audit-url">Website URL</label>
          <div className="input-row">
            <input
              id="audit-url"
              name="audit-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Analyzing...' : 'Run audit'}
            </button>
          </div>
        </form>

        {loading ? <p className="status loading">Running analysis. This may take up to 30 seconds.</p> : null}
        {error ? <p className="status error">{error}</p> : null}
      </section>

      {result ? (
        <section className="result-wrap">
          {result.reportUrl ? (
            <p className="share-line">
              Shareable report ready:{' '}
              <a href={result.reportUrl} target="_blank" rel="noreferrer">
                {result.reportUrl}
              </a>
            </p>
          ) : null}
          <ReportDashboard report={result} />
        </section>
      ) : null}
    </main>
  );
}
