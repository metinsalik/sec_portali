import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, BASE_URL } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FileText, Upload, Trash2, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface AssignmentDocument {
  id: string;
  name: string;
  date: string;
  filePath: string;
  createdAt: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: number | null;
  assignmentName?: string;
}

export function AssignmentDocumentModal({ open, onOpenChange, assignmentId, assignmentName }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: documents, isLoading } = useQuery<AssignmentDocument[]>({
    queryKey: ['assignment-documents', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return [];
      const res = await api.get(`/panel/assignments/${assignmentId}/documents`);
      if (!res.ok) throw new Error('Dokümanlar yüklenemedi');
      return res.json();
    },
    enabled: !!assignmentId && open,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.customFetch(`/panel/assignments/${assignmentId}/documents`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Yükleme başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-documents', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['facility-detail'] }); // Ensure facility updates too
      toast.success('Doküman başarıyla yüklendi.');
      setName('');
      setFile(null);
    },
    onError: () => {
      toast.error('Doküman yüklenirken hata oluştu.');
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      const res = await api.delete(`/panel/assignments/documents/${docId}`);
      if (!res.ok) throw new Error('Silinemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-documents', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['facility-detail'] }); // Ensure facility updates too
      toast.success('Doküman silindi.');
    },
    onError: () => {
      toast.error('Doküman silinirken hata oluştu.');
    }
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name || !date || !assignmentId) {
      toast.error('Lütfen tüm alanları doldurun.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('date', date);
    formData.append('file', file);

    uploadMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Dokümanlar
            {assignmentName && <span className="text-muted-foreground text-sm font-normal"> - {assignmentName}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <form onSubmit={handleUpload} className="bg-muted/30 p-4 rounded-xl border space-y-4">
            <h4 className="text-sm font-bold">Yeni Doküman Yükle</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Doküman Adı</Label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Örn: Taahhütname"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tarih</Label>
                <Input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dosya</Label>
              <Input 
                type="file" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
            </div>
            <Button type="submit" disabled={isUploading} className="w-full">
              {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Yükle
            </Button>
          </form>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Yüklü Dokümanlar</h4>
            {isLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : documents?.length === 0 ? (
              <div className="text-center p-6 bg-muted/20 border border-dashed rounded-lg text-muted-foreground text-sm">
                Henüz doküman yüklenmemiş.
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {documents?.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(doc.date), 'dd.MM.yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        asChild
                      >
                        <a href={`${BASE_URL}${doc.filePath}`} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4 text-slate-500" />
                        </a>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => deleteMutation.mutate(doc.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
