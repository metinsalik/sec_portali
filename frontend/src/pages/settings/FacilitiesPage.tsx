import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Search, Building2, MapPin, ChevronRight, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Facility {
  id: string;
  name: string;
  isActive: boolean;
  buildings: { id: number, name: string }[];
}

const FacilitiesPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFacility, setNewFacility] = useState({ id: '', name: '' });

  const { data: facilities, isLoading } = useQuery<Facility[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: { id: string, name: string }) => {
      const res = await api.post('/settings/facilities', data);
      if (!res.ok) throw new Error('Oluşturulamadı');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      setIsModalOpen(false);
      setNewFacility({ id: '', name: '' });
    }
  });

  const filteredFacilities = facilities?.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFacility.id && newFacility.name) {
      createMutation.mutate(newFacility);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Tesis adı veya koduna göre ara..." 
            className="pl-10 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Yeni Tesis Ekle
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredFacilities?.map((facility) => (
          <Card key={facility.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center text-foreground">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-base">{facility.name}</h3>
                      <Badge variant={facility.isActive ? "outline" : "secondary"} className={cn(facility.isActive && "border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-normal")}>
                        {facility.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> {facility.id}
                      </span>
                      <span>{facility.buildings.length} Bina/Blok</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredFacilities?.length === 0 && (
          <div className="text-center py-20 bg-background rounded-xl border border-dashed">
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Tesis bulunamadı.</p>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Yeni Tesis Ekle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tesis Kodu</label>
              <Input 
                placeholder="Örn: TR-06" 
                value={newFacility.id} 
                onChange={e => setNewFacility({...newFacility, id: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tesis Adı</label>
              <Input 
                placeholder="Örn: Ankara Fabrika" 
                value={newFacility.name} 
                onChange={e => setNewFacility({...newFacility, name: e.target.value})}
                required
              />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Vazgeç</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FacilitiesPage;
