import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Building2, Users, ClipboardCheck, AlertTriangle, ShieldAlert, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DashboardKPI {
  totalFacilities: number;
  totalProfessionals: number;
  totalActiveAssignments: number;
  certWarningCount: number;
  certCriticalCount: number;
}

const kpiConfig = [
  {
    key: 'totalFacilities' as const,
    label: 'Aktif Tesis',
    icon: Building2,
  },
  {
    key: 'totalProfessionals' as const,
    label: 'İSG Profesyoneli',
    icon: Users,
  },
  {
    key: 'totalActiveAssignments' as const,
    label: 'Aktif Atama',
    icon: ClipboardCheck,
  },
  {
    key: 'certWarningCount' as const,
    label: 'Sertifika Uyarısı',
    icon: AlertTriangle,
  },
  {
    key: 'certCriticalCount' as const,
    label: 'Kritik Sertifika',
    icon: ShieldAlert,
  },
];

export default function PanelDashboard() {
  const { data: kpi, isLoading } = useQuery<DashboardKPI>({
    queryKey: ['panel-dashboard'],
    queryFn: async () => {
      const res = await api.get('/panel/dashboard');
      if (!res.ok) throw new Error('Dashboard verileri yüklenemedi.');
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5 font-normal">
          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
          Sistem Devrede
        </Badge>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpiConfig.map(({ key, label, icon: Icon }) => (
          <Card key={key}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                {isLoading ? (
                  <div className="h-8 w-16 bg-muted rounded animate-pulse mt-2" />
                ) : (
                  <div className="text-3xl font-bold mt-2">
                    {kpi?.[key] ?? 0}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hızlı Erişim */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sertifika Durumu</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">90 Gün İçinde Bitiyor</span>
                  </div>
                  <span className="font-bold">{kpi?.certWarningCount ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">60 Gün / Süresi Dolmuş</span>
                  </div>
                  <span className="font-bold text-destructive">{kpi?.certCriticalCount ?? 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Genel Özet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              {[
                { label: 'Toplam Tesis', value: kpi?.totalFacilities },
                { label: 'Toplam Profesyonel', value: kpi?.totalProfessionals },
                { label: 'Aktif Atama', value: kpi?.totalActiveAssignments },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <span className="text-muted-foreground">{label}</span>
                  {isLoading ? (
                    <div className="h-5 w-10 bg-muted rounded animate-pulse" />
                  ) : (
                    <span className="font-medium">{value ?? 0}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
