import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

const SoruBankasi = () => {
  const [data, setData] = useState<any[]>([]);
  
  // Lookups
  const [anaGruplar, setAnaGruplar] = useState<any[]>([]);
  const [denetlenenAlanlar, setDenetlenenAlanlar] = useState<any[]>([]);
  const [kategoriler, setKategoriler] = useState<any[]>([]);

  // Form
  const [kriter, setKriter] = useState('');
  const [anaGrupId, setAnaGrupId] = useState('');
  const [denetlenenAlanId, setDenetlenenAlanId] = useState('');
  const [kategoriId, setKategoriId] = useState('');
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    fetchLookups();
    fetchData();
  }, []);

  const fetchLookups = async () => {
    const facilityId = localStorage.getItem('activeFacilityId');
    if (!facilityId) return;
    try {
      const [agRes, daRes, katRes] = await Promise.all([
        api.get(`/bina-turu/ayarlar/ana-grup?facilityId=${facilityId}`),
        api.get(`/bina-turu/ayarlar/denetlenen-alan?facilityId=${facilityId}`),
        api.get(`/bina-turu/ayarlar/kategori?facilityId=${facilityId}`)
      ]);
      setAnaGruplar(await agRes.json());
      setDenetlenenAlanlar(await daRes.json());
      setKategoriler(await katRes.json());
    } catch (err) {
      toast.error('Ayarlar alınamadı.');
    }
  };

  const fetchData = async () => {
    const facilityId = localStorage.getItem('activeFacilityId');
    if (!facilityId) return;
    try {
      const res = await api.get(`/bina-turu/soru-bankasi?facilityId=${facilityId}`);
      setData(await res.json());
    } catch (err) {
      toast.error('Sorular alınamadı.');
    }
  };

  const handleSave = async () => {
    const facilityId = localStorage.getItem('activeFacilityId');
    if (!facilityId) {
      toast.error('Lütfen sol menüden işlem yapmak istediğiniz tesisi seçin.');
      return;
    }
    if (!kriter || !anaGrupId || !denetlenenAlanId || !kategoriId) {
      toast.error('Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      if (editId) {
        await api.put(`/bina-turu/soru-bankasi/${editId}`, { 
          kriter, anaGrupId: Number(anaGrupId), denetlenenAlanId: Number(denetlenenAlanId), kategoriId: Number(kategoriId) 
        });
        toast.success('Soru güncellendi.');
      } else {
        await api.post(`/bina-turu/soru-bankasi`, { 
          facilityId, kriter, anaGrupId: Number(anaGrupId), denetlenenAlanId: Number(denetlenenAlanId), kategoriId: Number(kategoriId) 
        });
        toast.success('Soru eklendi.');
      }
      
      setKriter('');
      setAnaGrupId('');
      setDenetlenenAlanId('');
      setKategoriId('');
      setEditId(null);
      fetchData();
    } catch (err) {
      toast.error('Kayıt başarısız.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/bina-turu/soru-bankasi/${id}`);
      toast.success('Soru silindi.');
      fetchData();
    } catch (err) {
      toast.error('Silme başarısız.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Soru Bankası Yönetimi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 mb-6">
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={anaGrupId}
            onChange={(e) => setAnaGrupId(e.target.value)}
          >
            <option value="">Ana Grup Seçin</option>
            {anaGruplar.map((ag) => (
              <option key={ag.id} value={ag.id}>{ag.ad}</option>
            ))}
          </select>

          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={denetlenenAlanId}
            onChange={(e) => setDenetlenenAlanId(e.target.value)}
          >
            <option value="">Alan Seçin</option>
            {denetlenenAlanlar.map((da) => (
              <option key={da.id} value={da.id}>{da.ad}</option>
            ))}
          </select>

          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={kategoriId}
            onChange={(e) => setKategoriId(e.target.value)}
          >
            <option value="">Kategori Seçin</option>
            {kategoriler.map((kat) => (
              <option key={kat.id} value={kat.id}>{kat.ad}</option>
            ))}
          </select>

          <Input 
            placeholder="Soru/Kriter Metni" 
            value={kriter} 
            onChange={(e) => setKriter(e.target.value)}
            className="lg:col-span-1"
          />
          
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              {editId ? <Edit2 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {editId ? 'Güncelle' : 'Ekle'}
            </Button>
            {editId && (
              <Button variant="outline" onClick={() => { setEditId(null); setKriter(''); setAnaGrupId(''); setDenetlenenAlanId(''); setKategoriId(''); }}>İptal</Button>
            )}
          </div>
        </div>

        <div className="border rounded-md overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 font-medium">Soru / Kriter</th>
                <th className="p-3 font-medium w-48">Ana Grup</th>
                <th className="p-3 font-medium w-48">Denetlenen Alan</th>
                <th className="p-3 font-medium w-48">Kategori</th>
                <th className="p-3 font-medium text-right w-24">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3 whitespace-pre-wrap">{item.kriter}</td>
                  <td className="p-3">{item.anaGrup?.ad || '-'}</td>
                  <td className="p-3">{item.denetlenenAlan?.ad || '-'}</td>
                  <td className="p-3">{item.kategori?.ad || '-'}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => { 
                      setEditId(item.id); 
                      setKriter(item.kriter);
                      setAnaGrupId(item.anaGrupId?.toString() || '');
                      setDenetlenenAlanId(item.denetlenenAlanId?.toString() || '');
                      setKategoriId(item.kategoriId?.toString() || '');
                    }}>
                      <Edit2 className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">Henüz soru eklenmemiş.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default SoruBankasi;
