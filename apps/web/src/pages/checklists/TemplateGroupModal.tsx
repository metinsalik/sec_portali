import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';

interface TemplateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId?: string | null;
  onSuccess: () => void;
}

export function TemplateGroupModal({ open, onOpenChange, groupId, onSuccess }: TemplateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (groupId) {
        // Fetch group details (or could be passed as prop if we have it)
        // For simplicity, let's just fetch it from the API or rely on the list.
        // I will assume we don't have a GET /:id endpoint for groups yet.
        // Instead, the parent should maybe just pass the initial data if needed.
      } else {
        setName('');
        setDescription('');
      }
    }
  }, [open, groupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (groupId) {
        await api.put(`/checklists/groups/${groupId}`, { name, description });
      } else {
        await api.post('/checklists/groups', { name, description });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving group:', error);
      alert('Grup kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{groupId ? 'Grubu Düzenle' : 'Yeni Grup Oluştur'}</DialogTitle>
          <DialogDescription>
            Kontrol listesi şablonlarını kategorize etmek için bir grup oluşturun.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Grup Adı</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Örn: Yangın Kontrol Listeleri"
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama (Opsiyonel)</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Grup hakkında kısa bir açıklama..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
            <Button type="submit" disabled={loading || !name}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
