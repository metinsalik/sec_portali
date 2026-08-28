import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { BASE_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Send, FileText, ImageIcon, ArrowLeft, CheckCircle, ShieldAlert, Folder, Clock, Activity, CheckCircle2, Calendar, Pencil, X, Check, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function IsgDefterItemDetail() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isUploadingAction, setIsUploadingAction] = useState(false);
  const [editingContent, setEditingContent] = useState(false);
  const [editContentVal, setEditContentVal] = useState('');
  
  const activeFacilityId = localStorage.getItem('activeFacilityId');
  
  const { data: pages = [] } = useQuery({
    queryKey: ['isg-defter-pages', activeFacilityId],
    queryFn: async () => {
      if (!activeFacilityId) return [];
      const res = await api.get(`/safety-management/isg-defter/facilities/${activeFacilityId}/pages`);
      return res.json();
    },
    enabled: !!activeFacilityId,
  });

  const itemData = pages.flatMap((p: any) => p.items).find((i: any) => i.id === Number(itemId));
  const pageData = pages.find((p: any) => p.items.some((i: any) => i.id === Number(itemId)));
  const itemFacilityId = pageData?.facilityId || activeFacilityId;

  const { data: settings } = useQuery({
    queryKey: ['isg-defter-settings', itemFacilityId],
    queryFn: async () => {
      if (!itemFacilityId || itemFacilityId === 'all') return null;
      const res = await api.get(`/safety-management/isg-defter/facilities/${itemFacilityId}/settings`);
      return res.json();
    },
    enabled: !!itemFacilityId && itemFacilityId !== 'all',
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['global-categories'],
    queryFn: async () => {
      try {
        const res = await api.get(`/settings/definitions/categories`);
        const data = await res.json();
        return Array.isArray(data) ? data : (data?.data || []);
      } catch (err) {
        console.error("Kategoriler yüklenemedi:", err);
        return [];
      }
    }
  });

  const mainCategories = categories.filter((c: any) => !c.parentId);
  const subCategories1 = categories.filter((c: any) => itemData?.mainCategoryId && c.parentId === itemData.mainCategoryId);
  const subCategories2 = categories.filter((c: any) => itemData?.categoryId && c.parentId === itemData.categoryId);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['isg-defter-comments', itemId],
    queryFn: async () => {
      if (!itemId) return [];
      const res = await api.get(`/safety-management/isg-defter/items/${itemId}/comments`);
      return res.json();
    },
    enabled: !!itemId,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await api.post(`/safety-management/isg-defter/items/${itemId}/comments`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isg-defter-comments', itemId] });
      setNewComment('');
    },
    onError: () => toast.error('Yorum eklenirken hata oluştu.')
  });

  const updateItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/safety-management/isg-defter/items/${itemId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isg-defter-pages'] });
      toast.success('Kayıt başarıyla güncellendi.');
      setEditingContent(false);
    },
    onError: () => toast.error('Kayıt güncellenirken hata oluştu.')
  });

  const addActionMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post(`/safety-management/isg-defter/actions`, formData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isg-defter-pages'] });
      toast.success('İşlem durumu başarıyla güncellendi.');
      setIsCompleteModalOpen(false);
    },
    onSettled: () => setIsUploadingAction(false)
  });

  const handleCompleteAction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploadingAction(true);
    const formData = new FormData(e.currentTarget);
    formData.append('notebookItemId', itemId!);
    formData.append('status', 'Tamamlandı');
    addActionMutation.mutate(formData);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  if (!itemData) {
    return <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-[50vh]">
      <Activity className="h-8 w-8 animate-spin mb-4" />
      Yükleniyor veya kayıt bulunamadı...
    </div>;
  }

  const isCompleted = itemData.status === 'Tamamlandı';
  const statusColor = isCompleted ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600';
  const statusIcon = isCompleted ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <Clock className="w-4 h-4 mr-1" />;

  const facilityName = pageData?.facility?.name;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-start sm:items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full bg-muted/50" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Kayıt #{itemData.id}</h2>
              {facilityName && (
                <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-200 flex items-center shadow-sm">
                  <Building2 className="w-3 h-3 mr-1 text-primary" /> {facilityName}
                </Badge>
              )}
              <Badge className={`${statusColor} text-white px-3 py-1 text-sm shadow-sm flex items-center`}>
                {statusIcon} {itemData.status}
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2 mt-1 font-medium">
               <Calendar className="w-4 h-4" />
               {format(new Date(itemData.createdAt), 'dd MMMM yyyy', { locale: tr })}
            </p>
          </div>
        </div>
        {!isCompleted && (
          <Button 
            onClick={() => setIsCompleteModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-transform active:scale-95"
            size="lg"
          >
            <CheckCircle className="w-5 h-5 mr-2" /> İşlemi Tamamla ve Kapat
          </Button>
        )}
      </div>

      {/* KATEGORİLER VE RİSK - ÜST BÖLÜM TAM GENİŞLİK */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="w-full">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Folder className="w-4 h-4" /> Ana Kategori
              </div>
            <div className="font-semibold text-lg leading-tight text-foreground mt-2 w-full">
              <Select 
                value={itemData.mainCategoryId?.toString() || 'none'}
                onValueChange={(val) => {
                  updateItemMutation.mutate({ 
                    mainCategoryId: val === 'none' ? null : Number(val),
                    categoryId: null,
                    subCategoryId: null
                  });
                }}
              >
                <SelectTrigger className="h-8 border-transparent hover:border-input bg-transparent px-2 font-medium w-full">
                  <SelectValue placeholder="Seçilmedi">
                    <span className="block truncate max-w-full">
                      {itemData.mainCategoryId ? categories.find((c:any) => c.id.toString() === itemData.mainCategoryId?.toString())?.name : 'Seçilmedi'}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Seçilmedi</SelectItem>
                  {mainCategories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="w-full">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Folder className="w-4 h-4" /> Kategori
              </div>
            <div className="font-semibold text-lg leading-tight text-foreground mt-2 w-full">
              <Select 
                value={itemData.categoryId?.toString() || 'none'}
                onValueChange={(val) => {
                  updateItemMutation.mutate({ 
                    categoryId: val === 'none' ? null : Number(val),
                    subCategoryId: null
                  });
                }}
                disabled={!itemData.mainCategoryId}
              >
                <SelectTrigger className="h-8 border-transparent hover:border-input bg-transparent px-2 font-medium w-full">
                  <SelectValue placeholder="Seçilmedi">
                    <span className="block truncate max-w-full">
                      {itemData.categoryId ? categories.find((c:any) => c.id.toString() === itemData.categoryId?.toString())?.name : 'Seçilmedi'}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Seçilmedi</SelectItem>
                  {subCategories1.map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="w-full">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Folder className="w-4 h-4" /> Alt Kategori
              </div>
            <div className="font-semibold text-lg leading-tight text-foreground mt-2 w-full">
              <Select 
                value={itemData.subCategoryId?.toString() || 'none'}
                onValueChange={(val) => {
                  updateItemMutation.mutate({ 
                    subCategoryId: val === 'none' ? null : Number(val)
                  });
                }}
                disabled={!itemData.categoryId}
              >
                <SelectTrigger className="h-8 border-transparent hover:border-input bg-transparent px-2 font-medium w-full">
                  <SelectValue placeholder="Seçilmedi">
                    <span className="block truncate max-w-full">
                      {itemData.subCategoryId ? categories.find((c:any) => c.id.toString() === itemData.subCategoryId?.toString())?.name : 'Seçilmedi'}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Seçilmedi</SelectItem>
                  {subCategories2.map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <ShieldAlert className="w-4 h-4" /> Risk Düzeyi
              </div>
            <div className="font-semibold text-lg leading-tight text-foreground mt-2">
              <Select 
                value={itemData.riskLevel} 
                onValueChange={(val) => {
                  updateItemMutation.mutate({ riskLevel: val });
                }}
              >
                <SelectTrigger className={`h-auto min-h-[32px] py-1 border-transparent hover:border-input bg-transparent px-2 font-medium whitespace-normal text-left ${itemData.riskLevel === 'Belirlenmedi' ? 'text-muted-foreground' : ''}`}>
                  <SelectValue placeholder="Risk Seç">
                    {itemData.riskLevel === 'Belirlenmedi' ? 'Belirlenmedi' : (
                       <div className="flex items-center gap-2 flex-wrap">
                         <span className={`w-2 h-2 rounded-full shrink-0 ${settings?.riskLevels?.find((r:any) => r.name === itemData.riskLevel)?.color || 'bg-gray-500'}`}></span>
                         <span className="break-words">{itemData.riskLevel}</span>
                       </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Belirlenmedi" disabled>Belirlenmedi</SelectItem>
                  {settings?.riskLevels?.map((r: any) => (
                    <SelectItem key={r.name} value={r.name}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${r.color}`}></span>
                        {r.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ALT BÖLÜM: 2 KOLON (İçerik + Yorumlar SOLDA, Aksiyonlar SAĞDA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SOL KOLON */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <Card className="shadow-sm border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
                <span>Tespit / Öneri İçeriği</span>
                <div className="flex items-center gap-2">
                  {!editingContent && (
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => {
                      setEditContentVal(itemData.content);
                      setEditingContent(true);
                    }}>
                      <Pencil className="w-3 h-3 mr-1" /> Düzenle
                    </Button>
                  )}
                  <span className="bg-muted px-2 py-1 rounded text-xs">
                    Yazan: {itemData.authorType}
                    {itemData.authorName && itemData.authorName !== 'Sistem' && ` - ${itemData.authorName}`}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingContent ? (
                <div className="space-y-3">
                  <Textarea 
                    value={editContentVal}
                    onChange={(e) => setEditContentVal(e.target.value)}
                    className="min-h-[120px] text-base resize-y"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingContent(false)}>İptal</Button>
                    <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => {
                      if (editContentVal.trim() && editContentVal !== itemData.content) {
                        updateItemMutation.mutate({ content: editContentVal.trim() });
                      } else {
                        setEditingContent(false);
                      }
                    }}>
                      Kaydet
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
                  "{itemData.content}"
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="flex-1 flex flex-col shadow-sm border-t-4 border-t-blue-500 h-[600px]">
            <CardHeader className="bg-muted/10 border-b py-3">
              <CardTitle className="text-base flex items-center gap-2">
                Görüşler ve Yorumlar
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <ScrollArea className="flex-1 p-4 bg-slate-50/50 dark:bg-slate-950/20">
                {isLoading ? (
                  <div className="flex justify-center py-8"><Activity className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                    <div className="bg-muted p-4 rounded-full mb-3"><Send className="h-6 w-6 opacity-50" /></div>
                    <p>Sürece dair ilk yorumu siz yapın.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {comments.map((comment: any) => {
                      const isMe = comment.authorName === user?.fullName || comment.authorId === user?.username || comment.authorName === user?.username;
                      return (
                        <div key={comment.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex max-w-[80%] gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            <Avatar className="w-8 h-8 border shadow-sm">
                              <AvatarFallback className={isMe ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'}>
                                {comment.authorName?.substring(0,2).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              <span className="text-xs text-muted-foreground mb-1 px-1">
                                {comment.authorName} • {format(new Date(comment.createdAt), 'HH:mm - dd MMM', { locale: tr })}
                              </span>
                              <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                                isMe 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : 'bg-white dark:bg-slate-800 border rounded-tl-none'
                              }`}>
                                <p className="whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>

              <div className="p-4 bg-background border-t">
                <form onSubmit={handleSendComment} className="flex gap-2 items-end">
                  <div className="flex-1 relative bg-muted/30 rounded-xl border focus-within:ring-1 focus-within:ring-ring transition-shadow">
                    <Textarea 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Görüş veya yorumunuzu yazın..." 
                      className="min-h-[60px] resize-none border-0 bg-transparent focus-visible:ring-0 shadow-none px-4 py-3"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendComment(e);
                        }
                      }}
                    />
                    <div className="absolute right-2 bottom-2 flex gap-1">
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-full">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-full">
                        <Folder className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="h-[60px] px-6 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-transform active:scale-95" disabled={!newComment.trim() || addCommentMutation.isPending}>
                    {addCommentMutation.isPending ? <Activity className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SAĞ KOLON */}
        <div className="lg:col-span-5">
          <Card className="shadow-sm sticky top-6">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-lg">Zaman Çizelgesi (Aksiyonlar)</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 max-h-[600px] overflow-y-auto">
              {itemData.actions?.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Henüz bir aksiyon alınmamış.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-primary/30 ml-3 space-y-6">
                  {itemData.actions?.map((action: any, idx: number) => (
                    <div key={action.id} className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5 ring-4 ring-background"></div>
                      <div className="bg-muted/30 p-3 rounded-lg border text-sm">
                        <p className="font-medium text-foreground">{action.content}</p>
                        {action.proofUrl && (
                          <div className="mt-3">
                            <a href={`${BASE_URL.replace('/api', '')}${action.proofUrl}`} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 overflow-hidden rounded-md border shadow-sm hover:opacity-90 transition-opacity">
                               <img src={`${BASE_URL.replace('/api', '')}${action.proofUrl}`} alt="Kanıt" className="w-full h-full object-cover" />
                            </a>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2 flex items-center justify-between">
                          <span>{action.createdBy || 'Sistem'}</span>
                          <span>{format(new Date(action.createdAt), 'dd MMM yyyy HH:mm', { locale: tr })}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Completion Modal */}
      <Dialog open={isCompleteModalOpen} onOpenChange={setIsCompleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>İşlemi Tamamla ve Kapat</DialogTitle>
            <DialogDescription>
              Bu uygunsuzluğun giderildiğine dair bir açıklama girin. İsterseniz kanıt olarak bir fotoğraf veya belge yükleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCompleteAction} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Açıklama (Zorunlu)</Label>
              <Textarea 
                name="content" 
                placeholder="Örn: Yangın merdivenlerindeki aydınlatmalar yenilendi."
                required
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Kanıt Yükle (İsteğe Bağlı)</Label>
              <Input type="file" name="file" accept="image/*,.pdf" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsCompleteModalOpen(false)}>İptal</Button>
              <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800" disabled={isUploadingAction}>
                {isUploadingAction ? 'Kaydediliyor...' : 'Tamamla ve Kapat'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
