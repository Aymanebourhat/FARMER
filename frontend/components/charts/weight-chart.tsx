"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { dateLocale, type Locale } from "@/lib/i18n";
import type { WeightRecord } from "@/types/animal";

export function WeightChart({ records, locale, kilograms }: { records: WeightRecord[]; locale: Locale; kilograms: string }) {
  const data = records.map((record) => ({ date: record.recorded_at, weight: Number(record.weight_kg) }));
  const shortDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString(dateLocale(locale), { month: "short", day: "numeric" });
  return (
    <div className="h-72 w-full" role="img" aria-label={kilograms}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, left: -12, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e2e1" />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} minTickGap={24} />
          <YAxis unit={` ${kilograms}`} tick={{ fontSize: 11 }} width={62} domain={["auto", "auto"]} />
          <Tooltip labelFormatter={(value) => shortDate(String(value))} formatter={(value) => [`${Number(value).toFixed(2)} ${kilograms}`, ""]} />
          <Line type="monotone" dataKey="weight" stroke="#012d1d" strokeWidth={3} dot={{ r: 4, fill: "#012d1d" }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
