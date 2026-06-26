import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Printer, Search, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export function RiskReportsPage() {
  const { facilities } = useAuth();
  const [selectedFacility, setSelectedFacility] = useState(localStorage.getItem('activeFacilityId') || '');
  
  // Listen for activeFacilityId changes from FacilitySwitcher
  useEffect(() => {
    const handleStorageChange = () => {
      setSelectedFacility(localStorage.getItem('activeFacilityId') || '');
    };
    window.addEventListener('storage', handleStorageChange);
    // Custom event dispatch might be needed if FacilitySwitcher dispatches one
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('ALL');
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    if (!selectedFacility) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('facilityId', selectedFacility);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (status !== 'ALL') params.append('statuses', status);

      const response = await fetch(`/api/risks/reports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok) {
        setData(result);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFacility) {
      fetchReport();
    }
  }, [selectedFacility]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Risk Analiz ve Raporları</h1>
          <p className="text-muted-foreground">Tarih aralığına ve statüye göre risk değerlendirmesi sonuçları.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="w-4 h-4 mr-2" /> Yazdır / PDF
          </Button>
        </div>
      </div>

      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Başlangıç (Tespit)</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bitiş (Tespit)</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Statü</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue placeholder="Tümü" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tümü</SelectItem>
                  <SelectItem value="ACIK_TEHLIKE">Açık Tehlike</SelectItem>
                  <SelectItem value="ILK_MUDAHALE_EDILDI">İlk Müdahale Edildi</SelectItem>
                  <SelectItem value="TAKIP_SURECINDE">Takip Sürecinde</SelectItem>
                  <SelectItem value="KAPATILDI_GUVENLI">Kapatıldı</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 md:col-span-3 flex justify-end">
              <Button onClick={fetchReport} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                Filtrele
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {data && (
        <div className="space-y-6">
          {/* Grafikler */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="print:break-inside-avoid">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Statü Dağılımı</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {data.analysis?.byStatus?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.analysis.byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {data.analysis.byStatus.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Veri yok</div>}
              </CardContent>
            </Card>

            <Card className="print:break-inside-avoid">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Risk Seviyesi Dağılımı</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {data.analysis?.byLevel?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.analysis.byLevel} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {data.analysis.byLevel.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Veri yok</div>}
              </CardContent>
            </Card>

            <Card className="print:break-inside-avoid">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Departman Dağılımı</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {data.analysis?.byDepartment?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.analysis.byDepartment} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {data.analysis.byDepartment.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Veri yok</div>}
              </CardContent>
            </Card>
          </div>

          {/* Tablo */}
          <Card className="print:shadow-none print:border-none">
            <CardHeader className="print:hidden">
              <CardTitle className="text-lg">Risk Listesi ({data.risks?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent className="print:p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">No</th>
                      <th className="px-4 py-3">Departman</th>
                      <th className="px-4 py-3">Tehlike / Risk</th>
                      <th className="px-4 py-3">Tespit Tarihi</th>
                      <th className="px-4 py-3">Statü / Tarih</th>
                      <th className="px-4 py-3">Risk Skor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.risks?.map((risk: any) => (
                      <tr key={risk.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">#{risk.riskNo}</td>
                        <td className="px-4 py-3">{risk.department?.name}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold">{risk.hazard}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-xs print:whitespace-normal">{risk.riskDescription}</div>
                        </td>
                        <td className="px-4 py-3">
                          {risk.detectionDate ? new Date(risk.detectionDate).toLocaleDateString('tr-TR') : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            {risk.status === 'KAPATILDI_GUVENLI' ? 'Kapatıldı' : 
                             risk.status === 'TAKIP_SURECINDE' ? 'Takip Sürecinde' : 
                             risk.status === 'ILK_MUDAHALE_EDILDI' ? 'İlk Müdahale' : 'Açık'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {risk.statusDate ? new Date(risk.statusDate).toLocaleDateString('tr-TR') : (risk.actionDate ? new Date(risk.actionDate).toLocaleDateString('tr-TR') : '-')}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {risk.finalScore || risk.initialScore} ({risk.finalLevel || risk.initialLevel})
                        </td>
                      </tr>
                    ))}
                    {data.risks?.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          Seçili kriterlere uygun risk bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
