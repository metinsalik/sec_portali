import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, Search, User as UserIcon, ShieldCheck, Building, Save, Loader2 } from 'lucide-react';

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
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="İsim veya kullanıcı adına göre ara..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="bg-slate-900" onClick={() => setIsModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Kullanıcı Yetkilendir
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Kullanıcı</th>
              <th className="px-6 py-4">Roller</th>
              <th className="px-6 py-4">Tesisler</th>
              <th className="px-6 py-4">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers?.map((user) => (
              <tr key={user.username} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{user.fullName}</div>
                      <div className="text-xs text-slate-500">{user.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map(r => (
                      <Badge key={r.role.name} variant="outline" className="bg-slate-50 border-slate-200">
                        {r.role.name}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {user.facilities.map(f => (
                      <Badge key={f.facilityId} variant="secondary">
                        {f.facilityId}
                      </Badge>
                    ))}
                    {user.facilities.length === 0 && <span className="text-slate-400">Atama yok</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={user.isActive ? "success" : "secondary"}>
                    {user.isActive ? "Aktif" : "Pasif"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers?.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            Kullanıcı bulunamadı.
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcı Yetkilendir</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500">
                <ShieldCheck className="w-3 h-3 inline mr-1" />
                Yeni kullanıcılar varsayılan olarak "Uzman" rolüyle oluşturulur. Diğer roller ve tesis atamaları düzenleme ekranından yapılabilir.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Vazgeç</Button>
              <Button type="submit" disabled={authorizeMutation.isPending} className="bg-slate-900 text-white">
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
