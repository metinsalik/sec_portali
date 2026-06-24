import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, ShieldAlert, Plus, Trash2, Edit, Eye, Printer } from 'lucide-react';
import { PCRAModal } from './components/PCRAModal';
import { BuildPCRAPrintModal } from './components/BuildPCRAPrintModal';

const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export default function BuildRiskAssessmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [matrixData, setMatrixData] = useState<any[]>([]);
  const [contractorCompliance, setContractorCompliance] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedRisk, setSelectedRisk] = useState<any>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const { data: project, isLoading: projLoading } = useQuery({
    queryKey: ['buildProject', id],
    queryFn: async () => {
      const res = await api.get(`/build-management/projects/${id}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!id
  });

  const { data: riskAssessment, isLoading: riskLoading } = useQuery({
    queryKey: ['buildRiskAssessment', id],
    queryFn: async () => {
      const res = await api.get(`/build-management/projects/${id}/risk-assessment`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error();
      }
      return res.json();
    },
    enabled: !!id
  });

  useEffect(() => {
    if (riskAssessment && riskAssessment.matrixData) {
      try {
        const parsed = typeof riskAssessment.matrixData === 'string' ? JSON.parse(riskAssessment.matrixData) : riskAssessment.matrixData;
        if (Array.isArray(parsed)) {
          const withIds = parsed.map((item: any) => ({
            id: item.id || generateId(),
            category: item.category || '',
            hazard: item.hazard || '',
            risk: item.risk || '',
            activity: item.activity || '',
            initialLikelihood: item.initialLikelihood || item.likelihood || 0,
            initialSeverity: item.initialSeverity || item.severity || 0,
            department: item.department || '',
            responsible: item.responsible || '',
            dueDate: item.dueDate || '',
            precautions: item.precautions || item.actionPlan || '',
            finalLikelihood: item.finalLikelihood || 0,
            finalSeverity: item.finalSeverity || 0,
            controlSteps: item.controlSteps || ''
          }));
          setMatrixData(withIds);
        }
      } catch (e) {
        console.error('Error parsing matrix data', e);
      }
    }
    if (riskAssessment?.contractorCompliance) {
      setContractorCompliance(riskAssessment.contractorCompliance);
    }
  }, [riskAssessment]);

  const saveMutation = useMutation({
    mutationFn: async (updatedData: any[]) => {
      const payload = {
        matrixData: updatedData,
        contractorCompliance
      };
      const res = await api.post(`/build-management/projects/${id}/risk-assessment`, payload);
      if (!res.ok) throw new Error('Hata oluştu');
      return res.json();
    },
    onSuccess: () => {
      toast.success('İnşaat Öncesi Risk Değerlendirmesi başarıyla kaydedildi.');
      queryClient.invalidateQueries({ queryKey: ['buildProject', id] });
      queryClient.invalidateQueries({ queryKey: ['buildRiskAssessment', id] });
    },
    onError: () => toast.error('Kaydedilirken hata oluştu.')
  });

  if (projLoading || riskLoading) {
    return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;
  }

  const handleAddClick = () => {
    setModalMode('add');
    setSelectedRisk(null);
    setModalOpen(true);
  };

  const handleEditClick = (risk: any) => {
    setModalMode('edit');
    setSelectedRisk(risk);
    setModalOpen(true);
  };

  const handleViewClick = (risk: any) => {
    setModalMode('view');
    setSelectedRisk(risk);
    setModalOpen(true);
  };

  const handleDeleteClick = (idToRemove: string) => {
    if (window.confirm('Bu riski silmek istediğinize emin misiniz?')) {
      const updated = matrixData.filter(item => item.id !== idToRemove);
      setMatrixData(updated);
      saveMutation.mutate(updated);
    }
  };

  const handleModalSave = (data: any) => {
    let updated;
    if (modalMode === 'add') {
      updated = [...matrixData, data];
    } else {
      updated = matrixData.map(item => item.id === data.id ? data : item);
    }
    setMatrixData(updated);
    setModalOpen(false);
    saveMutation.mutate(updated);
  };

  const handleComplianceSave = () => {
    saveMutation.mutate(matrixData);
  };

  const getRiskLevel = (score: number) => {
    if (score >= 17) return { label: 'Kritik Risk', color: 'bg-red-100 text-red-800 border-red-200' };
    if (score >= 10) return { label: 'Yüksek Risk', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    if (score >= 5) return { label: 'Orta Risk', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    if (score > 0) return { label: 'Düşük Risk', color: 'bg-green-100 text-green-800 border-green-200' };
    return { label: '-', color: 'bg-slate-100 text-slate-800 border-slate-200' };
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/build-management/project/${id}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-orange-500" /> 
              İnşaat Öncesi Risk Değerlendirmesi (PCRA)
            </h1>
            <p className="text-sm text-slate-500 mt-1">Proje: {project?.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setPrintModalOpen(true)} variant="outline" className="border-slate-200">
            <Printer className="w-4 h-4 mr-2" />
            Yazdır / Önizleme
          </Button>
          <Button onClick={handleAddClick} className="bg-orange-600 hover:bg-orange-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Risk Ekle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#2c3135] p-4 rounded-xl border shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Toplam Risk Sayısı</p>
          <p className="text-3xl font-bold mt-1">{matrixData.length}</p>
        </div>
        <div className="bg-white dark:bg-[#2c3135] p-4 rounded-xl border shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Kritik & Yüksek Riskler</p>
          <p className="text-3xl font-bold mt-1 text-red-600">
            {matrixData.filter(m => (m.initialLikelihood * m.initialSeverity) >= 10).length}
          </p>
        </div>
        <div className="bg-white dark:bg-[#2c3135] p-4 rounded-xl border shadow-sm md:col-span-2 flex items-center">
          <p className="text-sm text-slate-500">
            Bu sayfa, İnşaat, Yenileme veya Yıkım projeleri başlamadan önce yapılması gereken risk değerlendirme kayıtlarını içerir. Tüm riskleri tanımlayın, puanlayın ve aksiyon planlarını belirleyin.
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 text-left font-semibold">Kategori</th>
                <th className="p-3 text-left font-semibold">Tehlike & Risk</th>
                <th className="p-3 text-center font-semibold w-32">İlk Skor</th>
                <th className="p-3 text-left font-semibold">Sorumlu & Departman</th>
                <th className="p-3 text-center font-semibold w-32">Son Skor</th>
                <th className="p-3 text-center font-semibold w-32">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {matrixData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <ShieldAlert className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-lg font-medium">Henüz değerlendirme bulunmuyor</p>
                    <p className="text-sm mt-1">Sağ üstten yeni bir risk değerlendirmesi ekleyebilirsiniz.</p>
                  </td>
                </tr>
              ) : (
                [...matrixData]
                .sort((a, b) => (b.initialLikelihood * b.initialSeverity) - (a.initialLikelihood * a.initialSeverity))
                .map((item) => {
                  const initScore = item.initialLikelihood * item.initialSeverity;
                  const initLevel = getRiskLevel(initScore);
                  
                  const finScore = item.finalLikelihood * item.finalSeverity;
                  const finLevel = getRiskLevel(finScore);

                  return (
                    <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-medium text-slate-700 dark:text-slate-300 w-1/4">
                        {item.category}
                      </td>
                      <td className="p-3 w-1/4">
                        <p className="font-semibold text-xs line-clamp-1" title={item.hazard}>{item.hazard || '-'}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1" title={item.risk}>{item.risk || '-'}</p>
                      </td>
                      <td className="p-3 text-center">
                        {initScore > 0 ? (
                          <div className={`px-2 py-1 rounded border text-xs font-bold ${initLevel.color} inline-block`}>
                            {initScore}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="p-3 w-1/5">
                        <p className="font-semibold text-xs">{item.responsible || '-'}</p>
                        <p className="text-xs text-muted-foreground">{item.department || '-'}</p>
                        <p className="text-xs text-slate-400 mt-1">Termin: {item.dueDate || '-'}</p>
                      </td>
                      <td className="p-3 text-center">
                        {finScore > 0 ? (
                          <div className={`px-2 py-1 rounded border text-xs font-bold ${finLevel.color} inline-block`}>
                            {finScore}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600" onClick={() => handleViewClick(item)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-orange-600" onClick={() => handleEditClick(item)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600" onClick={() => handleDeleteClick(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm p-6 mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg">Yüklenici Uyumu ve Dokümantasyon</h3>
            <p className="text-sm text-slate-500">
              Hastane, yüklenicinin uyumunu zorunlu tutmalı, takip etmeli ve dokümante etmelidir.
            </p>
          </div>
          <Button onClick={handleComplianceSave} variant="secondary" size="sm">
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Notu Kaydet
          </Button>
        </div>
        <Textarea 
          rows={4}
          placeholder="Yüklenici ile yapılan anlaşmalar, taahhütler ve takip detayları..."
          value={contractorCompliance}
          onChange={(e) => setContractorCompliance(e.target.value)}
        />
      </div>

      {printModalOpen && (
        <BuildPCRAPrintModal 
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          risks={matrixData}
          project={project}
        />
      )}

      {modalOpen && (
        <PCRAModal 
          open={modalOpen} 
          onOpenChange={setModalOpen} 
          onSave={handleModalSave} 
          defaultValues={selectedRisk} 
          mode={modalMode} 
        />
      )}
    </div>
  );
}
