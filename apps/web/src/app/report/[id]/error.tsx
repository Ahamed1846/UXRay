'use client';

export default function ReportError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="report-page-wrap">
      <header className="report-head">
        <h1>Shareable UX Report</h1>
        <p>Something went wrong while loading this report.</p>
      </header>
      <div className="report-status error">
        <p>{error.message || 'Unknown error'}</p>
        <button type="button" onClick={reset} style={{ marginTop: '0.6rem' }}>
          Retry
        </button>
      </div>
    </main>
  );
}
