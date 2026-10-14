import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Save,
  UserPlus,
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
  HardHat,
  Stethoscope,
  HeartPulse,
  Layers,
  Search,
  Check,
  CheckCheck,
  X,
  Loader2,
  Lock,
} from 'lucide-react';

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
  dangerClass?: string;
  city?: string;
  district?: string;
}

interface Module {
  id: number;
  code: string;
  name: string;
  description?: string;
}

interface UserDetail {
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  department?: string;
  title?: string;
  isActive: boolean;
  roles: { role: { id: number; name: string } }[];
  facilities: { facilityId: string; facility?: { id: string; name: string } }[];
  modules: { module: { id: number; code: string; name: string; description?: string } }[];
}

const ROLE_INFO: Record<string, { label: string; desc: string; icon: any }> = {
  admin: {
    label: 'Yönetici (Admin)',
    desc: 'Tüm sistem ayarlarına, kullanıcılara ve modüllere tam erişim.',
    icon: ShieldCheck,
  },
  safety: {
    label: 'İş Güvenliği Uzmanı',
    desc: 'İSG denetimleri, bina turları ve ramak kala yönetimi.',
    icon: HardHat,
  },
  doctor: {
    label: 'İşyeri Hekimi',
    desc: 'Sağlık modülleri, periyodik muayeneler ve sağlık gözetimi.',
    icon: Stethoscope,
  },
  dsp: {
    label: 'Diğer Sağlık Personeli',
    desc: 'Saha sağlık destek, aşı ve revir kayıtları takibi.',
    icon: HeartPulse,
  },
  management: {
    label: 'Üst Yönetim',
    desc: 'Kurumsal göstergeler ve yönetim denetim panoları.',
    icon: Briefcase,
  },
  user: {
    label: 'Standart Kullanıcı',
    desc: 'Atanan görevleri görüntüleme ve temel bildirimler.',
    icon: UserIcon,
  },
};

export default function UserEditPage() {
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  const queryClient = useQueryClient();
  const isEditing = Boolean(username && username !== 'new');

  // Form State
  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    department: '',
    title: '',
    isActive: true,
    roles: [] as string[],
    facilities: [] as string[],
    modules: [] as number[],
  });

  // UI Filters
  const [facilitySearch, setFacilitySearch] = useState('');
  const [facilityFilterType, setFacilityFilterType] = useState<'all' | 'selected' | 'unselected'>('all');
  const [moduleSearch, setModuleSearch] = useState('');

  // Queries
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

  const { data: systemModules = [] } = useQuery<Module[]>({
    queryKey: ['modules'],
    queryFn: async () => {
      const res = await api.get('/settings/modules');
      if (!res.ok) throw new Error('Modüller yüklenemedi');
      return res.json();
    },
  });

  // Fetch single user if editing
  const { data: existingUser, isLoading: isUserLoading } = useQuery<UserDetail>({
    queryKey: ['user', username],
    queryFn: async () => {
      const res = await api.get(`/settings/users/${username}`);
      if (!res.ok) {
        const allRes = await api.get('/settings/users');
        if (allRes.ok) {
          const list: UserDetail[] = await allRes.json();
          const match = list.find((u) => u.username === username);
          if (match) return match;
        }
        throw new Error('Kullanıcı bulunamadı');
      }
      return res.json();
    },
    enabled: isEditing,
  });

  // Populate form when existingUser arrives
  useEffect(() => {
    if (existingUser) {
      setForm({
        username: existingUser.username || '',
        fullName: existingUser.fullName || '',
        email: existingUser.email || '',
        phone: existingUser.phone || '',
        department: existingUser.department || '',
        title: existingUser.title || '',
        isActive: existingUser.isActive ?? true,
        roles: existingUser.roles?.map((r) => r.role?.name).filter(Boolean) || [],
        facilities: existingUser.facilities?.map((f) => f.facilityId).filter(Boolean) || [],
        modules: existingUser.modules?.map((m) => m.module?.id).filter((id): id is number => typeof id === 'number') || [],
      });
    }
  }, [existingUser]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/settings/users', form);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Kullanıcı oluşturulurken bir hata oluştu');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Kullanıcı başarıyla oluşturuldu');
      navigate('/settings/users');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Kullanıcı oluşturulamadı');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put(`/settings/users/${username}`, form);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Kullanıcı güncellenirken bir hata oluştu');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', username] });
      toast.success('Kullanıcı başarıyla güncellendi');
      navigate('/settings/users');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Güncelleme başarısız');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.phone || !form.department || !form.title) {
      toast.error('Lütfen tüm zorunlu kişisel bilgileri doldurun.');
      return;
    }
    if (!isEditing && !form.username) {
      toast.error('Lütfen kullanıcı adı girin.');
      return;
    }
    if (form.roles.length === 0) {
      toast.error('Lütfen en az bir sistem rolü seçin.');
      return;
    }

    if (isEditing) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const toggleRole = (roleName: string) => {
    setForm((prev) => {
      const exists = prev.roles.includes(roleName);
      return {
        ...prev,
        roles: exists ? prev.roles.filter((r) => r !== roleName) : [...prev.roles, roleName],
      };
    });
  };

  const toggleFacility = (facilityId: string) => {
    setForm((prev) => {
      const exists = prev.facilities.includes(facilityId);
      return {
        ...prev,
        facilities: exists ? prev.facilities.filter((id) => id !== facilityId) : [...prev.facilities, facilityId],
      };
    });
  };

  const selectAllFacilities = () => {
    const allIds = facilities.map((f) => f.id);
    setForm((prev) => ({ ...prev, facilities: allIds }));
    toast.info(`Tüm tesisler seçildi (${allIds.length})`);
  };

  const clearAllFacilities = () => {
    setForm((prev) => ({ ...prev, facilities: [] }));
    toast.info('Tesis seçimleri temizlendi');
  };

  const toggleModule = (moduleId: number) => {
    setForm((prev) => {
      const exists = prev.modules.includes(moduleId);
      return {
        ...prev,
        modules: exists ? prev.modules.filter((id) => id !== moduleId) : [...prev.modules, moduleId],
      };
    });
  };

  const selectAllModules = () => {
    const allIds = systemModules.map((m) => m.id);
    setForm((prev) => ({ ...prev, modules: allIds }));
    toast.info(`Tüm modüller açıldı (${allIds.length})`);
  };

  const clearAllModules = () => {
    setForm((prev) => ({ ...prev, modules: [] }));
    toast.info('Modül seçimleri temizlendi');
  };

  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(facilitySearch.toLowerCase()) ||
        f.id.toLowerCase().includes(facilitySearch.toLowerCase()) ||
        (f.dangerClass && f.dangerClass.toLowerCase().includes(facilitySearch.toLowerCase()));

      const isSelected = form.facilities.includes(f.id);

      if (!matchesSearch) return false;
      if (facilityFilterType === 'selected') return isSelected;
      if (facilityFilterType === 'unselected') return !isSelected;
      return true;
    });
  }, [facilities, facilitySearch, facilityFilterType, form.facilities]);

  const filteredModules = useMemo(() => {
    return systemModules.filter((m) => {
      const query = moduleSearch.toLowerCase();
      return (
        m.name.toLowerCase().includes(query) ||
        m.code.toLowerCase().includes(query) ||
        (m.description && m.description.toLowerCase().includes(query))
      );
    });
  }, [systemModules, moduleSearch]);

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isFormValid =
    (isEditing || Boolean(form.username.trim())) &&
    Boolean(form.fullName.trim()) &&
    Boolean(form.email.trim()) &&
    Boolean(form.phone.trim()) &&
    Boolean(form.department) &&
    Boolean(form.title.trim()) &&
    form.roles.length > 0;

  if (isEditing && isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Kullanıcı bilgileri yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 pb-20 animate-in fade-in duration-200">
      {/* ── Breadcrumb & Top Bar ────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/settings" className="hover:text-foreground transition-colors">
            Ayarlar
          </Link>
          <span>/</span>
          <Link to="/settings/users" className="hover:text-foreground transition-colors">
            Kullanıcılar
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[200px]">
            {isEditing ? form.fullName || username : 'Yeni Kullanıcı'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => navigate('/settings/users')}
              className="h-8 w-8 rounded-lg border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-foreground">
                  {isEditing ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
                </h1>
                {isEditing && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-medium border',
                      form.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900'
                        : 'bg-muted text-muted-foreground border-border'
                    )}
                  >
                    {form.isActive ? 'Aktif' : 'Pasif'}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {isEditing
                  ? `${form.fullName || username} (@${form.username}) yetkilendirme ve erişim ayarları`
                  : 'Yeni personel kaydı ve sistem yetkilendirmesi'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/settings/users')}
              className="h-8 px-3 text-xs rounded-lg"
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              form="user-form"
              size="sm"
              disabled={!isFormValid || isSaving}
              className="h-8 px-4 text-xs font-medium rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Kaydediliyor...
                </>
              ) : isEditing ? (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Güncelle
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Oluştur
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <form id="user-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* ── SOL KOLON: Profil & Roller (5 Kolon) ────────────────────── */}
          <div className="md:col-span-5 space-y-4">
            {/* Profil Kartı */}
            <Card className="rounded-xl border border-border/70 bg-card shadow-xs">
              <CardHeader className="p-4 pb-3 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {form.fullName ? form.fullName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Temel Bilgiler</CardTitle>
                    <CardDescription className="text-[11px]">Personel kimlik ve iletişim detayları</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                {/* Kullanıcı Adı */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground">Kullanıcı Adı *</label>
                    {isEditing && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Sabit
                      </span>
                    )}
                  </div>
                  <Input
                    placeholder="ör: burak.kurt"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().trim() })}
                    disabled={isEditing}
                    className={cn(
                      'h-9 rounded-md text-xs',
                      isEditing && 'bg-muted/50 text-muted-foreground font-mono'
                    )}
                    required
                  />
                </div>

                {/* Ad Soyad */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Ad Soyad *</label>
                  <div className="relative">
                    <UserIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Ör: Burak Kurt"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="pl-8 h-9 rounded-md text-xs"
                      required
                    />
                  </div>
                </div>

                {/* E-posta & Telefon */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">E-posta *</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="ornek@alanadi.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="pl-8 h-9 rounded-md text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Telefon *</label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="0532..."
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="pl-8 h-9 rounded-md text-xs"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Departman & Ünvan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Departman *</label>
                    <Select
                      value={form.department}
                      onValueChange={(val) => setForm({ ...form, department: val || '' })}
                    >
                      <SelectTrigger className="h-9 rounded-md text-xs">
                        <SelectValue placeholder="Seçin..." />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.name} className="text-xs">
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Ünvan *</label>
                    <div className="relative">
                      <Briefcase className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Ör: B Sınıfı İGU"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="pl-8 h-9 rounded-md text-xs"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Departman Uyarısı */}
                {departments.length === 0 && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-[11px] text-amber-800 dark:text-amber-400 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Departman listesi boş. Tanım Yönetimi sayfasından departman ekleyin.</span>
                  </div>
                )}

                {/* Kullanıcı Durumu (Düzenleme modu) */}
                {isEditing && (
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-foreground">Hesap Durumu</span>
                      <p className="text-[11px] text-muted-foreground">
                        {form.isActive ? 'Kullanıcı aktif' : 'Kullanıcı pasife alındı'}
                      </p>
                    </div>
                    <Switch
                      size="sm"
                      checked={form.isActive}
                      onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Roller Kartı */}
            <Card className="rounded-xl border border-border/70 bg-card shadow-xs">
              <CardHeader className="p-4 pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Sistem Rolleri *</CardTitle>
                  <CardDescription className="text-[11px]">En az 1 rol seçilmelidir</CardDescription>
                </div>
                <Badge variant="secondary" className="font-medium text-[10px] px-2 py-0 rounded-full">
                  {form.roles.length} Seçili
                </Badge>
              </CardHeader>

              <CardContent className="p-4 space-y-2">
                <div className="space-y-1.5">
                  {roles.map((role) => {
                    const info = ROLE_INFO[role.name] || {
                      label: role.name,
                      desc: 'Sistem yetki grubu',
                      icon: ShieldAlert,
                    };
                    const Icon = info.icon;
                    const isSelected = form.roles.includes(role.name);

                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleRole(role.name)}
                        className={cn(
                          'w-full text-left p-2.5 rounded-lg border text-xs transition-colors flex items-start gap-2.5 cursor-pointer',
                          isSelected
                            ? 'bg-primary/5 border-primary text-foreground shadow-2xs'
                            : 'bg-background border-border/60 hover:bg-muted/40 hover:border-border text-muted-foreground'
                        )}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 rounded flex items-center justify-center shrink-0 border mt-0.5 transition-colors',
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'bg-muted/40 border-border text-muted-foreground'
                          )}
                        >
                          {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : <Icon className="w-3 h-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className={cn('font-medium', isSelected && 'text-foreground font-semibold')}>
                              {info.label}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">
                              {role.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-normal mt-0.5 line-clamp-1">
                            {info.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {form.roles.length === 0 && (
                  <p className="text-[11px] text-destructive font-medium mt-1">
                    * En az bir rol seçmelisiniz.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── SAĞ KOLON: Tesis & Özel Modül Erişimi (7 Kolon) ───────── */}
          <div className="md:col-span-7 space-y-4">
            <Tabs defaultValue="facilities" className="w-full">
              <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
                <TabsList className="bg-muted p-1 rounded-lg h-8">
                  <TabsTrigger
                    value="facilities"
                    className="rounded-md font-medium text-xs px-3 h-6 data-active:bg-background data-active:text-foreground data-active:shadow-2xs"
                  >
                    <Building2 className="w-3.5 h-3.5 mr-1.5" />
                    Tesis Erişimi
                    <Badge variant="secondary" className="ml-1.5 font-medium text-[10px] px-1.5 py-0 h-4 rounded-full">
                      {form.facilities.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="modules"
                    className="rounded-md font-medium text-xs px-3 h-6 data-active:bg-background data-active:text-foreground data-active:shadow-2xs"
                  >
                    <Layers className="w-3.5 h-3.5 mr-1.5" />
                    Özel Modüller
                    <Badge variant="secondary" className="ml-1.5 font-medium text-[10px] px-1.5 py-0 h-4 rounded-full">
                      {form.modules.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <div className="text-[11px] text-muted-foreground hidden sm:block">
                  {form.facilities.length} Tesis • {form.modules.length} Modül
                </div>
              </div>

              {/* ── TAB 1: TESİS ERİŞİMİ ─────────────────────────────── */}
              <TabsContent value="facilities" className="mt-3 space-y-3">
                <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
                  <CardHeader className="p-4 pb-3 border-b border-border/50 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-sm font-semibold">Yetkili Tesisler</CardTitle>
                        <CardDescription className="text-[11px]">Erişim sağlanacak sağlık merkezleri</CardDescription>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={selectAllFacilities}
                          className="h-7 text-xs px-2.5 rounded-md"
                        >
                          <CheckCheck className="w-3 h-3 mr-1" />
                          Tümü ({facilities.length})
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFacilities}
                          className="h-7 text-xs px-2 rounded-md text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Temizle
                        </Button>
                      </div>
                    </div>

                    {/* Toolbar: Arama ve Filtre */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Tesis veya şehir ara..."
                          value={facilitySearch}
                          onChange={(e) => setFacilitySearch(e.target.value)}
                          className="pl-8 h-8 rounded-md text-xs"
                        />
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setFacilityFilterType('all')}
                          className={cn(
                            'px-2 py-1 rounded-md text-[11px] font-medium transition-colors',
                            facilityFilterType === 'all'
                              ? 'bg-foreground text-background font-semibold'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          )}
                        >
                          Tümü
                        </button>
                        <button
                          type="button"
                          onClick={() => setFacilityFilterType('selected')}
                          className={cn(
                            'px-2 py-1 rounded-md text-[11px] font-medium transition-colors',
                            facilityFilterType === 'selected'
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          )}
                        >
                          Seçilen ({form.facilities.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFacilityFilterType('unselected')}
                          className={cn(
                            'px-2 py-1 rounded-md text-[11px] font-medium transition-colors',
                            facilityFilterType === 'unselected'
                              ? 'bg-foreground text-background font-semibold'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          )}
                        >
                          Kalan ({facilities.length - form.facilities.length})
                        </button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3 sm:p-4">
                    {filteredFacilities.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[480px] overflow-y-auto pr-1">
                        {filteredFacilities.map((f) => {
                          const isSelected = form.facilities.includes(f.id);
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => toggleFacility(f.id)}
                              className={cn(
                                'text-left p-2.5 rounded-lg border text-xs transition-colors flex items-center gap-2.5 group cursor-pointer',
                                isSelected
                                  ? 'bg-primary/5 border-primary/60 text-foreground shadow-2xs'
                                  : 'bg-background border-border/60 hover:bg-muted/40 hover:border-border text-muted-foreground'
                              )}
                            >
                              <div
                                className={cn(
                                  'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                                  isSelected
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : 'border-muted-foreground/40 bg-background group-hover:border-muted-foreground'
                                )}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div
                                  className={cn(
                                    'font-medium truncate',
                                    isSelected ? 'text-foreground font-semibold' : 'text-foreground/90'
                                  )}
                                >
                                  {f.name}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {f.dangerClass && (
                                    <span
                                      className={cn(
                                        'text-[9px] px-1 py-0.2 rounded border font-medium',
                                        f.dangerClass === 'Çok Tehlikeli'
                                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900'
                                          : f.dangerClass === 'Tehlikeli'
                                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900'
                                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900'
                                      )}
                                    >
                                      {f.dangerClass}
                                    </span>
                                  )}
                                  {f.city && (
                                    <span className="text-[10px] text-muted-foreground truncate">
                                      {f.city}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 border border-dashed border-border/60 rounded-lg">
                        <Building2 className="w-7 h-7 text-muted-foreground mx-auto mb-1.5 opacity-40" />
                        <p className="text-xs font-medium text-foreground">Eşleşen tesis bulunamadı</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── TAB 2: ÖZEL MODÜL ERİŞİMİ ─────────────────────────── */}
              <TabsContent value="modules" className="mt-3 space-y-3">
                <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
                  <CardHeader className="p-4 pb-3 border-b border-border/50 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-sm font-semibold">Özel Modül İzinleri</CardTitle>
                        <CardDescription className="text-[11px]">Rol dışı özel modül yetkilendirmeleri</CardDescription>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={selectAllModules}
                          className="h-7 text-xs px-2.5 rounded-md"
                        >
                          <CheckCheck className="w-3 h-3 mr-1" />
                          Tümünü Aç ({systemModules.length})
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearAllModules}
                          className="h-7 text-xs px-2 rounded-md text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Kapat
                        </Button>
                      </div>
                    </div>

                    {/* Toolbar: Arama */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Modül adı veya kodu ara..."
                        value={moduleSearch}
                        onChange={(e) => setModuleSearch(e.target.value)}
                        className="pl-8 h-8 rounded-md text-xs"
                      />
                    </div>
                  </CardHeader>

                  <CardContent className="p-3 sm:p-4">
                    {filteredModules.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[480px] overflow-y-auto pr-1">
                        {filteredModules.map((m) => {
                          const isSelected = form.modules.includes(m.id);
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => toggleModule(m.id)}
                              className={cn(
                                'text-left p-2.5 rounded-lg border text-xs transition-colors flex items-start justify-between gap-2.5 group cursor-pointer',
                                isSelected
                                  ? 'bg-primary/5 border-primary/60 text-foreground shadow-2xs'
                                  : 'bg-background border-border/60 hover:bg-muted/40 hover:border-border text-muted-foreground'
                              )}
                            >
                              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                <div
                                  className={cn(
                                    'w-7 h-7 rounded-md flex items-center justify-center shrink-0 border mt-0.5 transition-colors',
                                    isSelected
                                      ? 'bg-primary/10 text-primary border-primary/30'
                                      : 'bg-muted text-muted-foreground border-border/60'
                                  )}
                                >
                                  <Layers className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div
                                    className={cn(
                                      'font-medium truncate',
                                      isSelected ? 'text-foreground font-semibold' : 'text-foreground/90'
                                    )}
                                  >
                                    {m.name}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                    {m.description || 'Modül erişim yetkisi'}
                                  </p>
                                </div>
                              </div>

                              <Switch
                                size="sm"
                                checked={isSelected}
                                onCheckedChange={() => toggleModule(m.id)}
                                className="shrink-0 pointer-events-none mt-1"
                              />
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 border border-dashed border-border/60 rounded-lg">
                        <Layers className="w-7 h-7 text-muted-foreground mx-auto mb-1.5 opacity-40" />
                        <p className="text-xs font-medium text-foreground">Eşleşen modül bulunamadı</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* ── STICKY BOTTOM ACTION BAR (Zarif & Kompakt) ────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-background/85 backdrop-blur-md border-t border-border/60 py-2.5 px-4 shadow-sm">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center font-semibold text-[10px] text-muted-foreground">
                {form.fullName ? form.fullName.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {form.fullName || (isEditing ? username : 'Yeni Kullanıcı')}
                </span>
                <span className="ml-1.5 hidden sm:inline">
                  • {form.roles.length} Rol • {form.facilities.length} Tesis • {form.modules.length} Modül
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate('/settings/users')}
                className="h-8 px-3 text-xs rounded-lg"
              >
                Vazgeç
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!isFormValid || isSaving}
                className="h-8 px-4 text-xs font-medium rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : isEditing ? (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Güncelle
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    Oluştur
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
