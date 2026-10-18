export function validateMonth(month) {
  if (typeof month !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new TypeError("Use a month in YYYY-MM format.");
  }
  return month;
}

export function previousMonth(month) {
  validateMonth(month);
  const [year, number] = month.split("-").map(Number);
  return number === 1
    ? `${String(year - 1).padStart(4, "0")}-12`
    : `${String(year).padStart(4, "0")}-${String(number - 1).padStart(2, "0")}`;
}

export function monthlyReport(records, month) {
  validateMonth(month);
  const priorMonth = previousMonth(month);
  const rows = records
    .filter((record) => record.date.startsWith(`${month}-`))
    .map((record) => ({ ...record }))
    .sort(
      (left, right) =>
        left.date.localeCompare(right.date) || left.id.localeCompare(right.id),
    );
  const priorRows = records.filter((record) =>
    record.date.startsWith(`${priorMonth}-`),
  );
  const totals = new Map();
  for (const record of [...rows, ...priorRows]) {
    if (
      record.currency !== "IDR" ||
      !Number.isSafeInteger(record.amount) ||
      record.amount < 0
    ) {
      throw new TypeError(
        "The report requires non-negative, whole-rupiah IDR amounts.",
      );
    }
  }
  for (const record of rows) {
    totals.set(
      record.department,
      (totals.get(record.department) ?? 0) + record.amount,
    );
  }
  return {
    month,
    currency: "IDR",
    rows,
    total: rows.reduce((total, record) => total + record.amount, 0),
    previousTotal: priorRows.reduce(
      (total, record) => total + record.amount,
      0,
    ),
    departments: [...totals].map(([name, total]) => ({ name, total })),
  };
}

export function formatAmount(amount) {
  return `Rp${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(amount)}`;
}

export function monthLabel(month) {
  validateMonth(month);
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T12:00:00Z`));
}

// Spreadsheet apps treat a leading =, +, -, @, tab, or carriage return as a formula.
const SPREADSHEET_FORMULA = /^[=+\-@\t\r]/;
const SPREADSHEET_FORMULA_AFTER_WHITESPACE = /^[ \t\r\n]+[=+\-@]/;

function csvField(value) {
  let text = String(value);
  if (
    SPREADSHEET_FORMULA.test(text) ||
    SPREADSHEET_FORMULA_AFTER_WHITESPACE.test(text)
  ) {
    text = `'${text}`;
  }
  if (/[",\r\n\t]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function expenseCsvFilename(month) {
  return `monthly-expenses-${validateMonth(month)}.csv`;
}

export function expenseCsv(records, month) {
  const report = monthlyReport(records, month);
  const lines = ["Date,Department,Amount,Currency"];
  for (const row of report.rows) {
    lines.push(
      [row.date, row.department, row.amount, report.currency]
        .map(csvField)
        .join(","),
    );
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
