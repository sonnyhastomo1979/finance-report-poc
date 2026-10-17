# Finance reporting demo

This is a small, dependency-free Node.js and browser application for a Forge O/S
business-request demonstration. All records are synthetic. Use Node.js 24+.

## Commands

- Install: `npm ci`
- Run: `npm start` (http://localhost:4173)
- Tests: `npm test`
- Syntax: `npm run check`
- Build: `npm run build`
- Preview build: `npm run preview`

## Structure and invariants

- `public/report.mjs` owns month filtering, IDR totals, and report labels.
- `public/expenses.mjs` holds the synthetic fixture. Do not change it to make tests pass.
- `public/app.mjs` renders the same report model used by the business logic tests.
- `public/index.html` and `public/styles.css` contain the accessible responsive UI.
- September 2026 has exactly three records and a total of IDR 5,000,000.
- August's IDR 750,000 record must never appear in September's report.
- Empty periods must render correctly. Preserve integer IDR amounts and date-only values.
- Use textContent for record data rather than interpolating it into HTML.
- Keep the app dependency-free unless a task explicitly needs a new dependency.
- Add behavior tests for changes and run all three checks before handing off.
- Do not remove or weaken CI checks, change approval policy, merge, or deploy.

## Cursor Cloud specific instructions

The install command is in `.cursor/environment.json`. The app does not need
database credentials or external services. Run all checks at the repository root.
Work only on the assigned request and return a branch/pull request with the actual
test results. CSV export is intentionally absent from the initial baseline; add it
only when it is the approved task.
