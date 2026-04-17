import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, Search, User as UserIcon, ShieldCheck, Save, Loader2 } from 'lucide-react';

interface User {
  username: string;
  fullName: string;
  isActive: boolean;
  roles: { role: { name: string } }[];
  facilities: { facilityId: string, facility: { name: string } }[];
}

const UsersPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', fullName: '', roles: [1], facilities: [] });

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/settings/users');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    }
  });

  const authorizeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/settings/users', data);
      if (!res.ok) throw new Error('Yetkilendirme başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      setNewUser({ username: '', fullName: '', roles: [1], facilities: [] });
    }
  });

  const filteredUsers = users?.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.username && newUser.fullName) {
      authorizeMutation.mutate(newUser);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="İsim veya kullanıcı adına göre ara..." 
            className="pl-10 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Kullanıcı Yetkilendir
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
              <tr>
                <th className="px-6 py-4">Kullanıcı</th>
                <th className="px-6 py-4">Roller</th>
                <th className="px-6 py-4">Tesisler</th>
                <th className="px-6 py-4">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers?.map((user) => (
                <tr key={user.username} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{user.fullName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map(r => (
                        <Badge key={r.role.name} variant="outline" className="font-normal">
                          {r.role.name}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2 max-w-[250px]">
                      {user.facilities.map(f => (
                        <Badge key={f.facilityId} variant="secondary" className="font-normal">
                          {f.facilityId}
                        </Badge>
                      ))}
                      {user.facilities.length === 0 && <span className="text-muted-foreground text-xs">Atama yok</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={user.isActive ? "outline" : "secondary"} className={user.isActive ? "border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-normal" : "font-normal"}>
                      {user.isActive ? "Aktif" : "Pasif"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers?.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            Kullanıcı bulunamadı.
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Kullanıcı Yetkilendir</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Windows Kullanıcı Adı</label>
              <Input 
                placeholder="Örn: metin.salik" 
                value={newUser.username} 
                onChange={e => setNewUser({...newUser, username: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tam İsim</label>
              <Input 
                placeholder="Örn: Metin Salık" 
                value={newUser.fullName} 
                onChange={e => setNewUser({...newUser, fullName: e.target.value})}
                required
              />
            </div>
            <div className="p-4 bg-muted rounded-lg border mt-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1.5 align-text-bottom text-foreground" />
                Yeni kullanıcılar varsayılan olarak "Uzman" rolüyle oluşturulur. Diğer roller ve tesis atamaları düzenleme ekranından yapılabilir.
              </p>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Vazgeç</Button>
              <Button type="submit" disabled={authorizeMutation.isPending}>
                {authorizeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Yetkilendir
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
