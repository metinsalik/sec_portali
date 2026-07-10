import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Plus, Search, Calendar, User, Tag, 
  Building2, AlertCircle, CheckCircle2, History,
  Eye, FileUp, Loader2, Download, Trash2, Save, Lock, Unlock,
  BarChart3, PieChart, Activity, Clock, FilterX, ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';

interface NotebookItem {
  id?: number;
  authorType: 'DOKTOR' | 'UZMAN';
  authorName: string;
  content: string;
  categoryId: string;
  subCategoryId?: string;
  departmentId: string;
  category?: { name: string };
  department?: { name: string };
}

interface NotebookPage {
  id: number;
  date: string;
  year: number;
  documentUrl?: string;
  documentUploadedAt?: string;
  status: 'Eksik' | 'Tamamlandı';
  isLocked: boolean;
  isArchived: boolean;
  items: NotebookItem[];
  createdAt: string;
}

export default function NotebooksPage() {
  const queryClient = useQueryClient();
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewPage, setViewPage] = useState<NotebookPage | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string | null>(null);

  // Auth User (Simulated for rules)
  const userRole = localStorage.getItem('userRole') || 'USER'; 

  // Form State
  const [pageDate, setPageDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<NotebookItem[]>([{
    authorType: 'UZMAN',
    authorName: '',
    content: '',
    categoryId: '',
    subCategoryId: '',
    departmentId: '',
  }]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Data Fetching
  const { data: facilities } = useQuery({
    queryKey: ['operations-facilities'],
    queryFn: async () => {
      const res = await api.get('/operations/facilities');
      if (!res.ok) throw new Error('Tesisler yüklenemedi');
      return res.json();
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['definitions-categories'],
    queryFn: async () => {
      const res = await api.get('/settings/definitions/categories');
      if (!res.ok) throw new Error('Kategoriler yüklenemedi');
      return res.json();
    },
  });

  const { data: subCategories } = useQuery({
    queryKey: ['definitions-subcategories'],
    queryFn: async () => {
      const res = await api.get('/settings/definitions/subcategories');
      if (!res.ok) throw new Error('Alt kategoriler yüklenemedi');
      return res.json();
    },
  });

  const { data: departments } = useQuery({
    queryKey: ['definitions-departments'],
    queryFn: async () => {
      const res = await api.get('/settings/definitions/departments');
      if (!res.ok) throw new Error('Departmanlar yüklenemedi');
      return res.json();
    },
  });

  const { data: professionals } = useQuery({
    queryKey: ['facility-professionals', selectedFacility],
    queryFn: async () => {
      if (!selectedFacility) return [];
      const res = await api.get(`/notebooks/${selectedFacility}/professionals`);
      if (!res.ok) throw new Error('Profesyoneller yüklenemedi');
      return res.json();
    },
    enabled: !!selectedFacility,
  });

  const { data: pages, isLoading } = useQuery<NotebookPage[]>({
    queryKey: ['notebook-pages', selectedFacility, selectedYear, showArchived],
    queryFn: async () => {
      if (!selectedFacility) return [];
      const res = await api.get(`/notebooks/${selectedFacility}?year=${selectedYear}&includeArchived=${showArchived}`);
      if (!res.ok) throw new Error('Kayıtlar yüklenemedi');
      return res.json();
    },
    enabled: !!selectedFacility,
  });

  // Mutasyonlar
  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const url = isEdit 
        ? `/notebooks/${selectedFacility}/${editingId}`
        : `/notebooks/${selectedFacility}`;
      const method = isEdit ? 'PUT' : 'POST';
      
      const res = await api.customFetch(url, {
        method,
        body: data,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'İşlem başarısız');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Sayfa güncellendi' : 'Yeni sayfa eklendi');
      queryClient.invalidateQueries({ queryKey: ['notebook-pages'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/notebooks/${selectedFacility}/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Silme işlemi başarısız');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Kayıt silindi');
      queryClient.invalidateQueries({ queryKey: ['notebook-pages'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const toggleLockMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.customFetch(`/notebooks/${selectedFacility}/${id}/toggle-lock`, {
        method: 'PATCH'
      });
      if (!res.ok) throw new Error('Kilit işlemi başarısız');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Kilit durumu güncellendi');
      queryClient.invalidateQueries({ queryKey: ['notebook-pages'] });
    }
  });

  const resetForm = () => {
    setPageDate(new Date().toISOString().slice(0, 10));
    setItems([{
      authorType: 'UZMAN',
      authorName: '',
      content: '',
      categoryId: '',
      subCategoryId: '',
      departmentId: '',
    }]);
    setSelectedFile(null);
    setIsEdit(false);
    setEditingId(null);
  };

  const addItem = () => {
    setItems([...items, {
      authorType: 'UZMAN',
      authorName: '',
      content: '',
      categoryId: '',
      subCategoryId: '',
      departmentId: '',
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof NotebookItem, value: string) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const handleEdit = (page: NotebookPage) => {
    // Kurallar kontrolü
    if (userRole !== 'ADMIN') {
      if (page.isLocked) {
        toast.error('Bu kayıt kilitlidir.');
        return;
      }
      if (page.documentUploadedAt) {
        const diff = (new Date().getTime() - new Date(page.documentUploadedAt).getTime()) / (1000 * 60 * 60);
        if (diff > 24) {
          toast.error('Doküman yüklendikten sonra 24 saat geçtiği için düzenleme yapılamaz.');
          return;
        }
      }
      // 15 gün kontrolü sisteme giriş tarihinden itibaren (createdAt)
      const daysDiffSinceEntry = (new Date().getTime() - new Date(page.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (!page.documentUrl && daysDiffSinceEntry > 15) {
        toast.error('Sisteme giriş tarihinden itibaren 15 günlük yükleme süresi dolduğu için düzenleme yapılamaz.');
        return;
      }
    }

    setPageDate(page.date.slice(0, 10));
    setItems(page.items.map(item => ({
      authorType: item.authorType,
      authorName: item.authorName,
      content: item.content,
      categoryId: item.categoryId.toString(),
      subCategoryId: item.subCategoryId?.toString() || '',
      departmentId: item.departmentId.toString(),
    })));
    setEditingId(page.id);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const handleDelete = (page: NotebookPage) => {
    if (userRole !== 'ADMIN') {
      if (page.isLocked) {
        toast.error('Kilitli kayıt silinemez.');
        return;
      }
      if (page.documentUploadedAt) {
        const diff = (new Date().getTime() - new Date(page.documentUploadedAt).getTime()) / (1000 * 60 * 60);
        if (diff > 24) {
          toast.error('Doküman yüklendikten sonra 24 saat geçtiği için silinemez.');
          return;
        }
      }
    }
    if (confirm('Bu defter sayfasını ve tüm maddelerini silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(page.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append('date', pageDate);
    data.append('items', JSON.stringify(items));
    if (selectedFile) {
      data.append('document', selectedFile);
    }
    mutation.mutate(data);
  };

  // Check if a page is locked by rules
  const isPageLocked = (page: NotebookPage | null) => {
    if (!page) return false;
    if (userRole === 'ADMIN') return false;
    if (page.isLocked) return true;
    if (page.documentUploadedAt) {
       const diff = (new Date().getTime() - new Date(page.documentUploadedAt).getTime()) / (1000 * 60 * 60);
       if (diff > 24) return true;
    }
    // 15 gün kontrolü sisteme giriş tarihinden itibaren (createdAt)
    const daysDiffSinceEntry = (new Date().getTime() - new Date(page.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (!page.documentUrl && daysDiffSinceEntry > 15) return true;
    return false;
  };

  // Enhanced Filtering & Stats
  const { stats, filteredPages } = useMemo(() => {
    if (!pages) return { stats: null, filteredPages: [] };
    
    // Filter pages
    const filtered = pages.filter(p => {
      const matchesSearch = searchQuery === '' || 
        p.items.some(item => item.content.toLowerCase().includes(searchQuery.toLowerCase()) || item.authorName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = !filterCategory || p.items.some(item => item.category?.name === filterCategory);
      const matchesDepartment = !filterDepartment || p.items.some(item => item.department?.name === filterDepartment);
      
      return matchesSearch && matchesCategory && matchesDepartment;
    });

    // Stats calculation
    const totalPages = pages.length;
    const completedPages = pages.filter(p => p.status === 'Tamamlandı').length;
    const documentationRate = totalPages > 0 ? Math.round((completedPages / totalPages) * 100) : 0;
    
    // Calculate entry delay (time between page date and system entry date)
    let totalDelayDays = 0;
    let delayedCount = 0;
    pages.forEach(p => {
       const delay = Math.round(Math.abs(new Date(p.createdAt).getTime() - new Date(p.date).getTime()) / (1000 * 60 * 60 * 24));
       totalDelayDays += delay;
       if (delay > 3) delayedCount++;
    });
    const avgEntryDelay = totalPages > 0 ? Math.round(totalDelayDays / totalPages) : 0;

    const catCounts: Record<string, number> = {};
    const depCounts: Record<string, number> = {};
    
    pages.forEach(p => {
      p.items.forEach(item => {
        if (item.category) catCounts[item.category.name] = (catCounts[item.category.name] || 0) + 1;
        if (item.department) depCounts[item.department.name] = (depCounts[item.department.name] || 0) + 1;
      });
    });

    return { 
      stats: {
        totalPages,
        completedPages,
        documentationRate,
        avgEntryDelay,
        delayedCount,
        catCounts,
        depCounts
      }, 
      filteredPages: filtered 
    };
  }, [pages, searchQuery, filterCategory, filterDepartment]);

  if (isLoading && facilities) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Main Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-4 rounded-2xl border shadow-sm sticky top-0 z-20 backdrop-blur-md bg-card/80">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl">
            <FileText className="w-6 h-6 text-amber-500" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold tracking-tight">Tespit & Öneri Defteri</h1>
            <p className="text-xs text-muted-foreground">Sisteme giriş tarihinden itibaren süre takibi yapılır</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase hidden sm:inline">Tesis:</Label>
            <Select value={selectedFacility} onValueChange={setSelectedFacility}>
              <SelectTrigger className="w-64 bg-background h-10 font-semibold">
                <SelectValue placeholder="Tesis seçin" />
              </SelectTrigger>
              <SelectContent>
                {facilities?.map((f: any) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase hidden sm:inline italic">Arşivi Göster:</Label>
            <Button 
              variant={showArchived ? "secondary" : "outline"} 
              size="sm" 
              onClick={() => setShowArchived(!showArchived)}
              className={showArchived ? "bg-amber-100 text-amber-700 border-amber-200" : ""}
            >
              {showArchived ? "Arşiv Açık" : "Arşiv Kapalı"}
            </Button>
          </div>
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="gap-2 shadow-lg h-10 px-6">
            <Plus className="w-4 h-4" /> Yeni Sayfa Ekle
          </Button>
        </div>
      </div>

      {/* Interactive Dashboard KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border/50 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-600"><PieChart className="w-5 h-5" /></div>
              <Badge variant="outline" className="text-[10px] font-black border-blue-200 text-blue-600 bg-blue-50">DOKÜMANTASYON</Badge>
            </div>
            <div>
              <p className="text-3xl font-black text-blue-700">{stats?.documentationRate}%</p>
              <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-tight">Kapanma Oranı</p>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-100/50">
               <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${stats?.documentationRate}%` }} />
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50 bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-600"><Clock className="w-5 h-5" /></div>
              <Badge variant="outline" className="text-[10px] font-black border-amber-200 text-amber-600 bg-amber-50">SÜRE TAKİBİ</Badge>
            </div>
            <div>
              <p className="text-3xl font-black text-amber-700">{stats?.avgEntryDelay} Gün</p>
              <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-tight">Ort. Giriş Gecikmesi</p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant={stats?.delayedCount && stats.delayedCount > 0 ? "destructive" : "outline"} className="text-[9px] py-0">
                {stats?.delayedCount} Gecikmiş Kayıt
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
              <Tag className="w-3.5 h-3.5" /> Kategori Dağılımı
            </CardTitle>
            {(filterCategory || filterDepartment) && (
              <Button variant="ghost" size="sm" onClick={() => { setFilterCategory(null); setFilterDepartment(null); }} className="h-6 text-[10px] p-0 text-red-500 hover:bg-red-50">
                <FilterX className="w-3 h-3 mr-1" /> Temizle
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-4 pt-2 max-h-[120px] overflow-y-auto space-y-1.5 custom-scrollbar">
            {stats?.catCounts && Object.entries(stats.catCounts).sort((a,b) => b[1]-a[1]).map(([cat, count]) => (
              <div 
                key={cat} 
                onClick={() => setFilterCategory(cat === filterCategory ? null : cat)}
                className={`flex items-center justify-between text-xs p-1.5 rounded-lg cursor-pointer transition-colors group ${filterCategory === cat ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              >
                <span className="truncate pr-2 font-medium">{cat}</span>
                <Badge variant={filterCategory === cat ? "secondary" : "outline"} className="text-[10px] h-5">{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" /> Departman Analizi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 max-h-[120px] overflow-y-auto space-y-1.5 custom-scrollbar">
            {stats?.depCounts && Object.entries(stats.depCounts).sort((a,b) => b[1]-a[1]).map(([dep, count]) => (
              <div 
                key={dep} 
                onClick={() => setFilterDepartment(dep === filterDepartment ? null : dep)}
                className={`flex items-center justify-between text-xs p-1.5 rounded-lg cursor-pointer transition-colors group ${filterDepartment === dep ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              >
                <span className="truncate pr-2 font-medium">{dep}</span>
                <Badge variant={filterDepartment === dep ? "secondary" : "outline"} className="text-[10px] h-5">{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="shadow-sm border-border/50 overflow-hidden">
        <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-lg font-bold">Defter Kayıtları</CardTitle>
            <CardDescription className="flex items-center gap-2">
              {filteredPages.length} sayfa listeleniyor 
              {filterCategory && <Badge variant="secondary" className="h-5 text-[10px]">{filterCategory}</Badge>}
              {filterDepartment && <Badge variant="secondary" className="h-5 text-[10px]">{filterDepartment}</Badge>}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
             <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="İçerik veya yazar ara..." 
                className="pl-9 w-64 h-9 bg-background text-xs" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
             </div>
             <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-24 h-9 text-xs font-semibold">
                  <SelectValue placeholder="Yıl" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[120px]">Defter Tarihi</TableHead>
                <TableHead className="w-[120px]">Giriş Tarihi</TableHead>
                <TableHead>Madde Bilgisi</TableHead>
                <TableHead>Kategoriler</TableHead>
                <TableHead>Statü & Kilit</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPages.map((page) => {
                const locked = isPageLocked(page);
                const delay = Math.round(Math.abs(new Date(page.createdAt).getTime() - new Date(page.date).getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <TableRow key={page.id} className={`group hover:bg-muted/50 transition-colors ${page.isArchived ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="text-sm">{new Date(page.date).toLocaleDateString('tr-TR')}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-black">SAYFA NO: {page.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold">{new Date(page.createdAt).toLocaleDateString('tr-TR')}</span>
                        {delay > 0 && (
                          <span className={`text-[9px] font-black uppercase ${delay > 3 ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {delay} Gün Sonra Girildi
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-bold text-[10px] bg-primary/5 border-primary/10">
                        {page.items.length} Madde
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(new Set(page.items.map(i => i.category?.name))).slice(0, 2).map((cat, idx) => (
                          <Badge key={idx} variant="outline" className="text-[9px] bg-muted/5 font-medium">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        {page.status === 'Tamamlandı' ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none flex w-fit items-center gap-1 text-[10px] px-2 py-0">
                            <CheckCircle2 className="w-3 h-3" /> Görsel Mevcut
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none flex w-fit items-center gap-1 text-[10px] px-2 py-0">
                            <AlertCircle className="w-3 h-3" /> Görsel Eksik
                          </Badge>
                        )}
                        <div className="flex gap-1 flex-wrap">
                          {locked && (
                            <Badge variant="outline" className="text-[9px] border-red-200 text-red-600 bg-red-50 py-0 flex w-fit items-center gap-1 font-black">
                              <Lock className="w-2.5 h-2.5" /> Kilitli
                            </Badge>
                          )}
                          {page.isArchived && (
                            <Badge variant="outline" className="text-[9px] border-gray-300 text-gray-500 bg-gray-100 py-0 flex w-fit items-center gap-1">
                              Arşivlenmiş
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setViewPage(page)} className="h-8 px-2 text-xs font-bold group-hover:bg-primary/5">
                          <Eye className="w-3.5 h-3.5 mr-1" /> İncele
                        </Button>
                        {!page.isArchived && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(page)} 
                              disabled={locked}
                              className="h-8 px-2 text-xs font-bold text-primary hover:bg-primary/10"
                            >
                               Düzenle
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(page)}
                              disabled={locked}
                              className="h-8 px-2 text-xs font-bold text-destructive hover:bg-destructive/10"
                            >
                               <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        {userRole === 'ADMIN' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleLockMutation.mutate(page.id)}
                            className="h-8 px-2"
                          >
                            {page.isLocked ? <Unlock className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-amber-600" />}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredPages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">
                    {searchQuery || filterCategory || filterDepartment ? 'Filtrelere uygun kayıt bulunamadı.' : 'Henüz kayıt bulunmuyor.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New/Edit Page Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 pb-4 bg-primary text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                {isEdit ? <History className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">
                  {isEdit ? 'Kayıt Güncelleme' : 'Defter Sayfa Kaydı'}
                </DialogTitle>
                <DialogDescription className="text-primary-foreground/80 font-medium">
                  Sayfa tarihi fiziksel defterdeki tarih olmalıdır.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="px-6 py-3 bg-amber-50 border-y border-amber-100 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <p className="text-[11px] font-bold text-amber-700 leading-tight">
               ÖNEMLİ: Doküman yükleme süresi (15 gün) bu formu kaydettiğiniz andan itibaren başlar. Doküman yüklendikten 24 saat sonra kayıt kilitlenir.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-4 rounded-xl border border-dashed border-primary/20">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fiziksel Sayfa Tarihi</Label>
                <Input 
                  type="date" 
                  value={pageDate} 
                  onChange={(e) => setPageDate(e.target.value)}
                  required
                  className="h-11 shadow-sm border-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Defter Görseli (JPG/PNG/PDF)</Label>
                <div className="flex items-center gap-3">
                  <Input 
                    type="file" 
                    className="hidden" 
                    id="notebook-file-form" 
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-11 border-dashed border-primary/40 hover:bg-primary/5 transition-all bg-background" 
                    onClick={() => document.getElementById('notebook-file-form')?.click()}
                  >
                    <FileUp className="w-4 h-4 mr-2 text-primary" />
                    {selectedFile ? <span className="text-primary font-bold">{selectedFile.name}</span> : 'Doküman Seçin (PDF/JPG)'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
                  <Badge className="bg-primary text-primary-foreground border-none rounded-md px-1.5">{items.length}</Badge>
                  Sayfa Üzerindeki Maddeler
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-8 gap-1 border-primary text-primary hover:bg-primary/5 font-bold rounded-lg">
                  <Plus className="w-3.5 h-3.5" /> Madde Ekle
                </Button>
              </div>

              <div className="space-y-6">
                {items.map((item, index) => (
                  <div key={index} className="relative p-5 border rounded-2xl bg-card shadow-sm space-y-5 group transition-all hover:border-primary/30 hover:shadow-md">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground/70">Yazan Rolü</Label>
                        <Select value={item.authorType} onValueChange={(v: any) => {
                          updateItem(index, 'authorType', v);
                          updateItem(index, 'authorName', '');
                        }}>
                          <SelectTrigger className="h-10 text-xs bg-muted/5 border-muted-foreground/20"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UZMAN">İş Güvenliği Uzmanı</SelectItem>
                            <SelectItem value="DOKTOR">İşyeri Hekimi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground/70">Yazan Kişi (Atananlar)</Label>
                        <Select 
                          value={item.authorName} 
                          onValueChange={(v) => updateItem(index, 'authorName', v)}
                        >
                          <SelectTrigger className="h-10 text-xs bg-muted/5 font-semibold border-muted-foreground/20">
                            <SelectValue placeholder="Profesyonel Seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {professionals
                              ?.filter((p: any) => {
                                const title = (p.titleClass || '').toLowerCase();
                                if (item.authorType === 'DOKTOR') return title.includes('hekim');
                                if (item.authorType === 'UZMAN') return title.includes('uzman') || title.includes('igu');
                                return true;
                              })
                              .map((p: any) => (
                                <SelectItem key={p.id} value={p.fullName}>{p.fullName}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground/70">Kategori</Label>
                        <Select value={item.categoryId} onValueChange={(v) => {
                          updateItem(index, 'categoryId', v);
                          updateItem(index, 'subCategoryId', '');
                        }}>
                          <SelectTrigger className="h-10 text-xs font-semibold border-muted-foreground/20">
                            <div className="truncate">
                              {categories?.find((c: any) => String(c.id) === String(item.categoryId))?.name || <span className="text-muted-foreground italic">Kategori Seçin</span>}
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((c: any) => (
                              <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground/70">Alt Kategori</Label>
                        <Select value={item.subCategoryId} onValueChange={(v) => updateItem(index, 'subCategoryId', v)}>
                          <SelectTrigger className="h-10 text-xs border-muted-foreground/20">
                            <div className="truncate">
                              {subCategories?.find((sc: any) => String(sc.id) === String(item.subCategoryId))?.name || <span className="text-muted-foreground italic">Seçiniz</span>}
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {subCategories
                              ?.filter((sc: any) => sc.categoryId.toString() === item.categoryId)
                              .map((sc: any) => (
                                <SelectItem key={sc.id} value={sc.id.toString()}>{sc.name}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground/70">Departman</Label>
                        <Select value={item.departmentId} onValueChange={(v) => updateItem(index, 'departmentId', v)}>
                          <SelectTrigger className="h-10 text-xs font-semibold border-muted-foreground/20">
                            <div className="truncate">
                              {departments?.find((d: any) => String(d.id) === String(item.departmentId))?.name || <span className="text-muted-foreground italic">Departman Seçin</span>}
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {departments?.map((d: any) => (
                              <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground/70">Tespit/Öneri Metni</Label>
                      <Textarea 
                        placeholder="Defterdeki metnin birebir aynısı..." 
                        className="min-h-[100px] text-xs resize-none bg-muted/5 focus:bg-background transition-colors border-muted-foreground/20"
                        value={item.content}
                        onChange={(e) => updateItem(index, 'content', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>

          <DialogFooter className="p-6 border-t bg-muted/10">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>İptal</Button>
            <Button type="submit" onClick={handleSubmit} disabled={mutation.isPending} className="min-w-[180px] shadow-lg shadow-primary/20 font-bold h-11">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {isEdit ? 'Kaydı Güncelle' : 'Deftere İşle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Detail Modal */}
      <Dialog open={!!viewPage} onOpenChange={() => setViewPage(null)}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 border-b bg-muted/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600 border border-amber-200/50"><Calendar className="w-6 h-6" /></div>
                 <div>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight">
                      {new Date(viewPage?.date || '').toLocaleDateString('tr-TR')} Tarihli Defter Sayfası
                    </DialogTitle>
                    <DialogDescription className="font-bold flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="h-5">{viewPage?.items.length} Madde</Badge>
                      <span className="text-[10px] uppercase text-muted-foreground italic">Giriş: {new Date(viewPage?.createdAt || '').toLocaleString('tr-TR')}</span>
                    </DialogDescription>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 {viewPage && isPageLocked(viewPage) && (
                   <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50 py-1.5 px-3 flex items-center gap-1.5 uppercase font-black text-[10px] shadow-sm">
                     <Lock className="w-3 h-3" /> Düzenlemeye Kapalı
                   </Badge>
                 )}
                 <Badge className={viewPage?.status === 'Tamamlandı' ? 'bg-emerald-500 py-1.5 px-3' : 'bg-amber-500 py-1.5 px-3'}>
                    {viewPage?.status === 'Tamamlandı' ? 'Görsel Mevcut' : 'Görsel Eksik'}
                 </Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-background">
            {/* Left: Items List */}
            <div className="flex-[1.2] overflow-y-auto p-6 space-y-6 border-r bg-muted/5 custom-scrollbar">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2 mb-4">
                 <Tag className="w-3.5 h-3.5" /> Yazılan Maddeler
               </h4>
               <div className="space-y-5">
                 {viewPage?.items.map((item, idx) => (
                   <Card key={idx} className="shadow-sm border-border/50 hover:shadow-md transition-all hover:border-primary/20">
                     <CardContent className="p-5 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-black text-primary border border-primary/20 shadow-inner">{idx + 1}</div>
                            <div>
                                <h5 className="text-sm font-bold leading-none">{item.authorName}</h5>
                                <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-1 block">{item.authorType}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                             <Badge variant="outline" className="text-[9px] bg-primary/5 border-primary/20 text-primary font-black uppercase">{item.category?.name}</Badge>
                             <div className="flex items-center gap-1 text-[9px] font-black text-muted-foreground/50 uppercase tracking-tighter">
                                <Building2 className="w-2.5 h-2.5" /> {item.department?.name}
                             </div>
                          </div>
                        </div>
                        <div className="relative bg-muted/20 p-4 rounded-xl border border-muted-foreground/5 italic shadow-inner">
                            <p className="text-sm leading-relaxed text-foreground/80 font-medium">
                              "{item.content}"
                            </p>
                        </div>
                     </CardContent>
                   </Card>
                 ))}
               </div>
            </div>

            {/* Right: Document Preview */}
            <div className="flex-1 bg-muted/10 p-6 flex flex-col gap-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                 <FileUp className="w-3.5 h-3.5" /> Taranmış Orijinal Belge
              </h4>
              <div className="flex-1 relative rounded-[2rem] overflow-hidden border-2 border-dashed border-muted-foreground/20 bg-background flex items-center justify-center min-h-[450px] shadow-2xl group transition-all">
                {viewPage?.documentUrl ? (
                   viewPage.documentUrl.toLowerCase().endsWith('.pdf') ? (
                     <div className="flex flex-col items-center gap-4 text-center p-8">
                       <div className="p-8 bg-red-50 rounded-full border border-red-100 shadow-inner group-hover:scale-110 transition-transform"><FileText className="w-24 h-24 text-red-500/40" /></div>
                       <div>
                          <p className="text-sm font-black text-foreground uppercase tracking-widest">PDF DOKÜMANI</p>
                          <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Tarayıcıda görüntülemek için butona basın</p>
                       </div>
                       <Button asChild variant="outline" className="h-11 rounded-2xl px-10 border-primary/40 text-primary hover:bg-primary hover:text-white shadow-xl transition-all font-bold">
                         <a href={viewPage.documentUrl} target="_blank" rel="noreferrer">
                           <Download className="w-4 h-4 mr-2" /> Görüntüle / İndir
                         </a>
                       </Button>
                     </div>
                   ) : (
                    <img 
                      src={viewPage.documentUrl} 
                      alt="Notebook Page" 
                      className="max-w-full h-auto max-h-[600px] object-contain p-4 group-hover:scale-[1.05] transition-transform duration-700 cursor-zoom-in"
                      onClick={() => window.open(viewPage.documentUrl, '_blank')}
                    />
                   )
                ) : (
                  <div className="flex flex-col items-center justify-center gap-6 text-muted-foreground/30 p-12 text-center">
                    <div className="p-10 bg-amber-500/5 rounded-[2.5rem] border border-amber-100/50 shadow-inner animate-pulse"><AlertCircle className="w-20 h-20 text-amber-500/20" /></div>
                    <div>
                        <p className="text-lg font-black uppercase tracking-widest text-amber-600/40">Henüz Belge Yok</p>
                        <p className="text-xs font-bold text-muted-foreground/60 mt-2 uppercase">Görsel yüklemeden sayfa "Eksik" olarak kalır</p>
                    </div>
                  </div>
                )}
              </div>
              {viewPage?.documentUploadedAt && (
                <div className="p-3 bg-emerald-500/5 border border-emerald-100 rounded-xl flex items-center justify-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                    Belge Yükleme: {new Date(viewPage.documentUploadedAt).toLocaleString('tr-TR')}
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-5 border-t bg-card flex items-center justify-between">
             <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px] h-6 font-bold bg-muted/50 border-muted-foreground/10 px-2 uppercase">UUID: {viewPage?.id}</Badge>
             </div>
             <Button variant="outline" className="px-12 rounded-xl font-bold h-10 hover:bg-muted" onClick={() => setViewPage(null)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}