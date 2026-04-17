import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface HRData {
  id: number;
  facilityId: string;
  month: string;
  mainEmployerData: any;
  subContractorData: any;
  facility: { name: string };
}

export default function HRDataPage() {
  const queryClient = useQueryClient();
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [mainEmployerData, setMainEmployerData] = useState({ totalWorkers: 0, workHours: 0 });
  const [subContractorData, setSubContractorData] = useState({ totalWorkers: 0, workHours: 0 });

  const { data: facilities } = useQuery({
    queryKey: ['operations-facilities'],
    queryFn: async () => {
      const res = await api.get('/operations/facilities');
      if (!res.ok) throw new Error('Tesisler yüklenemedi');
      return res.json();
    },
  });

  const { data: hrDataList } = useQuery<HRData[]>({
    queryKey: ['operations-hr', selectedFacility, selectedMonth],
    queryFn: async () => {
      if (!selectedFacility) return [];
      const res = await api.get(`/operations/hr/${selectedFacility}/monthly?month=${selectedMonth}`);
      if (!res.ok) throw new Error('HR verileri yüklenemedi');
      return res.json();
    },
    enabled: !!selectedFacility,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/operations/hr/${selectedFacility}/monthly`, {
        month: selectedMonth,
        mainEmployerData,
        subContractorData,
      });
      if (!res.ok) throw new Error('Kayıt hatası');
      return res.json();
    },
    onSuccess: () => {
      toast.success('HR verisi kaydedildi');
      queryClient.invalidateQueries({ queryKey: ['operations-hr'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Kayıt başarısız');
    },
  });

  const currentData = hrDataList?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Aylık Personel Verisi</h1>
        <p className="text-sm text-muted-foreground">Çalışan sayısı ve çalışma saatleri girişi</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Veri Girişi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tesis</Label>
              <Select value={selectedFacility} onValueChange={(v) => setSelectedFacility(v || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Tesis seçin" />
                </SelectTrigger>
                <SelectContent>
                  {facilities?.map((f: any) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ay</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            <div className="space-y-4">
              <h3 className="font-medium">Ana İşveren</h3>
              <div className="space-y-2">
                <Label>Toplam Çalışan</Label>
                <Input
                  type="number"
                  value={mainEmployerData.totalWorkers}
                  onChange={(e) => setMainEmployerData({ ...mainEmployerData, totalWorkers: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Aylık Çalışma Saati</Label>
                <Input
                  type="number"
                  value={mainEmployerData.workHours}
                  onChange={(e) => setMainEmployerData({ ...mainEmployerData, workHours: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-medium">Alt Yüklenici</h3>
              <div className="space-y-2">
                <Label>Toplam Çalışan</Label>
                <Input
                  type="number"
                  value={subContractorData.totalWorkers}
                  onChange={(e) => setSubContractorData({ ...subContractorData, totalWorkers: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Aylık Çalışma Saati</Label>
                <Input
                  type="number"
                  value={subContractorData.workHours}
                  onChange={(e) => setSubContractorData({ ...subContractorData, workHours: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!selectedFacility || saveMutation.isPending}
            className="w-full"
          >
            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </CardContent>
      </Card>

      {currentData && (
        <Card>
          <CardHeader>
            <CardTitle>Kayıtlı Veriler</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p><strong>Ana İşveren:</strong> {currentData.mainEmployerData?.totalWorkers ?? 0} çalışan, {currentData.mainEmployerData?.workHours ?? 0} saat</p>
            <p><strong>Alt Yüklenici:</strong> {currentData.subContractorData?.totalWorkers ?? 0} çalışan, {currentData.subContractorData?.workHours ?? 0} saat</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}