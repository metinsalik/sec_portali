import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { BASE_URL } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PlusCircle, Search, Upload, FileText, FileDown, ArrowLeft, Calendar, FileCheck, Building2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export default function IsgDefterRecords() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.isAdmin || user?.isManagement || user?.roles?.includes('admin');
  const activeFacilityId = localStorage.getItem('activeFacilityId');
  
  const [searchParams, setSearchParams] = useSearchParams();
  
  const selectedYear = searchParams.get('year') === 'all' ? 'all' : (Number(searchParams.get('year')) || new Date().getFullYear());
  const selectedMonth = searchParams.get('month') ? (searchParams.get('month') === 'all' ? 'all' : Number(searchParams.get('month'))) : 'all';
  const [selectedMainCategory, setSelectedMainCategory] = useState(searchParams.get('mainCategory') || 'all');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedSubCategory, setSelectedSubCategory] = useState(searchParams.get('subCategory') || 'all');
  const [selectedRisk, setSelectedRisk] = useState(searchParams.get('risk') || 'all');

  const updateParam = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);

    if (key === 'mainCategory') {
      setSelectedMainCategory(value || 'all');
      setSelectedCategory('all');
      setSelectedSubCategory('all');
    } else if (key === 'category') {
      setSelectedCategory(value || 'all');
      setSelectedSubCategory('all');
    } else if (key === 'subCategory') {
      setSelectedSubCategory(value || 'all');
    } else if (key === 'risk') setSelectedRisk(value || 'all');
  };
  
  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setSelectedMainCategory('all');
    setSelectedCategory('all');
    setSelectedSubCategory('all');
    setSelectedRisk('all');
  };
  
  const selectedDate = searchParams.get('date') || null;
  const viewMode = searchParams.get('view') || 'card';

  const [uploadingPageId, setUploadingPageId] = useState<number | null>(null);
  const [editingPageId, setEditingPageId] = useState<number | null>(null);
  const [isNewPageModalOpen, setIsNewPageModalOpen] = useState(false);

  // Data Queries
  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['isg-defter-pages', activeFacilityId, selectedYear],
    queryFn: async () => {
      if (!activeFacilityId) return [];
      const yearQuery = selectedYear === 'all' ? '' : `?year=${selectedYear}`;
      const res = await api.get(`/safety-management/isg-defter/facilities/${activeFacilityId}/pages${yearQuery}`);
      return res.json();
    },
    enabled: !!activeFacilityId,
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

  const mainCategories = categories.filter((c: any) => !c.parentId);
  const subCategories1 = categories.filter((c: any) => c.parentId && selectedMainCategory !== 'all' && c.parentId.toString() === selectedMainCategory);
  const subCategories2 = categories.filter((c: any) => c.parentId && selectedCategory !== 'all' && c.parentId.toString() === selectedCategory);

  const getCategoryPath = (item: any) => {
    const path = [];
    if (item.mainCategoryId) path.push(categories.find((c: any) => c.id === item.mainCategoryId)?.name);
    if (item.categoryId) path.push(categories.find((c: any) => c.id === item.categoryId)?.name);
    if (item.subCategoryId) path.push(categories.find((c: any) => c.id === item.subCategoryId)?.name);
    return path.filter(Boolean).join(' > ');
  };

  const { data: settings } = useQuery({
    queryKey: ['isg-defter-settings', activeFacilityId],
    queryFn: async () => {
      if (!activeFacilityId || activeFacilityId === 'all') return null;
      const res = await api.get(`/safety-management/isg-defter/facilities/${activeFacilityId}/settings`);
      return res.json();
    },
    enabled: !!activeFacilityId && activeFacilityId !== 'all',
  });

  // Mutations
  const updateItemMutation = useMutation({
    mutationFn: async (data: { id: number, field: string, value: any }) => {
      const res = await api.put(`/safety-management/isg-defter/items/${data.id}`, { [data.field]: data.value });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isg-defter-pages'] });
      toast.success('Kayıt güncellendi.');
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/safety-management/isg-defter/items/${id}`);
      if (!res.ok) throw new Error('Silinemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isg-defter-pages'] });
      toast.success('Madde başarıyla silindi.');
    },
    onError: () => toast.error('Madde silinirken hata oluştu.')
  });

  const createPageMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/safety-management/isg-defter/pages', data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['isg-defter-pages'] });
      toast.success('Defter sayfası başarıyla oluşturuldu.');
      setIsNewPageModalOpen(false);
      navigate(`/safety-management/isg-defter/pages/${data.id}/builder`);
    },
    onError: () => toast.error('Defter sayfası oluşturulurken hata oluştu.')
  });

  const updatePageMutation = useMutation({
    mutationFn: async (data: { id?: number, ids?: number[], ciltNo?: number, pageNo?: number | string, date?: string, file?: File }) => {
      const formData = new FormData();
      if (data.ciltNo) formData.append('ciltNo', data.ciltNo.toString());
      if (data.pageNo) formData.append('pageNo', data.pageNo.toString());
      if (data.date) formData.append('date', data.date);
      if (data.file) formData.append('file', data.file);
      
      if (data.ids && data.ids.length > 0) {
        formData.append('ids', data.ids.join(','));
        const res = await api.put(`/safety-management/isg-defter/facilities/${activeFacilityId}/pages/bulk`, formData);
        return res.json();
      } else if (data.id) {
        const res = await api.put(`/safety-management/isg-defter/facilities/${activeFacilityId}/pages/${data.id}`, formData);
        return res.json();
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['isg-defter-pages'] });
      toast.success('Sayfa bilgileri güncellendi.');
      setEditingPageId(null);
      setUploadingPageId(null);
      if (variables.date && selectedDate !== variables.date) {
        // Just update search param without resetting everything
        const newParams = new URLSearchParams(searchParams);
        newParams.set('date', variables.date);
        setSearchParams(newParams);
      }
    }
  });

  const deletePageGroupMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await api.delete(`/safety-management/isg-defter/facilities/${activeFacilityId}/pages/bulk?ids=${ids.join(',')}`);
      if (!res.ok) throw new Error('Silinemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isg-defter-pages'] });
      toast.success('Defter sayfası başarıyla silindi.');
      updateParam('date', null);
    },
    onError: () => toast.error('Silinirken hata oluştu.')
  });

  // Helpers
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Açık': return 'bg-red-100 text-red-800 border-red-200';
      case 'Planlandı': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Tamamlandı': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!activeFacilityId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-xl font-semibold mb-2">Tesis Seçimi Gerekli</h2>
        <p className="text-muted-foreground">Lütfen İSG Defteri kayıtlarını görüntülemek için sol menüden bir tesis seçin.</p>
      </div>
    );
  }

  // Data processing
  const filteredPages = useMemo(() => {
    let filtered = pages;
    if (selectedMonth !== 'all') {
      filtered = filtered.filter((page: any) => new Date(page.date).getMonth() === selectedMonth);
    }
    
    if (selectedMainCategory !== 'all' || selectedCategory !== 'all' || selectedSubCategory !== 'all' || selectedRisk !== 'all') {
      filtered = filtered.filter((page: any) => {
        const hasMatchingItem = page.items.some((item: any) => {
          const matchMainCat = selectedMainCategory === 'all' || item.mainCategoryId?.toString() === selectedMainCategory;
          const matchCat = selectedCategory === 'all' || item.categoryId?.toString() === selectedCategory;
          const matchSubCat = selectedSubCategory === 'all' || item.subCategoryId?.toString() === selectedSubCategory;
          const matchRisk = selectedRisk === 'all' || item.riskLevel === selectedRisk;
          return matchMainCat && matchCat && matchSubCat && matchRisk;
        });
        return hasMatchingItem;
      });
    }

    return filtered;
  }, [pages, selectedMonth, selectedMainCategory, selectedCategory, selectedSubCategory, selectedRisk]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, any> = {};
    filteredPages.forEach((p: any) => {
      const d = format(new Date(p.date), 'yyyy-MM-dd');
      if (!groups[d]) {
        groups[d] = { dateString: d, date: p.date, facility: p.facility, pages: [], items: [], hasPdf: false, documentUrl: null };
      }
      groups[d].pages.push(p);
      groups[d].items.push(...p.items);
      if (p.documentUrl) { groups[d].hasPdf = true; groups[d].documentUrl = p.documentUrl; }
    });

    Object.values(groups).forEach((g: any) => {
      g.pages.sort((a: any, b: any) => {
        const getFirstNum = (p: string) => parseInt((p || '0').toString().split('-')[0]) || 0;
        return getFirstNum(a.pageNo) - getFirstNum(b.pageNo);
      });
    });

    return Object.values(groups).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredPages]);

  // VIEW 2: Inside a specific Date Group (Nested View)
  useEffect(() => {
    if (selectedDate && !groupedByDate.find((g: any) => g.dateString === selectedDate)) {
      updateParam('date', null);
    }
  }, [selectedDate, groupedByDate]);

  if (selectedDate) {
    const activeGroup = groupedByDate.find((g: any) => g.dateString === selectedDate);
    if (!activeGroup) {
      return null;
    }

    const primaryPage = activeGroup.pages[0];
    const ciltNo = primaryPage?.ciltNo;
    const firstPageNo = primaryPage?.pageNo;
    const lastPageNo = activeGroup.pages[activeGroup.pages.length - 1]?.pageNo;
    const pageNoDisplay = firstPageNo === lastPageNo ? firstPageNo : `${firstPageNo} - ${lastPageNo}`;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center justify-between mb-6 bg-slate-50 p-4 rounded-xl border w-full">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => updateParam('date', null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Defter Sayfası İncelemesi</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(activeGroup.date), 'dd MMMM yyyy, EEEE', { locale: tr })}</span>
                </div>
              </div>
            </div>
            <Button onClick={() => navigate(`/safety-management/isg-defter/pages/${primaryPage?.id}/builder`)} className="bg-slate-900 text-white hover:bg-slate-800">
              <PlusCircle className="w-4 h-4 mr-2" /> Yeni Madde Ekle
            </Button>
          </div>
        </div>

        <Card className="bg-muted/30">
          <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Tesis</div>
                  <div className="font-semibold">{activeGroup.facility?.name || 'Tesis'}</div>
                </div>
              </div>
              <div className="w-px h-10 bg-border hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Kayıt Detayları</div>
                  {editingPageId === primaryPage?.id ? (
                    <form 
                      className="flex items-center gap-2 mt-1 flex-wrap"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        updatePageMutation.mutate({
                          ids: activeGroup.pages.map((p: any) => p.id),
                          ciltNo: Number(formData.get('ciltNo')),
                          pageNo: formData.get('pageNo') as string,
                          date: formData.get('date') as string
                        });
                      }}
                    >
                      <Input name="date" type="date" defaultValue={format(new Date(activeGroup.date), 'yyyy-MM-dd')} className="w-36 h-8 text-xs" required />
                      <Input name="ciltNo" type="number" defaultValue={primaryPage?.ciltNo || ''} placeholder="Cilt" className="w-16 h-8 text-xs" />
                      <Input name="pageNo" type="text" defaultValue={primaryPage?.pageNo || ''} placeholder="Sayfa (Örn: 1-3)" className="w-[120px] h-8 text-xs" />
                      <Button type="submit" size="sm" className="h-8 bg-slate-900 text-white hover:bg-slate-800">Kaydet</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => setEditingPageId(null)}>İptal</Button>
                    </form>
                  ) : (
                    <div className="font-semibold flex items-center gap-2">
                      Cilt {ciltNo || '?'} / Sayfalar: {pageNoDisplay || '?'}
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setEditingPageId(primaryPage?.id)}>Düzenle</Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {activeGroup.hasPdf ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-md border border-green-200">
                  <FileCheck className="w-4 h-4" />
                  <span className="text-sm font-medium">PDF Yüklü</span>
                  <a href={BASE_URL + activeGroup.documentUrl} target="_blank" rel="noreferrer" className="text-xs underline ml-2">Görüntüle</a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-md border border-yellow-200">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">PDF Yüklü Değil</span>
                </div>
              )}

              {uploadingPageId === primaryPage?.id ? (
                <div className="flex items-center gap-2 border rounded-md p-1 bg-background">
                  <Input type="file" className="h-8 text-xs w-[180px]" onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      updatePageMutation.mutate({ id: primaryPage.id, file: e.target.files[0] });
                    }
                  }} />
                  <Button variant="ghost" size="sm" className="h-6" onClick={() => setUploadingPageId(null)}>İptal</Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setUploadingPageId(primaryPage?.id)}>
                  <Upload className="h-4 w-4 mr-2" /> {activeGroup.hasPdf ? 'Yeni PDF Yükle' : 'PDF Yükle'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="border rounded-md bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20">
                <TableHead className="w-[80px]">No</TableHead>
                <TableHead>Tespit/Öneri İçeriği</TableHead>
                <TableHead className="w-[200px]">Kategori</TableHead>
                <TableHead className="w-[160px]">Risk</TableHead>
                <TableHead className="w-[120px]">Durum</TableHead>
                <TableHead className="text-right w-[100px]">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeGroup.items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Bu tarihte hiç tespit/öneri yok.</TableCell></TableRow>
              ) : (
                activeGroup.items.map((item: any, index: number) => (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/safety-management/isg-defter/items/${item.id}`)}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="truncate" title={item.content}>{item.content}</p>
                      <span className="text-xs text-muted-foreground block truncate">
                        {item.authorType}
                        {item.authorName && item.authorName !== 'Sistem' && ` - ${item.authorName}`}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-xs px-2 py-1 bg-slate-100 text-slate-900 rounded-md truncate max-w-[150px]" title={getCategoryPath(item)}>
                        {getCategoryPath(item)}
                      </span>
                    </TableCell>

                    <TableCell>
                      {item.riskLevel}
                    </TableCell>

                    <TableCell>
                      <Badge className={getStatusBadgeColor(item.status)} variant="outline">{item.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Maddeyi Sil</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bu maddeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteItemMutation.mutate(item.id)} className="bg-red-600 hover:bg-red-700 text-white">
                                Evet, Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button variant="default" className="bg-slate-900 text-white hover:bg-slate-800" size="sm" onClick={(e) => {
                           e.stopPropagation();
                           navigate(`/safety-management/isg-defter/items/${item.id}`);
                        }}>
                          Detay
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // VIEW 1: Main Records View (Date Cards)
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Defter Kayıtları</h2>
          <p className="text-muted-foreground">Geçmiş defter sayfalarını ve tespitleri yönetin.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted rounded-md p-1 border">
            <Button variant="ghost" size="sm" className={`h-8 px-3 ${viewMode === 'card' ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm' : ''}`} onClick={() => updateParam('view', 'card')}>Kartlar</Button>
            <Button variant="ghost" size="sm" className={`h-8 px-3 ${viewMode === 'list' ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm' : ''}`} onClick={() => updateParam('view', 'list')}>Liste</Button>
          </div>
          <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => setIsNewPageModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Yeni Tespit (Sayfa) Ekle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6 p-4 bg-muted/30 rounded-xl border items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium">Yıl</label>
          <Select value={selectedYear.toString()} onValueChange={(v) => updateParam('year', v)}>
            <SelectTrigger><SelectValue placeholder="Tüm Yıllar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Yıllar</SelectItem>
              {Array.from({ length: new Date().getFullYear() - 2020 + 1 }, (_, i) => new Date().getFullYear() - i).map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Ay</label>
          <Select value={selectedMonth.toString()} onValueChange={(v) => updateParam('month', v)}>
            <SelectTrigger><SelectValue placeholder="Tüm Aylar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Aylar</SelectItem>
              {Array.from({ length: 12 }).map((_, i) => <SelectItem key={i} value={i.toString()}>{format(new Date(2024, i, 1), 'MMMM', { locale: tr })}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Ana Kategori</label>
          <Select value={selectedMainCategory} onValueChange={(v) => updateParam('mainCategory', v)}>
            <SelectTrigger><SelectValue placeholder="Tümü" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              {mainCategories.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Kategori</label>
          <Select value={selectedCategory} onValueChange={(v) => updateParam('category', v)} disabled={selectedMainCategory === 'all'}>
            <SelectTrigger><SelectValue placeholder="Tümü" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              {subCategories1.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 w-full">
          <label className="text-xs font-medium">Alt Kategori</label>
          <Select value={selectedSubCategory} onValueChange={(v) => updateParam('subCategory', v)} disabled={selectedCategory === 'all'}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Alt Kategori">
                <span className="block truncate max-w-[90%]">
                  {selectedSubCategory === 'all' ? 'Tümü' : categories.find((c: any) => c.id.toString() === selectedSubCategory)?.name || 'Tümü'}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              {subCategories2.map((c: any) => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-1 w-full">
          <label className="text-xs font-medium">Risk Düzeyi</label>
          <Select value={selectedRisk} onValueChange={(v) => updateParam('risk', v)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Risk Seçin">
                {selectedRisk === 'all' ? 'Tüm Riskler' : selectedRisk}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Riskler</SelectItem>
              {(settings?.riskLevels || []).map((r: any) => (
                <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {(selectedMonth !== 'all' || selectedMainCategory !== 'all' || selectedRisk !== 'all' || selectedYear !== 'all') && (
          <Button variant="ghost" onClick={clearFilters} className="text-xs h-9 px-3 mt-2 md:mt-0 whitespace-nowrap lg:col-span-6 md:col-span-2">
            Filtreleri Temizle
          </Button>
        )}
      </div>

      {/* LIST OF DATE CARDS (PAGES ONLY) */}
      {viewMode === 'card' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groupedByDate.length === 0 ? (
            <div className="col-span-full p-8 text-center text-muted-foreground border rounded-xl bg-muted/20">
              Bu kriterlere uygun kayıt bulunamadı.
            </div>
          ) : (
            groupedByDate.map((group: any) => {
              const primaryPage = group.pages[0];
              const firstPageNo = primaryPage?.pageNo;
              const lastPageNo = group.pages[group.pages.length - 1]?.pageNo;
              const pageNoDisplay = firstPageNo === lastPageNo ? firstPageNo : `${firstPageNo} - ${lastPageNo}`;
              const ciltNo = primaryPage?.ciltNo;

              return (
                <Card key={group.dateString} className="hover:border-primary/50 transition-colors shadow-sm flex flex-col justify-between">
                  <CardHeader className="pb-2 flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        {format(new Date(group.date), 'dd MMMM yyyy', { locale: tr })}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Building2 className="w-3 h-3" /> {group.facility?.name}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {group.hasPdf ? (
                        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                          <FileCheck className="w-3 h-3 mr-1" /> PDF
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">Eksik</Badge>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" title="Defter Kaydını Sil">
                            <Trash2 className="w-3 h-3 mr-1" /> Sil
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Defter Kaydını Sil</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bu defter kaydını silmek istediğinize emin misiniz? {group.items.length > 0 && <span className="block mt-2 font-bold text-red-600">İçerisindeki {group.items.length} madde de tamamen silinecektir.</span>} Bu işlem geri alınamaz.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deletePageGroupMutation.mutate(group.pages.map((p: any) => p.id))} className="bg-red-600 hover:bg-red-700 text-white">
                              Evet, Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Cilt No: <span className="font-medium text-foreground">{ciltNo || '-'}</span></span>
                      <span className="text-muted-foreground">Sayfalar: <span className="font-medium text-foreground">{pageNoDisplay || '-'}</span></span>
                    </div>
                    <p className="mt-3 text-muted-foreground text-xs">
                      Bu tarihte toplam <span className="font-medium text-foreground">{group.items.length}</span> adet madde (tespit/öneri) bulunuyor.
                    </p>
                    <Button className="w-full mt-4 bg-slate-900 text-white hover:bg-slate-800" variant="default" onClick={() => updateParam('date', group.dateString)}>
                      Sayfa İçeriğini İncele <Search className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Tesis</TableHead>
                <TableHead>Cilt No</TableHead>
                <TableHead>Sayfa No</TableHead>
                <TableHead>Madde Sayısı</TableHead>
                <TableHead>PDF Durumu</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedByDate.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">Bu kriterlere uygun kayıt bulunamadı.</TableCell>
                </TableRow>
              ) : (
                groupedByDate.map((group: any) => {
                  const primaryPage = group.pages[0];
                  const firstPageNo = primaryPage?.pageNo;
                  const lastPageNo = group.pages[group.pages.length - 1]?.pageNo;
                  const pageNoDisplay = firstPageNo === lastPageNo ? firstPageNo : `${firstPageNo} - ${lastPageNo}`;
                  
                  return (
                    <TableRow key={group.dateString} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium">
                        {format(new Date(group.date), 'dd MMMM yyyy', { locale: tr })}
                      </TableCell>
                      <TableCell>{group.facility?.name}</TableCell>
                      <TableCell>{primaryPage?.ciltNo || '-'}</TableCell>
                      <TableCell>{pageNoDisplay || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200">
                          {group.items.length} Madde
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {group.hasPdf ? (
                          <span className="flex items-center text-green-600 text-xs font-medium"><FileCheck className="w-3 h-3 mr-1" /> Yüklü</span>
                        ) : (
                          <span className="text-amber-600 text-xs font-medium">Eksik</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => updateParam('date', group.dateString)}>
                          İncele
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* NEW PAGE MODAL */}
      <Dialog open={isNewPageModalOpen} onOpenChange={setIsNewPageModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Yeni Tespit Sayfası Ekle</DialogTitle>
            <DialogDescription>
              İSG Tespit ve Öneri Defteri için yeni bir kayıt tarihi ve numarası oluşturun. Ardından sayfa içine tespitlerinizi girebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const dateStr = formData.get('date') as string;
            const pageNo = formData.get('pageNo') as string;
            
            if (!dateStr || !activeFacilityId) return;
            
            createPageMutation.mutate({
              facilityId: activeFacilityId,
              date: new Date(dateStr).toISOString(),
              year: new Date(dateStr).getFullYear(),
              pageNo: pageNo || undefined
            });
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Kayıt Tarihi (Zorunlu)</Label>
                <Input id="date" name="date" type="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pageNo">Sayfa Numarası (Opsiyonel)</Label>
                <Input id="pageNo" name="pageNo" placeholder="Örn: 48 veya 48-49" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewPageModalOpen(false)}>İptal</Button>
              <Button type="submit" disabled={createPageMutation.isPending} className="bg-slate-900 text-white hover:bg-slate-800">
                {createPageMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur ve Maddelere Geç'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
