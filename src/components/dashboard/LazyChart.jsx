"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function LazyChart({ chartType, chartData }) {
  const ChartComponent = {
    line: LineChart,
    bar: BarChart,
    area: AreaChart,
  }[chartType];

  const ChartContent = () => {
    switch (chartType) {
      case "line":
        return (
          <>
            <Line
              type="monotone"
              dataKey="study_hours"
              stroke="#06b6d4"
              strokeWidth={3}
              dot={{ fill: "#06b6d4", strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8, fill: "#0891b2" }}
            />
            <Line
              type="monotone"
              dataKey="test_count"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ fill: "#f59e0b", strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8, fill: "#d97706" }}
            />
            {chartData.some((d) => d.ghalamchi_score) && (
              <Line
                type="monotone"
                dataKey="ghalamchi_score"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 5 }}
                activeDot={{ r: 8, fill: "#7c3aed" }}
              />
            )}
          </>
        );
      case "bar":
        return (
          <>
            <Bar dataKey="study_hours" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            <Bar dataKey="test_count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </>
        );
      case "area":
        return (
          <>
            <Area
              type="monotone"
              dataKey="study_hours"
              stackId="1"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="test_count"
              stackId="1"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.6}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ChartComponent data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="persianDate" 
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
        />
        <YAxis />
        <Tooltip />
        <ChartContent />
      </ChartComponent>
    </ResponsiveContainer>
  );
}
