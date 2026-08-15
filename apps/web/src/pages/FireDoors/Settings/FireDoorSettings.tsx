import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Edit, Trash2, Send } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { toast } from 'sonner';

const fetchProperties = async () => {
  const res = await api.get('/safety-management/fire-doors/settings/properties');
  return res.json();
};

const fetchQuestionGroups = async () => {
  const res = await api.get('/safety-management/fire-doors/settings/question-groups');
  return res.json();
};

export default function FireDoorSettings() {
  const queryClient = useQueryClient();

  const { data: properties, isLoading: propsLoading } = useQuery({
    queryKey: ['fireDoorProperties'],
    queryFn: fetchProperties,
  });

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['fireDoorQuestionGroups'],
    queryFn: fetchQuestionGroups,
  });

  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notifyDeadline, setNotifyDeadline] = useState('');

  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);

  const { data: facilities, isLoading: isFacilitiesLoading } = useQuery({
    queryKey: ['allFacilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      return res.json();
    },
    enabled: isNotifyModalOpen
  });

  // Modal States
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({ id: '', name: '', order: 0 });

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState({ id: '', groupId: '', text: '', order: 0, tw: 1 });

  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [propertyForm, setPropertyForm] = useState({ id: '', name: '', optionsStr: '' });

  // Mutations
  const saveGroup = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        return api.put(`/safety-management/fire-doors/settings/question-groups/${data.id}`, data).then(res => res.json());
      }
      return api.post('/safety-management/fire-doors/settings/question-groups', data).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fireDoorQuestionGroups'] });
      setGroupModalOpen(false);
      toast.success('Kategori kaydedildi.');
    }
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => api.delete(`/safety-management/fire-doors/settings/question-groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fireDoorQuestionGroups'] });
      toast.success('Kategori silindi.');
    }
  });

  const saveQuestion = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        weightPass: data.tw,
        weightPartial: data.tw * 0.5,
        weightFail: data.tw * -1,
      };

      if (data.id) {
        return api.put(`/safety-management/fire-doors/settings/questions/${data.id}`, payload).then(res => res.json());
      }
      return api.post('/safety-management/fire-doors/settings/questions', payload).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fireDoorQuestionGroups'] });
      setQuestionModalOpen(false);
      toast.success('Soru kaydedildi.');
    }
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => api.delete(`/safety-management/fire-doors/settings/questions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fireDoorQuestionGroups'] });
      toast.success('Soru silindi.');
    }
  });

  const saveProperty = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        options: data.optionsStr.split(',').map((s: string) => s.trim()).filter(Boolean)
      };

      if (data.id) {
        return api.put(`/safety-management/fire-doors/settings/properties/${data.id}`, payload).then(res => res.json());
      }
      return api.post('/safety-management/fire-doors/settings/properties', payload).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fireDoorProperties'] });
      setPropertyModalOpen(false);
      toast.success('Özellik kaydedildi.');
    }
  });

  const deleteProperty = useMutation({
    mutationFn: async (id: string) => api.delete(`/safety-management/fire-doors/settings/properties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fireDoorProperties'] });
      toast.success('Özellik silindi.');
    }
  });

  const notifyFacilities = useMutation({
    mutationFn: async () => {
      if (selectedFacilities.length === 0) {
        throw new Error('Lütfen en az bir tesis seçiniz.');
      }
      const res = await api.post('/safety-management/fire-doors/settings/notify', { 
        deadline: notifyDeadline,
        facilityIds: selectedFacilities
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`${data.count} yetkiliye bildirim gönderildi.`);
      setIsNotifyModalOpen(false);
      setNotifyDeadline('');
      setSelectedFacilities([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Bildirim gönderilirken bir hata oluştu.');
    }
  });

  // Handlers
  const handleOpenGroupModal = (group?: any) => {
    setGroupForm(group ? { id: group.id, name: group.name, order: group.order } : { id: '', name: '', order: 0 });
    setGroupModalOpen(true);
  };

  const handleOpenQuestionModal = (groupId: string, question?: any) => {
    setQuestionForm(question 
      ? { id: question.id, groupId: question.groupId, text: question.text, order: question.order, tw: question.weightPass } 
      : { id: '', groupId, text: '', order: 0, tw: 1 });
    setQuestionModalOpen(true);
  };

  const handleOpenPropertyModal = (prop?: any) => {
    setPropertyForm(prop 
      ? { id: prop.id, name: prop.name, optionsStr: prop.options?.join(', ') || '' } 
      : { id: '', name: '', optionsStr: '' });
    setPropertyModalOpen(true);
  };


  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yangın Kapıları Ayarları</h1>
          <p className="text-muted-foreground">
            Soru bankası ve kapı özelliklerini yönetin.
          </p>
        </div>
        <Button onClick={() => setIsNotifyModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Send className="mr-2 h-4 w-4" /> Tüm Tesislere Bildir
        </Button>
      </div>

      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions">Soru Bankası</TabsTrigger>
          <TabsTrigger value="properties">Kapı Özellikleri</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Denetim Soruları</CardTitle>
                <CardDescription>Kapı denetimlerinde sorulacak soruları kategori bazlı yönetin.</CardDescription>
              </div>
              <Button size="sm" onClick={() => handleOpenGroupModal()}>
                <Plus className="mr-2 h-4 w-4" /> Yeni Kategori Ekle
              </Button>
            </CardHeader>
            <CardContent>
              {groupsLoading ? (
                <p>Yükleniyor...</p>
              ) : (
                <div className="space-y-6">
                  {groups?.map((group: any) => (
                    <div key={group.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-4">
                            <h3 className="text-lg font-semibold">{group.name}</h3>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenGroupModal(group)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Kategoriyi Sil</AlertDialogTitle>
                                            <AlertDialogDescription>Bu kategoriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>İptal</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteGroup.mutate(group.id)} className="bg-red-600 hover:bg-red-700">Sil</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleOpenQuestionModal(group.id)}>
                          <Plus className="mr-2 h-4 w-4" /> Soru Ekle
                        </Button>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sıra</TableHead>
                            <TableHead>Soru</TableHead>
                            <TableHead>TW Puanı</TableHead>
                            <TableHead className="w-[100px]">İşlemler</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.questions?.map((q: any) => (
                            <TableRow key={q.id}>
                              <TableCell>{q.order}</TableCell>
                              <TableCell>{q.text}</TableCell>
                              <TableCell>{q.weightPass}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => handleOpenQuestionModal(group.id, q)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Soruyu Sil</AlertDialogTitle>
                                            <AlertDialogDescription>Bu soruyu silmek istediğinize emin misiniz?</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>İptal</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteQuestion.mutate(q.id)} className="bg-red-600 hover:bg-red-700">Sil</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!group.questions || group.questions.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">Bu kategoride henüz soru yok.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Dinamik Özellikler</CardTitle>
                <CardDescription>Kapılara atanacak ekstra seçenekli özellikleri tanımlayın.</CardDescription>
              </div>
              <Button size="sm" onClick={() => handleOpenPropertyModal()}>
                <Plus className="mr-2 h-4 w-4" /> Yeni Özellik
              </Button>
            </CardHeader>
            <CardContent>
              {propsLoading ? (
                <p>Yükleniyor...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Özellik Adı</TableHead>
                      <TableHead>Seçenekler</TableHead>
                      <TableHead className="w-[100px]">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties?.map((prop: any) => (
                      <TableRow key={prop.id}>
                        <TableCell className="font-medium">{prop.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(prop.options) && prop.options.map((opt: string, i: number) => (
                              <span key={i} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">
                                {opt}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenPropertyModal(prop)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Özelliği Sil</AlertDialogTitle>
                                        <AlertDialogDescription>Bu özelliği silmek istediğinize emin misiniz?</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteProperty.mutate(prop.id)} className="bg-red-600 hover:bg-red-700">Sil</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!properties || properties.length === 0) && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">Henüz özellik tanımlanmamış.</TableCell>
                        </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Group Modal */}
      <Dialog open={groupModalOpen} onOpenChange={setGroupModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{groupForm.id ? 'Soru Grubunu Düzenle' : 'Yeni Soru Grubu'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Kategori Adı</Label>
                    <Input value={groupForm.name} onChange={e => setGroupForm({...groupForm, name: e.target.value})} placeholder="Örn: Fiziksel Uygunluk" />
                </div>
                <div className="space-y-2">
                    <Label>Sıra (Opsiyonel)</Label>
                    <Input type="number" value={groupForm.order} onChange={e => setGroupForm({...groupForm, order: Number(e.target.value)})} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setGroupModalOpen(false)}>İptal</Button>
                <Button onClick={() => saveGroup.mutate(groupForm)} disabled={saveGroup.isPending}>Kaydet</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Modal */}
      <Dialog open={questionModalOpen} onOpenChange={setQuestionModalOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>{questionForm.id ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Soru Metni</Label>
                    <Input value={questionForm.text} onChange={e => setQuestionForm({...questionForm, text: e.target.value})} placeholder="Örn: Kapının montajı düzgün yapılmış olmalı..." />
                </div>
                <div className="space-y-2">
                    <Label>TW Puanı (Çarpanlar otomatik hesaplanacaktır)</Label>
                    <Input type="number" value={questionForm.tw} onChange={e => setQuestionForm({...questionForm, tw: Number(e.target.value)})} />
                    <p className="text-xs text-muted-foreground mt-1">
                        Hesaplanan: Karşılıyor ({questionForm.tw * 1}), Kısmen ({questionForm.tw * 0.5}), Karşılamıyor ({questionForm.tw * -1})
                    </p>
                </div>
                <div className="space-y-2">
                    <Label>Sıra (Opsiyonel)</Label>
                    <Input type="number" value={questionForm.order} onChange={e => setQuestionForm({...questionForm, order: Number(e.target.value)})} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setQuestionModalOpen(false)}>İptal</Button>
                <Button onClick={() => saveQuestion.mutate(questionForm)} disabled={saveQuestion.isPending}>Kaydet</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Property Modal */}
      <Dialog open={propertyModalOpen} onOpenChange={setPropertyModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{propertyForm.id ? 'Özellik Düzenle' : 'Yeni Özellik Ekle'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Özellik Adı</Label>
                    <Input value={propertyForm.name} onChange={e => setPropertyForm({...propertyForm, name: e.target.value})} placeholder="Örn: Kapatma Sistemi" />
                </div>
                <div className="space-y-2">
                    <Label>Seçenekler (Virgülle ayırın)</Label>
                    <Input value={propertyForm.optionsStr} onChange={e => setPropertyForm({...propertyForm, optionsStr: e.target.value})} placeholder="Örn: Var, Yok, Manuel" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setPropertyModalOpen(false)}>İptal</Button>
                <Button onClick={() => saveProperty.mutate(propertyForm)} disabled={saveProperty.isPending}>Kaydet</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notify Modal */}
      <Dialog open={isNotifyModalOpen} onOpenChange={setIsNotifyModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tesislere Denetim Bildirimi Gönder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Son Tamamlama Tarihi (Opsiyonel)</Label>
              <Input
                type="date"
                value={notifyDeadline}
                onChange={(e) => setNotifyDeadline(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">Bu tarih bildirim mesajına eklenecektir.</p>
            </div>
            <div className="space-y-2">
              <Label>Bildirim Gönderilecek Tesisler</Label>
              <div className="border rounded-md p-2">
                <ScrollArea className="h-[200px]">
                  {isFacilitiesLoading ? (
                      <p className="text-sm text-muted-foreground p-2">Yükleniyor...</p>
                  ) : facilities?.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2">Sistemde kayıtlı tesis bulunamadı.</p>
                  ) : (
                      <div className="space-y-2 p-1">
                          {Array.isArray(facilities) && facilities.map((f: any) => (
                              <div key={f.id} className="flex items-center space-x-2">
                                  <input 
                                    type="checkbox" 
                                    id={`fac-${f.id}`} 
                                    className="rounded border-gray-300"
                                    checked={selectedFacilities.includes(f.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedFacilities([...selectedFacilities, f.id]);
                                        } else {
                                            setSelectedFacilities(selectedFacilities.filter(id => id !== f.id));
                                        }
                                    }}
                                  />
                                  <label htmlFor={`fac-${f.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                      {f.name}
                                  </label>
                              </div>
                          ))}
                      </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotifyModalOpen(false)}>İptal</Button>
            <Button onClick={() => notifyFacilities.mutate()} disabled={notifyFacilities.isPending || selectedFacilities.length === 0}>Gönder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
