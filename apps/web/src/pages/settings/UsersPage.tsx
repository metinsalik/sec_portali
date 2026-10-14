import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  UserPlus,
  Search,
  User as UserIcon,
  ShieldCheck,
  Building2,
  LayoutGrid,
  List,
  Archive,
  CheckCircle2,
  Edit2,
  Building,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  modules: { module: { id: number; code: string; name: string } }[];
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

interface Module {
  id: number;
  code: string;
  name: string;
  description: string;
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [facilityFilter, setFacilityFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');

  // Queries
  const { data: users, isLoading: usersLoading } = useQuery({
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

  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) throw new Error('Tesisler yüklenemedi');
      return res.json();
    },
  });

  // Toggle user status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ username, isActive }: { username: string; isActive: boolean }) => {
      const res = await api.put(`/settings/users/${username}`, { isActive });
      if (!res.ok) throw new Error('Durum güncellenemedi');
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(vars.isActive ? 'Kullanıcı aktif edildi' : 'Kullanıcı arşivlendi');
    },
    onError: () => {
      toast.error('İşlem sırasında hata oluştu');
    },
  });

  const filteredUsers = allUsers
    .filter((u) => {
      const matchesSearch =
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.roles.some((r) => r.role.name === roleFilter);
      const matchesFacility = facilityFilter === 'all' || u.facilities.some((f) => f.facilityId === facilityFilter);
      const matchesStatus = activeTab === 'active' ? u.isActive : !u.isActive;
      return matchesSearch && matchesRole && matchesFacility && matchesStatus;
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'tr'));

  // Rolere göre gruplama
  const groupedUsers = filteredUsers.reduce((acc, user) => {
    const primaryRole = user.roles[0]?.role.name || 'user';
    if (!acc[primaryRole]) acc[primaryRole] = [];
    acc[primaryRole].push(user);
    return acc;
  }, {} as Record<string, User[]>);

  const sortedRoles = Object.keys(groupedUsers).sort((a, b) => {
    if (a === 'admin') return -1;
    if (b === 'admin') return 1;
    return (ROLE_LABELS[a] || a).localeCompare(ROLE_LABELS[b] || b, 'tr');
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* ── Page Header & Tabs ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Kullanıcı Yönetimi</h1>
          <p className="text-xs text-muted-foreground">Sistem personelleri, rol tanımları ve erişim yetkileri</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'archive')}>
            <TabsList className="h-8 p-1 rounded-md bg-muted">
              <TabsTrigger
                value="active"
                className="text-xs px-3 h-6 rounded-sm data-active:bg-background data-active:text-foreground data-active:shadow-2xs"
              >
                Aktif
                <span className="ml-1.5 text-[10px] text-muted-foreground font-mono">
                  {allUsers.filter((u) => u.isActive).length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="archive"
                className="text-xs px-3 h-6 rounded-sm data-active:bg-background data-active:text-foreground data-active:shadow-2xs"
              >
                Arşiv
                <span className="ml-1.5 text-[10px] text-muted-foreground font-mono">
                  {allUsers.filter((u) => !u.isActive).length}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            onClick={() => navigate('/settings/users/new')}
            size="sm"
            className="h-8 px-3 text-xs font-medium rounded-md bg-primary text-primary-foreground shadow-xs gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Kullanıcı Ekle
          </Button>
        </div>
      </div>

      {/* ── Toolbar: Search, Filters & View Toggle ─────────────────────── */}
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between p-2.5 rounded-lg border border-border/70 bg-card shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="İsim veya kullanıcı adına göre ara..."
            className="pl-8 h-8 text-xs rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs rounded-md">
              <SelectValue placeholder="Rol Filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                Tüm Roller
              </SelectItem>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.name} className="text-xs">
                  {ROLE_LABELS[r.name] || r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={facilityFilter} onValueChange={setFacilityFilter}>
            <SelectTrigger className="w-[160px] h-8 text-xs rounded-md">
              <SelectValue placeholder="Tesis Filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                Tüm Tesisler
              </SelectItem>
              {facilities.map((f) => (
                <SelectItem key={f.id} value={f.id} className="text-xs">
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center border border-border/70 rounded-md p-0.5 bg-muted/40">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn(
                'h-7 w-7 p-0 rounded-sm text-muted-foreground hover:text-foreground',
                viewMode === 'list' && 'bg-background shadow-2xs text-foreground font-semibold'
              )}
              title="Liste Görünümü"
            >
              <List className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={cn(
                'h-7 w-7 p-0 rounded-sm text-muted-foreground hover:text-foreground',
                viewMode === 'grid' && 'bg-background shadow-2xs text-foreground font-semibold'
              )}
              title="Kart Görünümü"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Content: List or Grid ───────────────────────────────────────── */}
      {usersLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredUsers.length > 0 ? (
        viewMode === 'list' ? (
          <Accordion type="multiple" defaultValue={sortedRoles} className="space-y-3">
            {sortedRoles.map((roleName) => (
              <AccordionItem
                key={roleName}
                value={roleName}
                className="border border-border/70 rounded-lg bg-card overflow-hidden shadow-xs"
              >
                <AccordionTrigger className="px-4 py-2.5 hover:no-underline bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-xs text-foreground">
                      {ROLE_LABELS[roleName] || roleName}
                    </span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal rounded-full">
                      {groupedUsers[roleName].length}
                    </Badge>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="p-0 border-t border-border/50">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="h-8 text-[11px] font-medium text-muted-foreground pl-4">
                          Kullanıcı
                        </TableHead>
                        <TableHead className="h-8 text-[11px] font-medium text-muted-foreground">
                          Departman & Ünvan
                        </TableHead>
                        <TableHead className="h-8 text-[11px] font-medium text-muted-foreground">
                          Tesis Yetkileri
                        </TableHead>
                        <TableHead className="h-8 text-[11px] font-medium text-muted-foreground">
                          Durum
                        </TableHead>
                        <TableHead className="h-8 text-[11px] font-medium text-muted-foreground text-right pr-4">
                          İşlemler
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedUsers[roleName].map((user) => (
                        <TableRow key={user.username} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="py-2.5 pl-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-md bg-muted text-muted-foreground flex items-center justify-center font-medium text-xs">
                                {user.fullName ? (
                                  user.fullName.charAt(0).toUpperCase()
                                ) : (
                                  <UserIcon className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-xs text-foreground">{user.fullName}</div>
                                <div className="text-[10px] font-mono text-muted-foreground">@{user.username}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 text-xs">
                            <div className="font-medium text-foreground">{user.department || '—'}</div>
                            <div className="text-[11px] text-muted-foreground">{user.title || '—'}</div>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <div className="flex flex-wrap gap-1 max-w-[280px]">
                              {user.facilities.length > 0 ? (
                                user.facilities.slice(0, 3).map((f) => (
                                  <Badge
                                    key={f.facilityId}
                                    variant="secondary"
                                    className="text-[10px] font-normal px-1.5 py-0 h-4 rounded"
                                  >
                                    {f.facility.name}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-[11px] text-muted-foreground">Yetki yok</span>
                              )}
                              {user.facilities.length > 3 && (
                                <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 h-4">
                                  +{user.facilities.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  'w-1.5 h-1.5 rounded-full',
                                  user.isActive ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                                )}
                              />
                              <span className="text-[11px] text-muted-foreground">
                                {user.isActive ? 'Aktif' : 'Pasif'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 pr-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  toggleUserStatusMutation.mutate({
                                    username: user.username,
                                    isActive: !user.isActive,
                                  })
                                }
                                className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                                title={user.isActive ? 'Arşive Al' : 'Aktife Al'}
                              >
                                {user.isActive ? (
                                  <Archive className="w-3.5 h-3.5" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/settings/users/${user.username}/edit`)}
                                className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                                title="Düzenle"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredUsers.map((user) => (
              <Card
                key={user.username}
                className="rounded-lg border border-border/70 bg-card hover:border-border hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
              >
                <CardHeader className="p-3.5 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0">
                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-xs text-foreground truncate">{user.fullName}</h4>
                        <p className="text-[10px] font-mono text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[9px] px-1.5 py-0 h-4 rounded font-medium shrink-0 border',
                        user.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900'
                          : 'bg-muted text-muted-foreground border-border'
                      )}
                    >
                      {user.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-3.5 pt-0 space-y-2 text-xs">
                  <div className="space-y-1.5 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-foreground/70" />
                      <span className="truncate text-foreground font-medium">
                        {user.roles.map((r) => ROLE_LABELS[r.role.name] || r.role.name).join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {user.department || '—'} • {user.title || '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 shrink-0" />
                      <span>{user.facilities.length} Tesis Erişimi</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/settings/users/${user.username}/edit`)}
                      className="flex-1 h-7 text-xs rounded-md"
                    >
                      Düzenle
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        toggleUserStatusMutation.mutate({
                          username: user.username,
                          isActive: !user.isActive,
                        })
                      }
                      className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                      title={user.isActive ? 'Arşive Al' : 'Aktife Al'}
                    >
                      {user.isActive ? (
                        <Archive className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-16 border border-dashed border-border/70 rounded-lg bg-card">
          <Archive className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <h3 className="text-xs font-semibold text-foreground">Kullanıcı Bulunamadı</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs mx-auto">
            {searchTerm || roleFilter !== 'all' || facilityFilter !== 'all'
              ? 'Arama ve filtre kriterlerinize uygun kullanıcı bulunamadı.'
              : 'Bu bölümde gösterilecek kayıtlı kullanıcı bulunmuyor.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default UsersPage;