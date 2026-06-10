import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, PackageSearch, Search, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function HazmatDepartmentsPage() {
  const navigate = useNavigate();
  const activeFacilityId = localStorage.getItem('activeFacilityId');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['hazmat-departments', activeFacilityId],
    queryFn: async () => {
      if (!activeFacilityId) return [];
      const res = await api.get(`/hazmat/inventory/departments?facilityId=${activeFacilityId}`);
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    enabled: !!activeFacilityId
  });

  if (!activeFacilityId) {
    return <div className="p-8 text-center text-muted-foreground">Lütfen önce bir tesis seçin.</div>;
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>;
  }

  const filteredDepartments = departments.filter((dept: any) => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Departmanlar</h1>
          <p className="text-muted-foreground">
            Tesisinize ait departmanlar ve atanmış tehlikeli madde sayıları. Detaylarını görmek istediğiniz departmana tıklayın.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20 p-4 rounded-lg border">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Departman ara..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Toplam {filteredDepartments.length} kayıt
          </div>
          <div className="flex bg-muted p-1 rounded-md">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode('list')}
              title="Liste Görünümü"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'card' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode('card')}
              title="Kart Görünümü"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {departments.length === 0 ? (
        <div className="text-center p-12 bg-muted/20 border rounded-lg">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Departman Bulunamadı</h3>
          <p className="text-muted-foreground mb-4">Bu tesise henüz hiçbir departman eklenmemiş.</p>
          <Button onClick={() => navigate('/hazmat/settings/departments')}>Ayarlardan Departman Ekle</Button>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="text-center p-12 bg-muted/20 border rounded-lg">
          <p className="text-muted-foreground">Aradığınız kritere uygun departman bulunamadı.</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((dept: any) => (
            <Card 
              key={dept.id} 
              className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50 group"
              onClick={() => navigate(`/hazmat/departments/${dept.id}`)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Building2 className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                  {dept.name}
                </CardTitle>
                <CardDescription>Aktif Departman</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <PackageSearch className="w-4 h-4" />
                    <span>Tehlikeli Madde Sayısı:</span>
                  </div>
                  <span className="font-semibold text-base">{dept._count?.inventory || 0}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg bg-card overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm text-muted-foreground border-b bg-muted/30">
            <div className="col-span-8">Departman Adı</div>
            <div className="col-span-4 text-right">Tehlikeli Madde Sayısı</div>
          </div>
          <div className="divide-y">
            {filteredDepartments.map((dept: any) => (
              <div 
                key={dept.id} 
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/10 cursor-pointer transition-colors"
                onClick={() => navigate(`/hazmat/departments/${dept.id}`)}
              >
                <div className="col-span-8 font-medium flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <Building2 className="w-4 h-4" />
                  </div>
                  {dept.name}
                </div>
                <div className="col-span-4 text-right flex items-center justify-end gap-2 text-muted-foreground">
                  <PackageSearch className="w-4 h-4" />
                  <span className="font-semibold text-foreground">{dept._count?.inventory || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
