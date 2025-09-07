"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface AttendanceChartProps {
    data: {
        date: string;
        present: number;
        absent: number;
    }[];
}

const chartConfig = {
  present: {
    label: "Present",
    color: "hsl(142.1 76.2% 36.3%)", // green-600
  },
  absent: {
    label: "Absent",
    color: "hsl(0 72.2% 50.6%)", // red-600
  },
} satisfies ChartConfig

export function AttendanceChart({ data }: AttendanceChartProps) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="present" fill="var(--color-present)" radius={4} />
        <Bar dataKey="absent" fill="var(--color-absent)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
