import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, Plus, Users, Building } from 'lucide-react';
import { toast } from 'sonner';

export default function RenovationReportSettings() {
  const queryClient = useQueryClient();
  const [newDepartment, setNewDepartment] = useState('');
  const [facilityId, setFacilityId] = useState(localStorage.getItem('activeFacilityId'));

  useEffect(() => {
    const handleFacilityChange = () => {
      setFacilityId(localStorage.getItem('activeFacilityId'));
    };
    window.addEventListener('facilityChanged', handleFacilityChange);
    return () => window.removeEventListener('facilityChanged', handleFacilityChange);
  }, []);

  // Fetch departments (using existing build management settings API)
  const { data: departments, isLoading } = useQuery({
    queryKey: ['build-departments', facilityId],
    queryFn: async () => {
      const res = await api.get(`/build-management/settings/departments?facilityId=${facilityId}`);
      if (!res.ok) throw new Error('Birimler getirilemedi');
      return res.json();
    },
    enabled: !!facilityId
  });

  const addDepartmentMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post('/build-management/settings/departments', {
        facilityId,
        name
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Birim eklenemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['build-departments'] });
      setNewDepartment('');
      toast.success('Birim başarıyla eklendi');
    },
    onError: () => {
      toast.error('Birim eklenirken bir hata oluştu');
    }
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/build-management/settings/departments/${id}`);
      if (!res.ok) throw new Error('Birim silinemedi');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['build-departments'] });
      toast.success('Birim silindi');
    },
    onError: () => {
      toast.error('Birim silinirken bir hata oluştu');
    }
  });

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartment.trim()) return;
    addDepartmentMutation.mutate(newDepartment.trim());
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu birimi silmek istediğinize emin misiniz?')) {
      deleteDepartmentMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Modül Ayarları</h1>
        <p className="text-slate-500">İnşaat Renovasyon Teslim Raporu için tanımlamalar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Sorumlu Birimler
            </CardTitle>
            <CardDescription>
              Raporlarda "Kontrol Eden Birim" olarak seçilebilecek departman ve birimlerin listesi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddDepartment} className="flex gap-2 mb-4">
              <Input
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                placeholder="Yeni birim adı (Örn: Teknik Hizmetler)"
                disabled={addDepartmentMutation.isPending}
              />
              <Button type="submit" disabled={!newDepartment.trim() || addDepartmentMutation.isPending}>
                <Plus className="w-4 h-4" />
              </Button>
            </form>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-4 text-slate-500">Yükleniyor...</div>
              ) : departments?.length === 0 ? (
                <div className="text-center py-4 text-slate-500 border border-dashed rounded-md">
                  Kayıtlı birim bulunmuyor
                </div>
              ) : (
                departments?.map((dept: any) => (
                  <div key={dept.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md border">
                    <span className="font-medium">{dept.name}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(dept.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
