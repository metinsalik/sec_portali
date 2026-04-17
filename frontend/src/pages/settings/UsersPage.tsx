import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Search, User as UserIcon, ShieldCheck, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

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

  const filteredUsers = users?.filter(u =>
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="İsim veya kullanıcı adına göre ara..."
            className="pl-10 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Kullanıcı Ekle
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
              <tr>
                <th className="px-6 py-4">Kullanıcı</th>
                <th className="px-6 py-4">Departman / Ünvan</th>
                <th className="px-6 py-4">Roller</th>
                <th className="px-6 py-4">Tesisler</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers?.map((user) => (
                <tr key={user.username} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{user.fullName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{user.username}</div>
                        {user.email && <div className="text-xs text-muted-foreground">{user.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div>{user.department || '-'}</div>
                      <div className="text-muted-foreground">{user.title || '-'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map(r => (
                        <Badge key={r.role.id} variant="outline" className="font-normal text-xs">
                          {ROLE_LABELS[r.role.name] || r.role.name}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2 max-w-[200px]">
                      {user.facilities.length > 0 ? (
                        user.facilities.map(f => (
                          <Badge key={f.facilityId} variant="secondary" className="font-normal text-xs">
                            {f.facility.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs">Tesis yok</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={user.isActive ? "outline" : "secondary"}
                      className={user.isActive ? "border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-normal" : "font-normal"}
                    >
                      {user.isActive ? "Aktif" : "Pasif"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(user)}>
                        Düzenle
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleUserStatusMutation.mutate({ username: user.username, isActive: !user.isActive })}
                      >
                        {user.isActive ? 'Pasif Et' : 'Aktif Et'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers?.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            Kullanıcı bulunamadı.
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