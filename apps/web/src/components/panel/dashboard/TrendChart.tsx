import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { Users, TrendingUp, TrendingDown } from "lucide-react";

interface EmployeeTrendData {
  month: string;
  count: number;
  totalCount: number;
  percentChange: number | null;
  countChange?: number | null;
}

interface TrendChartProps {
  data: EmployeeTrendData[];
  companyName?: string;
}

const formatMonth = (monthStr: string) => {
  if (!monthStr || !monthStr.includes("-")) return monthStr;
  const [year, month] = monthStr.split("-");
  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
};

export function EmployeeTrendChart({ data, companyName }: TrendChartProps) {
  const title = companyName
    ? `${companyName} Çalışan Sayısı Trendi`
    : "Çalışan Sayısı Trendi";

  const latestCount = data?.length > 0 ? data[data.length - 1].totalCount : 0;
  const latestChange = data?.length > 0 && data[data.length - 1].percentChange !== null 
    ? data[data.length - 1].percentChange 
    : 0;
  
  const isPositive = (latestChange || 0) >= 0;

  return (
    <Card className="rounded-xl border border-border bg-card shadow-xs transition-all duration-200">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4 border-b border-border/40">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-4 h-4" />
            </div>
            {title}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Son 12 ayın toplam çalışan sayısı ve aylık değişim oranları
          </CardDescription>
        </div>
        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1">
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {latestCount.toLocaleString('tr-TR')}
          </div>
          {latestChange !== 0 && (
            <Badge
              variant="outline"
              className={`h-5 px-2 text-[11px] font-semibold gap-1 ${
                isPositive
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? '+' : ''}{latestChange?.toFixed(1)}% (Son ay)
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[280px] w-full min-h-[280px] overflow-hidden" style={{ minWidth: 0 }}>
          <ResponsiveContainer width="99%" height="100%" minHeight={280}>
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barSize={36}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--muted))"
                opacity={0.6}
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
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const monthData = payload[0].payload;
                    return (
                      <div className="bg-popover text-popover-foreground border border-border p-3 rounded-lg shadow-md text-xs space-y-1">
                        <p className="font-semibold text-muted-foreground">{formatMonth(label)}</p>
                        <p className="text-xl font-bold text-foreground">
                          {monthData.totalCount.toLocaleString('tr-TR')}{' '}
                          <span className="text-xs font-normal text-muted-foreground">Çalışan</span>
                        </p>
                        {monthData.percentChange !== null && (
                          <div
                            className={`font-semibold flex items-center gap-1 ${
                              monthData.percentChange >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {monthData.percentChange >= 0 ? '↗ +' : '↘ '}
                            {monthData.percentChange.toFixed(1)}% aylık değişim
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="totalCount" radius={[6, 6, 0, 0]}>
                {data?.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === data.length - 1 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                    fillOpacity={index === data.length - 1 ? 0.9 : 0.3}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}