import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CheckCircle2, Upload, Loader2, XCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
}

const REQUIRED_DOCS = [
  'Geçici Görevlendirme Evrağı',
  'SGK Evrakları',
  'İSG Eğitim Kayıtları',
  'Yangın Güvenliği Planı',
  'Enfeksiyon Kontrol Planı'
];

export function BuildDocumentsModal({ open, onOpenChange, project }: Props) {
  const queryClient = useQueryClient();
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, docType }: { file: File, docType: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', docType);
      formData.append('status', 'Onaylandı'); // Direkt onaylı yüklüyoruz varsayımıyla (Demo amaçlı)
      
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
      toast.success('Belge başarıyla yüklendi ve onaylandı');
      queryClient.invalidateQueries({ queryKey: ['buildProject', project.id] });
      setUploadingDoc(null);
    },
    onError: () => {
      toast.error('Belge yüklenirken bir hata oluştu');
      setUploadingDoc(null);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingDoc(docType);
      uploadMutation.mutate({ file: e.target.files[0], docType });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Zorunlu Yüklenici Evrakları</DialogTitle>
          <DialogDescription>Projenin başlayabilmesi için aşağıdaki evrakların yüklenmesi ve onaylanması gerekmektedir.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {REQUIRED_DOCS.map(docType => {
            const uploadedDoc = project?.documents?.find((d: any) => d.documentType === docType && d.status === 'Onaylandı');
            const isUploading = uploadingDoc === docType;

            return (
              <div key={docType} className="flex items-center justify-between p-4 bg-slate-50 border rounded-lg">
                <div className="flex items-center gap-3">
                  {uploadedDoc ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <h4 className="font-semibold text-sm">{docType}</h4>
                    <p className="text-xs text-slate-500">
                      {uploadedDoc ? `Yüklendi: ${uploadedDoc.documentName}` : 'Eksik'}
                    </p>
                  </div>
                </div>
                
                <div>
                  {uploadedDoc ? (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">Onaylandı</span>
                  ) : (
                    <div className="relative">
                      <input 
                        type="file" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => handleFileChange(e, docType)}
                        disabled={isUploading}
                      />
                      <Button size="sm" variant="outline" disabled={isUploading}>
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                        Yükle
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={() => onOpenChange(false)}>Kapat</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
