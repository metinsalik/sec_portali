import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWorkflowRoles, useUpdateWorkflowRole } from '@/hooks/useWorkflow';
import { WorkflowCategories } from './WorkflowCategories';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function WorkflowSettings() {
  const { data: users, isLoading, error } = useWorkflowRoles();
  const { mutate: updateRole } = useUpdateWorkflowRole();

  const handleRoleChange = (userId: string, role: string) => {
    updateRole({ userId, role }, {
      onSuccess: () => toast.success('Rol başarıyla güncellendi'),
      onError: (err: any) => toast.error('Hata: ' + err.message)
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Modül Ayarları</h1>
        <p className="text-slate-500 dark:text-slate-400">İş Takibi modülüne ait varsayılan ayarları ve kullanıcı yetkilerini yönetin.</p>
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">Genel Ayarlar</TabsTrigger>
          <TabsTrigger value="categories">Kategoriler</TabsTrigger>
          <TabsTrigger value="users">Kullanıcı Yetkilendirme</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-0">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <CardHeader>
                <CardTitle>Uyarı Motoru</CardTitle>
                <CardDescription>Yaklaşan termin uyarıları için eşik değerler</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Yaklaşan Termin Uyarı Günü (Varsayılan: 3)</label>
                  <Input type="number" defaultValue={3} min={1} max={30} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Geciken İşler Hatırlatma Sıklığı</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="daily">Her Gün</option>
                    <option value="weekly">Haftada Bir</option>
                  </select>
                </div>
                <Button>Kaydet</Button>
              </CardContent>
            </Card>

            <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <CardHeader>
                <CardTitle>Görev Kuralları</CardTitle>
                <CardDescription>Görev oluşturma ve tamamlanma koşulları</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Kanıt Girişi Zorunlu</p>
                    <p className="text-xs text-slate-500">Her alt adım için açıklama/kanıt girmek zorunlu olsun mu?</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Yönetici Onayı ile Tamamla</p>
                    <p className="text-xs text-slate-500">Görev "Tamamlandı" durumuna sadece yönetici onayı ile geçsin</p>
                  </div>
                  <input type="checkbox" className="w-4 h-4" />
                </div>
                <Button variant="outline">Güncelle</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-0">
          <WorkflowCategories />
        </TabsContent>

        <TabsContent value="users" className="mt-0">
          <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <CardHeader>
              <CardTitle>Kullanıcı Yetkilendirme (Modüle Özel Rol Yönetimi)</CardTitle>
              <CardDescription>
                Aşağıdaki liste, sistemde <strong>İş Takibi (Workflow)</strong> modülü erişimi olan kullanıcıları göstermektedir.
                Buradan seçtiğiniz rol sadece bu modül içinde geçerli olacaktır.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
              ) : error ? (
                <div className="p-4 text-red-500 bg-red-50 rounded-md">Kullanıcılar yüklenemedi. (Sadece sistem yöneticileri bu alanı görebilir)</div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                      <tr>
                        <th className="px-4 py-3 font-medium">Kullanıcı Adı</th>
                        <th className="px-4 py-3 font-medium">Ad Soyad</th>
                        <th className="px-4 py-3 font-medium">Modül Rolü</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users?.map(u => (
                        <tr key={u.username} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{u.username}</td>
                          <td className="px-4 py-3 text-slate-500">{u.fullName}</td>
                          <td className="px-4 py-3">
                            <select 
                              className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              value={u.workflowRole}
                              onChange={(e) => handleRoleChange(u.username, e.target.value)}
                            >
                              <option value="ADMIN">Yönetici (Admin)</option>
                              <option value="MANAGER">Birim Sorumlusu (Manager)</option>
                              <option value="MEMBER">Standart Üye (Member)</option>
                              <option value="VIEWER">İzleyici (Viewer)</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                      {users?.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                            Bu modüle atanmış hiçbir kullanıcı bulunmuyor. Ana ayarlardan modül ataması yapınız.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
