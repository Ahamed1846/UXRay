-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Report_url_idx" on "Report"("url");

-- CreateIndex
CREATE INDEX "Report_timestamp_idx" on "Report"("timestamp");
