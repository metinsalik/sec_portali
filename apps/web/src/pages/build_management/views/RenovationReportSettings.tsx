import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Plus, Save, X, Settings2, Info, ArrowLeft } from 'lucide-react';
import { useIRSC } from '../context/IRSCContext';
import type { IRSCDepartment } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function RenovationReportSettings() {
  const { departments, setDepartments } = useIRSC();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'CATEGORIES' | 'DEPARTMENTS' | 'AREAS'>('CATEGORIES');
  const [confirmDialog, setConfirmDialog] = useState<{ msg: string; onConfirm: () => void } | null>(null);

  // Department State
  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const [editDepartmentName, setEditDepartmentName] = useState('');

  const handleAddDepartment = () => {
    if (!newDepartmentName.trim()) return;
    const newDep: IRSCDepartment = {
      id: `d_${Date.now()}`,
      name: newDepartmentName.trim(),
    };
    setDepartments([...departments, newDep]);
    setNewDepartmentName('');
    setIsAddingDepartment(false);
  };

  const handleUpdateDepartment = (id: string) => {
    if (!editDepartmentName.trim()) return;
    setDepartments(
      departments.map((d) => (d.id === id ? { ...d, name: editDepartmentName.trim() } : d))
    );
    setEditingDepartmentId(null);
  };

  const handleDeleteDepartment = (id: string) => {
    setConfirmDialog({
      msg: 'Bu departmanı silmek istediğinize emin misiniz?',
      onConfirm: () => setDepartments(departments.filter((d) => d.id !== id)),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/renovation-report')}
            aria-label="Yönetim paneline dön"
            className="h-9 w-9 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Modül Ayarları
            </h2>
            <p className="text-xs text-muted-foreground">
              Denetim kategorileri, görevli departmanlar ve lokasyon tanımlarını yönetin.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <CardHeader className="pb-3 border-b border-border">
            <TabsList className="grid w-full sm:w-fit grid-cols-3">
              <TabsTrigger value="CATEGORIES" className="text-xs">
                Kategoriler
              </TabsTrigger>
              <TabsTrigger value="DEPARTMENTS" className="text-xs">
                Departmanlar
              </TabsTrigger>
              <TabsTrigger value="AREAS" className="text-xs">
                Mahaller &amp; Alanlar
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="p-6">
            {/* CATEGORIES TAB */}
            <TabsContent value="CATEGORIES" className="mt-0">
              <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/30 border border-dashed border-border rounded-lg space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Info className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground">
                    Kategoriler Artık Ortak Yönetiliyor
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Uygulama genelinde standartlaşmayı sağlamak amacıyla tüm kategoriler{' '}
                    <strong className="text-foreground">&quot;Ayarlar &gt; Tanımlar&quot;</strong>{' '}
                    bölümüne taşınmıştır.
                  </p>
                </div>
                <Button size="sm" onClick={() => navigate('/settings/definitions')}>
                  Global Tanımlara Git
                </Button>
              </div>
            </TabsContent>

            {/* DEPARTMENTS TAB */}
            <TabsContent value="DEPARTMENTS" className="mt-0">
              <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/30 border border-dashed border-border rounded-lg space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Info className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground">
                    Departmanlar Artık Merkezi Katalogdan Yönetiliyor
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Tüm modüllerde tek standart sağlamak amacıyla görevlendirilebilir departmanlar{' '}
                    <strong className="text-foreground">&quot;Ayarlar &gt; Tanımlar &gt; Departmanlar&quot;</strong>{' '}
                    bölümünden yönetilmektedir.
                  </p>
                </div>
                <Button size="sm" onClick={() => navigate('/settings/definitions')}>
                  Merkezi Departmanlara Git
                </Button>
              </div>
            </TabsContent>

            {/* AREAS TAB */}
            <TabsContent value="AREAS" className="mt-0">
              <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/30 border border-dashed border-border rounded-lg space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Info className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground">
                    Mahaller Artık Ortak Yönetiliyor
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Uygulama genelinde standartlaşmayı sağlamak amacıyla tüm mahaller ve lokasyonlar{' '}
                    <strong className="text-foreground">&quot;Ayarlar &gt; Lokasyonlar&quot;</strong>{' '}
                    bölümüne taşınmıştır.
                  </p>
                </div>
                <Button size="sm" onClick={() => navigate('/settings/locations')}>
                  Merkezi Lokasyonlara Git
                </Button>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Silme Onayı */}
      <Dialog open={Boolean(confirmDialog)} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Onay</DialogTitle>
            <DialogDescription>{confirmDialog?.msg}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmDialog(null)}>
              İptal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                confirmDialog?.onConfirm();
                setConfirmDialog(null);
              }}
            >
              Onayla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
