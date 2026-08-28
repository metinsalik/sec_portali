import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, PlusCircle, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function IsgDefterPageBuilder() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeFacilityId = localStorage.getItem('activeFacilityId');

  const [authorType, setAuthorType] = useState('İş Güvenliği Uzmanı');
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [mainCategoryId, setMainCategoryId] = useState('none');
  const [categoryId, setCategoryId] = useState('none');
  const [subCategoryId, setSubCategoryId] = useState('none');
  const [riskLevel, setRiskLevel] = useState('Belirlenmedi');
  const [status, setStatus] = useState('Açık');

  // Queries
  const { data: pageData, isLoading: isPageLoading } = useQuery({
    queryKey: ['isg-defter-page', pageId],
    queryFn: async () => {
      // Find the page in the facility pages list
      const res = await api.get(`/safety-management/isg-defter/facilities/${activeFacilityId}/pages`);
      const pages = await res.json();
      const page = pages.find((p: any) => p.id.toString() === pageId);
      if (!page) throw new Error('Sayfa bulunamadı');
      return page;
    },
    enabled: !!pageId && !!activeFacilityId,
  });

  const { data: settings } = useQuery({
    queryKey: ['isg-defter-settings', activeFacilityId],
    queryFn: async () => {
      if (!activeFacilityId || activeFacilityId === 'all') return null;
      const res = await api.get(`/safety-management/isg-defter/facilities/${activeFacilityId}/settings`);
      return res.json();
    },
    enabled: !!activeFacilityId && activeFacilityId !== 'all',
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['global-categories'],
    queryFn: async () => {
      try {
        const res = await api.get(`/settings/definitions/categories`);
        const data = await res.json();
        return Array.isArray(data) ? data : (data?.data || []);
      } catch (err) {
        console.error("Kategoriler yüklenemedi:", err);
        return [];
      }
    }
  });
  const riskLevels = settings?.riskLevels || [];
  
  const mainCategories = categories.filter((c: any) => c.parentId === null);
  const subCategories1 = categories.filter((c: any) => c.parentId?.toString() === mainCategoryId);
  const subCategories2 = categories.filter((c: any) => c.parentId?.toString() === categoryId);

  // Mutation
  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/safety-management/isg-defter/items', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isg-defter-page', pageId] });
      queryClient.invalidateQueries({ queryKey: ['isg-defter-pages'] });
      toast.success('Madde başarıyla eklendi.');
      
      // Reset form but keep author info
      setContent('');
      setCategoryId('none');
      setRiskLevel('Belirlenmedi');
      setStatus('Açık');
    },
    onError: () => toast.error('Madde eklenirken hata oluştu.')
  });

  if (isPageLoading) return <div className="p-8 text-center">Yükleniyor...</div>;
  if (!pageData) return <div className="p-8 text-center text-red-500">Sayfa bulunamadı.</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Lütfen tespit içeriğini doldurun.');
      return;
    }
    if (mainCategoryId === 'none' || categoryId === 'none') {
      toast.error('Lütfen Ana Kategori ve Kategori alanlarını seçiniz.');
      return;
    }

    createItemMutation.mutate({
      pageId: parseInt(pageId!),
      authorType,
      authorName,
      content,
      mainCategoryId: parseInt(mainCategoryId),
      categoryId: parseInt(categoryId),
      subCategoryId: subCategoryId === 'none' ? undefined : parseInt(subCategoryId),
      riskLevel: riskLevel === 'Belirlenmedi' ? undefined : riskLevel,
      status: status
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/safety-management/isg-defter')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Yeni Madde Ekle</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {format(new Date(pageData.date), 'dd MMMM yyyy', { locale: tr })}</span>
              {pageData.pageNo && <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> Sayfa: {pageData.pageNo}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* FORM BÖLÜMÜ */}
        <Card className="shadow-md">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg">Tespit / Öneri Formu</CardTitle>
            <CardDescription>Defter sayfasına yeni bir madde ekleyin.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Yazar Unvanı</Label>
                  <Select value={authorType} onValueChange={setAuthorType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seçiniz">
                        <span className="block truncate max-w-[90%]">{authorType}</span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="İş Güvenliği Uzmanı">İş Güvenliği Uzmanı</SelectItem>
                      <SelectItem value="İşyeri Hekimi">İşyeri Hekimi</SelectItem>
                      <SelectItem value="Diğer">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Yazar Adı Soyadı (İsteğe Bağlı)</Label>
                  <Input 
                    placeholder="Ad Soyad giriniz" 
                    value={authorName} 
                    onChange={e => setAuthorName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tespit ve Öneri İçeriği</Label>
                <Textarea 
                  placeholder="Madde içeriğini buraya yazın..." 
                  className="min-h-[120px] resize-none"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Ana Kategori <span className="text-red-500">*</span></Label>
                  <Select value={mainCategoryId} onValueChange={(v) => { setMainCategoryId(v); setCategoryId('none'); setSubCategoryId('none'); }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Ana Kategori Seç">
                        <span className="block truncate max-w-[90%]">
                          {mainCategoryId === 'none' ? 'Belirlenmedi' : categories.find((c: any) => c.id.toString() === mainCategoryId)?.name || 'Belirlenmedi'}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Belirlenmedi</SelectItem>
                      {mainCategories.map((c: any) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Kategori <span className="text-red-500">*</span></Label>
                  <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSubCategoryId('none'); }} disabled={mainCategoryId === 'none'}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Kategori Seç">
                        <span className="block truncate max-w-[90%]">
                          {categoryId === 'none' ? 'Belirlenmedi' : categories.find((c: any) => c.id.toString() === categoryId)?.name || 'Belirlenmedi'}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Belirlenmedi</SelectItem>
                      {subCategories1.map((c: any) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Alt Kategori</Label>
                  <Select value={subCategoryId} onValueChange={setSubCategoryId} disabled={categoryId === 'none'}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Alt Kategori Seç">
                        <span className="block truncate max-w-[90%]">
                          {subCategoryId === 'none' ? 'Belirlenmedi' : categories.find((c: any) => c.id.toString() === subCategoryId)?.name || 'Belirlenmedi'}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Belirlenmedi</SelectItem>
                      {subCategories2.map((c: any) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Risk Düzeyi</Label>
                  <Select value={riskLevel} onValueChange={setRiskLevel}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Risk Seç">
                        <span className="block truncate max-w-[90%]">{riskLevel}</span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Belirlenmedi">Belirlenmedi</SelectItem>
                      {riskLevels.map((r: any) => (
                        <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Durum</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Durum Seç">
                        <span className="block truncate max-w-[90%]">
                          {status === 'Açık' ? 'Başlamadı (Açık)' : status}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Açık">Başlamadı (Açık)</SelectItem>
                      <SelectItem value="Devam Ediyor">Devam Ediyor</SelectItem>
                      <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800" disabled={createItemMutation.isPending}>
                <PlusCircle className="w-4 h-4 mr-2" />
                {createItemMutation.isPending ? 'Ekleniyor...' : 'Maddeyi Sayfaya Ekle'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* EKLENEN MADDELER BÖLÜMÜ */}
        <Card className="shadow-sm border-dashed">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-lg">Sayfaya Eklenen Maddeler ({pageData.items?.length || 0})</CardTitle>
            <CardDescription>Bu defter sayfasına yeni eklediğiniz maddeler aşağıda listelenir.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {pageData.items && pageData.items.length > 0 ? (
              <div className="divide-y">
                {pageData.items.map((item: any, index: number) => (
                  <div key={item.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <div className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium whitespace-pre-wrap">{item.content}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{item.authorType}{item.authorName ? ` - ${item.authorName}` : ''}</span>
                            {item.category && <span>• {item.category.name}</span>}
                            <span>• {item.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full min-h-[200px]">
                <CheckCircle2 className="w-12 h-12 mb-3 text-slate-200" />
                <p>Henüz bu sayfaya madde eklemediniz.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-end mt-8 border-t pt-6">
        <Button onClick={() => navigate('/safety-management/isg-defter')} size="lg" className="w-full md:w-auto bg-slate-900 text-white hover:bg-slate-800">
          <Save className="w-4 h-4 mr-2" /> Kaydet ve Çık
        </Button>
      </div>
    </div>
  );
}
