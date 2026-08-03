import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Calendar, AlertCircle, Edit, Trash2, Maximize2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || '';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Tamamlandı': return 'bg-green-100 text-green-800 border-green-200';
    case 'Devam Ediyor': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Sürekli Takip': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'İptal Edildi': return 'bg-gray-200 text-gray-800 border-gray-300';
    case 'Başlamadı':
    case 'Belirsiz':
    default: return 'bg-amber-100 text-amber-800 border-amber-200';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Kritik': return 'bg-red-600 text-white border-red-700';
    case 'Yüksek Riskli': return 'bg-red-400 text-white border-red-500';
    case 'Riskli': return 'bg-orange-400 text-white border-orange-500';
    case 'Orta': return 'bg-amber-400 text-white border-amber-500';
    case 'Düşük': return 'bg-green-500 text-white border-green-600';
    default: return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

export default function IsgKurulMeetingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');

  const [isAddDecisionOpen, setIsAddDecisionOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [viewDecision, setViewDecision] = useState<any | null>(null);
  
  const [actionText, setActionText] = useState('');

  const [formData, setFormData] = useState({
    decisionText: '',
    categoryId: '',
    subCategoryId: '',
    departmentId: '',
    priority: 'Orta',
    status: 'Başlamadı',
    dueDateType: 'DATE',
    dueDate: '',
    periodicity: '',
    remarks: ''
  });

  // Fetch Meeting Details
  const { data: meeting, isLoading } = useQuery({
    queryKey: ['ohs-board-meeting-details', id],
    queryFn: async () => {
      const res = await fetch(`${API}/api/operations/board/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Toplantı detayları yüklenemedi');
      return res.json();
    },
    enabled: !!id
  });

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['settings-categories'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/settings/definitions/categories`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Kategoriler alınamadı');
      return res.json();
    }
  });

  // Fetch Departments
  const { data: departments = [] } = useQuery({
    queryKey: ['settings-departments'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/settings/definitions/departments`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Departmanlar alınamadı');
      return res.json();
    }
  });

  const selectedCategory = categories.find((c: any) => c.id.toString() === formData.categoryId);
  const subCategories = selectedCategory?.subCategories || [];

  // Update Meeting Mutation (Overwrites decisions array)
  const updateMeetingMutation = useMutation({
    mutationFn: async (updatedDecisions: any[]) => {
      if (!meeting) return;
      const payload = {
        meetingDate: meeting.meetingDate,
        meetingNo: meeting.meetingNo,
        decisions: updatedDecisions
      };
      const res = await fetch(`${API}/api/operations/board/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('İşlem başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ohs-board-meeting-details', id] });
      toast.success('İşlem başarılı');
      setIsAddDecisionOpen(false);
      setDeleteIndex(null);
      setEditingIndex(null);
      setFormData({
        decisionText: '', categoryId: '', subCategoryId: '', departmentId: '',
        priority: 'Orta', status: 'Başlamadı', dueDateType: 'DATE', dueDate: '', periodicity: '', remarks: ''
      });
    },
    onError: (error) => toast.error(error.message)
  });

  // Create Action Mutation
  const addActionMutation = useMutation({
    mutationFn: async ({ decisionId, text }: { decisionId: string, text: string }) => {
      const res = await fetch(`${API}/api/operations/board/decisions/${decisionId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ actionText: text })
      });
      if (!res.ok) throw new Error('Aksiyon eklenemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ohs-board-meeting-details', id] });
      toast.success('Aksiyon başarıyla eklendi');
      setActionText('');
      // Update the local viewDecision to show new action immediately (optimistic UI would be better but this is simpler)
      // Closing and reopening is annoying, we just let the query refetch handle it, but we need to wait for it.
    }
  });

  const handleSaveDecision = () => {
    if (!formData.decisionText || !formData.categoryId || !formData.departmentId) {
      toast.error('Lütfen karar metni, kategori ve sorumlu departman seçiniz.');
      return;
    }

    const currentDecisions = meeting?.decisions || [];
    let updatedDecisions = [...currentDecisions];

    if (editingIndex !== null) {
      // Edit existing
      updatedDecisions[editingIndex] = {
        ...updatedDecisions[editingIndex],
        ...formData
      };
    } else {
      // Add new
      const newDecision = { ...formData };
      updatedDecisions.push(newDecision);
    }

    updateMeetingMutation.mutate(updatedDecisions);
  };

  const handleDeleteDecision = () => {
    if (deleteIndex === null) return;
    const currentDecisions = meeting?.decisions || [];
    const updatedDecisions = currentDecisions.filter((_: any, idx: number) => idx !== deleteIndex);
    updateMeetingMutation.mutate(updatedDecisions);
  };

  const openEdit = (decision: any, index: number) => {
    setEditingIndex(index);
    setFormData({
      decisionText: decision.decisionText || '',
      categoryId: decision.categoryId?.toString() || '',
      subCategoryId: decision.subCategoryId?.toString() || '',
      departmentId: decision.departmentId?.toString() || '',
      priority: decision.priority || 'Orta',
      status: decision.status || 'Başlamadı',
      dueDateType: decision.dueDateType || 'DATE',
      dueDate: decision.dueDate ? new Date(decision.dueDate).toISOString().split('T')[0] : '',
      periodicity: decision.periodicity || '',
      remarks: decision.remarks || ''
    });
    setIsAddDecisionOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!meeting) return <div className="p-6">Toplantı bulunamadı.</div>;

  const date = new Date(meeting.meetingDate).toLocaleDateString('tr-TR');
  const decisions = meeting.decisions || [];
  
  // Update viewDecision reference if data refetched
  const activeViewDecision = viewDecision ? decisions.find((d: any) => d.id === viewDecision.id) : null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/isg-kurul/meetings')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Toplantı: {meeting.meetingNo}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Calendar className="w-3.5 h-3.5" /> {date}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => {
            setEditingIndex(null);
            setFormData({
              decisionText: '', categoryId: '', subCategoryId: '', departmentId: '',
              priority: 'Orta', status: 'Başlamadı', dueDateType: 'DATE', dueDate: '', periodicity: '', remarks: ''
            });
            setIsAddDecisionOpen(true);
          }} className="gap-2">
            <Plus className="w-4 h-4" /> Yeni Karar Ekle
          </Button>
        </div>
      </div>

      {/* Decisions List */}
      <div className="space-y-4">
        {decisions.length === 0 ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-12 text-center text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Bu toplantıya ait henüz bir karar bulunmamaktadır.</p>
            </CardContent>
          </Card>
        ) : (
          decisions.map((decision: any, index: number) => (
            <Card key={decision.id} className="overflow-hidden border-l-4" style={{ borderLeftColor: decision.priority === 'Kritik' ? '#dc2626' : decision.priority === 'Yüksek Riskli' ? '#f87171' : decision.priority === 'Riskli' ? '#fb923c' : decision.priority === 'Orta' ? '#fbbf24' : '#22c55e' }}>
              <div className="border-b bg-muted/10 px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                    Karar No: {decision.decisionNumber}
                  </span>
                  <Badge className={`border ${getStatusColor(decision.status)}`} variant="outline">
                    {decision.status}
                  </Badge>
                  <Badge className={`border ${getPriorityColor(decision.priority)}`} variant="outline">
                    {decision.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground mr-4">
                    <strong>Sorumlu:</strong> {decision.department?.name}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/isg-kurul/meetings/${id}/decisions/${decision.id}`);
                  }}>
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600" onClick={(e) => {
                    e.stopPropagation();
                    openEdit(decision, index);
                  }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => {
                    e.stopPropagation();
                    setDeleteIndex(index);
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardContent 
                className="p-4 cursor-pointer hover:bg-muted/5 transition-colors" 
                onClick={() => navigate(`/isg-kurul/meetings/${id}/decisions/${decision.id}`)}
              >
                <div className="grid grid-cols-4 gap-6">
                  <div className="col-span-3 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-1">Alınan Karar</h4>
                      <p className="text-sm leading-relaxed">{decision.decisionText}</p>
                    </div>
                  </div>
                  <div className="col-span-1 border-l pl-4 space-y-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs">Kategori</span>
                      <span className="font-medium">{decision.category?.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Termin Tipi</span>
                      <span className="font-medium">{decision.dueDateType === 'DATE' ? 'Belirli Tarih' : 'Periyodik'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Decision Dialog */}
      <Dialog open={isAddDecisionOpen} onOpenChange={setIsAddDecisionOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? 'Kararı Düzenle' : 'Yeni Karar Ekle'}</DialogTitle>
          </DialogHeader>
          
          {/* Ensure Selects only render if options are loaded to prevent ID showing */}
          {categories.length > 0 && departments.length > 0 && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2 space-y-2">
                <Label>Karar Metni *</Label>
                <Textarea 
                  placeholder="Alınan kararı yazınız..." 
                  value={formData.decisionText}
                  onChange={(e) => setFormData({...formData, decisionText: e.target.value})}
                  rows={3}
                />
              </div>

              <div>
              <Label className="mb-2 block">Kategori *</Label>
              <Select value={formData.categoryId} onValueChange={(val) => setFormData({...formData, categoryId: val, subCategoryId: ''})}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori Seçin">
                    {categories.find((c: any) => c.id.toString() === formData.categoryId)?.name || "Kategori Seçin"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

              <div className="space-y-2">
                <Label>Alt Kategori</Label>
                <Select value={formData.subCategoryId} onValueChange={(val) => setFormData({...formData, subCategoryId: val})} disabled={subCategories.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alt Kategori Seçin">
                      {subCategories.find((sc: any) => sc.id.toString() === formData.subCategoryId)?.name || "Alt Kategori Seçin"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {subCategories.map((sc: any) => <SelectItem key={sc.id} value={sc.id.toString()}>{sc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sorumlu Departman *</Label>
                <Select value={formData.departmentId} onValueChange={(val) => setFormData({...formData, departmentId: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Departman Seçin">
                      {departments.find((d: any) => d.id.toString() === formData.departmentId)?.name || "Departman Seçin"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d: any) => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kritiklik Seviyesi</Label>
                <Select value={formData.priority} onValueChange={(val) => setFormData({...formData, priority: val})}>
                  <SelectTrigger><SelectValue placeholder="Seviye" /></SelectTrigger>
                  <SelectContent>
                    {['Kritik', 'Yüksek Riskli', 'Riskli', 'Orta', 'Düşük'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mevcut Durum</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                  <SelectTrigger><SelectValue placeholder="Durum" /></SelectTrigger>
                  <SelectContent>
                    {['Başlamadı', 'Devam Ediyor', 'Tamamlandı', 'İptal Edildi', 'Sürekli Takip', 'Belirsiz'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 col-span-1 border rounded-md p-3">
                <Label>Termin Tipi</Label>
                <RadioGroup value={formData.dueDateType} onValueChange={(val) => setFormData({...formData, dueDateType: val})} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="DATE" id="r1" />
                    <Label htmlFor="r1" className="font-normal cursor-pointer">Belirli Tarih</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PERIOD" id="r2" />
                    <Label htmlFor="r2" className="font-normal cursor-pointer">Periyodik</Label>
                  </div>
                </RadioGroup>

                {formData.dueDateType === 'DATE' ? (
                  <div className="space-y-2 pt-2">
                    <Label>Termin Tarihi</Label>
                    <Input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} />
                  </div>
                ) : (
                  <div className="space-y-2 pt-2">
                    <Label>Periyot</Label>
                    <Select value={formData.periodicity} onValueChange={(val) => setFormData({...formData, periodicity: val})}>
                      <SelectTrigger><SelectValue placeholder="Periyot Seçin" /></SelectTrigger>
                      <SelectContent>
                        {['Sürekli', 'Aylık', '3 Aylık', '6 Aylık', 'Yıllık'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Sonuç / Açıklama / Değerlendirme</Label>
                <Textarea 
                  placeholder="Karara dair değerlendirmeler..." 
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDecisionOpen(false)}>İptal</Button>
            <Button onClick={handleSaveDecision} disabled={updateMeetingMutation.isPending}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteIndex !== null} onOpenChange={(open) => !open && setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kararı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kararı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteDecision}
            >
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
