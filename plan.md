# UXRay (You-Ex Ray) — PLAN.md

## 1. Project overview

UXRay is an open-source tool that audits a website for real human usability. You provide a URL and UXRay generates a structured report with:

* Category scores (Accessibility, Readability, Mobile Usability, Form Experience, Navigation Clarity)
* A consolidated Human Usability Score
* Actionable findings with severity and suggested fixes
* A shareable report page (and optional PDF export)

UXRay is designed to be:

* Fully open source and self-hostable
* Independent of closed-source services and proprietary APIs
* Useful for students, indie developers, small teams, NGOs, and maintainers

## 2. Problem statement

Many websites are “technically working” but still difficult to use. Common issues include:

* Poor accessibility (missing labels, low contrast, keyboard traps)
* Hard-to-read typography and dense content
* Broken or uncomfortable mobile layouts
* Forms that cause user drop-off
* Confusing navigation and information architecture

Existing tools are fragmented across accessibility, performance, and UX heuristics. UXRay unifies these checks into a single report, optimized for actionability.

## 3. Target users

### Primary

* Web developers building or maintaining public sites
* Student teams in colleges building websites for clubs/projects
* NGOs/small businesses with limited budget for UX audits

### Secondary

* FOSS maintainers who want quick audits for project websites
* Designers who want quick red flags and a checklist view

## 4. Goals

* Provide a single-URL audit producing a clear, actionable report
* Maintain modular analyzers so each category can evolve independently
* Keep the tool easy to run locally (CLI) and easy to host (web app)
* Provide consistent progress via small PRs and steady commits throughout March

## 5. Non-goals (for this hackathon)

* Full WCAG compliance certification
* A full Lighthouse replacement (performance can be added later)
* AI-generated fixes or proprietary model dependencies
* Deep crawling of entire large sites (initially focus on homepage + a small number of linked pages)

## 6. Key outputs

### 6.1 Web app

* URL input
* Report page with scores and findings
* Shareable link to stored reports (optional but recommended)

### 6.2 CLI tool (stretch but high impact)

* `uxray <url>` prints a summary and writes a JSON report

### 6.3 Export

* PDF export of report (stretch)

## 7. Audit categories and checks

The following checks are designed to be pragmatic heuristics that catch most real-world issues.

### 7.1 Accessibility

* Image alt text presence and quality heuristics
* Form labels and accessible names
* Heading hierarchy consistency (h1/h2/h3 order)
* Keyboard focus visibility and basic tab-ability heuristics
* ARIA basics (missing aria-label on icon buttons, role misuse warnings)
* Color contrast checks (initial version for common text elements)

### 7.2 Readability

* Font size and line height heuristics
* Paragraph density (very long paragraphs flagged)
* Line length heuristics (characters per line estimate)
* Reading level estimation (Flesch reading ease / similar)
* Content structure heuristics (too many walls of text; missing headings)

### 7.3 Mobile usability

* Viewport meta tag presence/config
* Tap target sizes for buttons/links
* Layout overflow / horizontal scroll detection
* Responsive breakpoint behavior check (run at common widths)

### 7.4 Form experience

* Missing labels / placeholder-only fields
* Required fields not marked
* Error message UX heuristics (if detectable)
* Password requirements visibility
* Form length complexity scoring

### 7.5 Navigation clarity

* Navigation item overload (too many top-level links)
* Broken anchors and dead links (light check)
* Footer presence and key links presence heuristics
* Information architecture signals (multiple nav bars, repeated menus)

## 8. Scoring model

Scores must be deterministic and explainable.

### 8.1 Severity levels

* Critical: likely blocks users (e.g., no labels on form inputs)
* High: significantly harms usability (e.g., very low contrast)
* Medium: noticeable friction (e.g., too many nav items)
* Low: minor improvement (e.g., redundant headings)

### 8.2 Category scoring approach

* Start with 100 points per category
* Deduct based on findings: `deduction = weight(severity) * count * confidence`
* Clamp to 0–100

Suggested weights (tunable):

* Critical: 15
* High: 8
* Medium: 4
* Low: 2

Confidence is 0.5–1.0 for heuristic checks.

### 8.3 Overall Human Usability Score

Weighted average:

* Accessibility: 30%
* Mobile usability: 25%
* Readability: 20%
* Form experience: 15%
* Navigation clarity: 10%

These weights can be adjusted as UXRay matures.

## 9. Tech stack

### 9.1 Frontend

* Next.js (React)
* Tailwind CSS
* TypeScript

### 9.2 Backend

* Node.js (Next.js API routes or separate server)
* TypeScript
* Zod for validation

### 9.3 Crawling and analysis

Choose one:

* Playwright (recommended for reliability)
* Puppeteer

Parsing and utilities:

* Cheerio for HTML parsing (if needed)
* axe-core for accessibility checks (open source)

### 9.4 Data storage (optional but recommended)

* SQLite (local dev + easy hosting)
* Prisma ORM (optional; good for speed)

### 9.5 PDF export (optional)

* Playwright PDF or server-side PDF renderer

### 9.6 Deployment

* Vercel for web UI (if using Next.js)
* Alternative: self-host using Docker

## 10. Architecture

### 10.1 High-level flow

1. User submits URL
2. Backend validates URL and normalizes it
3. Crawler loads page (and optionally a small set of internal links)
4. Snapshot DOM + computed styles
5. Run analyzers (Accessibility, Readability, Mobile, Forms, Navigation)
6. Merge findings into a single report schema
7. Run scoring engine
8. Store report (optional)
9. Render report UI

### 10.2 Design principles

* Modular analyzers: each analyzer returns findings in the same schema
* Deterministic output: no AI dependencies in core checks
* Explainability: every score must map back to findings

## 11. Report schema (suggested)

```json
{
  "url": "https://example.com",
  "timestamp": "2026-03-03T00:00:00Z",
  "summary": {
    "overallScore": 82,
    "categoryScores": {
      "accessibility": 78,
      "readability": 85,
      "mobile": 80,
      "forms": 76,
      "navigation": 90
    }
  },
  "findings": [
    {
      "id": "a11y_missing_label",
      "category": "accessibility",
      "severity": "critical",
      "title": "Form inputs missing labels",
      "description": "Some inputs do not have associated labels, which harms screen reader use.",
      "evidence": [{"selector": "#email", "snippet": "<input id=\"email\" ...>"}],
      "recommendation": "Add <label for=\"email\">Email</label> or aria-label.",
      "confidence": 0.9
    }
  ],
  "meta": {
    "engine": "playwright",
    "pagesAnalyzed": 1,
    "userAgent": "UXRayBot/0.1"
  }
}
```

## 12. Repository structure (suggested)

```
uxray/
  apps/
    web/                 # Next.js UI
  packages/
    core/                # analyzers + scoring + schemas
    cli/                 # CLI wrapper (optional)
  docs/                  # documentation assets
  PLAN.md
  ROADMAP.md
  LICENSE
  README.md
```

Within `packages/core`:

```
packages/core/src/
  analyzers/
    accessibility/
    readability/
    mobile/
    forms/
    navigation/
  crawler/
  scoring/
  schema/
  utils/
```

## 13. Coding standards

* TypeScript strict mode
* ESLint + Prettier enforced
* All analyzers must:

  * Accept a common `PageContext` input
  * Return a list of `Finding` items
  * Avoid network calls beyond the crawler

## 14. Testing strategy

* Unit tests for scoring engine and schema validation
* Snapshot tests for analyzer output on known HTML fixtures
* E2E smoke test: run analysis against a small set of static test pages

Suggested tools:

* Vitest
* Playwright test runner for E2E (if already using Playwright)

## 15. Security and safety

* Validate and sanitize URLs
* Restrict crawling scope to same-origin by default
* Rate limit analysis endpoint if hosted publicly
* Timeouts for page load and scripts
* Prevent SSRF by blocking private IP ranges (recommended)

## 16. Licensing

* MIT License (already selected)

## 17. Month plan and PR schedule

This schedule is designed for steady progress, visible GitHub activity, and clear technical depth. Each PR must include:

* Clear PR title and description
* Linked issue(s)
* How to test section
* Screenshots or logs (where relevant)
* Updated documentation if architecture changes

### Week 1 (Mar 3 – Mar 9): Foundation + crawler + first analyzer

#### PR #1 (Mar 3): Project scaffold (Completed 👍)

Scope:

* Monorepo structure (apps/web, packages/core, optional packages/cli)
* Next.js + TypeScript setup
* ESLint + Prettier configuration
* Basic Tailwind setup
* tsconfig strict mode
* Initial README.md
* PLAN.md committed
* MIT LICENSE

Must include:

* Project runs locally (`npm run dev` works)
* Lint passes
* Folder structure documented in README
* Initial GitHub issues created for roadmap

---

#### PR #2 (Mar 4): Headless crawler setup + `/analyze` endpoint (Completed 👍)

Scope:

* Install and configure Playwright (or Puppeteer)
* Create crawler module in `packages/core/crawler`
* Implement URL validation and normalization
* Implement API route `/api/analyze`
* Return raw HTML snapshot
* Add basic timeout handling

Must include:

* Error handling for invalid URLs
* Page load timeout configuration
* Basic SSRF protection (block private IP ranges if possible)
* Console logs for debug mode
* Manual test against 2–3 websites

---

#### PR #3 (Mar 6): DOM extraction utilities + analyzer framework (Completed 👍)

Scope:

* Create `PageContext` interface
* Extract headings, images, forms, links
* Build analyzer base interface
* Create analyzer registry system
* Define `Finding` schema

Must include:

* Shared types in `packages/core/schema`
* Unit test for schema validation
* Example mock analysis on static HTML fixture
* README section explaining analyzer architecture

---

#### PR #4 (Mar 8–9): Accessibility checks MVP (Completed 👍)

Scope:

* Alt attribute detection
* Form label detection
* Heading hierarchy validation
* Basic contrast check (heuristic)
* ARIA basic warnings

Must include:

* Severity tagging (Critical/High/Medium/Low)
* Confidence scoring
* Example output JSON
* Unit tests for 3–5 accessibility cases

Deliverable at end of Week 1:

* URL → Accessibility findings JSON working

---

### Week 2 (Mar 10 – Mar 16): Core analyzers

#### PR #5 (Mar 10): Readability engine (Completed 👍)

Scope:

* Paragraph extraction
* Flesch reading score implementation
* Font size heuristic
* Line length estimate
* Content density heuristic

Must include:

* Configurable thresholds
* Unit tests for reading score
* Sample output in docs

---

#### PR #6 (Mar 12): Mobile usability analyzer

Scope:

* Viewport meta detection
* Tap target size check
* Horizontal scroll detection
* Multi-viewport analysis (mobile width + desktop width)

Must include:

* Viewport simulation via Playwright
* Test page fixture for overflow
* Document heuristic assumptions

---

#### PR #7 (Mar 14): Form experience analyzer

Scope:

* Placeholder-only detection
* Required field marking check
* Form length scoring
* Password rule visibility heuristic

Must include:

* Severity classification rules
* Edge case handling (hidden inputs ignored)
* Unit tests for at least 4 scenarios

---

#### PR #8 (Mar 16): Navigation clarity analyzer

Scope:

* Count top-level nav items
* Detect broken anchors
* Footer presence detection
* Duplicate navigation detection

Must include:

* Heuristic explanation in docs
* Sample report JSON
* Unit tests for nav count threshold

Deliverable at end of Week 2:

* Full multi-category findings JSON for a URL

---

### Week 3 (Mar 17 – Mar 23): Scoring + recommendations + storage + CLI

#### PR #9 (Mar 17): Scoring engine + weights

Scope:

* Implement severity weight system
* Deduction formula
* Clamp score 0–100
* Category score calculation
* Overall weighted score

Must include:

* Pure functions (no side effects)
* Unit tests for scoring math
* Configurable weight constants
* Documentation of scoring formula

---

#### PR #10 (Mar 19): Recommendation engine

Scope:

* Map findings to human-readable suggestions
* Add priority tagging (Immediate / Important / Nice-to-have)
* Generate summary insights per category

Must include:

* Centralized recommendation mapping file
* Test for at least 5 recommendation types
* Example final report JSON with recommendations

---

#### PR #11 (Mar 21): Report persistence + shareable links

Scope:

* SQLite setup
* Prisma schema (if used)
* Store report JSON
* Generate unique report ID
* Route `/report/[id]`

Must include:

* Migration scripts
* Basic error handling
* Data validation before saving
* Test save + retrieve cycle

---

#### PR #12 (Mar 23): CLI mode

Scope:

* Create `packages/cli`
* Command parsing
* Run analysis from terminal
* Print summary to console
* Save JSON file locally

Must include:

* Help command (`uxray --help`)
* Exit codes for errors
* README CLI usage section

Deliverable at end of Week 3:

* Scored report + persistence + optional CLI

---

### Week 4 (Mar 24 – Mar 30): UI + export + docs + polish

#### PR #13 (Mar 24): Frontend report dashboard UI

Scope:

* Score cards for each category
* Overall score visualization
* Expandable findings list
* Severity color coding

Must include:

* Responsive layout
* Loading and error states
* At least 2 screenshots added to README

---

#### PR #14 (Mar 26): PDF export

Scope:

* Generate PDF from report page
* Download button
* Clean printable layout

Must include:

* Test export on 2–3 sample reports
* Handle large reports gracefully

---

#### PR #15 (Mar 28): Landing page + docs

Scope:

* Public homepage explaining UXRay
* Feature sections
* Example report screenshot
* Setup instructions

Must include:

* Clear install guide
* Contribution guide section
* Architecture diagram (simple)

---

#### PR #16 (Mar 29–30): Polish and stabilization

Scope:

* Improve error handling
* Performance optimization (reduce crawl time)
* Add logging levels
* Refactor messy code

Must include:

* Final README cleanup
* Screenshots
* Demo checklist
* Tag release `v0.1.0`

### Final milestone days (Mar 30–31): Wrap-up

* Record demo video
* Verify fresh clone works
* Final lint + test run
* Confirm license + docs
* Prepare submission summary

## 18. Daily workflow recommendation

Daily workflow recommendation

* Work in small increments
* Create a short issue for each subtask
* Open PRs frequently (even if small)
* Keep PR descriptions clear:

  * What changed
  * Why
  * How to test

## 19. Deliverables checklist (for submission)

* Working URL analysis and report page
* Multi-category report with scoring
* Clear README with setup instructions
* MIT License
* Demo video or hosted link
* Minimal test coverage (scoring + key analyzers)
* Polished UI for judges to try quickly
