import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building2,
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  Shield,
  Users,
  Ruler,
  Briefcase,
  AlertCircle,
} from 'lucide-react';

interface BuildingBlock {
  id?: number;
  name: string;
  constructionYear?: number | string | null;
  buildingHeight?: number | string | null;
  structureHeight?: number | string | null;
  buildingFloors?: number | string | null;
  structureFloors?: number | string | null;
  closedArea?: number | string | null;
  parkingArea?: number | string | null;
  gardenArea?: number | string | null;
  bedCapacity?: number | string | null;
}

interface FacilityAssignment {
  id: number;
  type: string;
  status?: string;
  durationMinutes?: number;
  isFullTime?: boolean;
  professional?: { fullName: string; titleClass?: string } | null;
  employerRep?: { fullName: string; title?: string } | null;
}

interface FacilityDetail {
  id: string;
  name: string;
  shortName?: string | null;
  type?: string | null;
  city?: string | null;
  district?: string | null;
  fullAddress?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  commercialTitle?: string | null;
  taxOffice?: string | null;
  taxNumber?: string | null;
  sgkNumber?: string | null;
  naceCode?: string | null;
  dangerClass: string;
  employeeCount: number;
  logoUrl?: string | null;
  isActive: boolean;
  buildings?: BuildingBlock[];
  assignments?: FacilityAssignment[];
}

function InfoField({ label, value, mono = false }: { label: string; value?: string | number | null; mono?: boolean }) {
  const display = value !== null && value !== undefined && String(value).trim() !== '' ? String(value) : '—';
  return (
    <div className="p-3 rounded-lg border border-border/70 bg-muted/20 space-y-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
        {label}
      </span>
      <span className={`text-xs font-semibold text-foreground break-words block ${mono ? 'font-mono tabular-nums' : ''}`}>
        {display}
      </span>
    </div>
  );
}

export default function MyFacilityPage() {
  const { user } = useAuth();

  const assignedFacilityIds = useMemo(() => {
    const ids = new Set<string>(user?.facilities || []);
    user?.professionalProfile?.assignments?.forEach((a) => {
      if (a.facilityId) ids.add(a.facilityId);
    });
    return Array.from(ids);
  }, [user]);

  const { data: allFacilities = [], isLoading } = useQuery<FacilityDetail[]>({
    queryKey: ['my-facilities-detail'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) throw new Error('Tesis bilgileri yüklenemedi');
      return res.json();
    },
  });

  const myFacilities = useMemo(() => {
    if (assignedFacilityIds.length > 0) {
      const matched = allFacilities.filter((f) => assignedFacilityIds.includes(f.id));
      if (matched.length > 0) return matched;
    }
    if (user?.isAdmin || user?.isManagement) {
      return allFacilities.filter((f) => f.isActive);
    }
    return [];
  }, [allFacilities, assignedFacilityIds, user]);

  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    if (myFacilities.length === 0) return;
    if (selectedId && myFacilities.some((f) => f.id === selectedId)) return;
    const stored = localStorage.getItem('activeFacilityId');
    const initial =
      (stored && myFacilities.find((f) => f.id === stored)?.id) || myFacilities[0].id;
    setSelectedId(initial);
  }, [myFacilities, selectedId]);

  const facility = myFacilities.find((f) => f.id === selectedId) || myFacilities[0] || null;

  const dangerBadgeCls = (dc?: string) => {
    if (dc === 'Çok Tehlikeli') return 'bg-destructive/10 text-destructive border-destructive/30';
    if (dc === 'Tehlikeli') return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
    return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-10">
      {/* Üst Başlık ve Çoklu Tesis Seçici */}
      <Card className="rounded-lg border-border/80">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold tracking-tight text-foreground truncate">
                  {facility ? facility.name : 'Tesis ve Bilgileri'}
                </h1>
                {facility && (
                  <Badge variant="outline" className="text-[11px] font-mono">
                    {facility.id}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {facility?.commercialTitle || 'Atanmış olduğunuz tesisin kurumsal, resmi ve fiziki bilgileri.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {facility && (
              <Badge variant="outline" className={`text-xs ${dangerBadgeCls(facility.dangerClass)}`}>
                {facility.dangerClass}
              </Badge>
            )}
            {myFacilities.length > 1 && (
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="h-8 w-[240px] text-xs">
                  <SelectValue placeholder="Tesis seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {myFacilities.map((f) => (
                    <SelectItem key={f.id} value={f.id} className="text-xs">
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="h-48 rounded-lg bg-muted animate-pulse" />
          <div className="h-48 rounded-lg bg-muted animate-pulse" />
        </div>
      ) : !facility ? (
        <Card className="rounded-lg border-border/80">
          <CardContent className="py-10 text-center space-y-2">
            <AlertCircle className="w-7 h-7 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-foreground">Atanmış tesis bulunamadı</p>
            <p className="text-xs text-muted-foreground">
              Hesabınıza henüz bir tesis atanmamış. Sistem yöneticinizle iletişime geçebilirsiniz.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {/* Kurumsal & Resmi Bilgiler */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="rounded-lg border-border/80">
              <CardHeader className="pb-3 border-b border-border bg-muted/20">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  Kurumsal Kimlik Bilgileri
                </CardTitle>
                <CardDescription className="text-xs">
                  Tesis kaydında tanımlı ad, ünvan, tip ve çalışan bilgileri.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoField label="Tesis Kodu" value={facility.id} mono />
                <InfoField label="Kısa Adı" value={facility.shortName} />
                <div className="sm:col-span-2">
                  <InfoField label="Tesis Adı" value={facility.name} />
                </div>
                <div className="sm:col-span-2">
                  <InfoField label="Ticari Ünvanı" value={facility.commercialTitle} />
                </div>
                <InfoField label="Tesis Tipi" value={facility.type} />
                <InfoField label="Tehlike Sınıfı" value={facility.dangerClass} />
                <InfoField label="Çalışan Sayısı" value={`${facility.employeeCount ?? 0} çalışan`} mono />
                <InfoField label="Durum" value={facility.isActive ? 'Aktif' : 'Pasif / Arşiv'} />
              </CardContent>
            </Card>

            <Card className="rounded-lg border-border/80">
              <CardHeader className="pb-3 border-b border-border bg-muted/20">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Resmi, Vergi ve İletişim Bilgileri
                </CardTitle>
                <CardDescription className="text-xs">
                  Vergi, SGK, NACE kodu ve iletişim detayları.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoField label="Vergi Dairesi" value={facility.taxOffice} />
                <InfoField label="Vergi Numarası" value={facility.taxNumber} mono />
                <InfoField label="SGK Sicil No" value={facility.sgkNumber} mono />
                <InfoField label="NACE Kodu" value={facility.naceCode} mono />
                <InfoField
                  label="İl / İlçe"
                  value={[facility.city, facility.district].filter(Boolean).join(' / ') || '—'}
                />
                <InfoField label="Telefon" value={facility.phone} mono />
                <InfoField label="E-posta" value={facility.email} />
                <InfoField label="Web Sitesi" value={facility.website} />
                <div className="sm:col-span-2">
                  <InfoField label="Açık Adres" value={facility.fullAddress} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bina ve Blok Bilgileri */}
          <Card className="rounded-lg border-border/80">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Building className="w-4 h-4 text-primary" />
                    Bina ve Fiziki Alan Bilgileri
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Tesise kayıtlı binalar, kat sayıları, yükseklik ve alan metrekareleri.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-[11px] tabular-nums">
                  {facility.buildings?.length || 0} Bina / Blok
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {facility.buildings && facility.buildings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {facility.buildings.map((b, idx) => (
                    <div key={b.id || idx} className="p-3.5 rounded-lg border border-border/80 bg-muted/15 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Ruler className="w-3.5 h-3.5 text-primary" />
                          {b.name}
                        </span>
                        {b.constructionYear && (
                          <Badge variant="outline" className="text-[10px] tabular-nums">
                            Yapım: {b.constructionYear}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground tabular-nums">
                        <div>Bina Katı: <strong className="text-foreground">{b.buildingFloors ?? '—'}</strong></div>
                        <div>Yapı Katı: <strong className="text-foreground">{b.structureFloors ?? '—'}</strong></div>
                        <div>Bina Yük.: <strong className="text-foreground">{b.buildingHeight ? `${b.buildingHeight} m` : '—'}</strong></div>
                        <div>Kapalı Alan: <strong className="text-foreground">{b.closedArea ? `${b.closedArea} m²` : '—'}</strong></div>
                        <div>Otopark: <strong className="text-foreground">{b.parkingArea ? `${b.parkingArea} m²` : '—'}</strong></div>
                        <div>Bahçe: <strong className="text-foreground">{b.gardenArea ? `${b.gardenArea} m²` : '—'}</strong></div>
                        {b.bedCapacity ? (
                          <div>Yatak Kap.: <strong className="text-foreground">{b.bedCapacity}</strong></div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
                  Bu tesise ait kayıtlı bina bilgisi bulunmuyor.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tesis İSG Atamaları */}
          {facility.assignments && facility.assignments.length > 0 && (
            <Card className="rounded-lg border-border/80">
              <CardHeader className="pb-3 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Tesiste Görevli İSG Personeli ve Vekiller
                  </CardTitle>
                  <Badge variant="secondary" className="text-[11px] tabular-nums">
                    {facility.assignments.length} Kayıt
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {facility.assignments.map((asg) => (
                    <div key={asg.id} className="p-3 rounded-lg border border-border/70 bg-muted/20 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {asg.type}
                        </Badge>
                        {asg.status && (
                          <span className="text-[10px] text-muted-foreground">{asg.status}</span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-foreground truncate">
                        {asg.professional?.fullName || asg.employerRep?.fullName || '—'}
                      </p>
                      {(asg.professional?.titleClass || asg.employerRep?.title) && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {asg.professional?.titleClass || asg.employerRep?.title}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
