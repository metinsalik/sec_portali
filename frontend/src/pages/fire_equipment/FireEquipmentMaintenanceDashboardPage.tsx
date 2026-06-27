import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PenTool, CheckCircle, AlertTriangle, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export default function FireEquipmentMaintenanceDashboardPage() {
  const facilityId = localStorage.getItem('activeFacilityId');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL'); // ALL, OVERDUE, UPCOMING
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: equipmentList, isLoading } = useQuery({
    queryKey: ['fire-equipment', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const res = await api.get(`/fire-equipment/equipment/${facilityId}`);
      if (!res.ok) throw new Error('Failed to fetch equipment');
      return res.json();
    },
    enabled: !!facilityId
  });

  const { data: categories } = useQuery({
    queryKey: ['fire-categories'],
    queryFn: async () => {
      const res = await api.get('/fire-equipment/categories');
      return res.json();
    }
  });

  const getMaintenanceStatus = (dateString: string | null) => {
    if (!dateString) return { status: 'UNKNOWN', text: 'Tarih Yok', color: 'text-gray-500' };
    const nextDate = new Date(dateString);
    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'OVERDUE', text: `Süresi Geçti (${Math.abs(diffDays)} gün)`, color: 'text-red-600 bg-red-50' };
    if (diffDays <= 30) return { status: 'UPCOMING', text: `Yaklaşıyor (${diffDays} gün)`, color: 'text-orange-600 bg-orange-50' };
    return { status: 'OK', text: nextDate.toLocaleDateString('tr-TR'), color: 'text-green-600 bg-green-50' };
  };

  const activeEquipment = equipmentList?.filter((e: any) => e.status !== 'HURDA' && e.status !== 'KULLANIM_DISI') || [];

  const categoryFilteredEquipment = activeEquipment.filter((item: any) => {
    const matchesSearch = 
      item.equipmentNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (item.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (selectedCategory !== 'all') {
      const matchCategory = item.categoryId === selectedCategory || item.category?.parentId === selectedCategory;
      if (!matchCategory) return false;
    }

    return true;
  });

  const filteredEquipment = categoryFilteredEquipment.filter((item: any) => {
    const status = getMaintenanceStatus(item.nextMaintenanceDate).status;
    if (filter === 'OVERDUE' && status !== 'OVERDUE') return false;
    if (filter === 'UPCOMING' && status !== 'UPCOMING') return false;

    return true;
  });

  if (!facilityId) {
    return <div className="p-8 text-center text-muted-foreground">Lütfen bir tesis seçin.</div>;
  }

  const total = categoryFilteredEquipment.length;
  let overdueCount = 0;
  let upcomingCount = 0;
  let okCount = 0;
  
  let uygunCount = 0;
  let sartliUygunCount = 0;
  let uygunDegilCount = 0;
  let noMaintenanceCount = 0;

  categoryFilteredEquipment.forEach((item: any) => {
    const status = getMaintenanceStatus(item.nextMaintenanceDate).status;
    if (status === 'OVERDUE') overdueCount++;
    else if (status === 'UPCOMING') upcomingCount++;
    else okCount++;

    const lastResult = item.maintenances?.[0]?.result;
    if (lastResult === 'UYGUN') uygunCount++;
    else if (lastResult === 'SARTLI_UYGUN') sartliUygunCount++;
    else if (lastResult === 'UYGUN_DEGIL') uygunDegilCount++;
    else noMaintenanceCount++;
  });

  const pieDataStatus = [
    { name: 'Süresi Geçen', value: overdueCount, color: '#ef4444' },
    { name: 'Yaklaşan', value: upcomingCount, color: '#f97316' },
    { name: 'Zamanı Var', value: okCount, color: '#22c55e' }
  ].filter(d => d.value > 0);

  const pieDataResult = [
    { name: 'Uygun', value: uygunCount, color: '#22c55e' },
    { name: 'Şartlı Uygun', value: sartliUygunCount, color: '#eab308' },
    { name: 'Uygun Değil', value: uygunDegilCount, color: '#ef4444' },
    { name: 'Kayıt Yok', value: noMaintenanceCount, color: '#94a3b8' }
  ].filter(d => d.value > 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <PenTool className="w-8 h-8 text-blue-500" /> Bakım ve Kontroller
          </h1>
          <p className="text-muted-foreground mt-1">Ekipmanların periyodik bakım tarihlerini takip edin ve kayıt girin.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900 border-blue-100 dark:border-blue-900">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Aktif Ekipman</p>
              <h3 className="text-3xl font-black text-blue-600 dark:text-blue-400">{total}</h3>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full"><PenTool className="w-5 h-5 text-blue-600 dark:text-blue-300" /></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-slate-900 border-red-100 dark:border-red-900">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Süresi Geçen Bakım</p>
              <h3 className="text-3xl font-black text-red-600 dark:text-red-400">{overdueCount}</h3>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full"><AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-300" /></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-slate-900 border-orange-100 dark:border-orange-900">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Yaklaşan (30 Gün)</p>
              <h3 className="text-3xl font-black text-orange-600 dark:text-orange-400">{upcomingCount}</h3>
            </div>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-full"><AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-300" /></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-50 to-white dark:from-rose-950 dark:to-slate-900 border-rose-100 dark:border-rose-900">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Uygun Değil</p>
              <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400">{uygunDegilCount}</h3>
            </div>
            <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-full"><AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-300" /></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-4">Bakım Zaman Çizelgesi</h3>
            <div className="h-[250px] w-full">
              {pieDataStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieDataStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                      {pieDataStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                 <div className="h-full flex items-center justify-center text-muted-foreground">Veri Yok</div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-4">Son Bakım Sonuçları</h3>
            <div className="h-[250px] w-full">
              {pieDataResult.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieDataResult} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                      {pieDataResult.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                 <div className="h-full flex items-center justify-center text-muted-foreground">Veri Yok</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Button variant={filter === 'ALL' ? 'default' : 'outline'} onClick={() => setFilter('ALL')}>Tümü</Button>
          <Button variant={filter === 'OVERDUE' ? 'destructive' : 'outline'} onClick={() => setFilter('OVERDUE')}>
            <AlertTriangle className="w-4 h-4 mr-2" /> Süresi Geçenler
          </Button>
          <Button variant={filter === 'UPCOMING' ? 'secondary' : 'outline'} className={filter === 'UPCOMING' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : ''} onClick={() => setFilter('UPCOMING')}>
            Yaklaşanlar
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <select 
            className="flex h-9 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">Tüm Kategoriler</option>
            {categories?.filter((c: any) => !c.parentId)?.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ekipman No veya Kategori..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card className="shadow-sm border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="w-full h-16" />)}
            </div>
          ) : filteredEquipment.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <p>Belirtilen kriterlere uygun ekipman bulunamadı.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-medium">Ekipman No</th>
                    <th className="px-6 py-4 font-medium">Kategori</th>
                    <th className="px-6 py-4 font-medium">Lokasyon</th>
                    <th className="px-6 py-4 font-medium">Sonraki Bakım</th>
                    <th className="px-6 py-4 font-medium text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEquipment.map((item: any) => {
                    const statusInfo = getMaintenanceStatus(item.nextMaintenanceDate);
                    return (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium">{item.equipmentNo}</td>
                        <td className="px-6 py-4">{item.category?.name || '-'}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {item.location ? `${item.location.building}${item.location.floor ? ` / ${item.location.floor}` : ''}${item.location.department ? ` - ${item.location.department}` : ''}` : 'Lokasyon Yok'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8"
                            onClick={() => navigate(`/fire-equipment/maintenance/${item.id}`)}
                          >
                            <Plus className="w-4 h-4 mr-1" /> Bakım Gir
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
