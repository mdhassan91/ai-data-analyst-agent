import type { TableData } from "@/types";

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function tableToCsv(table: TableData): string {
  const lines = [
    table.headers.map(escapeCsvCell).join(","),
    ...table.rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  return lines.join("\n");
}

export function downloadCsv(table: TableData, filename = "query-result.csv") {
  const csv = tableToCsv(table);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
