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
  Eye, FileUp, Loader2, Download, Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface NotebookEntry {
  id: number;
  date: string;
  authorType: 'DOKTOR' | 'UZMAN';
  authorName: string;
  content: string;
  categoryId: number;
  subCategoryId?: number;
  departmentId: number;
  documentUrl?: string;
  status: 'Eksik' | 'Tamamlandı';
  category: { name: string };
  subCategory?: { name: string };
  department: { name: string };
}

export default function NotebooksPage() {
  const queryClient = useQueryClient();
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState<NotebookEntry | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    authorType: 'UZMAN',
    authorName: '',
    content: '',
    categoryId: '',
    subCategoryId: '',
    departmentId: '',
  });
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

  const { data: departments } = useQuery({
    queryKey: ['definitions-departments'],
    queryFn: async () => {
      const res = await api.get('/settings/definitions/departments');
      if (!res.ok) throw new Error('Departmanlar yüklenemedi');
      return res.json();
    },
  });

  const { data: entries, isLoading } = useQuery<NotebookEntry[]>({
    queryKey: ['notebook-entries', selectedFacility, selectedYear],
    queryFn: async () => {
      if (!selectedFacility) return [];
      const res = await api.get(`/notebooks/${selectedFacility}?year=${selectedYear}`);
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
        // FormData olduğu için Content-Type set etmiyoruz, browser hallediyor
      });
      if (!res.ok) throw new Error('İşlem başarısız');
      return res.json();
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Kayıt güncellendi' : 'Yeni kayıt eklendi');
      queryClient.invalidateQueries({ queryKey: ['notebook-entries'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      authorType: 'UZMAN',
      authorName: '',
      content: '',
      categoryId: '',
      subCategoryId: '',
      departmentId: '',
    });
    setSelectedFile(null);
    setIsEdit(false);
    setEditingId(null);
  };

  const handleEdit = (entry: NotebookEntry) => {
    setFormData({
      date: entry.date.slice(0, 10),
      authorType: entry.authorType,
      authorName: entry.authorName,
      content: entry.content,
      categoryId: entry.categoryId.toString(),
      subCategoryId: entry.subCategoryId?.toString() || '',
      departmentId: entry.departmentId.toString(),
    });
    setEditingId(entry.id);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) data.append(key, value);
    });
    if (selectedFile) {
      data.append('document', selectedFile);
    }
    mutation.mutate(data);
  };

  // Dashboard Stats
  const stats = useMemo(() => {
    if (!entries) return { total: 0, missing: 0, completed: 0, byCategory: {} as Record<string, number> };
    const res = {
      total: entries.length,
      missing: entries.filter(e => e.status === 'Eksik').length,
      completed: entries.filter(e => e.status === 'Tamamlandı').length,
      byCategory: {} as Record<string, number>
    };
    entries.forEach(e => {
      res.byCategory[e.category.name] = (res.byCategory[e.category.name] || 0) + 1;
    });
    return res;
  }, [entries]);

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
            <p className="text-xs text-muted-foreground">Resmi İSG defter kayıtlarının dijital arşivi</p>
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
            <Label className="text-xs font-bold text-muted-foreground uppercase hidden sm:inline">Yıl:</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-24 h-10 font-semibold">
                <SelectValue placeholder="Yıl" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="gap-2 shadow-lg h-10 px-6">
            <Plus className="w-4 h-4" /> Yeni Kayıt
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg"><History className="w-5 h-5 text-blue-500" /></div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Toplam Kayıt</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Tamamlanan (Dokümanlı)</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-lg"><AlertCircle className="w-5 h-5 text-amber-500" /></div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Eksik (Görsel Bekleyen)</p>
              <p className="text-2xl font-bold text-amber-600">{stats.missing}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg"><Tag className="w-5 h-5 text-purple-500" /></div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">En Çok Kategori</p>
              <p className="text-lg font-bold truncate max-w-[150px]">
                {Object.entries(stats.byCategory).sort((a,b) => b[1]-a[1])[0]?.[0] || '-'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="shadow-sm border-border/50 overflow-hidden">
        <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Kayıt Arşivi</CardTitle>
            <CardDescription>{selectedYear} yılına ait tüm defter kayıtları</CardDescription>
          </div>
          <div className="flex items-center gap-2">
             <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Kayıtlarda ara..." className="pl-9 w-64 h-9 bg-background" />
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[120px]">Tarih</TableHead>
                <TableHead>Yazan</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Departman</TableHead>
                <TableHead>Statü</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries?.map((entry) => (
                <TableRow key={entry.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="text-sm">{new Date(entry.date).toLocaleDateString('tr-TR')}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{entry.year}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{entry.authorName}</span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase">{entry.authorType}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary px-2 py-0">
                      {entry.category.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-medium">{entry.department.name}</TableCell>
                  <TableCell>
                    {entry.status === 'Tamamlandı' ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none flex w-fit items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Tamamlandı
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none flex w-fit items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Doküman Eksik
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setViewEntry(entry)} className="h-8 px-3 text-xs font-bold">
                        <Eye className="w-3.5 h-3.5 mr-1" /> İncele
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)} className="h-8 px-3 text-xs font-bold text-primary hover:bg-primary/10">
                         Düzenle
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!entries || entries.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">
                    Bu tesis ve yıl için henüz kayıt bulunmuyor.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New/Edit Entry Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEdit ? <History className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {isEdit ? 'Kaydı Güncelle' : 'Yeni Tespit & Öneri Kaydı'}
            </DialogTitle>
            <DialogDescription>Deftere yazılan tüm bilgileri eksiksiz şekilde dijital ortama aktarın.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider">Kayıt Tarihi</Label>
                <Input 
                  type="date" 
                  value={formData.date} 
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider">Yazan Kişi Rolü</Label>
                <Select value={formData.authorType} onValueChange={(v: any) => setFormData({ ...formData, authorType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UZMAN">İş Güvenliği Uzmanı</SelectItem>
                    <SelectItem value="DOKTOR">İşyeri Hekimi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">Yazan Kişi Adı Soyadı</Label>
              <Input 
                placeholder="Örn: Dr. Ahmet Yılmaz" 
                value={formData.authorName}
                onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider">Kategori</Label>
                <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Kategori Seçin" /></SelectTrigger>
                  <SelectContent>
                    {categories?.map((c: any) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider">Sorumlu Departman</Label>
                <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v })}>
                  <SelectTrigger><SelectValue placeholder="Departman Seçin" /></SelectTrigger>
                  <SelectContent>
                    {departments?.map((d: any) => (
                      <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">Tespit & Öneri Detayı</Label>
              <Textarea 
                placeholder="Deftere yazılan metni buraya kopyalayın..." 
                className="min-h-[150px] resize-none"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">Defter Sayfası Görseli / PDF</Label>
              <div className="flex items-center gap-4 p-4 border-2 border-dashed rounded-xl bg-muted/30">
                <div className="p-3 bg-background rounded-full border shadow-sm">
                  <FileUp className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-bold">{selectedFile ? selectedFile.name : 'Dosya seçilmedi'}</p>
                  <p className="text-[10px] text-muted-foreground italic">PNG, JPEG veya PDF (Maks. 10MB)</p>
                </div>
                <Input 
                  type="file" 
                  className="hidden" 
                  id="notebook-file" 
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('notebook-file')?.click()}>
                  Dosya Seç
                </Button>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Vazgeç</Button>
              <Button type="submit" disabled={mutation.isPending} className="min-w-[150px]">
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {isEdit ? 'Güncelle' : 'Kaydet'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Detail Modal */}
      <Dialog open={!!viewEntry} onOpenChange={() => setViewEntry(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
               <Badge className={viewEntry?.status === 'Tamamlandı' ? 'bg-emerald-500' : 'bg-amber-500'}>
                 {viewEntry?.status}
               </Badge>
               <span>{viewEntry?.category.name} - {new Date(viewEntry?.date || '').toLocaleDateString('tr-TR')}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-1 bg-muted/30 p-4 rounded-xl">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Tespit / Öneri Metni</p>
                <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap font-medium border-l-4 border-primary pl-4 py-2">
                  {viewEntry?.content}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Düzenleyen</p>
                  <p className="text-sm font-bold flex items-center gap-2"><User className="w-3.5 h-3.5" /> {viewEntry?.authorName}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{viewEntry?.authorType}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Departman</p>
                  <p className="text-sm font-bold flex items-center gap-2"><Building2 className="w-3.5 h-3.5" /> {viewEntry?.department.name}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Orijinal Defter Görseli</p>
              {viewEntry?.documentUrl ? (
                <div className="relative group rounded-2xl overflow-hidden border shadow-inner bg-black/5 min-h-[300px] flex items-center justify-center">
                   {viewEntry.documentUrl.toLowerCase().endsWith('.pdf') ? (
                     <div className="flex flex-col items-center gap-3">
                       <FileText className="w-16 h-16 text-muted-foreground/30" />
                       <p className="text-xs font-bold text-muted-foreground">PDF Dokümanı</p>
                       <Button asChild variant="outline" size="sm">
                         <a href={import.meta.env.VITE_API_URL?.replace('/api', '') + viewEntry.documentUrl} target="_blank" rel="noreferrer">
                           <Download className="w-3.5 h-3.5 mr-2" /> Görüntüle / İndir
                         </a>
                       </Button>
                     </div>
                   ) : (
                    <img 
                      src={import.meta.env.VITE_API_URL?.replace('/api', '') + viewEntry.documentUrl} 
                      alt="Notebook Page" 
                      className="max-w-full h-auto"
                    />
                   )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] bg-muted/20 border-2 border-dashed rounded-2xl gap-4">
                  <AlertCircle className="w-12 h-12 text-amber-500/30" />
                  <p className="text-sm font-bold text-muted-foreground">Henüz bir doküman yüklenmemiş</p>
                  <Button variant="outline" size="sm" onClick={() => { setViewEntry(null); handleEdit(viewEntry!); }}>
                    Şimdi Yükle
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-8 pt-4 border-t">
            <Button variant="outline" onClick={() => setViewEntry(null)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Save = ({ className }: { className?: string }) => <CheckCircle2 className={className} />;