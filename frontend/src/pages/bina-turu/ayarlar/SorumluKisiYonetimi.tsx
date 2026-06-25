import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

const SorumluKisiYonetimi = () => {
  const [data, setData] = useState<any[]>([]);
  const [birimler, setBirimler] = useState<any[]>([]);
  const [ad, setAd] = useState('');
  const [birimId, setBirimId] = useState('');
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const facilityId = localStorage.getItem('activeFacilityId');
    if (!facilityId) return;
    try {
      const resData = await api.get(`/bina-turu/ayarlar/sorumlu-kisi?facilityId=${facilityId}`);
      setData(await resData.json());
      const resBirimler = await api.get(`/bina-turu/ayarlar/sorumlu-birim?facilityId=${facilityId}`);
      setBirimler(await resBirimler.json());
    } catch (err) {
      toast.error('Veriler alınamadı.');
    }
  };

  const handleSave = async () => {
    const facilityId = localStorage.getItem('activeFacilityId');
    if (!facilityId) {
      toast.error('Lütfen sol menüden işlem yapmak istediğiniz tesisi seçin.');
      return;
    }
    if (!ad || !birimId) return;

    try {
      if (editId) {
        await api.put(`/bina-turu/ayarlar/sorumlu-kisi/${editId}`, { ad, birimId });
        toast.success('Sorumlu Kişi güncellendi.');
      } else {
        await api.post(`/bina-turu/ayarlar/sorumlu-kisi`, { facilityId, ad, birimId });
        toast.success('Sorumlu Kişi eklendi.');
      }
      setAd('');
      setBirimId('');
      setEditId(null);
      fetchData();
    } catch (err) {
      toast.error('Kayıt başarısız.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/bina-turu/ayarlar/sorumlu-kisi/${id}`);
      toast.success('Sorumlu Kişi silindi.');
      fetchData();
    } catch (err) {
      toast.error('Silme başarısız.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sorumlu Kişi Yönetimi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6">
          <Input 
            placeholder="Kişi Adı Soyadı" 
            value={ad} 
            onChange={(e) => setAd(e.target.value)}
          />
          <Select value={birimId} onValueChange={setBirimId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Birim Seçin" />
            </SelectTrigger>
            <SelectContent>
              {birimler.map((b) => (
                <SelectItem key={b.id} value={b.id.toString()}>{b.ad}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSave}>
            {editId ? <Edit2 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {editId ? 'Güncelle' : 'Ekle'}
          </Button>
          {editId && (
            <Button variant="outline" onClick={() => { setEditId(null); setAd(''); setBirimId(''); }}>İptal</Button>
          )}
        </div>

        <div className="border rounded-md">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 font-medium">Ad</th>
                <th className="p-3 font-medium">Birim</th>
                <th className="p-3 font-medium text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3">{item.ad}</td>
                  <td className="p-3">{item.birim?.ad}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditId(item.id); setAd(item.ad); setBirimId(item.birimId.toString()); }}>
                      <Edit2 className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">Kayıt bulunamadı.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default SorumluKisiYonetimi;
