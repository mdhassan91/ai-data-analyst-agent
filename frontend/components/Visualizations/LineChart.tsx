"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Visualization } from "@/types";

export function LineChart({ visualization }: { visualization: Visualization }) {
  const data = visualization.labels.map((label, i) => ({
    label,
    value: visualization.values[i],
  }));

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 16, top: 12, bottom: 8 }}>
          <defs>
            <linearGradient id="lineGradientFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00BFA5" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#00BFA5" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="lineGradientStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#80E8C6" />
              <stop offset="100%" stopColor="#00BFA5" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2E3A59" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#7C8698"
            tick={{ fill: "#7C8698", fontSize: 12 }}
            label={
              visualization.x_label
                ? { value: visualization.x_label, position: "insideBottom", offset: -4, fill: "#7C8698", fontSize: 11 }
                : undefined
            }
          />
          <YAxis
            stroke="#7C8698"
            tick={{ fill: "#7C8698", fontSize: 12 }}
            label={
              visualization.y_label
                ? { value: visualization.y_label, angle: -90, position: "insideLeft", fill: "#7C8698", fontSize: 11 }
                : undefined
            }
          />
          <Tooltip
            contentStyle={{
              background: "#1F2433",
              border: "1px solid #2E3A59",
              borderRadius: 12,
              color: "#E5E9F0",
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="url(#lineGradientStroke)"
            strokeWidth={2.5}
            fill="url(#lineGradientFill)"
            dot={{ r: 4, fill: "#00BFA5", stroke: "#0B0E14", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#80E8C6" }}
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
