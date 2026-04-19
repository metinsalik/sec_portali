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
  Users, Activity, User, ExternalLink,
  Edit, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          <div className="md:col-span-2 h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!osgb) return <div className="p-8 text-center text-slate-400 font-semibold tracking-wide text-xs">OSGB bulunamadı.</div>;

  const igus = osgb.professionals.filter(p => p.titleClass.toLowerCase().includes('igu'));
  const hekimler = osgb.professionals.filter(p => p.titleClass.toLowerCase().includes('hekim'));
  const dspler = osgb.professionals.filter(p => p.titleClass.toLowerCase().includes('dsp'));

  const renderPrice = (p: Professional) => {
    if (!p.unitPrice) return '—';
    if (p.employmentType === 'Tam Zamanlı' || p.employmentType === 'Tesis Kadrosu') {
      return `₺${p.unitPrice.toLocaleString('tr-TR')} / Ay`;
    } else {
      return `₺${p.unitPrice.toLocaleString('tr-TR')} / Saat`;
    }
  };

  const ProfessionalTable = ({ title, professionals, count }: { title: string, professionals: Professional[], count: number }) => (
    <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
      <CardHeader className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex flex-row items-center justify-between">
        <CardTitle className="text-[11px] font-bold tracking-wide text-slate-400 flex items-center gap-2">
          <Users className="w-4 h-4" />
          {title}
        </CardTitle>
        <Badge variant="secondary" className="bg-slate-50 text-slate-400 text-[10px] font-bold tracking-wide rounded-lg px-2">
          {count} Kişi
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 tracking-wide">Profesyonel Bilgisi</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 tracking-wide">Sınıf / Ücret</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 tracking-wide">Atanan Tesisler</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {professionals.length > 0 ? professionals.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-lg flex items-center justify-center text-xs font-bold border border-slate-100 dark:border-slate-800 group-hover:bg-primary group-hover:text-white transition-all">
                        {p.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">{p.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 border-slate-200 w-fit">
                        {p.titleClass}
                      </Badge>
                      <span className="text-[10px] font-bold text-primary">{renderPrice(p)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                      {p.assignments && p.assignments.length > 0 ? p.assignments.map((as: any) => (
                        <Badge 
                          key={as.id} 
                          variant="secondary" 
                          className="bg-slate-100 text-slate-600 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"
                          onClick={() => navigate(`/panel/facilities/${as.facilityId}`)}
                        >
                          <Building2 className="w-2.5 h-2.5" />
                          {as.facility.name}
                        </Badge>
                      )) : (
                        <span className="text-[10px] font-medium text-slate-400">Atama yok</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5"
                      onClick={() => navigate(`/panel/professionals/${p.id}`)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <p className="text-[10px] font-bold text-slate-300 tracking-wide">Bu kategoride profesyonel bulunmuyor.</p>
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
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 gap-6">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/panel/osgb')}
            className="w-10 h-10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 hidden md:block" />
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 text-primary rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm">
              <Briefcase className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{osgb.name}</h1>
                {!osgb.isActive && (
                <Badge variant="secondary" className="bg-slate-50 text-slate-400 text-[10px] font-bold tracking-wide">Pasif</Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-400 tracking-wide">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary/70" />
                  {osgb.city || '—'} / {osgb.district || '—'}
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-200" />
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary/70" />
                  {osgb.professionals.length} Profesyonel
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end md:self-center">
          <Button variant="outline" className="rounded-xl h-10 px-4 font-bold text-xs border-slate-200 hover:bg-slate-50">
            <Globe className="w-4 h-4 mr-2 text-primary/70" /> Web Sitesi
          </Button>
          <Button className="rounded-xl h-10 px-5 font-bold text-xs bg-slate-900 hover:bg-slate-800 shadow-sm gap-2">
            <Edit className="w-4 h-4" /> Düzenle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Contact Info */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="px-6 py-5 border-b border-slate-50 dark:border-slate-800">
              <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                İletişim & Yetkili
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-4 group">
                <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 tracking-wide">Yetkili Kişi</p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{osgb.contact || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 tracking-wide">Telefon</p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{osgb.phone || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-slate-400 tracking-wide">E-Posta</p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{osgb.email || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 tracking-wide">Adres</p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {osgb.city ? `${osgb.city} / ${osgb.district}` : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="px-6 py-5 border-b border-slate-50 dark:border-slate-800">
              <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Genel İstatistikler
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[9px] font-bold text-slate-400 tracking-wide mb-1">Profesyoneller</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{osgb.professionals.length}</p>
                </div>
                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[9px] font-bold text-slate-400 tracking-wide mb-1">Aktif Atamalar</p>
                  <p className="text-xl font-bold text-primary">
                    {osgb.professionals.reduce((acc, p) => acc + (p.assignments?.length || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Professionals & Assignments */}
        <div className="lg:col-span-2 space-y-6">
          <ProfessionalTable title="İş Güvenliği Uzmanları (İGU)" professionals={igus} count={igus.length} />
          <ProfessionalTable title="İşyeri Hekimleri" professionals={hekimler} count={hekimler.length} />
          <ProfessionalTable title="Diğer Sağlık Personeli (DSP)" professionals={dspler} count={dspler.length} />
        </div>
      </div>
    </div>
  );
};

export default PanelOSGBLifeCardPage;
