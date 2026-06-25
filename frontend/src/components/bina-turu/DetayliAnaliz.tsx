import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2 } from 'lucide-react';

interface DetayliAnalizProps {
  year?: number | null;
  period?: number | null;
}

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6'];

const DetayliAnaliz: React.FC<DetayliAnalizProps> = ({ year, period }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnaliz();
  }, [year, period]);

  const fetchAnaliz = async () => {
    setLoading(true);
    const facilityId = localStorage.getItem('activeFacilityId');
    if (!facilityId) return;

    try {
      let url = `/bina-turu/analiz?facilityId=${facilityId}`;
      if (year) url += `&year=${year}`;
      if (period) url += `&period=${period}`;

      const res = await api.get(url);
      setData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data) return null;

  const { gostergeler, denetimTablosu, anaGrupTablosu, alanTablosu } = data;

  const formatPercent = (val: number) => Number(val).toFixed(1).replace('.', ',') + '%';

  const pieData = [
    { name: 'Uygun', value: gostergeler.uygun },
    { name: 'Uygun Değil', value: gostergeler.uygunDegil }
  ];

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* 1. Göstergeler (Üst Özet Kartları) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-semibold text-slate-500 uppercase">Kontrol Satırı</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{gostergeler.toplamSoru}</h3>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-semibold text-green-700 uppercase">Uygun</p>
            <h3 className="text-2xl font-bold text-green-800 mt-1">{gostergeler.uygun}</h3>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-semibold text-red-700 uppercase">Uygun Değil</p>
            <h3 className="text-2xl font-bold text-red-800 mt-1">{gostergeler.uygunDegil}</h3>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-semibold text-amber-700 uppercase">DF Var</p>
            <h3 className="text-2xl font-bold text-amber-800 mt-1">{gostergeler.dfVar}</h3>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-900">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-semibold text-slate-300 uppercase">Uygunluk</p>
            <h3 className="text-2xl font-bold text-green-400 mt-1">{formatPercent(gostergeler.uygunlukOrani)}</h3>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-900">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-semibold text-slate-300 uppercase">Uygunsuzluk</p>
            <h3 className="text-2xl font-bold text-red-400 mt-1">{formatPercent(gostergeler.uygunsuzlukOrani)}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 2. Denetim Tablosu */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-800">Denetim Bazlı Analiz</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-bold text-slate-700">Denetim</TableHead>
                    <TableHead className="text-right font-bold text-slate-700">Toplam</TableHead>
                    <TableHead className="text-right font-bold text-green-700">Uygun</TableHead>
                    <TableHead className="text-right font-bold text-red-700">Uygun Değil</TableHead>
                    <TableHead className="text-right font-bold text-slate-700">Uygunluk %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {denetimTablosu.map((d: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-slate-800">{d.ad}</TableCell>
                      <TableCell className="text-right">{d.toplam}</TableCell>
                      <TableCell className="text-right">{d.uygun}</TableCell>
                      <TableCell className="text-right">{d.uygunDegil}</TableCell>
                      <TableCell className="text-right font-semibold">{formatPercent(d.uygunlukYuzdesi)}</TableCell>
                    </TableRow>
                  ))}
                  {denetimTablosu.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-slate-400">Veri yok</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 3. Ana Grup Tablosu */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-800">Ana Grup Bazlı Analiz</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-bold text-slate-700">Ana Grup</TableHead>
                    <TableHead className="text-right font-bold text-slate-700">Toplam</TableHead>
                    <TableHead className="text-right font-bold text-green-700">Uygun</TableHead>
                    <TableHead className="text-right font-bold text-red-700">Uygun Değil</TableHead>
                    <TableHead className="text-right font-bold text-slate-700">Uygunluk %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anaGrupTablosu.map((g: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-slate-800">{g.ad}</TableCell>
                      <TableCell className="text-right">{g.toplam}</TableCell>
                      <TableCell className="text-right">{g.uygun}</TableCell>
                      <TableCell className="text-right">{g.uygunDegil}</TableCell>
                      <TableCell className="text-right font-semibold">{formatPercent(g.uygunlukYuzdesi)}</TableCell>
                    </TableRow>
                  ))}
                  {anaGrupTablosu.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-slate-400">Veri yok</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Grafikler */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-800">Genel Oranlar</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {gostergeler.toplamSoru > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    <Cell fill={COLORS[0]} />
                    <Cell fill={COLORS[1]} />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">Veri yok</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-800">Ana Gruplara Göre Dağılım</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {anaGrupTablosu.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={anaGrupTablosu} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="ad" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="uygun" name="Uygun" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="uygunDegil" name="Uygun Değil" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">Veri yok</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Denetlenecek Alan Tablosu */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-base text-slate-800">Denetlenecek Alan Bazlı Analiz</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-y-auto max-h-[500px]">
            <Table>
              <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 w-1/3">Denetlenecek Alan</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">Toplam</TableHead>
                  <TableHead className="text-right font-bold text-green-700">Uygun</TableHead>
                  <TableHead className="text-right font-bold text-red-700">Uygun Değil</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">Uygunluk %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alanTablosu.map((a: any, idx: number) => (
                  <TableRow key={idx} className="hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-800">{a.ad}</TableCell>
                    <TableCell className="text-right text-slate-600">{a.toplam}</TableCell>
                    <TableCell className="text-right text-green-700">{a.uygun}</TableCell>
                    <TableCell className="text-right text-red-700">{a.uygunDegil}</TableCell>
                    <TableCell className="text-right font-semibold">{formatPercent(a.uygunlukYuzdesi)}</TableCell>
                  </TableRow>
                ))}
                {alanTablosu.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">Veri yok</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetayliAnaliz;
