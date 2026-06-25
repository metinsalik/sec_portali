import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const BinaToruOlustur = () => {
  const navigate = useNavigate();
  const [ad, setAd] = useState('');
  const [tarih, setTarih] = useState('');
  const [birimler, setBirimler] = useState<any[]>([]);
  const [kisiler, setKisiler] = useState<any[]>([]);
  const [sorular, setSorular] = useState<any[]>([]);
  
  const [seciliBirimler, setSeciliBirimler] = useState<number[]>([]);
  const [seciliKisiler, setSeciliKisiler] = useState<number[]>([]);
  const [seciliSorular, setSeciliSorular] = useState<number[]>([]);
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const facilityId = localStorage.getItem('activeFacilityId');
    if (!facilityId) {
      toast.error('Lütfen sol menüden tesis seçin.');
      return;
    }

    try {
      const [birimRes, kisiRes, soruRes] = await Promise.all([
        api.get(`/bina-turu/ayarlar/sorumlu-birim?facilityId=${facilityId}`),
        api.get(`/bina-turu/ayarlar/sorumlu-kisi?facilityId=${facilityId}`),
        api.get(`/bina-turu/soru-bankasi?facilityId=${facilityId}`)
      ]);
      setBirimler(await birimRes.json());
      setKisiler(await kisiRes.json());
      setSorular(await soruRes.json());
    } catch (err) {
      toast.error('Veriler alınamadı.');
    }
  };

  const handleToggleSoru = (soruId: number) => {
    setSeciliSorular(prev => 
      prev.includes(soruId) ? prev.filter(id => id !== soruId) : [...prev, soruId]
    );
  };

  const handleToggleAllSorular = () => {
    if (seciliSorular.length === sorular.length) {
      setSeciliSorular([]);
    } else {
      setSeciliSorular(sorular.map(s => s.id));
    }
  };

  const handleSave = async () => {
    if (!ad || !tarih || seciliSorular.length === 0) {
      toast.error('Lütfen zorunlu alanları (Ad, Tarih, Soru) doldurun.');
      return;
    }
    const facilityId = localStorage.getItem('activeFacilityId');

    setSaving(true);
    try {
      const payload = {
        facilityId,
        ad,
        baslangicTarihi: tarih,
        bitisTarihi: tarih,
        sorumluBirimIds: seciliBirimler,
        sorumluKisiIds: seciliKisiler,
        soruIds: seciliSorular
      };
      await api.post('/bina-turu/turler', payload);
      toast.success('Tur başarıyla oluşturuldu.');
      navigate('/bina-turu/turler');
    } catch (err) {
      toast.error('Tur oluşturulurken hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  // Kategorilere göre gruplama
  const kategoriliSorular = sorular.reduce((acc, soru) => {
    const katAd = soru.kategori?.ad || 'Diğer';
    if (!acc[katAd]) acc[katAd] = [];
    acc[katAd].push(soru);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Yeni Bina Turu Oluştur</h1>
          <p className="text-muted-foreground">Denetim detaylarını girin ve soruları seçin.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Oluşturuluyor...' : 'Turu Oluştur'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Genel Bilgiler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Denetim Adı</label>
              <Input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Örn: Haziran Ayı Genel Denetim" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Denetim Tarihi</label>
              <Input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Sorumlu Birimler (Çoklu Seçim)</label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                {birimler.map(b => (
                  <div key={b.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`birim-${b.id}`} 
                      checked={seciliBirimler.includes(b.id)}
                      onCheckedChange={(checked) => {
                        setSeciliBirimler(prev => checked ? [...prev, b.id] : prev.filter(id => id !== b.id));
                      }}
                    />
                    <label htmlFor={`birim-${b.id}`} className="text-sm">{b.ad}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Sorumlu Kişiler (Çoklu Seçim)</label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                {kisiler.map(k => (
                  <div key={k.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`kisi-${k.id}`} 
                      checked={seciliKisiler.includes(k.id)}
                      onCheckedChange={(checked) => {
                        setSeciliKisiler(prev => checked ? [...prev, k.id] : prev.filter(id => id !== k.id));
                      }}
                    />
                    <label htmlFor={`kisi-${k.id}`} className="text-sm">{k.ad} ({k.birim?.ad})</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Soru Seti Seçimi</CardTitle>
            <CardDescription>
              Denetimde sorulacak soruları kategori bazlı veya tek tek seçebilirsiniz. ({seciliSorular.length} / {sorular.length} seçildi)
            </CardDescription>
          </div>
          <Button variant="outline" onClick={handleToggleAllSorular}>
            {seciliSorular.length === sorular.length ? 'Tüm Seçimi Kaldır' : 'Tümünü Seç'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.keys(kategoriliSorular).map(kategori => (
              <div key={kategori}>
                <h3 className="font-semibold text-lg mb-3 bg-muted p-2 rounded">{kategori}</h3>
                <div className="space-y-3">
                  {kategoriliSorular[kategori].map(soru => (
                    <div key={soru.id} className="flex items-start space-x-3 border-b pb-2">
                      <Checkbox 
                        id={`soru-${soru.id}`} 
                        checked={seciliSorular.includes(soru.id)}
                        onCheckedChange={() => handleToggleSoru(soru.id)}
                        className="mt-1"
                      />
                      <div>
                        <label htmlFor={`soru-${soru.id}`} className="text-sm font-medium cursor-pointer">
                          {soru.kriter}
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ana Grup: {soru.anaGrup?.ad} | Alan: {soru.denetlenenAlan?.ad}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BinaToruOlustur;
