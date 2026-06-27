import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Upload, Loader2, Trash2, Plus, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
}

const DEFAULT_DOCS = [
  'Geçici Görevlendirme Evrağı',
  'SGK Evrakları',
  'İSG Eğitim Kayıtları',
  'Yangın Güvenliği Planı',
  'Enfeksiyon Kontrol Planı'
];

export function BuildDocumentsModal({ open, onOpenChange, project }: Props) {
  const queryClient = useQueryClient();
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(DEFAULT_DOCS);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (project?.documents) {
      const existingTypes = project.documents.map((d: any) => d.documentType);
      const uniqueTypes = Array.from(new Set([...DEFAULT_DOCS, ...existingTypes])) as string[];
      setCategories(uniqueTypes);
    }
  }, [project]);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, docType }: { file: File, docType: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', docType);
      formData.append('status', 'Onaylandı');
      
      const res = await api.customFetch(`/build-management/projects/${project.id}/documents`, {
        method: 'POST',
        body: formData
      });
      
      if (res.status !== 200 && res.status !== 201) {
        throw new Error('Belge yükleme hatası');
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast.success('Belge başarıyla yüklendi');
      queryClient.invalidateQueries({ queryKey: ['buildProject', project.id] });
      setUploadingDoc(null);
    },
    onError: () => {
      toast.error('Belge yüklenirken bir hata oluştu');
      setUploadingDoc(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const res = await api.delete(`/build-management/projects/${project.id}/documents/${documentId}`);
      if (!res.ok) throw new Error('Silme hatası');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Belge başarıyla silindi');
      queryClient.invalidateQueries({ queryKey: ['buildProject', project.id] });
    },
    onError: () => {
      toast.error('Belge silinirken bir hata oluştu');
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingDoc(docType);
      uploadMutation.mutate({ file: e.target.files[0], docType });
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (cat: string) => {
    setCategories(categories.filter(c => c !== cat));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Yüklenici Evrakları</DialogTitle>
          <DialogDescription>Proje belgelerini bu alandan ekleyebilir veya silebilirsiniz. İstediğiniz kadar belge ekleyebilirsiniz.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mt-4 items-center shrink-0">
          <Input 
            value={newCategory} 
            onChange={e => setNewCategory(e.target.value)} 
            placeholder="Yeni belge başlığı ekle..."
            className="flex-1"
          />
          <Button onClick={handleAddCategory} variant="secondary">
            <Plus className="w-4 h-4 mr-2" />
            Başlık Ekle
          </Button>
        </div>

        <div className="space-y-4 mt-6 overflow-y-auto pr-2 pb-4">
          {categories.map(docType => {
            const uploadedDocs = project?.documents?.filter((d: any) => d.documentType === docType) || [];
            const isUploading = uploadingDoc === docType;

            return (
              <div key={docType} className="p-4 bg-slate-50 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700 rounded-lg">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    {docType}
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{uploadedDocs.length}</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input 
                        type="file" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => handleFileChange(e, docType)}
                        disabled={isUploading}
                      />
                      <Button size="sm" variant="outline" disabled={isUploading} className="h-8">
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                        Evrak Yükle
                      </Button>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveCategory(docType)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {uploadedDocs.length > 0 ? (
                  <div className="space-y-2">
                    {uploadedDocs.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 border rounded text-sm">
                        <span className="text-slate-600 dark:text-slate-300 truncate max-w-[300px]" title={doc.name}>
                          {doc.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 mr-2">{new Date(doc.createdAt).toLocaleDateString('tr-TR')}</span>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => window.open(doc.fileUrl, '_blank')}>
                            <Eye className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { if(window.confirm('Bu belgeyi silmek istediğinize emin misiniz?')) deleteMutation.mutate(doc.id); }}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Bu başlık altında henüz evrak bulunmuyor.</p>
                )}
              </div>
            );
          })}
          {categories.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">Hiç belge başlığı bulunmuyor. Yeni bir başlık ekleyebilirsiniz.</div>
          )}
        </div>

        <div className="flex justify-end mt-4 pt-4 border-t shrink-0">
          <Button onClick={() => onOpenChange(false)}>Kapat</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

