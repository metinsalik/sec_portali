import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserPlus, Search, User as UserIcon, ShieldCheck, Loader2, Building2, LayoutGrid, List, Archive, CheckCircle2, ChevronRight, Edit2, Eye, Mail, Phone, MapPin, Building } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from '@/components/ui/separator';

interface User {
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  department?: string;
  title?: string;
  isActive: boolean;
  roles: { role: { id: number; name: string } }[];
  facilities: { facilityId: string; facility: { id: string; name: string } }[];
}

interface Role {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

interface Facility {
  id: string;
  name: string;
  dangerClass: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Yönetici',
  management: 'Yönetim',
  user: 'Kullanıcı',
  safety: 'Uzman (Safety)',
  doctor: 'Hekim (Doctor)',
  dsp: 'DSP',
};

const UsersPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [facilityFilter, setFacilityFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');

  // Form state
  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    department: '',
    title: '',
    roles: [] as string[],
    facilities: [] as string[],
  });

  // Queries
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/settings/users');
      if (!res.ok) throw new Error('Kullanıcılar yüklenemedi');
      return res.json() as Promise<User[]>;
    },
  });

  const allUsers = users || [];

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/settings/roles');
      if (!res.ok) throw new Error('Roller yüklenemedi');
      return res.json();
    },
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/settings/definitions/departments');
      if (!res.ok) throw new Error('Departmanlar yüklenemedi');
      return res.json();
    },
  });

  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) throw new Error('Tesisler yüklenemedi');
      return res.json();
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/settings/users', form);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Hata oluştu');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Kullanıcı oluşturuldu');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put(`/settings/users/${editingUser?.username}`, form);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Hata oluştu');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Kullanıcı güncellendi');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ username, isActive }: { username: string; isActive: boolean }) => {
      const res = await api.put(`/settings/users/${username}`, { isActive });
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Durum güncellendi');
    },
  });

  const addFacilityMutation = useMutation({
    mutationFn: async ({ username, facilityId }: { username: string; facilityId: string }) => {
      const res = await api.post(`/settings/users/${username}/facilities`, { facilityId, action: 'add' });
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Tesis eklendi');
    },
  });

  const removeFacilityMutation = useMutation({
    mutationFn: async ({ username, facilityId }: { username: string; facilityId: string }) => {
      const res = await api.post(`/settings/users/${username}/facilities`, { facilityId, action: 'remove' });
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Tesis kaldırıldı');
    },
  });

  const filteredUsers = users?.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.roles.some(r => r.role.name === roleFilter);
    const matchesFacility = facilityFilter === 'all' || u.facilities.some(f => f.facilityId === facilityFilter);
    const matchesStatus = activeTab === 'active' ? u.isActive : !u.isActive;
    return matchesSearch && matchesRole && matchesFacility && matchesStatus;
  }).sort((a, b) => a.fullName.localeCompare(b.fullName, 'tr'));

  // Rolere göre gruplama (Kullanıcının ilk rolünü grup olarak kabul edelim)
  const groupedUsers = filteredUsers?.reduce((acc, user) => {
    const primaryRole = user.roles[0]?.role.name || 'user';
    if (!acc[primaryRole]) acc[primaryRole] = [];
    acc[primaryRole].push(user);
    return acc;
  }, {} as Record<string, User[]>);

  const sortedRoles = Object.keys(groupedUsers || {}).sort((a, b) => {
    // Admin her zaman en üstte
    if (a === 'admin') return -1;
    if (b === 'admin') return 1;
    return (ROLE_LABELS[a] || a).localeCompare(ROLE_LABELS[b] || b, 'tr');
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setForm({ username: '', fullName: '', email: '', phone: '', department: '', title: '', roles: [], facilities: [] });
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      fullName: user.fullName,
      email: user.email || '',
      phone: user.phone || '',
      department: user.department || '',
      title: user.title || '',
      roles: user.roles.map(r => r.role.name),
      facilities: user.facilities.map(f => f.facilityId),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs for Active/Archive */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 -mx-6 px-6">
        <div className="flex gap-8">
          <button 
            onClick={() => setActiveTab('active')}
            className={cn(
              "px-1 py-4 text-sm font-bold transition-all relative",
              activeTab === 'active' ? "text-primary" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Aktif Kullanıcılar
            {activeTab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('archive')}
            className={cn(
              "px-1 py-4 text-sm font-bold transition-all relative",
              activeTab === 'archive' ? "text-primary" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Arşiv
            {activeTab === 'archive' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Kullanıcı Yönetimi</h1>
            <p className="text-slate-500 text-sm mt-1">Sistem erişimi olan tüm personelleri yönetin ve yetkilendirin.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 h-11 rounded-xl px-6 font-medium shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <UserPlus className="w-5 h-5 mr-2" /> Kullanıcı Ekle
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="İsim veya kullanıcı adına göre ara..." 
              className="pl-10 bg-slate-50 dark:bg-slate-800/50 border-none h-11 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px] bg-slate-50 dark:bg-slate-800/50 border-none h-11 rounded-xl">
                <SelectValue placeholder="Rol Filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Roller</SelectItem>
                {roles.map(r => <SelectItem key={r.id} value={r.name}>{ROLE_LABELS[r.name] || r.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={facilityFilter} onValueChange={setFacilityFilter}>
              <SelectTrigger className="w-[180px] bg-slate-50 dark:bg-slate-800/50 border-none h-11 rounded-xl">
                <SelectValue placeholder="Tesis Filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tesisler</SelectItem>
                {facilities.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Separator orientation="vertical" className="h-8 mx-1 hidden md:block" />

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('list')}
                className={cn("h-9 w-10 p-0 rounded-lg transition-all", viewMode === 'list' ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-slate-500")}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('grid')}
                className={cn("h-9 w-10 p-0 rounded-lg transition-all", viewMode === 'grid' ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-slate-500")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-[400px]">
        {filteredUsers && filteredUsers.length > 0 ? (
          viewMode === 'list' ? (
            <Accordion type="multiple" defaultValue={sortedRoles} className="space-y-4">
              {sortedRoles.map(roleName => (
                <AccordionItem key={roleName} value={roleName} className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm border-b-0">
                  <AccordionTrigger className="hover:no-underline px-6 py-4 bg-slate-50/40 dark:bg-slate-800/40 group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-primary shadow-sm border border-slate-200/60 dark:border-slate-700 group-hover:scale-105 transition-transform">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-base">{ROLE_LABELS[roleName] || roleName}</span>
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">{groupedUsers![roleName].length} Kullanıcı</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-0 pb-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-slate-50/20 dark:bg-slate-900/20 border-t border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kullanıcı Bilgisi</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departman / Ünvan</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tesisler</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Durum</th>
                            <th className="px-6 py-3 text-right px-8 text-[10px] font-bold text-slate-400 uppercase tracking-wider">İşlemler</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {groupedUsers![roleName].map((user) => (
                            <tr key={user.username} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-700 group-hover:text-primary transition-colors">
                                    <UserIcon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{user.fullName}</div>
                                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">{user.username}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-xs">
                                  <div className="font-medium text-slate-700 dark:text-slate-300">{user.department || '-'}</div>
                                  <div className="text-slate-500">{user.title || '-'}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {user.facilities.length > 0 ? (
                                    user.facilities.map(f => (
                                      <Badge key={f.facilityId} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-[9px] py-0 px-1.5 border-none">
                                        {f.facility.name}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">Erişim Yok</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-1.5 h-1.5 rounded-full", user.isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-300")} />
                                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{user.isActive ? "Aktif" : "Pasif"}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => toggleUserStatusMutation.mutate({ username: user.username, isActive: !user.isActive })}
                                    className={cn(
                                      "w-8 h-8 rounded-lg transition-colors",
                                      user.isActive ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                    )}
                                    title={user.isActive ? "Pasife Al (Arşivle)" : "Aktife Al"}
                                  >
                                    {user.isActive ? <Archive className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => openEditModal(user)} className="w-8 h-8 rounded-lg hover:bg-primary/5 text-slate-400 hover:text-primary transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
                <Card key={user.username} className="hover:shadow-xl transition-all border border-slate-200/60 shadow-sm group overflow-hidden rounded-2xl bg-white dark:bg-slate-900 flex flex-col hover:-translate-y-1 duration-300">
                   <CardHeader className="p-5 pb-0">
                     <div className="flex justify-between items-start">
                       <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-primary/70 border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
                         <UserIcon className="w-6 h-6" />
                       </div>
                       <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => toggleUserStatusMutation.mutate({ username: user.username, isActive: !user.isActive })}
                          className={cn(
                            "w-8 h-8 rounded-lg transition-colors",
                            user.isActive ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          )}
                          title={user.isActive ? "Pasife Al (Arşivle)" : "Aktife Al"}
                        >
                          {user.isActive ? <Archive className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </Button>
                        <Badge variant={user.isActive ? "outline" : "secondary"} className={cn(
                          "font-medium text-[10px] px-2 py-0",
                          user.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        )}>
                          {user.isActive ? "Aktif" : "Pasif"}
                        </Badge>
                       </div>
                     </div>
                   </CardHeader>
                   <CardContent className="p-5 flex-1 flex flex-col">
                      <div className="mb-4">
                         <h3 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{user.fullName}</h3>
                         <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">{user.username}</p>
                      </div>
                      
                      <div className="space-y-3 mb-6 flex-1">
                         <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                           <div className="w-7 h-7 bg-primary/5 rounded-lg flex items-center justify-center text-primary/60">
                             <ShieldCheck className="w-3.5 h-3.5" />
                           </div>
                           <span className="line-clamp-1">{user.roles.map(r => ROLE_LABELS[r.role.name] || r.role.name).join(', ')}</span>
                         </div>
                         <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                           <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                             <Building className="w-3.5 h-3.5" />
                           </div>
                           <span className="line-clamp-1">{user.department || '-'}</span>
                         </div>
                         <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                           <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                             <Building2 className="w-3.5 h-3.5" />
                           </div>
                           <span className="line-clamp-1">{user.facilities.length} Tesis Erişimi</span>
                         </div>
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                         <Button onClick={() => openEditModal(user)} className="flex-1 bg-slate-50 hover:bg-primary hover:text-white text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-primary h-10 rounded-xl transition-all font-medium text-xs">
                           Düzenle
                         </Button>
                      </div>
                   </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-24 bg-background/50 rounded-3xl border-2 border-dashed border-muted">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Archive className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Kullanıcı Bulunamadı</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">Bu bölümde gösterilecek kullanıcı bulunmuyor.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {/* Kişisel Bilgiler */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Kullanıcı Adı *</label>
                <Input
                  placeholder="ör: metin.salik"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  disabled={!!editingUser}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ad Soyad *</label>
                <Input
                  placeholder="Ör: Metin Salık"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">E-posta *</label>
                <Input
                  type="email"
                  placeholder="metin@ornek.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefon *</label>
                <Input
                  type="tel"
                  placeholder="0532..."
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Departman *</label>
                <Select
                  value={form.department}
                  onValueChange={(v) => setForm({ ...form, department: v || '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Departman seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.name}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ünvan *</label>
                <Input
                  placeholder="Ör: İş Güvenliği Uzmanı"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Roller */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Roller *</label>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      const newRoles = form.roles.includes(role.name)
                        ? form.roles.filter((r) => r !== role.name)
                        : [...form.roles, role.name];
                      setForm({ ...form, roles: newRoles });
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      form.roles.includes(role.name)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                    }`}
                  >
                    {ROLE_LABELS[role.name] || role.name}
                  </button>
                ))}
              </div>
              {form.roles.length === 0 && (
                <p className="text-xs text-muted-foreground">En az bir rol seçilmelidir.</p>
              )}
            </div>

            {/* Departman Hatırlatıcı */}
            {departments.length === 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg">
                <p className="text-xs text-amber-800 dark:text-amber-400 flex gap-2">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Sistemde departman bulunamadı. Kullanıcı eklemeden önce <b>Tanım Yönetimi</b> sayfasından departman eklemelisiniz.</span>
                </p>
              </div>
            )}

            {/* Tesisler */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tesis Erişimi</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {facilities.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      const newFacilities = form.facilities.includes(f.id)
                        ? form.facilities.filter((id) => id !== f.id)
                        : [...form.facilities, f.id];
                      setForm({ ...form, facilities: newFacilities });
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      form.facilities.includes(f.id)
                        ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700'
                        : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg border">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1.5 align-text-bottom text-foreground" />
                Zorunlu alanlar: Kullanıcı adı, ad soyad, e-posta, telefon, departman ve ünvan.
                Kullanıcı sisteme giriş yaptığında kendi tesislerini görebilir.
              </p>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={closeModal}>Vazgeç</Button>
              <Button
                type="submit"
                disabled={
                  !form.username || !form.fullName || !form.email || !form.phone ||
                  !form.department || !form.title || form.roles.length === 0 ||
                  createMutation.isPending || updateMutation.isPending
                }
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingUser ? 'Güncelle' : 'Oluştur'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;