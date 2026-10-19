"use client";

import { Component, ReactNode } from "react";
import type { TableData, Visualization } from "@/types";
import { BarChart } from "@/components/Visualizations/BarChart";
import { LineChart } from "@/components/Visualizations/LineChart";
import { PieChart } from "@/components/Visualizations/PieChart";
import { DataTable } from "@/components/UI/DataTable";

interface Props {
  visualization: Visualization;
  fallbackData?: TableData;
}

interface State {
  hasError: boolean;
}

/**
 * Charts occasionally receive malformed data from the agent. Rather than
 * crashing the whole message, we catch that here and fall back to a plain
 * table using the same underlying data, if any was provided.
 */
class ChartErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function ChartRenderer({ visualization, fallbackData }: Props) {
  const fallback = fallbackData ? (
    <DataTable data={fallbackData} />
  ) : (
    <p className="mt-3 text-sm text-white/50">This chart couldn&apos;t be displayed.</p>
  );

  const chart = (() => {
    switch (visualization.type) {
      case "bar":
        return <BarChart visualization={visualization} />;
      case "line":
        return <LineChart visualization={visualization} />;
      case "pie":
        return <PieChart visualization={visualization} />;
      default:
        return fallback;
    }
  })();

  return (
    <div className="mt-3 rounded-card border border-base-border bg-base-card p-4 shadow-card">
      {visualization.title && (
        <p className="mb-2 text-sm font-semibold text-white/80">{visualization.title}</p>
      )}
      <ChartErrorBoundary fallback={fallback}>{chart}</ChartErrorBoundary>
    </div>
  );
}
