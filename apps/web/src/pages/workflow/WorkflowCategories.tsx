import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FolderTree, Plus, Edit2, Trash2, Loader2, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
}

export function WorkflowCategories() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  
  // Delete state
  const [replacementId, setReplacementId] = useState<string>('none');

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['workflow-categories'],
    queryFn: async () => {
      const res = await api.get('/workflow/categories');
      if (!res.ok) throw new Error('Kategoriler yüklenemedi');
      return res.json();
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name, description, color };
      let res;
      if (editingCat) {
        res = await api.put(`/workflow/categories/${editingCat.id}`, payload);
      } else {
        res = await api.post('/workflow/categories', payload);
      }
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Kaydedilemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-categories'] });
      toast.success('Kategori başarıyla kaydedildi');
      closeForm();
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deletingCat) return;
      const payload = replacementId !== 'none' ? { replacementCategoryId: replacementId } : {};
      
      const res = await api.delete(`/workflow/categories/${deletingCat.id}`, payload);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Silinemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-categories'] });
      toast.success('Kategori silindi');
      closeDelete();
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  const openNewForm = () => {
    setEditingCat(null);
    setName('');
    setDescription('');
    setColor('#3b82f6');
    setIsFormOpen(true);
  };

  const openEditForm = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setColor(cat.color || '#3b82f6');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCat(null);
  };

  const openDelete = (cat: Category) => {
    setDeletingCat(cat);
    setReplacementId('none');
    setIsDeleteOpen(true);
  };

  const closeDelete = () => {
    setIsDeleteOpen(false);
    setDeletingCat(null);
  };

  return (
    <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors col-span-1 md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-indigo-500" />
            İş Planı Kategorileri
          </CardTitle>
          <CardDescription>Planları gruplandırmak için kategoriler oluşturun</CardDescription>
        </div>
        <Button onClick={openNewForm} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Kategori
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
        ) : categories.length === 0 ? (
          <div className="text-center p-8 bg-muted/20 border rounded-lg border-dashed">
            <p className="text-muted-foreground">Henüz bir kategori eklenmemiş.</p>
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Kategori Adı</th>
                  <th className="px-4 py-3 font-medium">Açıklama</th>
                  <th className="px-4 py-3 font-medium w-24 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || '#ccc' }} />
                        <span className="font-medium text-slate-900 dark:text-slate-100">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{cat.description || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditForm(cat)}>
                          <Edit2 className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDelete(cat)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCat ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}</DialogTitle>
            <DialogDescription>
              İş planlarını gruplandırmak için kategori detaylarını girin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kategori Adı</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Yazılım Geliştirme" />
            </div>
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="İsteğe bağlı açıklama..." />
            </div>
            <div className="space-y-2">
              <Label>Renk Kataloğu</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 p-1 rounded cursor-pointer" />
                <span className="text-sm text-muted-foreground">{color}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>İptal</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !name.trim()}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategori Sil</DialogTitle>
            <DialogDescription>
              <strong className="text-foreground">{deletingCat?.name}</strong> kategorisini silmek üzeresiniz.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 text-orange-800 dark:text-orange-300 rounded-lg text-sm border border-orange-200 dark:border-orange-900">
              Bu kategoriye ait mevcut iş planları olabilir. Silmeden önce onlara ne olacağını seçebilirsiniz.
            </div>
            <div className="space-y-2">
              <Label>Mevcut planları nereye aktaralım?</Label>
              <Select value={replacementId} onValueChange={setReplacementId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seçim yapın..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Hiçbirine Aktarma (Kategorisiz kalsınlar)</SelectItem>
                  {categories.filter(c => c.id !== deletingCat?.id).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} kategorisine aktar</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDelete}>İptal</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Kategoriyi Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
