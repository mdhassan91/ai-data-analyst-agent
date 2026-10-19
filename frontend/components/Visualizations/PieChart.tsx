"use client";

import { PieChart as RePieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import type { Visualization } from "@/types";

const COLORS = ["#00BFA5", "#7D5FFF", "#80E8C6", "#FF3E6C", "#2ECC71", "#4F8CFF"];

export function PieChart({ visualization }: { visualization: Visualization }) {
  const total = visualization.values.reduce((sum, v) => sum + v, 0);
  const data = visualization.labels.map((label, i) => ({
    name: label,
    value: visualization.values[i],
  }));

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RePieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="45%"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
            animationDuration={500}
            label={({ value }) => `${((value / total) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#0B0E14" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#1F2433",
              border: "1px solid #2E3A59",
              borderRadius: 12,
              color: "#E5E9F0",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#E5E9F0" }}
            iconType="circle"
          />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}
