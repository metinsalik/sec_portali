import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface TemplateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId?: string | null;
  onSuccess: () => void;
}

export function TemplateGroupModal({
  open,
  onOpenChange,
  groupId,
  onSuccess,
}: TemplateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && !groupId) {
      setName('');
      setDescription('');
    }
  }, [open, groupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Grup adı zorunludur.');
      return;
    }
    setLoading(true);
    try {
      const res = groupId
        ? await api.put(`/checklists/groups/${groupId}`, {
            name: name.trim(),
            description: description.trim() || null,
          })
        : await api.post('/checklists/groups', {
            name: name.trim(),
            description: description.trim() || null,
          });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Grup kaydedilemedi.');
      }
      toast.success(groupId ? 'Grup güncellendi.' : 'Yeni grup oluşturuldu.');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || 'Grup kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {groupId ? 'Grubu Düzenle' : 'Yeni Grup Oluştur'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Kontrol listesi şablonlarını kategorize etmek için bir grup oluşturun.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="group-name" className="text-xs font-medium">
              Grup Adı <span className="text-destructive">*</span>
            </Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Yangın Kontrol Listeleri"
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="group-desc" className="text-xs font-medium">
              Açıklama (Opsiyonel)
            </Label>
            <Textarea
              id="group-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Grup hakkında kısa bir açıklama..."
              className="text-xs min-h-[70px]"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button type="submit" size="sm" disabled={loading || !name.trim()} className="gap-1.5">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
