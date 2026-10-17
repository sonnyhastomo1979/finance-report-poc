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
