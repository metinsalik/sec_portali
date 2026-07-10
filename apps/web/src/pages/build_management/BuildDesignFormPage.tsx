import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Plus, Upload, FileText, CheckCircle2 } from 'lucide-react';

export default function BuildDesignFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isViewMode = searchParams.get('mode') === 'view';
  const queryClient = useQueryClient();

  const [facilityId, setFacilityId] = useState<string>(localStorage.getItem('activeFacilityId') || '');
  const [deptSearch, setDeptSearch] = useState('');
  const [personSearch, setPersonSearch] = useState('');

  useEffect(() => {
    const handleFacilityChange = () => {
      setFacilityId(localStorage.getItem('activeFacilityId') || '');
    };
    window.addEventListener('facilityChanged', handleFacilityChange);
    return () => window.removeEventListener('facilityChanged', handleFacilityChange);
  }, []);

  const { register, handleSubmit, setValue, watch, reset } = useForm();

  // Queries
  const { data: project, isLoading: projLoading } = useQuery({
    queryKey: ['buildProject', id],
    queryFn: async () => {
      const res = await api.get(`/build-management/projects/${id}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!id
  });

  const { data: formData, isLoading: formLoading } = useQuery({
    queryKey: ['buildDesignForm', id],
    queryFn: async () => {
      const res = await api.get(`/build-management/projects/${id}/design-form`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!id
  });

  const { data: departments } = useQuery({
    queryKey: ['build-departments', facilityId],
    queryFn: async () => {
      const res = await api.get(`/build-management/settings/departments?facilityId=${facilityId}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!facilityId
  });

  const { data: persons } = useQuery({
    queryKey: ['build-persons', facilityId],
    queryFn: async () => {
      const res = await api.get(`/build-management/settings/persons?facilityId=${facilityId}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!facilityId
  });

  // Set default values when data loaded
  useEffect(() => {
    if (formData) {
      const d = new Date(formData.formDate || new Date());
      setValue('formDate', d.toISOString().split('T')[0]);
      setValue('description', formData.description || '');
      setValue('requester', formData.requester || '');
      setValue('projectSponsor', formData.projectSponsor || '');
      setValue('notes', formData.notes || '');
      setValue('relatedDepartments', formData.relatedDepartments ? JSON.parse(formData.relatedDepartments) : []);
      setValue('projectManager', formData.projectManager || '');
      setValue('otherTeamMembers', formData.otherTeamMembers ? JSON.parse(formData.otherTeamMembers) : []);
      setValue('projectGoal', formData.projectGoal || '');
      setValue('projectPlan', formData.projectPlan || '');
      setValue('inputs', formData.inputs || '');
      setValue('outputs', formData.outputs || '');
      setValue('verification', formData.verification || '');
      setValue('review', formData.review || '');
      setValue('validityStudies', formData.validityStudies || '');
      setValue('changeControl', formData.changeControl || '');
    } else {
      setValue('formDate', new Date().toISOString().split('T')[0]);
    }
  }, [formData, setValue]);

  // Submit Mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        relatedDepartments: JSON.stringify(data.relatedDepartments || []),
        otherTeamMembers: JSON.stringify(data.otherTeamMembers || []),
      };
      const res = await api.post(`/build-management/projects/${id}/design-form`, payload);
      if (!res.ok) throw new Error('Hata oluştu');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Hizmet Tasarım Formu başarıyla kaydedildi.');
      queryClient.invalidateQueries({ queryKey: ['buildProject', id] });
      navigate(`/build-management/project/${id}`);
    },
    onError: () => toast.error('Kaydedilirken hata oluştu.')
  });

  // Settings Add Mutations (Inline)
  const [newDept, setNewDept] = useState('');
  const addDeptMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/build-management/settings/departments', { facilityId, name: newDept });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['build-departments'] });
      setNewDept('');
      toast.success('Departman eklendi');
    }
  });

  const [newPerson, setNewPerson] = useState('');
  const addPersonMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/build-management/settings/persons', { facilityId, name: newPerson, title: '' });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['build-persons'] });
      setNewPerson('');
      toast.success('Kişi eklendi');
    }
  });

  // Document Upload
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const uploadDocMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'Hizmet Tasarım Formu');
      formData.append('status', 'Onaylandı');
      
      const res = await api.customFetch(`/build-management/projects/${id}/documents`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Yükleme hatası');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Doküman başarıyla eklendi');
      queryClient.invalidateQueries({ queryKey: ['buildProject', id] });
      setUploadingDoc(false);
    },
    onError: () => {
      toast.error('Doküman yüklenemedi');
      setUploadingDoc(false);
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingDoc(true);
      uploadDocMutation.mutate(e.target.files[0]);
    }
  };

  if (projLoading || formLoading) {
    return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;
  }

  const relatedDeptsWatch = watch('relatedDepartments') || [];
  const otherMembersWatch = watch('otherTeamMembers') || [];

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/build-management/project/${id}`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Hizmet Tasarım / Geliştirme Formu</h1>
      </div>

      <div className="bg-card border rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-6">
          <fieldset disabled={isViewMode} className="space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-1 block">Hastane</label>
              <Input value={project?.location?.facilityId || facilityId} disabled className="bg-muted" />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Tarih</label>
              <Input type="date" {...register('formDate', { required: true })} />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-1 block">Tanım (Projenin detaylı tanımı)</label>
            <Textarea {...register('description')} rows={3} placeholder="Proje tanımını buraya girin..." />
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <label className="text-sm font-semibold mb-1 block">Talep Sahibi</label>
              <div className="flex gap-2">
                <select {...register('requester')} className="flex-1 rounded-md border bg-background px-3 h-9 text-sm">
                  <option value="">Seçiniz...</option>
                  {departments?.map((d: any) => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2 mt-2">
                <Input value={newDept} onChange={e => setNewDept(e.target.value)} placeholder="Yeni departman..." className="h-8 text-xs" />
                <Button type="button" size="sm" variant="outline" onClick={() => addDeptMutation.mutate()} disabled={!newDept || addDeptMutation.isPending}><Plus className="w-3 h-3"/></Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Proje Sponsoru</label>
              <Input {...register('projectSponsor')} placeholder="Sponsor..." />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-1 block">Açıklamalar</label>
            <Textarea {...register('notes')} rows={2} />
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="font-bold text-lg">Proje Ekibi ve İlgili Bölümler</h3>
            
            <div>
              <div className="mb-2">
                <Input 
                  value={deptSearch} 
                  onChange={(e) => setDeptSearch(e.target.value)} 
                  placeholder="Bölüm ara..." 
                  className="h-8 text-xs" 
                />
              </div>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-md bg-background max-h-40 overflow-y-auto">
                {departments?.filter((d: any) => d.name.toLowerCase().includes(deptSearch.toLowerCase())).map((d: any) => (
                  <label key={d.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 w-4 h-4"
                      checked={relatedDeptsWatch.includes(d.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setValue('relatedDepartments', [...relatedDeptsWatch, d.name]);
                        } else {
                          setValue('relatedDepartments', relatedDeptsWatch.filter((name: string) => name !== d.name));
                        }
                      }}
                    />
                    <span className="truncate" title={d.name}>{d.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Proje Yöneticisi</label>
                <select {...register('projectManager')} className="w-full rounded-md border bg-background px-3 h-9 text-sm">
                  <option value="">Seçiniz...</option>
                  {persons?.map((p: any) => <option key={p.id} value={p.name}>{p.name} {p.title ? `(${p.title})` : ''}</option>)}
                </select>
                <div className="flex gap-2 mt-2">
                  <Input value={newPerson} onChange={e => setNewPerson(e.target.value)} placeholder="Yeni kişi..." className="h-8 text-xs" />
                  <Button type="button" size="sm" variant="outline" onClick={() => addPersonMutation.mutate()} disabled={!newPerson || addPersonMutation.isPending}><Plus className="w-3 h-3"/></Button>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-semibold mb-1 block">Diğer Ekip Üyeleri</label>
                <div className="mb-2">
                  <Input 
                    value={personSearch} 
                    onChange={(e) => setPersonSearch(e.target.value)} 
                    placeholder="Kişi ara..." 
                    className="h-8 text-xs" 
                  />
                </div>
                <div className="flex flex-col gap-2 p-3 border rounded-md bg-background max-h-40 overflow-y-auto">
                  {persons?.filter((p: any) => p.name.toLowerCase().includes(personSearch.toLowerCase())).map((p: any) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 w-4 h-4"
                        checked={otherMembersWatch.includes(p.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setValue('otherTeamMembers', [...otherMembersWatch, p.name]);
                          } else {
                            setValue('otherTeamMembers', otherMembersWatch.filter((name: string) => name !== p.name));
                          }
                        }}
                      />
                      <span className="truncate" title={`${p.name} ${p.title ? `(${p.title})` : ''}`}>{p.name} {p.title ? `(${p.title})` : ''}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="font-bold text-lg">Proje Detayları</h3>
            
            <div>
              <label className="text-sm font-semibold mb-1 block">Projenin Amacı ve İlgili Dokümanlar</label>
              <Textarea {...register('projectGoal')} rows={3} />
              
              <div className="mt-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Taralı Form / İlgili Doküman Ekle
                </h4>
                
                <div className="space-y-3">
                  {project?.documents?.filter((d: any) => d.documentType === 'Hizmet Tasarım Formu').length > 0 ? (
                    <div className="grid gap-2">
                      {project.documents.filter((d: any) => d.documentType === 'Hizmet Tasarım Formu').map((doc: any) => (
                        <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</p>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Henüz yüklenmiş bir doküman yok.</p>
                  )}
                  
                  {!isViewMode && (
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative">
                      <input 
                        type="file" 
                        onChange={handleFileUpload} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        disabled={uploadingDoc}
                      />
                      {uploadingDoc ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                          <p className="font-semibold text-slate-700 dark:text-slate-300">Yükleniyor...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                            <Upload className="w-6 h-6" />
                          </div>
                          <p className="font-semibold text-slate-700 dark:text-slate-300">Taralı Form / Doküman Ekle</p>
                          <p className="text-xs text-slate-500 mt-1">Bilgisayarınızdan seçmek için tıklayın veya sürükleyin</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-semibold mb-1 block">Proje Planı Temel Adımları</label>
              <Textarea {...register('projectPlan')} rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Girdiler</label>
                <Textarea {...register('inputs')} rows={3} />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Çıktılar</label>
                <Textarea {...register('outputs')} rows={3} />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Doğrulama</label>
                <Textarea {...register('verification')} rows={3} />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Gözden Geçirme</label>
                <Textarea {...register('review')} rows={3} />
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="font-bold text-lg">Geçerlilik ve Değişiklik Kontrolü</h3>
            
            <div>
              <label className="text-sm font-semibold mb-1 block">Geçerlilik Tespiti İçin Yapılan Çalışmalar</label>
              <p className="text-xs text-muted-foreground mb-1">Hizmet öncesi tamamlanamıyorsa tanımlanan hizmet süresi / müşteri sayısı / simülasyon / pilot uygulama</p>
              <Textarea {...register('validityStudies')} rows={3} />
            </div>

            <div>
              <label className="text-sm font-semibold mb-1 block">Değişiklik Kontrolü</label>
              <Textarea {...register('changeControl')} rows={3} />
            </div>
          </div>

          </fieldset>
          
          {!isViewMode && (
            <div className="flex justify-end pt-4 border-t">
              <Button type="button" variant="outline" className="mr-3" onClick={() => navigate(`/build-management/project/${id}`)}>
                İptal
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Formu Kaydet ve Onayla
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
