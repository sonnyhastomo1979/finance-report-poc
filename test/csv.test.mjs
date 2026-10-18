import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { expenses } from "../public/expenses.mjs";
import {
  expenseCsv,
  expenseCsvFilename,
  formatAmount,
  monthlyReport,
} from "../public/report.mjs";

function parseCsv(document) {
  assert.equal(document.codePointAt(0), 0xfeff);
  const csv = document.slice(1);
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    if (quoted) {
      if (char === '"') {
        if (csv[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (char === "\r") {
      assert.equal(csv[index + 1], "\n");
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      index += 1;
      continue;
    }
    assert.notEqual(char, "\n");
    field += char;
  }
  assert.equal(field, "");
  assert.deepEqual(row, []);
  return rows;
}

function record(id, date, department, amount) {
  return {
    id,
    date,
    department,
    description: "Synthetic export case",
    amount,
    currency: "IDR",
  };
}

test("September 2026 CSV exports three records, excludes August, and sums to the displayed total", () => {
  const before = structuredClone(expenses);
  const report = monthlyReport(expenses, "2026-09");
  const csv = expenseCsv(expenses, "2026-09");
  assert.deepEqual(expenses, before);
  assert.equal(
    csv,
    "\uFEFFDate,Department,Amount,Currency\r\n" +
      "2026-09-01,Marketing,1500000,IDR\r\n" +
      "2026-09-02,Operations,2500000,IDR\r\n" +
      "2026-09-03,Marketing,1000000,IDR\r\n",
  );
  assert.equal(csv.includes("2026-08-31"), false);
  assert.equal(csv.includes("750000"), false);
  assert.equal(csv.includes("EXP-0999"), false);
  const rows = parseCsv(csv);
  assert.deepEqual(rows[0], ["Date", "Department", "Amount", "Currency"]);
  assert.equal(rows.length, 4);
  const amounts = rows.slice(1).map((row) => {
    assert.equal(row.length, 4);
    assert.match(row[0], /^2026-09-\d{2}$/);
    assert.match(row[2], /^\d+$/);
    assert.equal(row[3], "IDR");
    return Number(row[2]);
  });
  const sum = amounts.reduce((total, amount) => total + amount, 0);
  assert.equal(sum, 5000000);
  assert.equal(sum, report.total);
  assert.equal(formatAmount(report.total), "Rp5.000.000");
  assert.deepEqual(
    Buffer.from(csv, "utf8").subarray(0, 3),
    Buffer.from([0xef, 0xbb, 0xbf]),
  );
});

test("CSV columns and the YYYY-MM filename follow the selected period", () => {
  assert.equal(expenseCsvFilename("2026-09"), "monthly-expenses-2026-09.csv");
  assert.equal(expenseCsvFilename("2026-08"), "monthly-expenses-2026-08.csv");
  assert.equal(expenseCsvFilename("2026-10"), "monthly-expenses-2026-10.csv");
  assert.match(expenseCsvFilename("2026-09"), /2026-09/);
  assert.match(expenseCsvFilename("2026-09"), /\.csv$/);
  for (const month of ["2026-09", "2026-08", "2026-10"]) {
    const [header, ...body] = parseCsv(expenseCsv(expenses, month));
    assert.deepEqual(header, ["Date", "Department", "Amount", "Currency"]);
    for (const row of body) assert.equal(row[3], "IDR");
  }
  assert.throws(() => expenseCsvFilename("2026-13"), /YYYY-MM/);
  assert.throws(() => expenseCsv(expenses, "September"), /YYYY-MM/);
});

test("changing the month changes exported records and an empty month is headers only", () => {
  const september = expenseCsv(expenses, "2026-09");
  const august = expenseCsv(expenses, "2026-08");
  const october = expenseCsv(expenses, "2026-10");
  assert.notEqual(september, august);
  assert.notEqual(september, october);
  assert.deepEqual(parseCsv(august), [
    ["Date", "Department", "Amount", "Currency"],
    ["2026-08-31", "Operations", "750000", "IDR"],
  ]);
  assert.equal(october, "\uFEFFDate,Department,Amount,Currency\r\n");
  assert.deepEqual(parseCsv(october), [
    ["Date", "Department", "Amount", "Currency"],
  ]);
  assert.equal(
    expenseCsv([], "2026-09"),
    "\uFEFFDate,Department,Amount,Currency\r\n",
  );
  const source = [
    record("EXP-B", "2026-09-02", "Operations", 2),
    record("EXP-A", "2026-09-02", "Marketing", 1),
    record("EXP-C", "2026-09-01", "Marketing", 4),
  ];
  const before = structuredClone(source);
  assert.deepEqual(
    parseCsv(expenseCsv(source, "2026-09")).slice(1),
    [
      ["2026-09-01", "Marketing", "4", "IDR"],
      ["2026-09-02", "Marketing", "1", "IDR"],
      ["2026-09-02", "Operations", "2", "IDR"],
    ],
  );
  assert.deepEqual(source, before);
});

test("commas, quotes, newlines, and formula-like text stay valid and spreadsheet-safe", () => {
  const dangerous = [
    ["EXP-01", "2026-09-01", 'North, "HQ"\nFloor', 1],
    ["EXP-02", "2026-09-02", '=HYPERLINK("http://example.invalid")', 2],
    ["EXP-03", "2026-09-03", "+SUM(A1)", 3],
    ["EXP-04", "2026-09-04", "-10+2", 4],
    ["EXP-05", "2026-09-05", "@SUM(A1)", 5],
    ["EXP-06", "2026-09-06", "\t=cmd", 6],
    ["EXP-07", "2026-09-07", "\r=cmd", 7],
    ["EXP-08", "2026-09-08", " =1+1", 8],
    ["EXP-09", "2026-09-09", "Total = 5", 9],
    ["EXP-10", "2026-09-10", "Tim — Jakarta", 10],
  ];
  const records = dangerous.map(([id, date, department, amount]) =>
    record(id, date, department, amount),
  );
  const csv = expenseCsv(records, "2026-09");
  const rows = parseCsv(csv);
  assert.equal(rows.length, dangerous.length + 1);
  const unsafe = new Set([1, 2, 3, 4, 5, 6, 7]);
  for (const [index, [id, date, department, amount]] of dangerous.entries()) {
    const row = rows[index + 1];
    assert.equal(id.startsWith("EXP-"), true);
    assert.equal(row[0], date);
    assert.equal(row[2], String(amount));
    assert.match(row[2], /^\d+$/);
    assert.equal(row[3], "IDR");
    assert.equal(row[1], unsafe.has(index) ? `'${department}` : department);
    assert.equal(/^[=+\-@\t\r]/.test(row[1]), false);
  }
  const sum = rows
    .slice(1)
    .reduce((total, row) => total + Number(row[2]), 0);
  assert.equal(sum, 55);
  assert.ok(Buffer.from(csv, "utf8").includes(Buffer.from("Tim — Jakarta", "utf8")));
  assert.throws(
    () => expenseCsv([{ ...records[0], currency: "USD" }], "2026-09"),
    /IDR amounts/,
  );
});

test("the Download CSV control is keyboard accessible on mobile and desktop layouts", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");
  const app = await readFile(new URL("../public/app.mjs", import.meta.url), "utf8");
  const button = html.match(/<button\b[^>]*id="download-csv"[^>]*>/)?.[0];
  assert.ok(button);
  assert.match(button, /type="button"/);
  assert.match(button, /class="download-csv"/);
  assert.doesNotMatch(button, /disabled|tabindex/);
  assert.match(html, /<button\b[^>]*id="download-csv"[^>]*>\s*Download CSV\s*<\/button>/);
  assert.equal(html.match(/id="download-csv"/g)?.length, 1);
  assert.match(html, /<main id="report">[\s\S]*id="download-csv"/);
  assert.match(css, /button:focus-visible/);
  assert.match(css, /\.download-csv\s*\{[^}]*min-height:\s*44px/);
  assert.doesNotMatch(css, /\.download-csv\s*\{[^}]*display:\s*none/);
  assert.match(css, /@media \(min-width: 1550px\)/);
  assert.match(css, /@media \(max-width: 850px\)[\s\S]*\.period-actions\s*\{[^}]*width:\s*170px/);
  assert.match(
    css,
    /@media \(max-width: 560px\)[\s\S]*\.period-actions\s*\{[^}]*width:\s*100%/,
  );
  assert.match(app, /const month = byId\("month"\)\.value;/);
  assert.match(app, /new Blob\(\[expenseCsv\(expenses, month\)\]/);
  assert.match(app, /text\/csv;charset=utf-8/);
  assert.match(app, /link\.download = expenseCsvFilename\(month\)/);
  assert.match(app, /getElementById\("download-csv"\)|byId\("download-csv"\)/);
  assert.match(app, /addEventListener\("click", downloadCsv\)/);
  assert.match(app, /Download CSV for /);
});
