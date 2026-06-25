import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Building2, AlertTriangle, CheckCircle, ListChecks } from 'lucide-react';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

const BinaToruDashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>({ turlar: 0, acikUygunsuzluklar: 0, kapaliUygunsuzluklar: 0, denetimSonuclari: [] });
  const [kategoriData, setKategoriData] = useState<any[]>([]);

  useEffect(() => {
    const facilityId = localStorage.getItem('activeFacilityId');
    if (facilityId) {
      fetchDashboardData(facilityId);
    }
  }, []);

  const fetchDashboardData = async (facilityId: string) => {
    try {
      const res = await api.get(`/bina-turu/dashboard?facilityId=${facilityId}`);
      const data = await res.json();
      
      const acikUygunsuzluklar = data.birimBazli.reduce((acc: number, cur: any) => acc + cur.acik + cur.devam, 0);
      const kapaliUygunsuzluklar = data.birimBazli.reduce((acc: number, cur: any) => acc + cur.kapali, 0);

      setSummary({
        turlar: data.genelDurum.toplamTur,
        acikUygunsuzluklar,
        kapaliUygunsuzluklar,
        denetimSonuclari: [
          { sonuc: 'UYGUN', _count: data.genelDurum.uygun },
          { sonuc: 'UYGUN_DEGIL', _count: data.genelDurum.uygunDegil }
        ]
      });

      setKategoriData(data.anaGrupBazli.map((item: any) => ({
        kategori: item.ad,
        UYGUN: item.uygun,
        UYGUN_DEGIL: item.uygunDegil
      })));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const pieData = summary.denetimSonuclari.map((item: any) => ({
    name: item.sonuc,
    value: item._count
  }));

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#011d2b] dark:text-[#cbe6fa]">Bina Turu Dashboard</h1>
          <p className="text-muted-foreground mt-1">Tesisinizin bina turu ve denetim istatistikleri.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Tur</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.turlar}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Açık Uygunsuzluk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.acikUygunsuzluklar}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kapanan Uygunsuzluk</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{summary.kapaliUygunsuzluklar}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Denetim Sorusu</CardTitle>
            <ListChecks className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.denetimSonuclari.reduce((acc: number, cur: any) => acc + cur._count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Genel Denetim Sonuçları</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'UYGUN' ? COLORS[0] : COLORS[1]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kategori Bazlı Uygunluk</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <BarChart data={kategoriData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="kategori" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="UYGUN" fill="#10b981" name="Uygun" />
                <Bar dataKey="UYGUN_DEGIL" fill="#ef4444" name="Uygun Değil" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BinaToruDashboard;
