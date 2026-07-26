import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    if (user?.facilityId) {
      api.get(`/checklists/reports/facility/${user.facilityId}`).then(async (res) => {
        const data = await res.json();
        setReports(data);
      });
    }
  }, [user]);

  const chartData = reports.map(r => ({
    name: new Date(r.auditDate).toLocaleDateString(),
    score: r.percentScore || 0,
    title: r.template.title
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Kontrol Listesi Raporları</h1>
      <p className="text-muted-foreground">Tesisinizin denetim performans analizleri.</p>

      <Card>
        <CardHeader>
          <CardTitle>Zaman İçinde Trend (Skor Yüzdesi)</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Yeterli veri yok.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
