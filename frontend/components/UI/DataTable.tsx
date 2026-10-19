"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { TableData } from "@/types";
import { downloadCsv } from "@/utils/csv";
import { Button } from "@/components/UI/Button";

const VISIBLE_ROWS = 20;

export function DataTable({ data }: { data: TableData }) {
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? data.rows : data.rows.slice(0, VISIBLE_ROWS);
  const hasMore = data.rows.length > VISIBLE_ROWS && !showAll;

  return (
    <div className="mt-3 overflow-hidden rounded-card border border-base-border bg-base-card">
      <div className="max-h-80 overflow-auto">
        <table className="w-full min-w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-base-inputFocus">
            <tr>
              {data.headers.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold text-white/70"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={i % 2 === 0 ? "bg-base-card" : "bg-white/[0.02]"}
              >
                {row.map((cell, j) => (
                  <td key={j} className="whitespace-nowrap px-4 py-2 text-white/90">
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-base-border px-4 py-2.5">
        {hasMore ? (
          <button
            onClick={() => setShowAll(true)}
            className="text-xs font-semibold text-accent-tealTo hover:underline"
          >
            Show all {data.rows.length} rows
          </button>
        ) : (
          <span className="text-xs text-white/40">{data.rows.length} rows</span>
        )}
        <Button
          variant="ghost"
          className="px-3 py-1.5 text-xs"
          onClick={() => downloadCsv(data)}
        >
          <Download size={14} />
          Export CSV
        </Button>
      </div>
    </div>
  );
}
