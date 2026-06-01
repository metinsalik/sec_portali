import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

interface EmployeeTrendData {
  month: string;
  count: number;
  totalCount: number;
  percentChange: number | null;
}

interface TrendChartProps {
  data: EmployeeTrendData[];
  companyName?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RechartsFormatter = (value: any, name: any, props: any, index: number) => [string, string];

export function EmployeeTrendChart({ data, companyName }: TrendChartProps) {
  const title = companyName
    ? `${companyName} Aylık Çalışan Sayısı Değişimi`
    : "Aylık Çalışan Sayısı Değişimi";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipFormatter: RechartsFormatter = (value: any, name: any, props: any) => {
    const index = props?.dataIndex ?? 0;
    const currentMonthData = data[index];

    if (!currentMonthData) return [String(value), String(name)];

    if (name === "percentChange") {
      const pct = currentMonthData.percentChange;
      if (pct === null) return ["—", "Aylık % Değişim"];
      const sign = pct > 0 ? "+" : "";
      return [`${sign}${pct.toFixed(1)}%`, "Aylık % Değişim"];
    }

    if (name === "totalCount") {
      return [`${currentMonthData.totalCount}`, "Toplam Çalışan"];
    }

    return [String(value), String(name)];
  };

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full min-h-[350px]">
          <ResponsiveContainer width="100%" height="100%" minHeight={350}>
            <ComposedChart
              data={data}
              margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--muted))"
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                label={{
                  value: "Toplam Çalışan",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickFormatter={(v: number) => `${v}%`}
                label={{
                  value: "% Değişim",
                  angle: 90,
                  position: "insideRight",
                  style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={tooltipFormatter}
              />
              <Legend
                formatter={(value: string) => {
                  if (value === "totalCount") return "Toplam Çalışan Sayısı";
                  if (value === "percentChange") return "Aylık % Değişim";
                  return value;
                }}
              />
              <Bar
                yAxisId="right"
                dataKey="percentChange"
                name="percentChange"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.percentChange === null
                        ? "hsl(var(--muted))"
                        : entry.percentChange >= 0
                          ? "#22c55e"
                          : "#ef4444"
                    }
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="totalCount"
                name="totalCount"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}