"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/**
 * Single-series bar chart (Recharts) with a hover tooltip.
 * data: [{ label, value }]
 */
export default function BarChartCard({ data, valueLabel = "Value", suffix = "", maxValue }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: "#cbd5e1" }}
            tick={{ fill: "#64748b", fontSize: 12 }}
            interval={0}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, maxValue ?? "auto"]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickFormatter={(v) => `${v}${suffix}`}
          />
          <Tooltip
            cursor={{ fill: "#f1f5f9" }}
            formatter={(v) => [`${v}${suffix}`, valueLabel]}
            contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, boxShadow: "0 4px 12px rgba(15,29,64,.08)" }}
            labelStyle={{ color: "#0f172a", fontWeight: 600 }}
          />
          <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
