import assert from "node:assert/strict";
import test from "node:test";
import { expenses } from "../public/expenses.mjs";
import {
  formatAmount,
  monthLabel,
  monthlyReport,
  previousMonth,
} from "../public/report.mjs";

test("September includes three records totaling IDR 5,000,000 and excludes August", () => {
  const report = monthlyReport(expenses, "2026-09");
  assert.equal(report.total, 5000000);
  assert.equal(report.currency, "IDR");
  assert.equal(report.rows.length, 3);
  assert.equal(
    report.rows.some((row) => row.id === "EXP-0999"),
    false,
  );
  assert.equal(report.previousTotal, 750000);
  assert.deepEqual(report.departments, [
    { name: "Marketing", total: 2500000 },
    { name: "Operations", total: 2500000 },
  ]);
});

test("August is separately filtered and a month without records has a zero total", () => {
  const august = monthlyReport(expenses, "2026-08");
  assert.equal(august.total, 750000);
  assert.deepEqual(
    august.rows.map((row) => row.id),
    ["EXP-0999"],
  );
  const empty = monthlyReport(expenses, "2026-10");
  assert.equal(empty.total, 0);
  assert.deepEqual(empty.rows, []);
  assert.deepEqual(empty.departments, []);
});

test("invalid month selections are rejected rather than returning misleading totals", () => {
  for (const month of [
    "2026-9",
    "2026-00",
    "2026-13",
    "2026-09-01",
    "",
    null,
  ]) {
    assert.throws(() => monthlyReport(expenses, month), /YYYY-MM/);
  }
});

test("currency and amount validation prevent mixing currencies or fractional rupiah", () => {
  for (const change of [
    { currency: "USD" },
    { amount: -1 },
    { amount: 0.5 },
    { amount: NaN },
  ]) {
    assert.throws(
      () => monthlyReport([{ ...expenses[0], ...change }], "2026-09"),
      /IDR amounts/,
    );
  }
});

test("reports do not mutate source records or their input order", () => {
  const source = structuredClone([...expenses].reverse());
  const before = structuredClone(source);
  const report = monthlyReport(source, "2026-09");
  assert.deepEqual(source, before);
  assert.deepEqual(
    report.rows.map((row) => row.id),
    ["EXP-1001", "EXP-1002", "EXP-1003"],
  );
  report.rows[0].amount = 0;
  assert.deepEqual(source, before);
});

test("period labels and comparisons are stable across year boundaries and timezones", () => {
  assert.equal(previousMonth("2026-01"), "2025-12");
  assert.equal(previousMonth("2026-09"), "2026-08");
  assert.equal(monthLabel("2026-09"), "September 2026");
  assert.equal(formatAmount(5000000), "Rp5.000.000");
});
