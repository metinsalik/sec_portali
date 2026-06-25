import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

const AnaGrupYonetimi = () => {
  const [data, setData] = useState<any[]>([]);
  const [ad, setAd] = useState('');
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const facilityId = localStorage.getItem('activeFacilityId');
    if (!facilityId) return;
    try {
      const res = await api.get(`/bina-turu/ayarlar/ana-grup?facilityId=${facilityId}`);
      setData(await res.json());
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
    if (!ad) return;

    try {
      if (editId) {
        await api.put(`/bina-turu/ayarlar/ana-grup/${editId}`, { ad });
        toast.success('Ana Grup güncellendi.');
      } else {
        await api.post(`/bina-turu/ayarlar/ana-grup`, { facilityId, ad });
        toast.success('Ana Grup eklendi.');
      }
      setAd('');
      setEditId(null);
      fetchData();
    } catch (err) {
      toast.error('Kayıt başarısız.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/bina-turu/ayarlar/ana-grup/${id}`);
      toast.success('Ana Grup silindi.');
      fetchData();
    } catch (err) {
      toast.error('Silme başarısız.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ana Grup Yönetimi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6">
          <Input 
            placeholder="Ana Grup Adı" 
            value={ad} 
            onChange={(e) => setAd(e.target.value)}
          />
          <Button onClick={handleSave}>
            {editId ? <Edit2 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {editId ? 'Güncelle' : 'Ekle'}
          </Button>
          {editId && (
            <Button variant="outline" onClick={() => { setEditId(null); setAd(''); }}>İptal</Button>
          )}
        </div>

        <div className="border rounded-md">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 font-medium">Ad</th>
                <th className="p-3 font-medium text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3">{item.ad}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditId(item.id); setAd(item.ad); }}>
                      <Edit2 className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={2} className="p-4 text-center text-muted-foreground">Kayıt bulunamadı.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnaGrupYonetimi;
