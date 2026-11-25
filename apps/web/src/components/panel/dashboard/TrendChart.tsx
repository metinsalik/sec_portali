import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Users, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface EmployeeTrendData {
  month: string;
  count?: number;
  totalCount: number;
  percentChange: number | null;
  countChange?: number | null;
}

interface TrendChartProps {
  data: EmployeeTrendData[];
  companyName?: string;
}

const MONTHS_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

const formatMonth = (monthStr: string) => {
  if (!monthStr || !monthStr.includes("-")) return monthStr;
  const [year, month] = monthStr.split("-");
  const idx = parseInt(month, 10) - 1;
  return `${MONTHS_TR[idx] || month} ${year.slice(-2)}`;
};

const formatMonthFull = (monthStr: string) => {
  if (!monthStr || !monthStr.includes("-")) return monthStr;
  const [year, month] = monthStr.split("-");
  const idx = parseInt(month, 10) - 1;
  return `${MONTHS_TR[idx] || month} ${year}`;
};

export function EmployeeTrendChart({ data = [], companyName }: TrendChartProps) {
  const title = companyName
    ? `${companyName} Çalışan Sayısı Trendi`
    : "Çalışan Sayısı Trendi";

  const metrics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        latestCount: 0,
        latestChange: 0,
        latestDiff: 0,
        avgCount: 0,
        yearlyPct: 0,
        yearlyDiff: 0,
        yMin: 0,
        yMax: 100,
      };
    }

    const counts = data.map((d) => d.totalCount || 0);
    const first = counts[0];
    const latest = counts[counts.length - 1];
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    const avg = Math.round(counts.reduce((s, v) => s + v, 0) / counts.length);
    const spread = Math.max(max - min, Math.round(max * 0.08), 10);
    const pad = Math.round(spread * 0.25);

    const lastItem = data[data.length - 1];
    const latestChange = lastItem.percentChange ?? 0;
    const latestDiff = lastItem.countChange ?? (data.length > 1 ? latest - counts[counts.length - 2] : 0);
    const yearlyDiff = latest - first;
    const yearlyPct = first > 0 ? (yearlyDiff / first) * 100 : 0;

    return {
      latestCount: latest,
      latestChange,
      latestDiff,
      avgCount: avg,
      yearlyPct,
      yearlyDiff,
      yMin: Math.max(0, Math.floor((min - pad) / 10) * 10),
      yMax: Math.ceil((max + pad) / 10) * 10,
    };
  }, [data]);

  const isPositive = metrics.latestChange > 0;
  const isNegative = metrics.latestChange < 0;

  return (
    <Card className="rounded-lg border border-border bg-card shadow-xs transition-all duration-200">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 gap-3 border-b border-border/50">
        <div className="space-y-0.5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-3.5 h-3.5" />
            </div>
            {title}
          </CardTitle>
          <CardDescription className="text-[11px] text-muted-foreground">
            Son 12 ayın toplam çalışan eğilimi ve aylık değişim oranları
          </CardDescription>
        </div>

        {/* Kompakt Özet Metrik Şeridi */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="hidden md:block text-right">
            <p className="text-[10px] font-medium text-muted-foreground">12 Ay Ort.</p>
            <p className="text-xs font-semibold tabular-nums text-foreground">
              {metrics.avgCount.toLocaleString("tr-TR")}
            </p>
          </div>

          <div className="hidden md:block h-6 w-px bg-border/70" />

          <div className="hidden sm:block text-right">
            <p className="text-[10px] font-medium text-muted-foreground">12 Aylık Değişim</p>
            <p
              className={`text-xs font-semibold tabular-nums ${
                metrics.yearlyDiff >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {metrics.yearlyDiff >= 0 ? "+" : ""}
              {metrics.yearlyDiff.toLocaleString("tr-TR")} ({metrics.yearlyPct >= 0 ? "+" : ""}
              {metrics.yearlyPct.toFixed(1)}%)
            </p>
          </div>

          <div className="hidden sm:block h-6 w-px bg-border/70" />

          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-[10px] font-medium text-muted-foreground">Güncel</p>
              <p className="text-lg font-bold tracking-tight tabular-nums text-foreground leading-none">
                {metrics.latestCount.toLocaleString("tr-TR")}
              </p>
            </div>
            <Badge
              variant="outline"
              className={`h-5 px-2 text-[10px] font-semibold gap-1 tabular-nums ${
                isPositive
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                  : isNegative
                    ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                    : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : isNegative ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              {isPositive ? "+" : ""}
              {metrics.latestChange.toFixed(1)}%
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {data.length === 0 ? (
          <div className="h-[220px] flex flex-col items-center justify-center text-xs text-muted-foreground gap-1.5">
            <Users className="w-6 h-6 opacity-40" />
            <span>Henüz çalışan trend verisi bulunmuyor.</span>
          </div>
        ) : (
          <div className="h-[230px] w-full min-h-[230px]" style={{ minWidth: 0 }}>
            <ResponsiveContainer width="99%" height="100%" minHeight={230}>
              <AreaChart
                data={data}
                margin={{ top: 12, right: 16, left: -12, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="employeeTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.01} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.7}
                />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatMonth}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }}
                  dy={8}
                />

                <YAxis
                  domain={[metrics.yMin, metrics.yMax]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }}
                  tickFormatter={(value) =>
                    value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value)
                  }
                />

                <ReferenceLine
                  y={metrics.avgCount}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  strokeOpacity={0.45}
                  label={{
                    value: `Ort. ${metrics.avgCount.toLocaleString("tr-TR")}`,
                    position: "insideTopRight",
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />

                <Tooltip
                  cursor={{
                    stroke: "hsl(var(--primary))",
                    strokeWidth: 1,
                    strokeDasharray: "3 3",
                  }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const row = payload[0].payload as EmployeeTrendData;
                    const pct = row.percentChange;
                    const diff = row.countChange;

                    return (
                      <div className="bg-popover text-popover-foreground border border-border px-3 py-2.5 rounded-lg shadow-md text-xs space-y-1">
                        <p className="font-semibold text-muted-foreground text-[11px]">
                          {formatMonthFull(String(label || ""))}
                        </p>
                        <p className="text-base font-bold tabular-nums text-foreground">
                          {row.totalCount.toLocaleString("tr-TR")}{" "}
                          <span className="text-[11px] font-normal text-muted-foreground">
                            çalışan
                          </span>
                        </p>
                        {pct !== null && (
                          <div
                            className={`text-[11px] font-semibold tabular-nums flex items-center gap-1 ${
                              pct >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {pct >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span>
                              {pct >= 0 ? "+" : ""}
                              {pct.toFixed(1)}%
                              {diff !== null && diff !== undefined
                                ? ` (${diff >= 0 ? "+" : ""}${diff.toLocaleString("tr-TR")} kişi)`
                                : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="totalCount"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.25}
                  fill="url(#employeeTrendFill)"
                  dot={{
                    r: 3,
                    fill: "hsl(var(--background))",
                    stroke: "hsl(var(--primary))",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 5,
                    fill: "hsl(var(--primary))",
                    stroke: "hsl(var(--background))",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
