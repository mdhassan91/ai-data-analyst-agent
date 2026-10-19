"use client";

import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Visualization } from "@/types";

export function BarChart({ visualization }: { visualization: Visualization }) {
  const data = visualization.labels.map((label, i) => ({
    label,
    value: visualization.values[i],
  }));

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#80E8C6" />
              <stop offset="100%" stopColor="#00BFA5" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2E3A59" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            stroke="#7C8698"
            tick={{ fill: "#7C8698", fontSize: 12 }}
            label={
              visualization.y_label
                ? { value: visualization.y_label, position: "insideBottom", offset: -4, fill: "#7C8698", fontSize: 11 }
                : undefined
            }
          />
          <YAxis
            type="category"
            dataKey="label"
            stroke="#7C8698"
            tick={{ fill: "#E5E9F0", fontSize: 12 }}
            width={110}
          />
          <Tooltip
            contentStyle={{
              background: "#1F2433",
              border: "1px solid #2E3A59",
              borderRadius: 12,
              color: "#E5E9F0",
            }}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar dataKey="value" fill="url(#barGradient)" radius={[0, 8, 8, 0]} animationDuration={500} />
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}
