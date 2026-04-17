import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, AlertTriangle, FileText } from 'lucide-react';

interface DashboardData {
  totalFacilities: number;
  hrDataSubmittedThisMonth: number;
  accidentDataSubmittedThisMonth: number;
  currentMonth: string;
}

export default function OperationsDashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['operations-dashboard'],
    queryFn: async () => {
      const res = await api.get('/operations/dashboard');
      if (!res.ok) throw new Error('Dashboard yüklenemedi');
      return res.json();
    },
  });

  const kpiCards = [
    { label: 'Toplam Tesis', value: data?.totalFacilities ?? 0, icon: Building2 },
    { label: 'Bu Ay HR Verisi', value: data?.hrDataSubmittedThisMonth ?? 0, icon: Users },
    { label: 'Bu Ay Kaza Verisi', value: data?.accidentDataSubmittedThisMonth ?? 0, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Operasyon Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {data?.currentMonth
            ? new Date(data.currentMonth + '-01').toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })
            : '...'}{' '}
          ayı özeti
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpiCards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold mt-2">{isLoading ? '...' : value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yardım</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <FileText className="w-4 h-4 inline mr-2" />
            <strong>Aylık Personel Verisi:</strong> Her ayın işçi sayısı ve çalışma saatleri
          </p>
          <p>
            <strong>Kaza İstatistikleri:</strong> İş kazaları ve yaralanma kayıtları
          </p>
        </CardContent>
      </Card>
    </div>
  );
}