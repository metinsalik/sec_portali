import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import api from '@/lib/api';

interface BuildApprovalsProps {
  project: any;
}

export function BuildApprovals({ project }: BuildApprovalsProps) {
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async (approvalType: string) => {
      const res = await api.post(`/build-management/projects/${project.id}/approvals`, {
        approvalType,
        status: 'Onaylandı'
      });
      if (!res.ok) throw new Error('Onay kaydedilemedi');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Onay başarıyla kaydedildi.');
      queryClient.invalidateQueries({ queryKey: ['buildProject', project.id] });
    },
    onError: () => toast.error('Onaylanırken hata oluştu.')
  });

  const getApproval = (type: string) => {
    return project.approvals?.find((a: any) => a.approvalType === type && a.status === 'Onaylandı');
  };

  const approvalTypes = [
    'Talep Sahibi Onayı',
    'İş Güvenliği Uzmanı Onayı',
    'Enfeksiyon Hemşiresi Onayı'
  ];

  return (
    <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mt-6">
      <h3 className="text-lg font-bold text-[#011d2b] dark:text-[#cbe6fa] mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
        İşe Başlama Onayları
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        Projenin başlatılabilmesi için aşağıdaki ilgililerin onay vermesi gerekmektedir.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {approvalTypes.map((type) => {
          const approval = getApproval(type);
          return (
            <div key={type} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">{type}</h4>
                {approval ? (
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                      <span className="font-semibold text-emerald-600">Onaylandı</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                    <span className="material-symbols-outlined text-sm">pending</span>
                    <span>Bekliyor</span>
                  </div>
                )}
              </div>
              
              {!approval && (
                <Button 
                  onClick={() => approveMutation.mutate(type)} 
                  disabled={approveMutation.isPending}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="sm"
                >
                  {approveMutation.isPending ? 'Kaydediliyor...' : 'Onayla'}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
