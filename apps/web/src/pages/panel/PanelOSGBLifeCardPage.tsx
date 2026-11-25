import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft, Phone, Mail,
  MapPin, Briefcase, Building2,
  Users, Activity, User, ExternalLink
} from 'lucide-react';

interface Professional {
  id: number;
  fullName: string;
  employmentType: string;
  titleClass: string;
  unitPrice?: number;
  assignments: any[];
}

interface OSGBDetail {
  id: number;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  city?: string;
  district?: string;
  isActive: boolean;
  professionals: Professional[];
}

const PanelOSGBLifeCardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: osgb, isLoading } = useQuery<OSGBDetail>({
    queryKey: ['osgb-detail', id],
    queryFn: async () => {
      const res = await api.get(`/panel/osgb/${id}`);
      if (!res.ok) throw new Error('OSGB yüklenemedi');
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 h-64 bg-muted rounded-lg" />
          <div className="md:col-span-2 h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!osgb) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        OSGB bulunamadı.
      </div>
    );
  }

  const igus = osgb.professionals.filter(p => p.titleClass.toLocaleLowerCase('tr-TR').includes('igu'));
  const hekimler = osgb.professionals.filter(p => p.titleClass.toLocaleLowerCase('tr-TR').includes('hekim'));
  const dspler = osgb.professionals.filter(p => p.titleClass.toLocaleLowerCase('tr-TR').includes('dsp'));

  const renderPrice = (p: Professional) => {
    if (!p.unitPrice) return '—';
    if (p.employmentType === 'Tam Zamanlı' || p.employmentType === 'Tesis Kadrosu') {
      return `₺${p.unitPrice.toLocaleString('tr-TR')} / Ay`;
    }
    return `₺${p.unitPrice.toLocaleString('tr-TR')} / Saat`;
  };

  const ProfessionalTable = ({ title, professionals, count }: { title: string; professionals: Professional[]; count: number }) => (
    <Card className="border border-border shadow-xs rounded-lg bg-card text-card-foreground overflow-hidden">
      <CardHeader className="py-3 px-4 border-b border-border bg-muted/30 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-primary" />
          {title}
        </CardTitle>
        <Badge variant="outline" className="text-[10px] font-semibold h-5 px-2 bg-background border-border tabular-nums">
          {count} Kişi
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/20 border-b border-border">
                <th className="px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Profesyonel</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Sınıf / Ücret</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Atanan Tesisler</th>
                <th className="px-4 py-2.5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {professionals.length > 0 ? professionals.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-muted text-muted-foreground rounded-lg flex items-center justify-center text-xs font-bold border border-border group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                        {p.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-foreground text-xs">{p.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <Badge variant="outline" className="text-[10px] font-medium px-1.5 h-5 border-border w-fit">
                        {p.titleClass}
                      </Badge>
                      <span className="text-[11px] font-semibold text-primary tabular-nums">{renderPrice(p)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[300px]">
                      {p.assignments && p.assignments.length > 0 ? p.assignments.map((as: any) => (
                        <Badge
                          key={as.id}
                          variant="secondary"
                          className="hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer text-[10px] font-medium px-2 h-5 rounded-md flex items-center gap-1"
                          onClick={() => navigate(`/panel/facilities/${as.facilityId}`)}
                        >
                          <Building2 className="w-2.5 h-2.5" />
                          {as.facility.name}
                        </Badge>
                      )) : (
                        <span className="text-[11px] text-muted-foreground">Atama yok</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary"
                      onClick={() => navigate(`/panel/professionals/${p.id}`)}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center">
                    <p className="text-xs text-muted-foreground">Bu kategoride profesyonel bulunmuyor.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 pb-10 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-card text-card-foreground p-4 rounded-lg shadow-xs border border-border gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/panel/osgb')}
            className="w-8 h-8 rounded-lg hover:bg-muted shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="w-px h-8 bg-border hidden md:block shrink-0" />
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 bg-primary/10 text-primary rounded-lg flex items-center justify-center border border-primary/20 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold tracking-tight text-foreground truncate">{osgb.name}</h1>
                {!osgb.isActive && (
                  <Badge variant="secondary" className="text-[10px] font-semibold h-5 px-2">Pasif</Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary/80" />
                  {osgb.city || '—'} / {osgb.district || '—'}
                </div>
                <span className="text-border">•</span>
                <div className="flex items-center gap-1 tabular-nums">
                  <Users className="w-3.5 h-3.5 text-primary/80" />
                  {osgb.professionals.length} Profesyonel
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/panel/osgb')}
            className="h-8 px-3 rounded-lg text-xs"
          >
            Listeye Dön
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Contact Info */}
        <div className="space-y-4">
          <Card className="border border-border shadow-xs rounded-lg bg-card text-card-foreground overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-border bg-muted/30">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-primary" />
                İletişim & Yetkili
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Yetkili Kişi</p>
                  <p className="text-xs font-semibold text-foreground truncate">{osgb.contact || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Telefon</p>
                  <p className="text-xs font-semibold text-foreground tabular-nums">{osgb.phone || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">E-Posta</p>
                  <p className="text-xs font-semibold text-foreground truncate">{osgb.email || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Adres</p>
                  <p className="text-xs font-semibold text-foreground">
                    {osgb.city ? `${osgb.city} / ${osgb.district}` : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="border border-border shadow-xs rounded-lg bg-card text-card-foreground overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-border bg-muted/30">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-primary" />
                Genel İstatistikler
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/20 rounded-lg border border-border text-center">
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">Profesyoneller</p>
                  <p className="text-lg font-bold text-foreground tabular-nums">{osgb.professionals.length}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-lg border border-border text-center">
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">Aktif Atamalar</p>
                  <p className="text-lg font-bold text-primary tabular-nums">
                    {osgb.professionals.reduce((acc, p) => acc + (p.assignments?.length || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Professionals & Assignments */}
        <div className="lg:col-span-2 space-y-4">
          <ProfessionalTable title="İş Güvenliği Uzmanları (İGU)" professionals={igus} count={igus.length} />
          <ProfessionalTable title="İşyeri Hekimleri" professionals={hekimler} count={hekimler.length} />
          <ProfessionalTable title="Diğer Sağlık Personeli (DSP)" professionals={dspler} count={dspler.length} />
        </div>
      </div>
    </div>
  );
};

export default PanelOSGBLifeCardPage;
