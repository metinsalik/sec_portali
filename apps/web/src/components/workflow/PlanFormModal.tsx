import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { useCreatePlan, useUpdatePlan, useWorkflowRoles } from '@/hooks/useWorkflow';

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any; // For editing, undefined for creating
}

export function PlanFormModal({ isOpen, onClose, initialData }: PlanFormModalProps) {
  const createMutation = useCreatePlan();
  const updateMutation = useUpdatePlan();
  
  const [formData, setFormData] = useState({
    title: '',
    goal: '',
    categoryId: 'none',
    ownerId: '',
    priority: 'MEDIUM',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: ''
  });

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const { data: users = [] } = useWorkflowRoles();

  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ['workflow-categories'],
    queryFn: async () => {
      const res = await api.get('/workflow/categories');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const createCatMutation = useCreatePlan(); // Actually we can just do a manual fetch for category creation
  const handleCreateCategory = async () => {
    try {
      const res = await api.post('/workflow/categories', { name: newCatName });
      if (!res.ok) throw new Error('Kategori eklenemedi');
      const data = await res.json();
      refetchCategories();
      setFormData(prev => ({ ...prev, categoryId: data.id }));
      setIsCatModalOpen(false);
      setNewCatName('');
      toast.success('Kategori eklendi');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: initialData?.title || '',
        goal: initialData?.goal || '',
        categoryId: initialData?.categoryId || 'none',
        ownerId: initialData?.ownerId || '',
        priority: initialData?.priority || 'MEDIUM',
        startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : ''
      });
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      categoryId: formData.categoryId === 'none' ? undefined : formData.categoryId,
      ownerId: formData.ownerId || undefined,
      startDate: new Date(formData.startDate).toISOString(),
      dueDate: new Date(formData.dueDate).toISOString(),
    };

    if (initialData?.id) {
      updateMutation.mutate(
        { id: initialData.id, data: payload },
        {
          onSuccess: () => {
            toast.success('İş planı başarıyla güncellendi');
            onClose();
          },
          onError: (err: any) => toast.error(err.message || 'Güncellenemedi')
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('İş planı başarıyla oluşturuldu');
          onClose();
        },
        onError: (err: any) => toast.error(err.message || 'Oluşturulamadı')
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{initialData ? 'Planı Düzenle' : 'Yeni İş Planı'}</DialogTitle>
            {!initialData && (
              <DialogDescription>
                Kapsamlı bir süreci başlatmak için plan oluşturun.
              </DialogDescription>
            )}
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Plan Başlığı *</Label>
                <Input 
                  placeholder="Örn: 2026 Q1 Güvenlik Denetimi" 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label>Kategori *</Label>
                <div className="flex gap-2">
                  <Select value={formData.categoryId} onValueChange={val => setFormData({ ...formData, categoryId: val })}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Kategori Seçin">
                        {formData.categoryId === 'none' ? 'Kategori Seçin...' : categories.find((c: any) => c.id === formData.categoryId)?.name || 'Kategori Seçin'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Kategorisiz</SelectItem>
                      {categories.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={() => setIsCatModalOpen(true)} type="button">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Plan Sahibi (Sorumlu)</Label>
                <Select value={formData.ownerId} onValueChange={val => setFormData({ ...formData, ownerId: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sorumlu Seçin">
                      {formData.ownerId ? users.find((u: any) => u.username === formData.ownerId)?.fullName || formData.ownerId : 'Sorumlu Seçin'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Seçiniz...</SelectItem>
                    {users.map((u: any) => (
                      <SelectItem key={u.username} value={u.username}>
                        {u.fullName} ({u.workflowRole})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amacı / Hedefi</Label>
                <Textarea 
                  placeholder="Planın ulaşmak istediği ana hedef..." 
                  value={formData.goal} 
                  onChange={e => setFormData({ ...formData, goal: e.target.value })} 
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Başlangıç Tarihi *</Label>
                  <Input 
                    type="date" 
                    value={formData.startDate} 
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hedef Bitiş Tarihi *</Label>
                  <Input 
                    type="date" 
                    value={formData.dueDate} 
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Öncelik Seviyesi</Label>
                <Select value={formData.priority} onValueChange={val => setFormData({ ...formData, priority: val })}>
                  <SelectTrigger>
                    <SelectValue>
                      {formData.priority === 'LOW' ? 'Düşük' : formData.priority === 'MEDIUM' ? 'Orta' : formData.priority === 'HIGH' ? 'Yüksek' : 'Kritik'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Düşük</SelectItem>
                    <SelectItem value="MEDIUM">Orta</SelectItem>
                    <SelectItem value="HIGH">Yüksek</SelectItem>
                    <SelectItem value="CRITICAL">Kritik</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
              <Button type="submit" disabled={isPending || !formData.title.trim() || !formData.startDate || !formData.dueDate}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {initialData ? 'Güncelle' : 'Oluştur'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* QUICK CATEGORY MODAL */}
      <Dialog open={isCatModalOpen} onOpenChange={setIsCatModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Yeni Kategori Ekle</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Kategori Adı</Label>
            <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} autoFocus className="mt-2" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCatModalOpen(false)}>İptal</Button>
            <Button onClick={handleCreateCategory} disabled={!newCatName.trim()}>
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
