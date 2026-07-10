import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Users } from "lucide-react";

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
    <Card className="col-span-1 md:col-span-2 lg:col-span-3 shadow-sm border-slate-200 dark:border-slate-800 bg-card rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <Users className="w-5 h-5" />
            </div>
            {title}
          </CardTitle>
          <CardDescription className="text-muted-foreground">Aylara göre toplam çalışan sayısındaki değişim</CardDescription>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-foreground">{latestCount.toLocaleString('tr-TR')}</p>
          {latestChange !== 0 && (
            <p className={`text-sm font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isPositive ? '+' : ''}{latestChange?.toFixed(1)}% (Son ay)
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full min-h-[320px] overflow-hidden" style={{ minWidth: 0 }}>
          <ResponsiveContainer width="99%" height="100%" minHeight={320}>
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barSize={40}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--muted))"
                opacity={0.5}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tickFormatter={formatMonth}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const monthData = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border p-4 rounded-lg shadow-md">
                        <p className="text-sm font-semibold text-muted-foreground mb-2">{formatMonth(label)}</p>
                        <p className="text-2xl font-bold text-foreground">
                          {monthData.totalCount.toLocaleString('tr-TR')} <span className="text-xs font-normal text-muted-foreground">Çalışan</span>
                        </p>
                        {monthData.percentChange !== null && (
                          <div className={`text-xs font-medium mt-1 ${monthData.percentChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {monthData.percentChange >= 0 ? '↗' : '↘'} {Math.abs(monthData.percentChange).toFixed(1)}% değişim
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="totalCount" radius={[4, 4, 0, 0]}>
                {data?.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === data.length - 1 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} 
                    fillOpacity={index === data.length - 1 ? 1 : 0.3}
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