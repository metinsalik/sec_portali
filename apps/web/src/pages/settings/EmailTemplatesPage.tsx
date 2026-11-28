import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Check,
  Code2,
  Eye,
  FileCode2,
  Loader2,
  Mail,
  Plus,
  Save,
  Search,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NotificationTemplate {
  id: string;
  code: string;
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
}

interface DepartmentOwnerUser {
  username: string;
  fullName: string;
  email: string | null;
  department: string | null;
  title: string | null;
}

interface DepartmentOwnersResponse {
  mappings: Record<string, string[]>;
  departments: { id: number; name: string }[];
  users: DepartmentOwnerUser[];
}

const TEMPLATE_VARIABLES = [
  { key: '{{userName}}', label: 'Alıcı Adı', sample: 'Ahmet Yılmaz' },
  { key: '{{facilityName}}', label: 'Tesis', sample: 'Merkez Hastanesi' },
  { key: '{{departmentName}}', label: 'Departman', sample: 'Teknik Bakım ve Onarım' },
  { key: '{{finding}}', label: 'Bulgu / Konu', sample: 'Acil çıkış kapısı aydınlatma arızası tespit edildi.' },
  { key: '{{riskScore}}', label: 'Risk Skoru', sample: '16 (Yüksek)' },
  { key: '{{dueDate}}', label: 'Termin Tarihi', sample: '15.12.2026' },
  {
    key: '{{photosSection}}',
    label: 'Bulgu Fotoğrafları',
    sample: '<div style="margin:14px 0;padding:10px;border:1px dashed #cbd5e1;border-radius:6px;font-size:12px;color:#475569;text-align:center;">[Kayda ait bulgu fotoğrafları mail içine gömülü (CID) olarak otomatik eklenir]</div>',
  },
  { key: '{{actionUrl}}', label: 'Aksiyon Linki', sample: 'http://localhost/operations-management/improvements/records/demo-id' },
];

const DEFAULT_HTML_STARTER = `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:20px 24px;color:#ffffff;">
    <p style="margin:0;font-size:12px;opacity:0.85;text-transform:uppercase;letter-spacing:0.06em;">İSG Portalı Bildirimi</p>
    <h2 style="margin:6px 0 0;font-size:18px;font-weight:700;">İyileştirme ve Aksiyon Bildirimi</h2>
  </div>
  <div style="padding:24px;color:#334155;font-size:14px;line-height:1.6;">
    <p style="margin:0 0 12px;">Sayın <strong>{{userName}}</strong>,</p>
    <p style="margin:0 0 16px;"><strong>{{facilityName}}</strong> tesisinde <strong>{{departmentName}}</strong> departmanı sorumluluğunda bir iyileştirme/aksiyon kaydı açılmıştır.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
      <p style="margin:0 0 6px;"><strong>Bulgu:</strong> {{finding}}</p>
      <p style="margin:0 0 6px;"><strong>Risk Skoru:</strong> {{riskScore}}</p>
      <p style="margin:0;"><strong>Termin:</strong> {{dueDate}}</p>
    </div>
    <a href="{{actionUrl}}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:600;font-size:14px;">Kaydı Aç ve Aksiyon Gir</a>
  </div>
</div>`;

function renderPreviewHtml(html: string): string {
  let output = html || '';
  for (const item of TEMPLATE_VARIABLES) {
    output = output.split(item.key).join(item.sample);
  }
  return output;
}

export default function EmailTemplatesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'templates' | 'owners'>('templates');

  // --- HTML Templates State ---
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'split' | 'code' | 'preview'>('split');
  const [formState, setFormState] = useState({
    code: '',
    name: '',
    subject: '',
    body: '',
    isActive: true,
  });
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // --- Department Owners State ---
  const [deptSearch, setDeptSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [ownerMappings, setOwnerMappings] = useState<Record<string, string[]>>({});

  const { data: templates = [], isLoading: loadingTemplates } = useQuery<NotificationTemplate[]>({
    queryKey: ['notification-templates'],
    queryFn: async () => {
      const res = await api.get('/settings/notification-templates');
      if (!res.ok) throw new Error('Şablonlar alınamadı');
      return res.json();
    },
  });

  const { data: ownersData, isLoading: loadingOwners } = useQuery<DepartmentOwnersResponse>({
    queryKey: ['department-owners'],
    queryFn: async () => {
      const res = await api.get('/settings/department-owners');
      if (!res.ok) throw new Error('Departman sorumluları alınamadı');
      return res.json();
    },
  });

  useEffect(() => {
    if (templates.length > 0 && !selectedId && !isCreatingNew) {
      const preferred =
        templates.find((t) => t.code === 'IMPROVEMENT_ACTION_ASSIGNED') || templates[0];
      setSelectedId(preferred.id);
      setFormState({
        code: preferred.code,
        name: preferred.name,
        subject: preferred.subject,
        body: preferred.body,
        isActive: preferred.isActive,
      });
    }
  }, [templates, selectedId, isCreatingNew]);

  useEffect(() => {
    if (ownersData) {
      setOwnerMappings(ownersData.mappings || {});
      if (!selectedDept && ownersData.departments.length > 0) {
        setSelectedDept(ownersData.departments[0].name);
      }
    }
  }, [ownersData, selectedDept]);

  const selectTemplate = (tpl: NotificationTemplate) => {
    setIsCreatingNew(false);
    setSelectedId(tpl.id);
    setFormState({
      code: tpl.code,
      name: tpl.name,
      subject: tpl.subject,
      body: tpl.body,
      isActive: tpl.isActive,
    });
  };

  const handleStartNew = () => {
    setIsCreatingNew(true);
    setSelectedId(null);
    setFormState({
      code: '',
      name: '',
      subject: 'İSG Portalı — {{facilityName}} İyileştirme Bildirimi',
      body: DEFAULT_HTML_STARTER,
      isActive: true,
    });
  };

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; data: Omit<typeof formState, 'code'> }) => {
      const res = await api.put(`/settings/notification-templates/${payload.id}`, payload.data);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Şablon güncellenemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('HTML e-posta şablonu kaydedildi.');
    },
    onError: (err: any) => toast.error(err.message || 'Güncelleme hatası'),
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formState) => {
      const res = await api.post('/settings/notification-templates', data);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Şablon oluşturulamadı');
      }
      return res.json();
    },
    onSuccess: (created: NotificationTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      setIsCreatingNew(false);
      setSelectedId(created.id);
      toast.success('Yeni HTML e-posta şablonu oluşturuldu.');
    },
    onError: (err: any) => toast.error(err.message || 'Oluşturma hatası'),
  });

  const saveOwnersMutation = useMutation({
    mutationFn: async (mappings: Record<string, string[]>) => {
      const res = await api.put('/settings/department-owners', { mappings });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Departman sorumluları kaydedilemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-owners'] });
      toast.success('Departman mail sorumluları kaydedildi.');
    },
    onError: (err: any) => toast.error(err.message || 'Kayıt hatası'),
  });

  const handleSaveTemplate = () => {
    if (!formState.name.trim() || !formState.subject.trim() || !formState.body.trim()) {
      toast.error('Şablon adı, konusu ve HTML içeriği boş bırakılamaz.');
      return;
    }
    if (isCreatingNew) {
      if (!formState.code.trim()) {
        toast.error('Şablon kodu zorunludur (Örn: CUSTOM_ALERT).');
        return;
      }
      createMutation.mutate(formState);
    } else if (selectedId) {
      updateMutation.mutate({
        id: selectedId,
        data: {
          name: formState.name,
          subject: formState.subject,
          body: formState.body,
          isActive: formState.isActive,
        },
      });
    }
  };

  const insertVariable = (token: string) => {
    setFormState((prev) => ({ ...prev, body: `${prev.body}${prev.body.endsWith('\n') || !prev.body ? '' : ' '}${token}` }));
  };

  const filteredDepartments = useMemo(() => {
    const list = ownersData?.departments || [];
    const q = deptSearch.trim().toLocaleLowerCase('tr-TR');
    if (!q) return list;
    return list.filter((d) => d.name.toLocaleLowerCase('tr-TR').includes(q));
  }, [ownersData?.departments, deptSearch]);

  const filteredUsers = useMemo(() => {
    const list = ownersData?.users || [];
    const q = userSearch.trim().toLocaleLowerCase('tr-TR');
    if (!q) return list;
    return list.filter(
      (u) =>
        u.fullName.toLocaleLowerCase('tr-TR').includes(q) ||
        (u.email || '').toLocaleLowerCase('tr-TR').includes(q) ||
        (u.department || '').toLocaleLowerCase('tr-TR').includes(q)
    );
  }, [ownersData?.users, userSearch]);

  const toggleUserForDept = (deptName: string, username: string) => {
    setOwnerMappings((prev) => {
      const current = prev[deptName] || [];
      const exists = current.includes(username);
      const next = exists ? current.filter((u) => u !== username) : [...current, username];
      return { ...prev, [deptName]: next };
    });
  };

  const previewHtml = useMemo(() => renderPreviewHtml(formState.body), [formState.body]);
  const previewSubject = useMemo(() => renderPreviewHtml(formState.subject), [formState.subject]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Bildirim Şablonları & Departman Sorumluları
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            HTML e-posta şablonlarını düzenleyin, canlı önizleyin ve iyileştirme departmanlarına sorumlu kullanıcı atayın.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-lg border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'templates'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            HTML E-posta Şablonları
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('owners')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'owners'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Departman Sorumluları
          </button>
        </div>
      </div>

      {activeTab === 'templates' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sol: Şablon Listesi */}
          <Card className="lg:col-span-4 shadow-xs border-border/60 rounded-lg h-fit">
            <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Şablonlar</CardTitle>
                <CardDescription className="text-xs">Sistem bildirim şablonları</CardDescription>
              </div>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={handleStartNew}>
                <Plus className="w-3.5 h-3.5" /> Yeni
              </Button>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground text-xs gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor...
                </div>
              ) : (
                templates.map((tpl) => {
                  const isSelected = !isCreatingNew && selectedId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => selectTemplate(tpl)}
                      className={`w-full text-left p-3 rounded-md border transition-colors ${
                        isSelected
                          ? 'bg-primary/5 border-primary/40 text-foreground'
                          : 'bg-transparent border-transparent hover:bg-muted/60 text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold truncate">{tpl.name}</span>
                        <Badge
                          variant={tpl.isActive ? 'default' : 'secondary'}
                          className="text-[10px] px-1.5 py-0 h-4 shrink-0"
                        >
                          {tpl.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono mt-1 truncate">
                        {tpl.code}
                      </p>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Sağ: HTML Editör + Canlı Önizleme */}
          <Card className="lg:col-span-8 shadow-xs border-border/60 rounded-lg">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    {isCreatingNew ? 'Yeni HTML E-posta Şablonu' : formState.name || 'Şablon Düzenleyici'}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    HTML formatında şablon oluşturun; alıcılar doğrudan kayıt linki ile aksiyon sayfasına ulaşır.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-md border border-border/60">
                  <button
                    type="button"
                    onClick={() => setEditorMode('split')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                      editorMode === 'split' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
                    }`}
                  >
                    Bölünmüş
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode('code')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 ${
                      editorMode === 'code' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
                    }`}
                  >
                    <Code2 className="w-3 h-3" /> HTML Kodu
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode('preview')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 ${
                      editorMode === 'preview' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
                    }`}
                  >
                    <Eye className="w-3 h-3" /> Canlı Önizleme
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isCreatingNew && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Şablon Kodu (Benzersiz)</Label>
                    <Input
                      value={formState.code}
                      onChange={(e) => setFormState((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                      placeholder="IMPROVEMENT_ACTION_ASSIGNED"
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Şablon Adı</Label>
                  <Input
                    value={formState.name}
                    onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Şablon adı"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-medium">E-posta Konusu</Label>
                  <Input
                    value={formState.subject}
                    onChange={(e) => setFormState((p) => ({ ...p, subject: e.target.value }))}
                    placeholder="Örn: [İSG Portalı] {{facilityName}} - Yeni İyileştirme Bildirimi"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Değişken Chip'leri */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Dinamik Değişkenler (Tıklayarak HTML içine ekleyin)
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATE_VARIABLES.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertVariable(v.key)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-muted/50 hover:bg-muted text-[11px] text-foreground transition-colors"
                      title={`${v.label}: ${v.sample}`}
                    >
                      <span className="font-mono text-primary">{v.key}</span>
                      <span className="text-muted-foreground">({v.label})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Kod + Önizleme Alanı */}
              <div className={`grid gap-4 ${editorMode === 'split' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                {editorMode !== 'preview' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">HTML İçerik</Label>
                    <textarea
                      rows={16}
                      value={formState.body}
                      onChange={(e) => setFormState((p) => ({ ...p, body: e.target.value }))}
                      className="w-full rounded-md border border-input bg-background p-3 text-xs font-mono leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="<div>...</div>"
                    />
                  </div>
                )}

                {editorMode !== 'code' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Canlı HTML Önizleme</Label>
                    <div className="rounded-md border border-border bg-muted/30 overflow-hidden">
                      <div className="px-3 py-2 border-b border-border bg-muted/60 text-xs">
                        <span className="text-muted-foreground">Konu: </span>
                        <span className="font-medium text-foreground">{previewSubject || '—'}</span>
                      </div>
                      <div
                        className="p-4 bg-white text-slate-900 min-h-[340px] overflow-auto"
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.isActive}
                    onChange={(e) => setFormState((p) => ({ ...p, isActive: e.target.checked }))}
                    className="rounded border-border"
                  />
                  Bu şablon aktif (otomatik bildirimlerde kullanılabilir)
                </label>

                <Button
                  onClick={handleSaveTemplate}
                  disabled={updateMutation.isPending || createMutation.isPending}
                  className="gap-2 h-9 text-xs"
                >
                  {updateMutation.isPending || createMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Şablonu Kaydet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Departman Sorumluları Sekmesi */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sol: Departman Listesi */}
          <Card className="lg:col-span-5 shadow-xs border-border/60 rounded-lg">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                İyileştirme & Aksiyon Departmanları
              </CardTitle>
              <CardDescription className="text-xs">
                Her departman için mail bildirimi alacak sorumlu kullanıcıları seçin.
              </CardDescription>
              <div className="relative mt-2">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                <Input
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  placeholder="Departman ara..."
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </CardHeader>
            <CardContent className="p-2 max-h-[520px] overflow-y-auto space-y-1">
              {loadingOwners ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground text-xs gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor...
                </div>
              ) : filteredDepartments.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Departman bulunamadı.
                </p>
              ) : (
                filteredDepartments.map((dept) => {
                  const assignedCount = (ownerMappings[dept.name] || []).length;
                  const isSelected = selectedDept === dept.name;
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => setSelectedDept(dept.name)}
                      className={`w-full text-left px-3 py-2.5 rounded-md border flex items-center justify-between gap-2 transition-colors ${
                        isSelected
                          ? 'bg-primary/5 border-primary/40 text-foreground'
                          : 'border-transparent hover:bg-muted/60 text-foreground'
                      }`}
                    >
                      <span className="text-xs font-medium truncate">{dept.name}</span>
                      <Badge
                        variant={assignedCount > 0 ? 'default' : 'secondary'}
                        className="text-[10px] shrink-0"
                      >
                        {assignedCount > 0 ? `${assignedCount} kişi` : 'Atanmadı'}
                      </Badge>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Sağ: Seçili Departmana Kullanıcı Atama */}
          <Card className="lg:col-span-7 shadow-xs border-border/60 rounded-lg">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-primary" />
                    {selectedDept ? `${selectedDept} — Sorumlu Kişiler` : 'Departman Seçiniz'}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Seçilen kişilere İyileştirme & Aksiyon detayından tek tıkla HTML bilgilendirme maili gönderilir.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => saveOwnersMutation.mutate(ownerMappings)}
                  disabled={saveOwnersMutation.isPending}
                  className="gap-1.5 h-8 text-xs"
                >
                  {saveOwnersMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Eşleştirmeleri Kaydet
                </Button>
              </div>

              {selectedDept && (
                <div className="relative mt-2">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Kullanıcı adı, e-posta veya departman ara..."
                    className="pl-8 h-8 text-xs"
                  />
                </div>
              )}
            </CardHeader>

            <CardContent className="p-3 max-h-[520px] overflow-y-auto space-y-1.5">
              {!selectedDept ? (
                <p className="text-xs text-muted-foreground text-center py-12">
                  Soldaki listeden bir departman seçin.
                </p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-12">
                  E-posta adresi tanımlı aktif kullanıcı bulunamadı.
                </p>
              ) : (
                filteredUsers.map((user) => {
                  const selectedList = ownerMappings[selectedDept] || [];
                  const isChecked = selectedList.includes(user.username);
                  return (
                    <button
                      key={user.username}
                      type="button"
                      onClick={() => toggleUserForDept(selectedDept, user.username)}
                      className={`w-full text-left p-2.5 rounded-md border flex items-center justify-between gap-3 transition-colors ${
                        isChecked
                          ? 'bg-primary/5 border-primary/40'
                          : 'border-border/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {user.fullName}
                          </span>
                          {user.department && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                              {user.department}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {user.email || 'E-posta yok'} {user.title ? `• ${user.title}` : ''}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${
                          isChecked
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-input bg-background'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
