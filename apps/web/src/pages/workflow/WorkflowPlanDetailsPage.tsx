import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Loader2, ArrowLeft, Calendar as CalendarIcon, Edit, Trash2 } from 'lucide-react';
import WorkflowTasksPage from './WorkflowTasksPage';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useDeletePlan } from '@/hooks/useWorkflow';
import { PlanFormModal } from '@/components/workflow/PlanFormModal';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function WorkflowPlanDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { mutate: deletePlan, isPending: isDeleting } = useDeletePlan();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: plan, isLoading } = useQuery({
    queryKey: ['workflow-plan', id],
    queryFn: async () => {
      const res = await api.get(`/workflow/plans/${id}`);
      if (!res.ok) throw new Error('Plan bulunamadı');
      return res.json();
    }
  });

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  if (!plan) return <div className="p-10 text-center">Plan bulunamadı.</div>;

  const hasAccess = user?.username === plan.ownerId;

  const handleDelete = () => {
    deletePlan(plan.id, {
      onSuccess: () => {
        toast.success('Plan başarıyla silindi.');
        navigate('/workflow/plans');
      },
      onError: (err: any) => {
        toast.error(err.message || 'Plan silinirken bir hata oluştu.');
        setIsDeleteDialogOpen(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Plan Header */}
      <div className="px-6 pt-6 pb-2 border-b">
        <Link to="/workflow/plans">
          <Button variant="ghost" size="sm" className="mb-4 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Planlara Dön
          </Button>
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
              {plan.title}
              {hasAccess && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setIsEditModalOpen(true)} className="h-8 w-8">
                    <Edit className="w-4 h-4 text-slate-500" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setIsDeleteDialogOpen(true)} className="h-8 w-8 border-red-200 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              )}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-3xl">{plan.goal}</p>
          </div>
          <div className="flex flex-col items-end gap-2 text-sm text-slate-500 bg-muted/30 p-4 rounded-lg border">
            {plan.category && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Kategori:</span>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: plan.category.color || '#ccc' }} />
                <span>{plan.category.name}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-medium">Hedef Bitiş:</span>
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{new Date(plan.dueDate).toLocaleDateString('tr-TR')}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-medium">Öncelik:</span>
              <span className={`font-bold ${
                plan.priority === 'CRITICAL' ? 'text-red-800 dark:text-red-400' :
                plan.priority === 'HIGH' ? 'text-red-500' :
                plan.priority === 'LOW' ? 'text-green-600' : 'text-yellow-500'
              }`}>
                {plan.priority === 'LOW' ? 'Düşük' : plan.priority === 'MEDIUM' ? 'Orta' : plan.priority === 'HIGH' ? 'Yüksek' : 'Kritik'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Tasks View for this plan */}
      <div className="-mt-6">
        <WorkflowTasksPage planId={id} />
      </div>

      <PlanFormModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        initialData={plan} 
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Planı silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlemi geri alamazsınız. Eğer bu planın altında aktif veya tamamlanmış görevler varsa, planı silemezsiniz. Önce o görevleri temizlemeniz gerekir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleDelete(); }} 
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
