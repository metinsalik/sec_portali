import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface AccidentData {
  id: number;
  facilityId: string;
  month: string;
  mainEmployerData: any;
  subContractorData: any;
  internData: any;
}

export default function AccidentsPage() {
  const queryClient = useQueryClient();
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const [mainEmployer, setMainEmployer] = useState({
    accidents: 0, injuries: 0, deaths: 0, lostDays: 0,
  });
  const [subContractor, setSubContractor] = useState({
    accidents: 0, injuries: 0, deaths: 0, lostDays: 0,
  });
  const [intern, setIntern] = useState({
    accidents: 0, injuries: 0, deaths: 0, lostDays: 0,
  });

  const { data: facilities } = useQuery({
    queryKey: ['operations-facilities'],
    queryFn: async () => {
      const res = await api.get('/operations/facilities');
      if (!res.ok) throw new Error('Tesisler yüklenemedi');
      return res.json();
    },
  });

  const { data: accidentList } = useQuery<AccidentData[]>({
    queryKey: ['operations-accidents', selectedFacility, selectedMonth],
    queryFn: async () => {
      if (!selectedFacility) return [];
      const res = await api.get(`/operations/accidents/${selectedFacility}/monthly?month=${selectedMonth}`);
      if (!res.ok) throw new Error('Kaza verileri yüklenemedi');
      return res.json();
    },
    enabled: !!selectedFacility,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/operations/accidents/${selectedFacility}/monthly`, {
        month: selectedMonth,
        mainEmployerData: mainEmployer,
        subContractorData: subContractor,
        internData: intern,
      });
      if (!res.ok) throw new Error('Kayıt hatası');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Kaza verileri kaydedildi');
      queryClient.invalidateQueries({ queryKey: ['operations-accidents'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Kayıt başarısız');
    },
  });

  const currentData = accidentList?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kaza İstatistikleri</h1>
        <p className="text-sm text-muted-foreground">İş kazaları ve yaralanma kayıtları</p>
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
              <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
            {[
              { label: 'Ana İşveren', data: mainEmployer, setData: setMainEmployer },
              { label: 'Alt Yüklenici', data: subContractor, setData: setSubContractor },
              { label: 'Stajyer', data: intern, setData: setIntern },
            ].map(({ label, data, setData }) => (
              <div key={label} className="space-y-3">
                <h3 className="font-medium text-sm">{label}</h3>
                {['accidents', 'injuries', 'deaths', 'lostDays'].map((field) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-xs capitalize">{field.replace(/([A-Z])/g, ' $1')}</Label>
                    <Input
                      type="number"
                      value={(data as any)[field]}
                      onChange={(e) => setData({ ...data, [field]: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                ))}
              </div>
            ))}
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
          <CardContent className="text-sm space-y-2">
            <p><strong>Ana İşveren:</strong> {currentData.mainEmployerData?.accidents ?? 0} kaza, {currentData.mainEmployerData?.injuries ?? 0} yaralanma</p>
            <p><strong>Alt Yüklenici:</strong> {currentData.subContractorData?.accidents ?? 0} kaza, {currentData.subContractorData?.injuries ?? 0} yaralanma</p>
            <p><strong>Stajyer:</strong> {currentData.internData?.accidents ?? 0} kaza, {currentData.internData?.injuries ?? 0} yaralanma</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}