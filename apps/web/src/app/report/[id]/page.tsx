'use client';

import { use, useEffect, useState } from 'react';
import { ReportDashboard, type DashboardReportData } from '../../../components/report-dashboard';

type ReportApiSuccess = {
  success: true;
  report: DashboardReportData;
};

type ReportApiError = {
  success: false;
  error: string;
  code: string;
};

type ReportApiResponse = ReportApiSuccess | ReportApiError;

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<DashboardReportData | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadReport(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/reports/${id}`, { cache: 'no-store' });
        const data = (await response.json()) as ReportApiResponse;

        if (!response.ok || !data.success) {
          const message = !data.success ? data.error : 'Failed to load report';
          throw new Error(message);
        }

        if (isMounted) {
          setReport(data.report);
        }
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Unknown error';
        if (isMounted) {
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadReport();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <main className="report-page-wrap">
      <header className="report-head">
        <h1>Shareable UX Report</h1>
        <p>Report ID: {id}</p>
      </header>

      {loading ? <p className="report-status">Loading report dashboard...</p> : null}

      {!loading && error ? <p className="report-status error">{error}</p> : null}

      {!loading && !error && report ? <ReportDashboard report={report} /> : null}
    </main>
  );
}
