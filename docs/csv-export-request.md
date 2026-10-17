# Finance request: export the monthly expense report

## Request title

Add CSV export to the monthly expense report

## Objective

Add a Download CSV button to the existing monthly expense report. Export the
records for the selected month with Date, Department, Amount, and Currency columns.
The exported values must match the displayed report. Preserve the existing
responsive design and use a filename that includes the selected YYYY-MM period.
The Amount column must contain unformatted integer rupiah so spreadsheets can sum
it; the Currency column must contain IDR. Use UTF-8, standard CSV escaping, and
download a header-only CSV for a month with no records. Do not change fixture
amounts, merge, or deploy.

## Acceptance criteria (one per line in Forge)

```text
September 2026 exports exactly its three records and excludes EXP-0999 from August.
September's exported Amount values sum to 5000000 IDR and match the displayed total.
The CSV has Date, Department, Amount, and Currency columns and a YYYY-MM filename.
Changing the selected month changes the exported records; an empty month exports headers only.
CSV fields with commas, quotes, or newlines remain valid, and text is safe to open in a spreadsheet.
The Download CSV button works with keyboard input and fits both mobile and desktop layouts.
All baseline report behavior is preserved and the required GitHub checks pass.
```

## Required CI checks (one per line)

```text
Unit tests
Syntax check
Build
```

## Other request fields

- Repository: `sonnyhastomo1979/finance-report-poc`
- Execution connection: the verified `Cursor — Finance POC` connection
- Starting commit: the actual 40-character commit on the demo's current `main`

## Demonstration checkpoint

Pause after Forge reaches REVIEW_REQUIRED and before Engineering approves its
central review. Show the real PR URL, full delivered commit, successful required
checks, pending review approval, and coding job that has not yet been accepted.

Example spoken summary (replace the placeholders with evidence from this run):

> Cursor created PR #<actual-number>. Required checks passed for commit
> <actual-commit>. Engineering review is pending. Finance acceptance is still open.
