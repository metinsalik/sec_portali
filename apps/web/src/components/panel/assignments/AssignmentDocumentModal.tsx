import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, BASE_URL } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
      queryClient.invalidateQueries({ queryKey: ['facility-detail'] });
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
      queryClient.invalidateQueries({ queryKey: ['facility-detail'] });
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
      <DialogContent className="sm:max-w-xl w-[95vw] max-h-[86vh] rounded-lg border border-border bg-card p-0 overflow-hidden shadow-lg flex flex-col gap-0">
        <DialogHeader className="px-5 py-3.5 bg-muted/30 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                Atama Dokümanları
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground truncate mt-0.5">
                {assignmentName ? `${assignmentName} — doküman yükleme ve arşiv yönetimi` : 'Doküman yükleme ve arşiv yönetimi'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <form onSubmit={handleUpload} className="bg-muted/20 p-4 rounded-lg border border-border space-y-3.5">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Yeni Doküman Yükle</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Doküman Adı *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Taahhütname"
                  className="h-9 rounded-lg text-xs bg-background"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Tarih *</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-9 rounded-lg text-xs bg-background tabular-nums"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Dosya *</Label>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="h-9 rounded-lg text-xs bg-background cursor-pointer"
                required
              />
            </div>
            <Button type="submit" size="sm" disabled={isUploading} className="w-full h-8 rounded-lg text-xs font-semibold gap-1.5">
              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Dokümanı Yükle
            </Button>
          </form>

          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Yüklü Dokümanlar</h4>
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : documents?.length === 0 ? (
              <div className="text-center py-6 bg-muted/20 border border-dashed border-border rounded-lg text-muted-foreground text-xs">
                Henüz doküman yüklenmemiş.
              </div>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto">
                {documents?.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{doc.name}</p>
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          {format(new Date(doc.date), 'dd.MM.yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" asChild>
                        <a href={`${BASE_URL}${doc.filePath}`} target="_blank" rel="noopener noreferrer" title="İndir">
                          <Download className="w-3.5 h-3.5 text-muted-foreground" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteMutation.mutate(doc.id)}
                        disabled={deleteMutation.isPending}
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 rounded-none px-5 py-3 bg-muted/30 border-t border-border shrink-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 rounded-lg text-xs">
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
