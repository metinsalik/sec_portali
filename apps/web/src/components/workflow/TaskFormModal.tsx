import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId?: string; // If provided, plan is locked
  initialData?: any; // For editing
}

export function TaskFormModal({ isOpen, onClose, planId: defaultPlanId, initialData }: TaskFormModalProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    planId: initialData?.planId || defaultPlanId || '',
    assigneeId: initialData?.assigneeId || '',
    followerId: initialData?.followerId || '',
    priority: initialData?.priority || 'MEDIUM',
    category: initialData?.category || '',
    labels: initialData?.labels ? initialData.labels.join(', ') : '',
    startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
    estimateHours: initialData?.estimateHours?.toString() || '0',
    recurrence: initialData?.recurrence || '',
    recurrenceEndDate: initialData?.recurrenceEndDate ? new Date(initialData.recurrenceEndDate).toISOString().split('T')[0] : '',
    checklist: initialData?.checklist?.map((c: any) => ({ title: c.title, isDone: c.isDone })) || [{ title: '', isDone: false }]
  });

  const formatDateTimeLocal = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  // Reset form when opened with new initialData
  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title || '',
          description: initialData.description || '',
          planId: initialData.planId || defaultPlanId || '',
          assigneeId: initialData.assigneeId || '',
          followerId: initialData.followerId || '',
          priority: initialData.priority || 'MEDIUM',
          category: initialData.category?.name || initialData.category || '',
          labels: initialData.labels ? (Array.isArray(initialData.labels) ? initialData.labels.join(', ') : initialData.labels) : '',
          startDate: formatDateTimeLocal(initialData.startDate) || formatDateTimeLocal(new Date().toISOString()),
          dueDate: formatDateTimeLocal(initialData.dueDate),
          estimateHours: initialData.estimateHours?.toString() || '0',
          recurrence: initialData.recurrence || '',
          recurrenceEndDate: initialData.recurrenceEndDate ? new Date(initialData.recurrenceEndDate).toISOString().split('T')[0] : '',
          blockNote: initialData.blockNote || '',
          status: initialData.status || 'TODO'
        });
        if (initialData.checklist && initialData.checklist.length > 0) {
          setChecklist(initialData.checklist.map((c: any) => ({
            id: c.id || Math.random(),
            text: c.text || '',
            requireEvidence: !!c.requireEvidence,
            requireDescription: !!c.requireDescription
          })));
        } else {
          setChecklist([{ id: 1, text: '', requireEvidence: false, requireDescription: false }]);
        }
      } else {
        setFormData({
          title: '',
          description: '',
          planId: defaultPlanId || '',
          assigneeId: '',
          followerId: '',
          priority: 'MEDIUM',
          status: 'TODO',
          category: '',
          labels: '',
          startDate: formatDateTimeLocal(new Date().toISOString()),
          dueDate: '',
          estimateHours: '0',
          blockNote: '',
          recurrence: '',
          recurrenceEndDate: ''
        });
        setChecklist([{ id: 1, text: '', requireEvidence: false, requireDescription: false }]);
      }
    }
  }, [isOpen, initialData, defaultPlanId]);

  const [checklist, setChecklist] = useState([
    { id: 1, text: '', requireEvidence: false, requireDescription: false }
  ]);

  // Fetch all plans for dropdown
  const { data: plans } = useQuery({
    queryKey: ['workflow-plans-all'],
    queryFn: async () => {
      const res = await api.get('/workflow/plans');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen && !defaultPlanId
  });

  // Fetch specific plan (either default or selected) to get category
  const { data: selectedPlan } = useQuery({
    queryKey: ['workflow-plan', formData.planId],
    queryFn: async () => {
      if (!formData.planId) return null;
      const res = await api.get(`/workflow/plans/${formData.planId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!formData.planId && isOpen
  });

  // Workflow users for dropdown (only people with workflow roles)
  const { data: workflowUsers } = useQuery({
    queryKey: ['workflow-users'],
    queryFn: async () => {
      const res = await api.get('/workflow/users');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen
  });

  // Pre-fill from plan
  React.useEffect(() => {
    if (selectedPlan && isOpen && !initialData) {
      setFormData(prev => ({
        ...prev,
        creatorId: prev.creatorId || selectedPlan.ownerId || '',
        category: selectedPlan.category?.name || '',
      }));
    }
  }, [selectedPlan, isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addChecklistStep = () => {
    setChecklist([...checklist, { id: Date.now(), text: '', requireEvidence: false, requireDescription: false }]);
  };

  const updateChecklist = (id: number, field: string, value: any) => {
    setChecklist(checklist.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeChecklist = (id: number) => {
    setChecklist(checklist.filter(c => c.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        ...formData,
        ...(formData.estimateHours ? { estimateHours: parseFloat(formData.estimateHours) } : {}),
        labels: formData.labels.split(',').map((l: string) => l.trim()).filter(Boolean),
        checklist: checklist.filter(c => c.text.trim() !== '').map((c, idx) => ({ ...c, order: idx }))
      };

      if (initialData?.id) {
        await api.put(`/workflow/tasks/${initialData.id}`, payload);
        toast.success('Görev başarıyla güncellendi');
      } else {
        await api.post('/workflow/tasks', payload);
        toast.success('Görev başarıyla oluşturuldu');
      }
      
      queryClient.invalidateQueries({ queryKey: ['workflow'] });
      onClose();
    } catch (error: any) {
      toast.error(initialData?.id ? 'Görev güncellenemedi' : 'Görev oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{initialData ? 'Görevi Düzenle' : 'Yeni Görev'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">İş Planı Seçimi *</label>
                {defaultPlanId ? (
                   <Input value={selectedPlan?.title || 'Yükleniyor...'} readOnly className="bg-slate-50" />
                ) : (
                  <select name="planId" value={formData.planId} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="">Plan Seçiniz...</option>
                    {plans?.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Kategori</label>
                <Input name="category" value={formData.category} readOnly placeholder="Plandan otomatik gelir" className="bg-slate-50" />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Görev Başlığı *</label>
              <Input name="title" value={formData.title} onChange={handleChange} required placeholder="Görev başlığı" />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Açıklama</label>
              <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Görev detayları..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Görevi Yapan *</label>
                <select name="assigneeId" value={formData.assigneeId} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="">Seçiniz...</option>
                  {workflowUsers?.map((u: any) => (
                    <option key={u.username} value={u.username}>{u.fullName || u.username} ({u.workflowRole})</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Sorumlu (Görevi takip eden) *</label>
                <select name="followerId" value={formData.followerId} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="">Seçiniz...</option>
                  {workflowUsers?.map((u: any) => (
                    <option key={u.username} value={u.username}>{u.fullName || u.username} ({u.workflowRole})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Durum (Status) *</label>
                <select name="status" value={formData.status} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="TODO">Bekliyor</option>
                  <option value="DOING">Yapılıyor</option>
                  <option value="REVIEW">Kontrolde</option>
                  <option value="DONE">Tamamlandı</option>
                  <option value="BLOCKED">Bloke Edildi</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Öncelik *</label>
                <select name="priority" value={formData.priority} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="LOW">Düşük</option>
                  <option value="MEDIUM">Orta</option>
                  <option value="HIGH">Yüksek</option>
                  <option value="CRITICAL">Kritik</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Tekrarlanma (Periyot)</label>
                <select name="recurrence" value={formData.recurrence} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="">Tekrarlamaz</option>
                  <option value="DAILY">Günlük</option>
                  <option value="WEEKLY">Haftalık</option>
                  <option value="MONTHLY">Aylık</option>
                  <option value="6MONTHS">6 Aylık</option>
                  <option value="YEARLY">Yıllık</option>
                </select>
              </div>
              {formData.recurrence && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Tekrarın Bitiş Tarihi</label>
                  <Input type="date" name="recurrenceEndDate" value={formData.recurrenceEndDate || ''} onChange={handleChange} />
                  <span className="text-[10px] text-slate-500">Boş bırakılırsa sonsuza kadar tekrarlar.</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Başlangıç Tarihi ve Saati *</label>
                <Input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Bitiş (Termin) Tarihi ve Saati *</label>
                <Input type="datetime-local" name="dueDate" value={formData.dueDate} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Etiketler</label>
              <Input name="labels" value={formData.labels} onChange={handleChange} placeholder="Örn: acil, arge, test" />
            </div>

            <div className="grid gap-2 mt-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Kontrol Adımları *</label>
                <Button type="button" variant="outline" size="sm" onClick={addChecklistStep}>
                  <Plus className="w-4 h-4 mr-1" /> Adım Ekle
                </Button>
              </div>
              <p className="text-xs text-slate-500">Otomatik ilerleme, bu adımların tamamlanma oranına göre hesaplanır.</p>
              
              <div className="space-y-3 bg-slate-50 p-4 rounded-lg border">
                {checklist.map((item, index) => (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-3 rounded border">
                    <span className="font-semibold text-slate-400 text-sm">{index + 1}.</span>
                    <Input 
                      placeholder="Adım açıklaması..." 
                      value={item.text} 
                      onChange={(e) => updateChecklist(item.id, 'text', e.target.value)} 
                      className="flex-1"
                    />
                    <div className="flex items-center gap-4 shrink-0">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={item.requireEvidence} onCheckedChange={(c) => updateChecklist(item.id, 'requireEvidence', !!c)} />
                        Kanıt İste
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={item.requireDescription} onCheckedChange={(c) => updateChecklist(item.id, 'requireDescription', !!c)} />
                        Açıklama İste
                      </label>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeChecklist(item.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {checklist.length === 0 && (
                  <div className="text-sm text-center text-slate-500 py-2">En az 1 kontrol adımı eklenmelidir.</div>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Yorum / Engel Notu</label>
              <Textarea name="blockNote" value={formData.blockNote} onChange={handleChange} placeholder="Görevi engelleyen durum veya notlar..." />
            </div>

          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" disabled={loading || checklist.length === 0}>
              {loading ? 'Kaydediliyor...' : (initialData ? 'Güncelle' : 'Oluştur')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
