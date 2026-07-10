import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';

export default function HazmatKitItemsPage() {
  const facilityId = localStorage.getItem('activeFacilityId');
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', type: '' });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['hazmat-master-items', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const res = await api.get(`/settings/hazmat-kit-items?facilityId=${facilityId}`);
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    enabled: !!facilityId
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/settings/hazmat-kit-items', { ...data, facilityId });
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-master-items'] });
      setForm({ name: '', type: '' });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/settings/hazmat-kit-items/${id}`);
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-master-items'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addItemMutation.mutate(form);
  };

  if (!facilityId) {
    return <div className="p-8 text-center">Lütfen bir tesis seçin.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Kit Malzemeleri (Master Veri)</h1>
        <p className="text-muted-foreground">Dökülme-Saçılma kitlerinde kullanılacak tüm malzemeleri buradan tanımlayabilirsiniz.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Yeni Malzeme</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Malzeme Adı</Label>
                  <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Örn. Biyolojik Absorban" />
                </div>
                <div className="space-y-2">
                  <Label>Türü / Kategorisi</Label>
                  <Input value={form.type} onChange={e => setForm({...form, type: e.target.value})} placeholder="Örn. Absorban, KKD" />
                </div>
                <Button type="submit" className="w-full" disabled={!form.name.trim() || addItemMutation.isPending}>
                  <Plus className="w-4 h-4 mr-2" /> Ekle
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Kayıtlı Malzemeler ({items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-medium">
                    <tr>
                      <th className="p-3 border-b">Malzeme Adı</th>
                      <th className="p-3 border-b">Türü</th>
                      <th className="p-3 border-b text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any) => (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3 font-medium">{item.name}</td>
                        <td className="p-3 text-muted-foreground">{item.type || '-'}</td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteItemMutation.mutate(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-6 text-center text-muted-foreground">Kayıtlı malzeme bulunamadı.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
