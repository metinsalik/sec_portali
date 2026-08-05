import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderTree, Building2, Edit, Trash2, Plus, Loader2, Users, CornerDownRight, CalendarDays, Search, ChevronDown, ChevronRight, Upload, FileText, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import * as xlsx from 'xlsx';
import api from '@/lib/api';

const API = import.meta.env.VITE_API_URL || '';

interface SubCategory { id: number; name: string; categoryId: number; }
interface Category { id: number; name: string; subCategories?: SubCategory[]; }
interface Department { id: number; name: string; }
interface BoardMember {
  id: number;
  facilityId: string;
  year: number;
  boardRole: string;
  jobTitle: string;
  name: string;
  departmentId: number;
  department?: Department;
}

const BOARD_ROLES = ["Kurul Başkanı", "Kurul Sekreteri", "Kurul Üyesi", "Destek Elemanı"];
const JOB_TITLES = [
  "İşveren / İşveren Vekili",
  "İş Güvenliği Uzmanı",
  "İşyeri Hekimi",
  "Baş Çalışan Temsilcisi",
  "Sivil Savunma Uzmanı",
  "Formen / Ustabaşı / Usta",
  "Çalışan Temsilcisi",
  "İnsan Kaynakları / Mali İşler Görevlisi",
  "Diğer"
];

export default function IsgKurulSettings() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');
  const { user } = useAuth();
  const hasAdminAccess = user?.isAdmin || user?.isManagement || user?.roles?.includes('admin') || user?.roles?.includes('management');

  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(localStorage.getItem('activeFacilityId') || '');
  useEffect(() => {
    const handleFacilityChange = () => setSelectedFacilityId(localStorage.getItem('activeFacilityId') || '');
    window.addEventListener('facilityChanged', handleFacilityChange);
    return () => window.removeEventListener('facilityChanged', handleFacilityChange);
  }, []);

  // Modals state
  const [catModal, setCatModal] = useState<{ open: boolean; edit?: Category }>({ open: false });
  const [catName, setCatName] = useState('');

  const [subModal, setSubModal] = useState<{ open: boolean; categoryId?: number; edit?: SubCategory }>({ open: false });
  const [subName, setSubName] = useState('');

  const [deptModal, setDeptModal] = useState<{ open: boolean; edit?: Department }>({ open: false });
  const [deptName, setDeptName] = useState('');

  const [memberModal, setMemberModal] = useState<{ open: boolean; edit?: BoardMember }>({ open: false });
  const [memberForm, setMemberForm] = useState({ name: '', boardRole: '', jobTitle: '', departmentId: '', year: new Date().getFullYear().toString() });

  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: 'category' | 'subcategory' | 'department' | 'member'; id: number | null }>({ open: false, type: 'category', id: null });

  const [catSearch, setCatSearch] = useState('');
  const [deptSearch, setDeptSearch] = useState('');
  const [expandedCats, setExpandedCats] = useState<Set<number>>(new Set());

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [importTargetFacilityId, setImportTargetFacilityId] = useState<string>('');
  
  const toggleCat = (id: number) => {
    const newSet = new Set(expandedCats);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedCats(newSet);
  };

  // Fetch Data
  const { data: categories = [], isLoading: catLoading } = useQuery<Category[]>({
    queryKey: ['settings-categories'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/settings/definitions/categories`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Kategoriler alınamadı');
      return res.json();
    },
    enabled: hasAdminAccess,
  });

  const { data: departments = [], isLoading: deptLoading } = useQuery<Department[]>({
    queryKey: ['settings-departments'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/settings/definitions/departments`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Departmanlar alınamadı');
      return res.json();
    },
  });

  const { data: facilities = [] } = useQuery<any[]>({
    queryKey: ['settings-facilities'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/settings/facilities`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    }
  });

  const { data: members = [], isLoading: membersLoading } = useQuery<BoardMember[]>({
    queryKey: ['board-members', selectedFacilityId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/operations/board/members?facilityId=${selectedFacilityId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Üyeler alınamadı');
      return res.json();
    },
    enabled: !!selectedFacilityId,
  });

  // Group members by year
  const groupedMembers = members.reduce((acc, member) => {
    if (!acc[member.year]) acc[member.year] = [];
    acc[member.year].push(member);
    return acc;
  }, {} as Record<number, BoardMember[]>);
  
  const sortedYears = Object.keys(groupedMembers).map(Number).sort((a, b) => b - a);

  // Category Mutations
  const saveCategory = useMutation({
    mutationFn: async () => {
      const url = catModal.edit ? `${API}/api/settings/definitions/categories/${catModal.edit.id}` : `${API}/api/settings/definitions/categories`;
      const res = await fetch(url, {
        method: catModal.edit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: catName })
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => { toast.success('Kategori kaydedildi'); queryClient.invalidateQueries({ queryKey: ['settings-categories'] }); setCatModal({ open: false }); setCatName(''); },
    onError: () => toast.error('İşlem başarısız')
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API}/api/settings/definitions/categories/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => { toast.success('Kategori silindi'); queryClient.invalidateQueries({ queryKey: ['settings-categories'] }); },
    onError: () => toast.error('Silme başarısız')
  });

  const saveSubCategory = useMutation({
    mutationFn: async () => {
      const url = subModal.edit ? `${API}/api/settings/definitions/subcategories/${subModal.edit.id}` : `${API}/api/settings/definitions/subcategories`;
      const res = await fetch(url, {
        method: subModal.edit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: subName, categoryId: subModal.categoryId })
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => { toast.success('Alt Kategori kaydedildi'); queryClient.invalidateQueries({ queryKey: ['settings-categories'] }); setSubModal({ open: false }); setSubName(''); },
    onError: () => toast.error('İşlem başarısız')
  });

  const deleteSubCategory = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API}/api/settings/definitions/subcategories/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => { toast.success('Alt Kategori silindi'); queryClient.invalidateQueries({ queryKey: ['settings-categories'] }); },
    onError: () => toast.error('Silme başarısız')
  });

  // Department Mutations
  const saveDepartment = useMutation({
    mutationFn: async () => {
      const url = deptModal.edit ? `${API}/api/settings/definitions/departments/${deptModal.edit.id}` : `${API}/api/settings/definitions/departments`;
      const res = await fetch(url, {
        method: deptModal.edit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: deptName })
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => { toast.success('Departman kaydedildi'); queryClient.invalidateQueries({ queryKey: ['settings-departments'] }); setDeptModal({ open: false }); setDeptName(''); },
    onError: () => toast.error('İşlem başarısız')
  });

  const deleteDepartment = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API}/api/settings/definitions/departments/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => {
      toast.success('Bölüm/Departman silindi');
      setDeleteConfirm({ open: false, type: 'department', id: null });
      queryClient.invalidateQueries({ queryKey: ['settings-departments'] });
    },
    onError: () => toast.error('Hata oluştu')
  });
  // Delete All Data Mutation
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete('/operations/board/bulk-delete');
      return res.json();
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Tüm veriler başarıyla silindi.');
      queryClient.invalidateQueries({ queryKey: ['ohs-board-meetings'] });
      setDeleteConfirm({ open: false, type: null, id: null });
    },
    onError: () => toast.error('Silme işlemi başarısız.')
  });

  // Import Mutation
  const importMutation = useMutation({
    mutationFn: async ({ data, targetFacilityId }: { data: any[], targetFacilityId: string }) => {
      const res = await api.post('/operations/board/bulk-import', { data, targetFacilityId });
      return res.json();
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${res.imported} karar başarıyla içeri aktarıldı.`);
      queryClient.invalidateQueries({ queryKey: ['settings-categories'] });
      queryClient.invalidateQueries({ queryKey: ['settings-departments'] });
      queryClient.invalidateQueries({ queryKey: ['ohs-board-meetings'] });
      setImportFile(null);
      setParsedData([]);
    },
    onError: () => {
      toast.error('Sunucu ile iletişimde bir hata oluştu.');
    }
  });

  const parseFile = (file: File) => {
    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = xlsx.read(data, { type: 'binary', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          toast.error('Dosyada veri bulunamadı.');
          setIsParsing(false);
          return;
        }

        // Map data
        const mappedData = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row: any = jsonData[i];
          if (row.length === 0 || !row[0]) continue;
          
          const decisionText = row[3];
          if (!decisionText) continue;

          mappedData.push({
            facilityName: row[0],
            meetingNo: row[1],
            meetingDate: row[2],
            decisionText: decisionText,
            categoryName: row[4],
            departmentName: row[5],
            status: row[6],
            dueDate: row[7],
            completionDate: row[8],
            remarks: row[9],
            priority: row[10] || 'Düşük'
          });
        }
        setParsedData(mappedData);
      } catch (err) {
        console.error('Error parsing file', err);
        toast.error('Dosya okunurken bir hata oluştu.');
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setImportFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  // Member Mutations
  const saveMember = useMutation({
    mutationFn: async () => {
      const url = memberModal.edit ? `${API}/api/operations/board/members/${memberModal.edit.id}` : `${API}/api/operations/board/members`;
      const res = await fetch(url, {
        method: memberModal.edit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          ...memberForm, 
          facilityId: selectedFacilityId,
          year: parseInt(memberForm.year),
        })
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => { toast.success('Kurul üyesi kaydedildi'); queryClient.invalidateQueries({ queryKey: ['board-members'] }); setMemberModal({ open: false }); },
    onError: () => toast.error('İşlem başarısız')
  });

  const deleteMember = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API}/api/operations/board/members/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => { toast.success('Kurul üyesi silindi'); queryClient.invalidateQueries({ queryKey: ['board-members'] }); },
    onError: () => toast.error('Silme başarısız')
  });

  const handleEditMember = (member: BoardMember) => {
    setMemberForm({
      name: member.name,
      boardRole: member.boardRole,
      jobTitle: member.jobTitle,
      departmentId: String(member.departmentId),
      year: String(member.year)
    });
    setMemberModal({ open: true, edit: member });
  };

  const handleCreateMember = () => {
    setMemberForm({ name: '', boardRole: '', jobTitle: '', departmentId: '', year: new Date().getFullYear().toString() });
    setMemberModal({ open: true });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">İSG Kurul Ayarları</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Toplantı kategorileri, departman tanımlamaları ve kurul üyeleri</p>
        </div>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="bg-white dark:bg-slate-900 border p-1 rounded-xl">
          <TabsTrigger value="members" className="gap-2 rounded-lg data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800">
            <Users className="w-4 h-4" />
            İSG Kurul Üyeleri
          </TabsTrigger>
          {hasAdminAccess && <TabsTrigger value="categories" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Kategoriler</TabsTrigger>}
          {hasAdminAccess && <TabsTrigger value="departments" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Sorumlu Birimler</TabsTrigger>}
          {hasAdminAccess && <TabsTrigger value="import" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700">Excel'den Aktar</TabsTrigger>}
        </TabsList>

        <TabsContent value="members" className="space-y-6 outline-none">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-[#2c3135] p-4 rounded-xl border border-slate-200/80 dark:border-[#73787c]/30 gap-4 shadow-sm">
            <div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Kurul Üyeleri</h3>
              <p className="text-sm text-muted-foreground">İş Sağlığı ve Güvenliği Kurulu üye listesi (Yıllara göre gruplandırılmış)</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleCreateMember} size="sm" className="gap-2 shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                <Plus className="w-4 h-4" /> Yeni Üye Ekle
              </Button>
            </div>
          </div>

          <div>
            {membersLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : sortedYears.length === 0 ? (
              <Card className="border-dashed"><CardContent className="py-16 text-center text-muted-foreground">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                Bu tesise ait kurul üyesi bulunamadı.<br/>Yukarıdaki butonu kullanarak yeni üye ekleyebilirsiniz.
              </CardContent></Card>
            ) : (
              <div className="space-y-8">
                {sortedYears.map(year => (
                  <div key={year} className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <CalendarDays className="w-5 h-5 text-blue-500" />
                      {year} Yılı Kurul Üyeleri
                      <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-800 ml-1">{groupedMembers[year].length} Üye</Badge>
                    </h4>
                    
                    <Card className="overflow-hidden border border-slate-200/60 dark:border-slate-800 shadow-sm">
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {groupedMembers[year].map(member => (
                          <div key={member.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group">
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-300 font-semibold text-sm shrink-0">
                                {member.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-[15px] text-slate-900 dark:text-slate-100">{member.name}</span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                                  <span className="font-medium text-blue-600 dark:text-blue-400">{member.boardRole}</span>
                                  <span className="text-slate-300 dark:text-slate-700">•</span>
                                  <span>{member.jobTitle}</span>
                                  <span className="text-slate-300 dark:text-slate-700">•</span>
                                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {member.department?.name || 'Bilinmiyor'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => handleEditMember(member)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setDeleteConfirm({ open: true, type: 'member', id: member.id })}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {hasAdminAccess && (
          <TabsContent value="categories" className="space-y-6 outline-none">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-[#2c3135] p-4 rounded-xl border border-slate-200/80 dark:border-[#73787c]/30 gap-4 shadow-sm">
              <div>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Kurul Kategorileri</h3>
                <p className="text-sm text-muted-foreground">Kararlar için kullanılacak kategori tanımları</p>
              </div>
              <Button onClick={() => { setCatName(''); setCatModal({ open: true }); }} size="sm" className="gap-2 shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                <Plus className="w-4 h-4" /> Kategori Ekle
              </Button>
            </div>

            <div>
              {catLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
              ) : categories.length === 0 ? (
                <Card className="border-dashed"><CardContent className="py-16 text-center text-muted-foreground">
                  <FolderTree className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  Kategori bulunamadı.<br/>Yukarıdaki butonu kullanarak yeni kategori ekleyebilirsiniz.
                </CardContent></Card>
              ) : (
                <>
                  <div className="mb-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Kategori veya alt kategori ara..." value={catSearch} onChange={e => setCatSearch(e.target.value)} className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
                  </div>
                  <Card className="overflow-hidden border border-slate-200/60 dark:border-slate-800 shadow-sm">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {[...categories]
                        .filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()) || c.subCategories?.some(sub => sub.name.toLowerCase().includes(catSearch.toLowerCase())))
                        .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
                        .map(cat => {
                        const hasSub = cat.subCategories && cat.subCategories.length > 0;
                        const isExpanded = expandedCats.has(cat.id);
                        return (
                          <div key={cat.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col group">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => hasSub && toggleCat(cat.id)}>
                                {hasSub ? (
                                  isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />
                                ) : <div className="w-4 h-4" />}
                                <span className="font-medium text-[15px] text-slate-900 dark:text-slate-100">{cat.name}</span>
                              </div>
                              <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSubName(''); setSubModal({ open: true, categoryId: cat.id }); }} className="h-8 text-xs border-slate-200 dark:border-slate-700">
                                  <Plus className="w-3 h-3 mr-1" /> Alt Kategori
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 ml-2" onClick={(e) => { e.stopPropagation(); setCatName(cat.name); setCatModal({ open: true, edit: cat }); }}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, type: 'category', id: cat.id }); }}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            {hasSub && isExpanded && (
                              <div className="ml-6 mt-3 border-l-2 border-slate-200/80 dark:border-slate-700/80 pl-4 space-y-1">
                                {cat.subCategories!.map(sub => (
                                  <div key={sub.id} className="flex justify-between items-center group/sub py-1.5 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-md px-2 -ml-2 transition-colors">
                                    <span className="text-sm flex items-center text-slate-600 dark:text-slate-400">
                                      <CornerDownRight className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                      {sub.name}
                                    </span>
                                    <div className="flex gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => { setSubName(sub.name); setSubModal({ open: true, edit: sub, categoryId: cat.id }); }}>
                                        <Edit className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setDeleteConfirm({ open: true, type: 'subcategory', id: sub.id })}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>
        )}

        {hasAdminAccess && (
          <TabsContent value="departments" className="space-y-6 outline-none">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-[#2c3135] p-4 rounded-xl border border-slate-200/80 dark:border-[#73787c]/30 gap-4 shadow-sm">
              <div>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Departmanlar</h3>
                <p className="text-sm text-muted-foreground">Toplantı katılımcıları ve kararlar için departman tanımları</p>
              </div>
              <Button onClick={() => { setDeptName(''); setDeptModal({ open: true }); }} size="sm" className="gap-2 shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                <Plus className="w-4 h-4" /> Departman Ekle
              </Button>
            </div>

            <div>
              {deptLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
              ) : departments.length === 0 ? (
                <Card className="border-dashed"><CardContent className="py-16 text-center text-muted-foreground">
                  <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  Departman bulunamadı.<br/>Yukarıdaki butonu kullanarak yeni departman ekleyebilirsiniz.
                </CardContent></Card>
              ) : (
                <>
                  <div className="mb-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Departman ara..." value={deptSearch} onChange={e => setDeptSearch(e.target.value)} className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
                  </div>
                  <Card className="overflow-hidden border border-slate-200/60 dark:border-slate-800 shadow-sm">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {[...departments]
                        .filter(d => d.name.toLowerCase().includes(deptSearch.toLowerCase()))
                        .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
                        .map(dept => (
                        <div key={dept.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-[15px] text-slate-900 dark:text-slate-100">{dept.name}</span>
                          </div>
                          <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => { setDeptName(dept.name); setDeptModal({ open: true, edit: dept }); }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setDeleteConfirm({ open: true, type: 'department', id: dept.id })}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>
        )}

        {hasAdminAccess && (
          <TabsContent value="import" className="space-y-6 outline-none">
            <div className="flex flex-col bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200/80 dark:border-[#73787c]/30 shadow-sm">
              <div className="mb-6">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Excel'den Karar Yükle</h3>
                <p className="text-sm text-muted-foreground">Hazırladığınız Excel (.xlsx) veya CSV dosyasını sisteme yükleyerek toplu karar aktarımı yapabilirsiniz.</p>
              </div>

              <div className="py-2">
                {!importFile ? (
                  <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-12 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer w-full">
                    <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8" />
                    </div>
                    <p className="text-base font-medium text-slate-700 dark:text-slate-200 mb-1">Dosya seçmek için tıklayın</p>
                    <p className="text-sm text-slate-500">.xlsx veya .csv (Maks. 10MB)</p>
                    <input 
                      type="file" 
                      onChange={handleImportFileSelect} 
                      accept=".xlsx, .xls, .csv" 
                      className="hidden" 
                    />
                  </label>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                    <div className="mb-6 space-y-2">
                      <label className="text-sm font-medium">Hedef Tesis Seçimi (Opsiyonel)</label>
                      <Select value={importTargetFacilityId} onValueChange={setImportTargetFacilityId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Tesis seçerseniz tüm kararlar bu tesise aktarılır" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Excel'deki tesis adlarını kullan</SelectItem>
                          {facilities.map((fac: any) => (
                            <SelectItem key={fac.id} value={fac.id}>{fac.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">Eğer bir tesis seçerseniz, Excel'deki Tesis Adı sütunu yok sayılır.</p>
                    </div>

                    <div className="flex items-start justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded flex items-center justify-center">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-base font-medium text-slate-800 dark:text-slate-100">{importFile.name}</p>
                          <p className="text-sm text-slate-500">
                            {isParsing ? 'Okunuyor...' : `${parsedData.length} geçerli karar satırı bulundu`}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => { setImportFile(null); setParsedData([]); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 p-2 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {!isParsing && parsedData.length > 0 && (
                      <div className="mt-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 flex items-start gap-3 border border-slate-100 dark:border-slate-700/50">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          Sistemde bulunmayan Kategori ve Sorumlular (Departman) otomatik olarak oluşturulacak. Eşleşmeyen Tesis satırları atlanacaktır.
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-6 flex justify-end">
                      <Button 
                        onClick={() => importMutation.mutate({ 
                          data: parsedData, 
                          targetFacilityId: importTargetFacilityId === 'none' ? '' : importTargetFacilityId 
                        })} 
                        disabled={isParsing || parsedData.length === 0 || importMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
                      >
                        {importMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {importMutation.isPending ? 'Aktarılıyor...' : 'İçeri Aktar'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Delete All Data Section */}
              <div className="mt-10 border-t border-slate-200 dark:border-slate-700/50 pt-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-red-50 dark:bg-red-900/10 p-5 rounded-lg border border-red-100 dark:border-red-900/30 gap-4">
                  <div>
                    <h4 className="text-red-800 dark:text-red-400 font-semibold mb-1">Tüm Kurul Verilerini Temizle</h4>
                    <p className="text-sm text-red-600 dark:text-red-500/80">Sistemdeki tüm Kurul Toplantılarını ve Kararlarını kalıcı olarak siler. Bu işlem geri alınamaz ve tüm geçmiş kayıtlar gider.</p>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={() => setDeleteConfirm({ open: true, type: 'all-data', id: null })}
                    disabled={deleteAllMutation.isPending}
                    className="shrink-0"
                  >
                    {deleteAllMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Tümünü Sil
                  </Button>
                </div>
              </div>

            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Modals */}
      <Dialog open={memberModal.open} onOpenChange={(open) => !open && setMemberModal({ open: false })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{memberModal.edit ? 'Kurul Üyesi Düzenle' : 'Yeni Kurul Üyesi'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-[1fr_100px] gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Ad Soyad</label>
                <Input value={memberForm.name} onChange={e => setMemberForm({ ...memberForm, name: e.target.value })} placeholder="Kişinin Adı Soyadı" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Yıl</label>
                <Input type="number" value={memberForm.year} onChange={e => setMemberForm({ ...memberForm, year: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Kuruldaki Görevi</label>
                <Select value={memberForm.boardRole} onValueChange={(val) => setMemberForm({ ...memberForm, boardRole: val })}>
                  <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                  <SelectContent>
                    {BOARD_ROLES.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Unvanı (Rolü)</label>
                <Select value={memberForm.jobTitle} onValueChange={(val) => setMemberForm({ ...memberForm, jobTitle: val })}>
                  <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                  <SelectContent>
                    {JOB_TITLES.map(title => <SelectItem key={title} value={title}>{title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Departmanı</label>
              <Select value={memberForm.departmentId} onValueChange={(val) => setMemberForm({ ...memberForm, departmentId: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seçiniz">
                    {memberForm.departmentId 
                      ? departments.find(d => String(d.id) === memberForm.departmentId)?.name || memberForm.departmentId 
                      : "Seçiniz"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberModal({ open: false })}>İptal</Button>
            <Button onClick={() => saveMember.mutate()} disabled={!memberForm.name.trim() || !memberForm.boardRole || !memberForm.jobTitle || !memberForm.departmentId || !memberForm.year || saveMember.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saveMember.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Modal */}
      <Dialog open={catModal.open} onOpenChange={(open) => !open && setCatModal({ open: false })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>{catModal.edit ? 'Kategori Düzenle' : 'Yeni Kategori'}</DialogTitle></DialogHeader>
          <div className="py-4"><label className="text-sm font-medium mb-1.5 block">Kategori Adı</label><Input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Örn: Saha Uygunsuzlukları" autoFocus /></div>
          <DialogFooter><Button variant="outline" onClick={() => setCatModal({ open: false })}>İptal</Button><Button onClick={() => saveCategory.mutate()} disabled={!catName.trim() || saveCategory.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">{saveCategory.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Kaydet</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SubCategory Modal */}
      <Dialog open={subModal.open} onOpenChange={(open) => !open && setSubModal({ open: false })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>{subModal.edit ? 'Alt Kategori Düzenle' : 'Yeni Alt Kategori'}</DialogTitle></DialogHeader>
          <div className="py-4"><label className="text-sm font-medium mb-1.5 block">Alt Kategori Adı</label><Input value={subName} onChange={e => setSubName(e.target.value)} placeholder="Örn: Kimyasal" autoFocus /></div>
          <DialogFooter><Button variant="outline" onClick={() => setSubModal({ open: false })}>İptal</Button><Button onClick={() => saveSubCategory.mutate()} disabled={!subName.trim() || saveSubCategory.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">{saveSubCategory.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Kaydet</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Department Modal */}
      <Dialog open={deptModal.open} onOpenChange={(open) => !open && setDeptModal({ open: false })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>{deptModal.edit ? 'Departman Düzenle' : 'Yeni Departman'}</DialogTitle></DialogHeader>
          <div className="py-4"><label className="text-sm font-medium mb-1.5 block">Departman Adı</label><Input value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="Örn: Teknik Servis" autoFocus /></div>
          <DialogFooter><Button variant="outline" onClick={() => setDeptModal({ open: false })}>İptal</Button><Button onClick={() => saveDepartment.mutate()} disabled={!deptName.trim() || saveDepartment.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">{saveDepartment.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Kaydet</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => !open && setDeleteConfirm(prev => ({ ...prev, open: false }))}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Kayıt Silme İşlemi</AlertDialogTitle><AlertDialogDescription>Bu kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve varsa ilişkili veriler de etkilenebilir.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirm(prev => ({ ...prev, open: false }))}>İptal</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => {
                if (deleteConfirm.type === 'all-data') {
                  deleteAllMutation.mutate();
                } else if (deleteConfirm.id !== null) {
                  if (deleteConfirm.type === 'category') deleteCategory.mutate(deleteConfirm.id);
                  else if (deleteConfirm.type === 'subcategory') deleteSubCategory.mutate(deleteConfirm.id);
                  else if (deleteConfirm.type === 'department') deleteDepartment.mutate(deleteConfirm.id);
                  else if (deleteConfirm.type === 'member') deleteMember.mutate(deleteConfirm.id);
                }
                if (deleteConfirm.type !== 'all-data') {
                  setDeleteConfirm(prev => ({ ...prev, open: false }));
                }
              }}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
