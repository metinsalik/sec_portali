import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, BASE_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DepartmentSelect } from '@/components/shared/DepartmentSelect';
import {
  User,
  Building2,
  Shield,
  Mail,
  Phone,
  Briefcase,
  Send,
  Save,
  Loader2,
  Layers,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Copy,
  Unlink,
  Link2,
  Award,
  FileText,
  Clock,
  ClipboardCheck,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface Facility {
  id: string;
  name: string;
  dangerClass: string;
  employeeCount: number;
}

const MODULE_ROUTE_MAP: Record<string, string> = {
  PANEL: '/panel/dashboard',
  OPERATIONS: '/operations',
  OPERATIONS_MANAGEMENT: '/operations-management',
  SAFETY_MANAGEMENT: '/safety-management',
  HAZMAT: '/hazmat',
  WORKFLOW: '/workflow',
  RISKS: '/risks',
  CHECKLISTS: '/checklists',
  FIRE_EQUIPMENT: '/fire-equipment',
  BUILD_MANAGEMENT: '/renovation-report',
  RENOVATION_REPORT: '/renovation-report',
  BINA_TURU: '/bina-turu',
  FM200: '/fm200',
  TRANSFER: '/transfer',
  SETTINGS: '/settings/users',
};

const CERTIFICATE_CLASSES = [
  'A Sınıfı IGU',
  'B Sınıfı IGU',
  'C Sınıfı IGU',
  'İşyeri Hekimi',
  'DSP',
  'Diğer',
];

function computeCertificateCountdown(dateStr?: string | null) {
  if (!dateStr) return null;
  const start = new Date(dateStr);
  if (Number.isNaN(start.getTime())) return null;

  const expiry = new Date(start);
  expiry.setFullYear(expiry.getFullYear() + 5);

  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalDays = Math.max(1, Math.round((expiry.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const progressPercent = Math.max(0, Math.min(100, Math.round((daysLeft / totalDays) * 100)));

  const absDays = Math.abs(daysLeft);
  const years = Math.floor(absDays / 365);
  const months = Math.floor((absDays % 365) / 30);
  const days = (absDays % 365) % 30;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yıl`);
  if (months > 0) parts.push(`${months} ay`);
  if (days > 0 || parts.length === 0) parts.push(`${days} gün`);

  return {
    expiryDate: expiry,
    daysLeft,
    isExpired: daysLeft < 0,
    isCritical: daysLeft >= 0 && daysLeft <= 60,
    isWarning: daysLeft > 60 && daysLeft <= 90,
    humanText: parts.join(' '),
    progressPercent,
  };
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [title, setTitle] = useState(user?.title || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [telegramChatId, setTelegramChatId] = useState(user?.telegramChatId || '');
  const [saving, setSaving] = useState(false);

  const [titleClass, setTitleClass] = useState(user?.professionalProfile?.titleClass || 'A Sınıfı IGU');
  const [certificateNo, setCertificateNo] = useState(user?.professionalProfile?.certificateNo || '');
  const [certificateDate, setCertificateDate] = useState(
    user?.professionalProfile?.certificateDate
      ? user.professionalProfile.certificateDate.substring(0, 10)
      : ''
  );
  const [savingCert, setSavingCert] = useState(false);

  const [telegramLinkData, setTelegramLinkData] = useState<{ token: string; link: string } | null>(null);
  const [loadingTelegramLink, setLoadingTelegramLink] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setTitle(user.title || '');
    setDepartment(user.department || '');
    setTelegramChatId(user.telegramChatId || '');
    setTitleClass(user.professionalProfile?.titleClass || user.title || 'A Sınıfı IGU');
    setCertificateNo(user.professionalProfile?.certificateNo || '');
    setCertificateDate(
      user.professionalProfile?.certificateDate
        ? user.professionalProfile.certificateDate.substring(0, 10)
        : ''
    );
  }, [user]);

  const { data: facilities = [], isLoading: facilitiesLoading } = useQuery<Facility[]>({
    queryKey: ['user-facilities', user?.facilities],
    queryFn: async () => {
      if (!user?.facilities?.length) return [];
      const res = await api.get('/settings/facilities');
      if (!res.ok) throw new Error('Tesisler yüklenemedi');
      const all = await res.json();
      return all.filter((f: Facility) => user.facilities.includes(f.id));
    },
    enabled: !!user?.facilities?.length,
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Ad Soyad alanı zorunludur.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/auth/me', {
        fullName: fullName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        title: title.trim() || null,
        department: department.trim() || null,
        telegramChatId: telegramChatId.trim() || null,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Profil güncellenemedi.');
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      await refreshUser();
      toast.success('Profil bilgileriniz güncellendi.');
    } catch (err: any) {
      toast.error(err?.message || 'Profil güncellenirken hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateTelegramLink = async () => {
    setLoadingTelegramLink(true);
    try {
      const res = await api.get('/settings/telegram/connect');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Telegram bağlantı kodu oluşturulamadı.');
      }
      setTelegramLinkData(data);
      toast.success('Telegram bağlantı kodu oluşturuldu.');
    } catch (err: any) {
      toast.error(err?.message || 'Telegram bağlantı linki alınamadı.');
    } finally {
      setLoadingTelegramLink(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    setSaving(true);
    try {
      const res = await api.put('/auth/me', { telegramChatId: null });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bağlantı kesilemedi.');
      if (data.token) localStorage.setItem('token', data.token);
      setTelegramChatId('');
      setTelegramLinkData(null);
      await refreshUser();
      toast.success('Telegram bağlantısı kaldırıldı.');
    } catch (err: any) {
      toast.error(err?.message || 'Telegram bağlantısı kaldırılamadı.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  const roleLabels: Record<string, { label: string; cls: string }> = {
    admin: {
      label: 'Sistem Yöneticisi',
      cls: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30',
    },
    management: {
      label: 'Yönetim',
      cls: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
    },
    safety: {
      label: 'İSG / SEÇ Uzmanı',
      cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    },
    user: {
      label: 'Standart Kullanıcı',
      cls: 'bg-muted text-muted-foreground border-border',
    },
  };

  const accessibleModules = user?.accessibleModules || [];
  const prof = user?.professionalProfile;
  const certCountdown = computeCertificateCountdown(certificateDate || prof?.certificateDate);

  const handleSaveCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCert(true);
    try {
      const res = await api.put('/auth/me', {
        titleClass: titleClass.trim() || null,
        certificateNo: certificateNo.trim() || null,
        certificateDate: certificateDate || null,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Sertifika bilgileri güncellenemedi.');
      }
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      await refreshUser();
      toast.success('Sertifika ve belge bilgileriniz güncellendi.');
    } catch (err: any) {
      toast.error(err?.message || 'Sertifika bilgileri kaydedilirken hata oluştu.');
    } finally {
      setSavingCert(false);
    }
  };

  const formatMinutesLabel = (minutes: number, isFullTime?: boolean) => {
    if (isFullTime) return 'Tam Zamanlı';
    const hrs = Math.floor((minutes || 0) / 60);
    const rem = (minutes || 0) % 60;
    if (hrs > 0 && rem > 0) return `${minutes} dk (${hrs} sa ${rem} dk)`;
    if (hrs > 0) return `${minutes} dk (${hrs} saat)`;
    return `${minutes || 0} dk`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-10">
      {/* Üst Profil Özet Kartı */}
      <Card className="rounded-lg border-border/80 overflow-hidden">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-base shrink-0">
              {getInitials(user?.fullName || user?.username)}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
                  {user?.fullName || user?.username}
                </h1>
                <Badge variant="outline" className="text-[11px] font-mono">
                  @{user?.username}
                </Badge>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                {user?.title && <span>{user.title}</span>}
                {user?.title && user?.department && <span>•</span>}
                {user?.department && <span>{user.department}</span>}
                {!user?.title && !user?.department && (
                  <span>Unvan ve departman bilginizi aşağıdan güncelleyebilirsiniz.</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {user?.roles?.map((role) => {
              const info = roleLabels[role] || {
                label: role,
                cls: 'bg-muted text-foreground border-border',
              };
              return (
                <Badge key={role} variant="outline" className={`text-xs ${info.cls}`}>
                  {info.label}
                </Badge>
              );
            })}
            <Badge
              variant="outline"
              className={`text-xs gap-1 ${user?.hasTelegram
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                }`}
            >
              <Send className="w-3 h-3" />
              {user?.hasTelegram ? 'Telegram Bağlı' : 'Telegram Bağlı Değil'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Sol 7 Kolon: Kişisel & İletişim Bilgileri Formu */}
        <div className="lg:col-span-7 space-y-5">
          <Card className="rounded-lg border-border/80">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Kişisel ve İletişim Bilgileri
              </CardTitle>
              <CardDescription className="text-xs">
                Ad soyad, e-posta, telefon, unvan ve kurumsal departman bilgilerinizi güncelleyebilirsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Kullanıcı Adı</Label>
                    <Input
                      value={user?.username || ''}
                      disabled
                      className="h-9 text-xs bg-muted/50 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="profile-fullName" className="text-xs font-medium">
                      Ad Soyad <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="profile-fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Adınız ve Soyadınız"
                      className="h-9 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="profile-email" className="text-xs font-medium flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      E-posta Adresi
                    </Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ad.soyad@mlpcare.com"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="profile-phone" className="text-xs font-medium flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      Telefon Numarası
                    </Label>
                    <Input
                      id="profile-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05XX XXX XX XX"
                      className="h-9 text-xs tabular-nums"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="profile-title" className="text-xs font-medium flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                      Unvan / Görev
                    </Label>
                    <Input
                      id="profile-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Örn: İSG Uzmanı / Teknik Müdür"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Kurumsal Departman</Label>
                    <DepartmentSelect
                      value={department}
                      onChange={setDepartment}
                      allowClear
                      placeholder="Departman seçiniz..."
                    />
                  </div>
                </div>

                {/* Telegram Bildirim Bağlantısı */}
                <div className="pt-3 border-t border-border space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Label htmlFor="profile-tg" className="text-xs font-semibold flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-sky-600" />
                        Telegram Bildirim Kimliği (Chat ID)
                      </Label>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Bildirim ve görev uyarılarını Telegram üzerinden almak için bot bağlantısı kurabilir veya Chat ID girebilirsiniz.
                      </p>
                    </div>
                    {user?.hasTelegram ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={saving}
                        onClick={handleDisconnectTelegram}
                        className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        <Unlink className="w-3 h-3" /> Bağlantıyı Kaldır
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={loadingTelegramLink}
                        onClick={handleGenerateTelegramLink}
                        className="h-7 text-xs gap-1"
                      >
                        {loadingTelegramLink ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Link2 className="w-3 h-3" />
                        )}
                        Bot ile Bağlantı Linki Oluştur
                      </Button>
                    )}
                  </div>

                  <Input
                    id="profile-tg"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    placeholder="Örn: 123456789 (Telegram Chat ID)"
                    className="h-9 text-xs font-mono tabular-nums"
                  />

                  {telegramLinkData && (
                    <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 space-y-2 text-xs">
                      <div className="font-semibold text-sky-900 dark:text-sky-200 flex items-center justify-between gap-2">
                        <span>Bağlantı Kodu: {telegramLinkData.token}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard?.writeText(telegramLinkData.link);
                            toast.success('Bağlantı linki kopyalandı.');
                          }}
                          className="h-6 px-2 text-[11px] gap-1"
                        >
                          <Copy className="w-3 h-3" /> Kopyala
                        </Button>
                      </div>
                      <a
                        href={telegramLinkData.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline font-medium break-all"
                      >
                        {telegramLinkData.link}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-border flex justify-end">
                  <Button type="submit" size="sm" disabled={saving} className="h-8 text-xs gap-1.5 px-4">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Değişiklikleri Kaydet
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Belge, Sertifika ve İSG Atama Bilgileri */}
          <Card className="rounded-lg border-border/80">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    Belge, Sertifika ve Atama Bilgilerim
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Sertifika bilgilerinizi güncelleyebilir, 5 yıllık vize geri sayımınızı ve tesis atamalarınızı takip edebilirsiniz.
                  </CardDescription>
                </div>
                {certCountdown && (
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold tabular-nums ${certCountdown.isExpired
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent'
                        : certCountdown.isCritical
                          ? 'bg-destructive/10 text-destructive border-destructive/30'
                          : certCountdown.isWarning
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      }`}
                  >
                    {certCountdown.isExpired
                      ? `Süresi Doldu (${Math.abs(certCountdown.daysLeft)} gün)`
                      : `${certCountdown.daysLeft} Gün Kaldı`}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-5">
              {/* Sertifika Süresi Geri Sayım Kartı */}
              {certCountdown ? (
                <div
                  className={`p-3.5 rounded-lg border space-y-2.5 ${certCountdown.isExpired
                      ? 'border-destructive/40 bg-destructive/5'
                      : certCountdown.isCritical
                        ? 'border-destructive/30 bg-destructive/5'
                        : certCountdown.isWarning
                          ? 'border-amber-500/30 bg-amber-500/5'
                          : 'border-emerald-500/30 bg-emerald-500/5'
                    }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {certCountdown.isExpired || certCountdown.isCritical ? (
                        <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                      ) : certCountdown.isWarning ? (
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {certCountdown.isExpired
                            ? 'Sertifika Vize Süresi Dolmuş'
                            : certCountdown.isCritical
                              ? 'Sertifika Vize Yenileme Süresi Kritik'
                              : certCountdown.isWarning
                                ? 'Sertifika Vize Yenileme Tarihi Yaklaşıyor'
                                : 'Sertifika Geçerli (5 Yıllık Vize Takibi)'}
                        </p>
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          Son Geçerlilik Tarihi:{' '}
                          <strong className="text-foreground">
                            {certCountdown.expiryDate.toLocaleDateString('tr-TR')}
                          </strong>
                        </p>
                      </div>
                    </div>

                    <div className="text-right tabular-nums">
                      <p
                        className={`text-sm font-bold ${certCountdown.isExpired || certCountdown.isCritical
                            ? 'text-destructive'
                            : certCountdown.isWarning
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                      >
                        {certCountdown.isExpired
                          ? `${certCountdown.humanText} geçti`
                          : `${certCountdown.humanText} kaldı`}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {certCountdown.isExpired
                          ? `-${Math.abs(certCountdown.daysLeft).toLocaleString('tr-TR')} gün`
                          : `Toplam ${certCountdown.daysLeft.toLocaleString('tr-TR')} gün`}
                      </p>
                    </div>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${certCountdown.isExpired || certCountdown.isCritical
                          ? 'bg-destructive'
                          : certCountdown.isWarning
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      style={{ width: `${certCountdown.progressPercent}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-dashed border-border bg-muted/20 flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    Sertifika tarihini girdiğinizde 5 yıllık vize geçerlilik süresi ve kalan gün geri sayımı otomatik hesaplanır.
                  </span>
                </div>
              )}

              {/* Sertifika Bilgisi Düzenleme Formu */}
              <form onSubmit={handleSaveCertificate} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Sertifika Sınıfı</Label>
                    <Select value={titleClass} onValueChange={setTitleClass}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Sınıf seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        {CERTIFICATE_CLASSES.map((cls) => (
                          <SelectItem key={cls} value={cls} className="text-xs">
                            {cls}
                          </SelectItem>
                        ))}
                        {titleClass && !CERTIFICATE_CLASSES.includes(titleClass) && (
                          <SelectItem value={titleClass} className="text-xs">
                            {titleClass}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="profile-certNo" className="text-xs font-medium">
                      Sertifika / Belge No
                    </Label>
                    <Input
                      id="profile-certNo"
                      value={certificateNo}
                      onChange={(e) => setCertificateNo(e.target.value)}
                      placeholder="Örn: İSG-123456"
                      className="h-9 text-xs font-mono tabular-nums"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="profile-certDate" className="text-xs font-medium">
                      Sertifika / Vize Başlangıç Tarihi
                    </Label>
                    <Input
                      id="profile-certDate"
                      type="date"
                      value={certificateDate}
                      onChange={(e) => setCertificateDate(e.target.value)}
                      className="h-9 text-xs tabular-nums"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" size="sm" variant="outline" disabled={savingCert} className="h-8 text-xs gap-1.5 px-3.5">
                    {savingCert ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Sertifika Bilgilerini Kaydet
                  </Button>
                </div>
              </form>

              {prof ? (
                <>
                  {/* Kurum & Toplam Atama Özeti */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
                    <div className="p-3 rounded-lg border border-border/70 bg-muted/20 space-y-0.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                        Çalışma / Kurum
                      </span>
                      <span className="text-xs font-bold text-foreground truncate block">
                        {prof.employmentType}
                        {prof.osgbName ? ` (${prof.osgbName})` : ''}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg border border-primary/25 bg-primary/5 space-y-0.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary block">
                        Toplam Aktif Atama
                      </span>
                      <span className="text-xs font-bold text-foreground tabular-nums">
                        {formatMinutesLabel(prof.totalAssignedMinutes)}
                      </span>
                    </div>
                  </div>

                  {/* Atanan Tesisler, Miktarlar ve Atama Belgeleri */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <ClipboardCheck className="w-3.5 h-3.5 text-primary" />
                        Tesis Atamaları ve Belgeler ({prof.assignments.length})
                      </span>
                    </div>

                    {prof.assignments.length > 0 ? (
                      <div className="space-y-2.5">
                        {prof.assignments.map((asg) => {
                          const isActiveAsg = asg.status === 'Aktif' || asg.status === 'ACTIVE';
                          return (
                            <div
                              key={asg.id}
                              className="p-3 rounded-lg border border-border/80 bg-card space-y-2"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-foreground">
                                      {asg.facilityName}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] ${isActiveAsg
                                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                          : 'bg-muted text-muted-foreground border-border'
                                        }`}
                                    >
                                      {asg.status}
                                    </Badge>
                                    {asg.dangerClass && (
                                      <Badge variant="secondary" className="text-[10px]">
                                        {asg.dangerClass}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground mt-1 tabular-nums">
                                    <span>Görev: <strong className="text-foreground">{asg.type}</strong></span>
                                    <span>•</span>
                                    <span className="inline-flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-primary" />
                                      Miktar: <strong className="text-foreground">{formatMinutesLabel(asg.durationMinutes, asg.isFullTime)}</strong>
                                    </span>
                                    <span>•</span>
                                    <span>
                                      Başlangıç: {new Date(asg.startDate).toLocaleDateString('tr-TR')}
                                      {asg.endDate ? ` — Bitiş: ${new Date(asg.endDate).toLocaleDateString('tr-TR')}` : ''}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {asg.documents && asg.documents.length > 0 && (
                                <div className="pt-2 border-t border-border/60 flex flex-wrap gap-1.5">
                                  {asg.documents.map((doc) => {
                                    const fileUrl = doc.filePath.startsWith('http')
                                      ? doc.filePath
                                      : `${BASE_URL}${doc.filePath.startsWith('/') ? '' : '/'}${doc.filePath}`;
                                    return (
                                      <a
                                        key={doc.id}
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/30 hover:bg-muted text-[11px] font-medium text-foreground transition-colors"
                                      >
                                        <FileText className="w-3 h-3 text-primary shrink-0" />
                                        <span className="truncate max-w-[200px]">{doc.name}</span>
                                        <span className="text-[10px] text-muted-foreground tabular-nums">
                                          ({new Date(doc.date).toLocaleDateString('tr-TR')})
                                        </span>
                                        <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                                      </a>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground py-3 text-center border border-dashed border-border rounded-lg">
                        Henüz tesis ataması bulunmuyor.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                  Henüz tesis ataması kaydı bulunmuyor. Yukarıdan sertifika bilgilerinizi kaydedebilirsiniz.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sağ 5 Kolon: Erişebildiğim Modüller + Tesisler */}
        <div className="lg:col-span-5 space-y-5">
          {/* Erişebildiği Modüller */}
          <Card className="rounded-lg border-border/80">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Erişebildiğim Modüller
                </CardTitle>
                <Badge variant="secondary" className="text-[11px] tabular-nums">
                  {accessibleModules.length} Modül
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Rolünüz ve özel yetkileriniz kapsamında kullanabildiğiniz portal modülleri.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {accessibleModules.length > 0 ? (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {accessibleModules.map((mod) => {
                    const targetPath = MODULE_ROUTE_MAP[mod.code];
                    return (
                      <div
                        key={mod.code}
                        className="flex items-center justify-between gap-2.5 p-2.5 rounded-lg border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors duration-200"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="text-xs font-semibold text-foreground truncate">
                              {mod.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                            <span className="font-mono text-[10px]">{mod.code}</span>
                            {mod.source && (
                              <>
                                <span>•</span>
                                <span>{mod.source}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {targetPath && (
                          <Link
                            to={targetPath}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-background hover:bg-muted text-[11px] font-medium text-foreground shrink-0 transition-colors"
                          >
                            Aç <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5">
                  <AlertCircle className="w-5 h-5 text-muted-foreground/60" />
                  <span>Tanımlı modül yetkisi bulunamadı.</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Erişim Tesisleri */}
          <Card className="rounded-lg border-border/80">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Yetkili Tesislerim
                </CardTitle>
                <Badge variant="secondary" className="text-[11px] tabular-nums">
                  {facilities.length} Tesis
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {facilitiesLoading ? (
                <div className="space-y-2">
                  <div className="h-12 rounded-lg bg-muted animate-pulse" />
                  <div className="h-12 rounded-lg bg-muted animate-pulse" />
                </div>
              ) : facilities.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {facilities.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border/60 bg-muted/20"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-xs text-foreground truncate">{f.name}</p>
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          {f.dangerClass} • {f.employeeCount} çalışan
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Size atanmış tesis bulunmuyor.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Oturum & Güvenlik Özeti */}
          <Card className="rounded-lg border-border/80">
            <CardHeader className="pb-2.5 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Hesap &amp; Oturum
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
              <p>Oturumunuz aktif ve yetkilendirme token&apos;ınız geçerlidir.</p>
              {user?.employmentType && (
                <p>
                  Çalışma Şekli: <strong className="text-foreground">{user.employmentType}</strong>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
