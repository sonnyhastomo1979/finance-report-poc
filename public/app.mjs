import { expenses } from "./expenses.mjs";
import {
  expenseCsv,
  expenseCsvFilename,
  formatAmount,
  monthLabel,
  monthlyReport,
  previousMonth,
} from "./report.mjs";

const byId = (id) => document.getElementById(id);
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

function render() {
  const report = monthlyReport(expenses, byId("month").value);
  byId("total").textContent = formatAmount(report.total);
  byId("table-total").textContent = formatAmount(report.total);
  byId("count").textContent = String(report.rows.length).padStart(2, "0");
  byId("department-count").textContent = String(
    report.departments.length,
  ).padStart(2, "0");
  byId("comparison").textContent =
    `${formatAmount(report.previousTotal)} in ${monthLabel(previousMonth(report.month))}`;
  byId("selected-period").textContent = monthLabel(report.month);
  byId("download-csv").setAttribute(
    "aria-label",
    `Download CSV for ${monthLabel(report.month)}`,
  );
  byId("row-count").textContent =
    `${report.rows.length} ${report.rows.length === 1 ? "record" : "records"}`;
  byId("empty").hidden = report.rows.length > 0;
  const tableRows = report.rows.map((record) => {
    const tr = document.createElement("tr");
    const description = document.createElement("td");
    const title = document.createElement("strong");
    title.textContent = record.description;
    const reference = document.createElement("span");
    reference.className = "expense-reference";
    reference.textContent = record.id;
    description.append(title, reference);
    const date = document.createElement("td");
    date.textContent = dateFormatter.format(
      new Date(`${record.date}T12:00:00Z`),
    );
    const department = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "department-badge";
    badge.dataset.department = record.department;
    badge.textContent = record.department;
    department.append(badge);
    const amount = document.createElement("td");
    amount.className = "numeric";
    amount.textContent = formatAmount(record.amount);
    tr.append(description, date, department, amount);
    return tr;
  });
  byId("expense-rows").replaceChildren(...tableRows);
  const bars = report.departments.map((department, index) => {
    const item = document.createElement("div");
    item.className = "department-item";
    const label = document.createElement("div");
    label.className = "department-label";
    const name = document.createElement("strong");
    name.textContent = department.name;
    const share = document.createElement("span");
    const percentage = report.total
      ? (department.total / report.total) * 100
      : 0;
    share.textContent = `${Math.round(percentage)}%`;
    label.append(name, share);
    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("div");
    fill.className = `bar-fill color-${index % 2}`;
    fill.style.width = `${percentage}%`;
    track.append(fill);
    const amount = document.createElement("p");
    amount.textContent = formatAmount(department.total);
    item.append(label, track, amount);
    return item;
  });
  if (!bars.length) {
    const message = document.createElement("p");
    message.className = "muted";
    message.textContent = "No department expenses in this period.";
    bars.push(message);
  }
  byId("department-bars").replaceChildren(...bars);
}

function downloadCsv() {
  const month = byId("month").value;
  const blob = new Blob([expenseCsv(expenses, month)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = expenseCsvFilename(month);
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

byId("month").addEventListener("change", render);
byId("download-csv").addEventListener("click", downloadCsv);
render();
