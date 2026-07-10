import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Calendar as CalendarIcon, FolderTree, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkflowRoles } from '@/hooks/useWorkflow';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function WorkflowPlansPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  
  // Form state
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [categoryId, setCategoryId] = useState<string>('none');
  const [ownerId, setOwnerId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  const { data: users = [] } = useWorkflowRoles();

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['workflow-plans'],
    queryFn: async () => {
      const res = await api.get('/workflow/plans');
      if (!res.ok) throw new Error('Planlar yüklenemedi');
      return res.json();
    }
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['workflow-categories'],
    queryFn: async () => {
      const res = await api.get('/workflow/categories');
      if (!res.ok) throw new Error('Kategoriler yüklenemedi');
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        goal: goal || undefined,
        categoryId: categoryId !== 'none' ? categoryId : undefined,
        ownerId: ownerId || undefined,
        startDate: new Date(startDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        priority
      };
      
      const res = await api.post('/workflow/plans', payload);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Oluşturulamadı');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-plans'] });
      toast.success('İş planı oluşturuldu');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  const createCatMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/workflow/categories', { name: newCatName });
      if (!res.ok) throw new Error('Kategori eklenemedi');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflow-categories'] });
      setCategoryId(data.id);
      setIsCatModalOpen(false);
      setNewCatName('');
      toast.success('Kategori eklendi');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const openModal = () => {
    setTitle('');
    setGoal('');
    setCategoryId('none');
    setOwnerId('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setPriority('MEDIUM');
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">İş Planları</h1>
          <p className="text-slate-500 dark:text-slate-400">Projeleri ve uzun soluklu iş süreçlerini yönetin.</p>
        </div>
        <Button onClick={openModal}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Plan Oluştur
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plansLoading ? (
          <div className="col-span-full flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
        ) : plans.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-muted/20 border border-dashed rounded-lg">
            <p className="text-muted-foreground">Henüz bir iş planı bulunmuyor.</p>
          </div>
        ) : (
          plans.map((plan: any) => (
            <Link to={`/workflow/plans/${plan.id}`} key={plan.id}>
              <Card className="hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-md transition-all flex flex-col cursor-pointer h-full group">
                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {plan.title}
                    </CardTitle>
                    {plan.category && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: plan.category.color || '#ccc' }} />
                        <span className="text-xs font-medium text-slate-500">{plan.category.name}</span>
                      </div>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                    {plan.goal || 'Amaç belirtilmemiş.'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>Bitiş: {new Date(plan.dueDate).toLocaleDateString('tr-TR')}</span>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 pt-3 border-t">
                  <div className="text-xs text-muted-foreground w-full flex justify-between">
                    <span>Görev: {plan.tasks?.length || 0}</span>
                    <span className={`font-medium ${
                      plan.priority === 'CRITICAL' ? 'text-red-800 dark:text-red-400 font-bold' :
                      plan.priority === 'HIGH' ? 'text-red-500' :
                      plan.priority === 'LOW' ? 'text-green-600' : 'text-yellow-500'
                    }`}>
                      {plan.priority === 'LOW' ? 'Düşük' : plan.priority === 'MEDIUM' ? 'Orta' : plan.priority === 'HIGH' ? 'Yüksek' : 'Kritik'}
                    </span>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* CREATE PLAN MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni İş Planı</DialogTitle>
            <DialogDescription>
              Kapsamlı bir süreci başlatmak için plan oluşturun. Kategoriler, ayarlar sayfasından yönetilmektedir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Plan Başlığı *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Örn: 2026 Q1 Güvenlik Denetimi" />
            </div>
            
            <div className="space-y-2">
              <Label>Kategori *</Label>
              <div className="flex gap-2">
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Kategori Seçin">
                      {categoryId === 'none' ? 'Kategori Seçin...' : categories.find((c: any) => c.id === categoryId)?.name || 'Kategori Seçin'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
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
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sorumlu Seçin">
                    {ownerId ? users.find((u: any) => u.username === ownerId)?.fullName || ownerId : 'Sorumlu Seçin'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {users.map((u: any) => (
                    <SelectItem key={u.username} value={u.username}>
                      {u.fullName} ({u.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amacı / Hedefi</Label>
              <Textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="Planın ulaşmak istediği ana hedef..." className="min-h-[100px]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Başlangıç Tarihi *</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Hedef Bitiş Tarihi *</Label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Öncelik Seviyesi</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue>
                    {priority === 'LOW' ? 'Düşük' : priority === 'MEDIUM' ? 'Orta' : priority === 'HIGH' ? 'Yüksek' : 'Kritik'}
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
            <Button variant="outline" onClick={closeModal}>İptal</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !title.trim() || !startDate || !dueDate || categoryId === 'none'}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Oluştur
            </Button>
          </DialogFooter>
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
            <Button onClick={() => createCatMutation.mutate()} disabled={createCatMutation.isPending || !newCatName.trim()}>
              {createCatMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
