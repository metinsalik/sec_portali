import React, { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { IL_ILCE_DATA } from '@/data/turkiye';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Building2, Landmark, Phone, Mail, Globe, MapPin, 
  Shield, Users, Image as ImageIcon, Upload, Loader2, CheckCircle2, Lock
} from 'lucide-react';

const FACILITY_TYPES = [
  "Hastane", 
  "Ofis", 
  "Depo", 
  "Tıp Merkezi", 
  "Diyaliz Merkezi", 
  "Çağrı Merkezi", 
  "Konuk Evi", 
  "Şantiye"
];

const DANGER_CLASSES = [
  "Az Tehlikeli", 
  "Tehlikeli", 
  "Çok Tehlikeli"
];

export default function BasicInfoStep({ data, update }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const cities = Object.keys(IL_ILCE_DATA).sort((a, b) => a.localeCompare(b, 'tr'));
  const selectedCity = data.city as keyof typeof IL_ILCE_DATA;
  const availableDistricts = selectedCity && IL_ILCE_DATA[selectedCity] ? IL_ILCE_DATA[selectedCity] : [];

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo dosyası 5MB'dan küçük olmalıdır.");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.customFetch('/settings/facilities/upload-logo', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Logo yüklenemedi');
      }

      const result = await res.json();
      update({ logoUrl: result.url });
      toast.success('Logo başarıyla yüklendi.');
    } catch (err: any) {
      toast.error(err.message || 'Logo yüklenirken hata oluştu');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Tesis Genel & Kurumsal Bilgileri
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Tesis kimlik, logo, resmi unvan, vergi/SGK ve iletişim parametrelerini eksiksiz tanımlayınız.
        </p>
      </div>

      {/* 1. Kimlik ve Sınıflandırma */}
      <div className="bg-card border rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Tesis Kimliği & Sınıflandırma</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Tesis Kodu (Otomatik)</Label>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5 text-muted-foreground/70" /> Otomatik
              </span>
            </div>
            <Input 
              value={data.id || 'Oto: TES-...'} 
              disabled
              className="h-9 text-xs font-mono font-bold bg-muted/50 border-dashed cursor-not-allowed text-primary"
            />
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <Label className="text-xs font-semibold">Tesis Resmi Adı <span className="text-rose-500">*</span></Label>
            <Input 
              placeholder="Örn: Medical Park Göztepe Hastanesi" 
              value={data.name || ''} 
              onChange={e => update({ name: e.target.value })} 
              className="h-9 text-xs font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Kısa Kod / Kısaltma</Label>
            <Input 
              placeholder="Örn: MP-GOZTEPE" 
              value={data.shortName || ''} 
              onChange={e => update({ shortName: e.target.value })} 
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Tesis Tipi <span className="text-rose-500">*</span></Label>
            <Select value={data.type || ''} onValueChange={v => update({ type: v })}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Tesis Tipi Seçiniz" />
              </SelectTrigger>
              <SelectContent>
                {FACILITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Tehlike Sınıfı <span className="text-rose-500">*</span></Label>
            <Select value={data.dangerClass || 'Az Tehlikeli'} onValueChange={v => update({ dangerClass: v })}>
              <SelectTrigger className="h-9 text-xs font-medium">
                <SelectValue placeholder="Tehlike Sınıfı" />
              </SelectTrigger>
              <SelectContent>
                {DANGER_CLASSES.map(dc => <SelectItem key={dc} value={dc}>{dc}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              Çalışan Sayısı
            </Label>
            <Input 
              type="number"
              min="0"
              placeholder="0" 
              value={data.employeeCount !== undefined ? data.employeeCount : ''} 
              onChange={e => update({ employeeCount: parseInt(e.target.value) || 0 })} 
              className="h-9 text-xs"
            />
          </div>

          {/* Logo Yükleme Alanı */}
          <div className="space-y-1.5 lg:col-span-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-primary" />
              Tesis Logosu Yükle
            </Label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-10 rounded-xl border bg-muted/40 flex items-center justify-center shrink-0 overflow-hidden">
                {data.logoUrl ? (
                  <img src={data.logoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
                ) : (
                  <Building2 className="w-5 h-5 text-muted-foreground/50" />
                )}
              </div>

              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleLogoUpload}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="h-9 text-xs flex-1 gap-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span>Yükleniyor...</span>
                  </>
                ) : data.logoUrl ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="truncate">Logoyu Değiştir</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Logo Dosyası Seç (PNG, JPG)</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Ticari, Mali & SGK Bilgileri */}
      <div className="bg-card border rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Landmark className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Resmi Ticari & Mali Bilgiler (Vergi & SGK)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5 lg:col-span-2">
            <Label className="text-xs font-semibold">Ticari Unvan (Resmi Şirket Ünvanı)</Label>
            <Input 
              placeholder="Örn: MLP Sağlık Hizmetleri A.Ş." 
              value={data.commercialTitle || ''} 
              onChange={e => update({ commercialTitle: e.target.value })} 
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">NACE Kodu</Label>
            <Input 
              placeholder="Örn: 86.10.01" 
              value={data.naceCode || ''} 
              onChange={e => update({ naceCode: e.target.value })} 
              className="h-9 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Vergi Dairesi</Label>
            <Input 
              placeholder="Örn: Kadıköy V.D." 
              value={data.taxOffice || ''} 
              onChange={e => update({ taxOffice: e.target.value })} 
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Vergi Numarası (VKN)</Label>
            <Input 
              placeholder="10 Haneli VKN" 
              maxLength={11}
              value={data.taxNumber || ''} 
              onChange={e => update({ taxNumber: e.target.value })} 
              className="h-9 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">SGK İşyeri Sicil Numarası</Label>
            <Input 
              placeholder="26 Haneli SGK Sicil No" 
              value={data.sgkNumber || ''} 
              onChange={e => update({ sgkNumber: e.target.value })} 
              className="h-9 text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* 3. İletişim ve Konum Bilgileri */}
      <div className="bg-card border rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 pb-2 border-b">
          <MapPin className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">İletişim & Lokasyon Adres Bilgileri</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">İl (Şehir) <span className="text-rose-500">*</span></Label>
            <Select 
              value={data.city || ''} 
              onValueChange={v => update({ city: v, district: '' })}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Şehir Seçiniz" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">İlçe</Label>
            <Select 
              value={data.district || ''} 
              onValueChange={v => update({ district: v })}
              disabled={!selectedCity || availableDistricts.length === 0}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder={selectedCity ? "İlçe Seçiniz" : "Önce Şehir Seçiniz"} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {availableDistricts.map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              Telefon Numarası
            </Label>
            <Input 
              placeholder="0 (212) 000 00 00" 
              value={data.phone || ''} 
              onChange={e => update({ phone: e.target.value })} 
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              E-Posta Adresi
            </Label>
            <Input 
              type="email"
              placeholder="ornek@kurum.com" 
              value={data.email || ''} 
              onChange={e => update({ email: e.target.value })} 
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              Web Sitesi
            </Label>
            <Input 
              placeholder="https://www.ornek.com" 
              value={data.website || ''} 
              onChange={e => update({ website: e.target.value })} 
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5 lg:col-span-3">
            <Label className="text-xs font-semibold">Tam Açık Adres</Label>
            <Textarea 
              placeholder="Cadde, sokak, bina no, posta kodu vb. detaylı açık adres..." 
              value={data.fullAddress || ''} 
              onChange={e => update({ fullAddress: e.target.value })} 
              className="min-h-[75px] text-xs resize-y"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
