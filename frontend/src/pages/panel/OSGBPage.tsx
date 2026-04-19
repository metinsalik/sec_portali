import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Plus, Search, Briefcase, Edit, Loader2, Phone, Mail, 
  MapPin, User, LayoutGrid, List as ListIcon, 
  ChevronRight, Eye, MoreHorizontal, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { IL_ILCE_DATA, type City } from '@/data/turkiye';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';

interface OSGBCompany {
  id: number;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  city?: string;
  district?: string;
  isActive: boolean;
}

const emptyForm = { 
  name: '', 
  contact: '', 
  phone: '', 
  email: '', 
  city: '' as City | '', 
  district: '' 
};

export default function OSGBPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<OSGBCompany | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: companies = [], isLoading } = useQuery<OSGBCompany[]>({
    queryKey: ['osgb'],
    queryFn: async () => {
      const res = await api.get('/panel/osgb');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const res = editItem
        ? await api.put(`/panel/osgb/${editItem.id}`, data)
        : await api.post('/panel/osgb', data);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['osgb'] });
      setModalOpen(false); setEditItem(null); setForm(emptyForm);
    },
  });

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (c: OSGBCompany) => {
    setEditItem(c);
    setForm({ 
      name: c.name, 
      contact: c.contact ?? '', 
      phone: c.phone ?? '', 
      email: c.email ?? '',
      city: (c.city as City) ?? '',
      district: c.district ?? ''
    });
    setModalOpen(true);
  };

  const handleCityChange = (city: string) => {
    setForm(prev => ({ ...prev, city: city as City, district: '' }));
  };

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.contact?.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">OSGB Firmaları</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Sistemde kayıtlı Ortak Sağlık Güvenlik Birimlerini yönetin.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-50/50 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("h-8 w-8 rounded-lg transition-all", viewMode === 'list' && "bg-white dark:bg-slate-700 shadow-sm text-primary")}
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="w-3.5 h-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("h-8 w-8 rounded-lg transition-all", viewMode === 'grid' && "bg-white dark:bg-slate-700 shadow-sm text-primary")}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
          </div>
          <Button onClick={openAdd} className="rounded-xl h-10 px-5 font-semibold text-sm bg-slate-900 hover:bg-slate-800 shadow-sm gap-2 text-white">
            <Plus className="w-4 h-4" /> Yeni OSGB
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input 
            placeholder="Firma adı veya yetkili ile ara..." 
            className="pl-10 h-11 bg-slate-50/50 border-none rounded-xl text-sm font-medium focus-visible:ring-primary/10" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-slate-50/50 rounded-2xl animate-pulse border border-slate-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/30 rounded-2xl border border-dashed border-slate-200">
          <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-semibold text-xs">OSGB firması bulunamadı</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <Card key={c.id} className={cn(
              "border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900 overflow-hidden hover:ring-1 hover:ring-primary/20 transition-all duration-300 group",
              !c.isActive && 'opacity-60 grayscale'
            )}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-primary rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm group-hover:scale-110 transition-transform">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate(`/panel/osgb/${c.id}`)}>
                      <Eye className="w-4 h-4 text-slate-400" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(c)}>
                      <Edit className="w-4 h-4 text-slate-400" />
                    </Button>
                  </div>
                </div>
                <div className="mb-4">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1 group-hover:text-primary transition-colors line-clamp-1">{c.name}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 tracking-wide">
                    <MapPin className="w-3 h-3" />
                    {c.city || 'Konum Belirtilmedi'}
                  </div>
                </div>
                <div className="space-y-2.5 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.contact || 'Yetkili Belirtilmedi'}</span>
                  </div>
                  {c.phone && (
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={() => navigate(`/panel/osgb/${c.id}`)}
                  className="w-full mt-6 bg-slate-50 hover:bg-primary hover:text-white text-slate-600 border-none shadow-none h-10 rounded-xl transition-all font-semibold text-xs gap-2"
                >
                  Yaşam Kartını Aç <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500">OSGB Firması</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500">Lokasyon</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500">Yetkili / İletişim</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filtered.map((c) => (
                  <tr key={c.id} className={cn("hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors group", !c.isActive && 'opacity-60')}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-primary rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-800 group-hover:bg-primary group-hover:text-white transition-all">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white text-sm hover:text-primary cursor-pointer transition-colors" onClick={() => navigate(`/panel/osgb/${c.id}`)}>
                          {c.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-semibold">{c.city || '—'}</span>
                        <span className="text-[10px] text-slate-400 font-bold tracking-tight">{c.district || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
                          <User className="w-3 h-3 opacity-50" /> {c.contact || '—'}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
                          <Phone className="w-3 h-3 opacity-50" /> {c.phone || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => navigate(`/panel/osgb/${c.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100 transition-colors" onClick={() => openEdit(c)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="h-9 px-3 rounded-xl hover:bg-primary/5 text-primary font-bold text-xs gap-2"
                          onClick={() => navigate(`/panel/osgb/${c.id}`)}
                        >
                          Kart <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={(v) => { setModalOpen(v); if (!v) setEditItem(null); }}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-white dark:bg-slate-950">
          <DialogHeader className="px-8 py-6 bg-slate-900 text-white">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <Briefcase className="w-5 h-5 text-white/70" />
              </div>
              <DialogTitle className="text-lg font-semibold tracking-tight">
                {editItem ? 'OSGB Firmasını Düzenle' : 'Yeni OSGB Firması Tanımla'}
              </DialogTitle>
            </div>
          </DialogHeader>
          <form onSubmit={(ev) => { ev.preventDefault(); saveMutation.mutate(form); }} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">Firma Adı *</label>
                <Input 
                  value={form.name} 
                  onChange={(ev) => setForm({ ...form, name: ev.target.value })} 
                  className="rounded-xl border-slate-100 h-11 text-sm font-medium focus-visible:ring-primary/10 bg-slate-50/50"
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">İl</label>
                  <Select value={form.city} onValueChange={handleCityChange}>
                    <SelectTrigger className="rounded-xl border-slate-100 h-11 text-sm font-medium focus:ring-primary/10 bg-slate-50/50">
                      <SelectValue placeholder="Şehir seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(IL_ILCE_DATA).map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">İlçe</label>
                  <Select 
                    value={form.district} 
                    onValueChange={(v) => setForm({ ...form, district: v })}
                    disabled={!form.city}
                  >
                    <SelectTrigger className="rounded-xl border-slate-100 h-11 text-sm font-medium focus:ring-primary/10 bg-slate-50/50">
                      <SelectValue placeholder={form.city ? "İlçe seçin" : "Önce il seçin"} />
                    </SelectTrigger>
                    <SelectContent>
                      {form.city && IL_ILCE_DATA[form.city as City].map(dist => (
                        <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">Yetkili Kişi</label>
                <Input 
                  value={form.contact} 
                  onChange={(ev) => setForm({ ...form, contact: ev.target.value })} 
                  placeholder="Firma Yetkilisi"
                  className="rounded-xl border-slate-100 h-11 text-sm font-medium focus-visible:ring-primary/10 bg-slate-50/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">Telefon</label>
                  <Input 
                    value={form.phone} 
                    onChange={(ev) => setForm({ ...form, phone: ev.target.value })} 
                    className="rounded-xl border-slate-100 h-11 text-sm font-medium focus-visible:ring-primary/10 bg-slate-50/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">E-posta</label>
                  <Input 
                    type="email" 
                    value={form.email} 
                    onChange={(ev) => setForm({ ...form, email: ev.target.value })} 
                    className="rounded-xl border-slate-100 h-11 text-sm font-medium focus-visible:ring-primary/10 bg-slate-50/50"
                  />
                </div>
              </div>
            </div>
            
            {saveMutation.isError && (
              <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold border border-rose-100 flex items-center gap-3">
                <Loader2 className="w-4 h-4 shrink-0" />
                {(saveMutation.error as Error).message}
              </div>
            )}
            
            <DialogFooter className="gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="rounded-xl h-11 px-6 font-bold text-xs text-slate-400">Vazgeç</Button>
              <Button type="submit" disabled={saveMutation.isPending} className="rounded-xl h-11 px-8 font-bold text-xs bg-slate-900 hover:bg-slate-800 shadow-lg text-white">
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
