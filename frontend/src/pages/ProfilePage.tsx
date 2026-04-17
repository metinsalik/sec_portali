import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Building2, Shield, Calendar } from 'lucide-react';

interface Facility {
  id: string;
  name: string;
  dangerClass: string;
  employeeCount: number;
}

export default function ProfilePage() {
  const { user } = useAuth();

  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ['user-facilities', user?.facilities],
    queryFn: async () => {
      if (!user?.facilities?.length) return [];
      const res = await api.get('/settings/facilities');
      if (!res.ok) throw new Error('Tesisler yüklenemedi');
      const all = await res.json();
      return all.filter((f: Facility) => user.facilities.includes(f.id));
    },
    enabled: !!user?.facilities?.length,
  });

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    management: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    user: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Profilim</h1>
        <p className="text-sm text-muted-foreground">Hesap bilgilerinizi görüntüleyin</p>
      </div>

      {/* Temel Bilgiler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5" />
            Kişisel Bilgiler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Kullanıcı Adı</label>
              <p className="font-medium mt-1">{user?.username}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Ad Soyad</label>
              <p className="font-medium mt-1">{user?.fullName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roller */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5" />
            Roller ve Yetkiler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {user?.roles?.map((role) => (
              <Badge
                key={role}
                className={roleColors[role] || 'bg-gray-100 text-gray-700'}
              >
                {role === 'admin' ? 'Yönetici' :
                 role === 'management' ? 'Yönetim' :
                 role === 'user' ? 'Kullanıcı' : role}
              </Badge>
            ))}
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            {user?.isAdmin && <p> Tam yönetici erişiminiz var.</p>}
            {user?.isManagement && <p> Yönetim paneline erişiminiz var.</p>}
            {!user?.isAdmin && !user?.isManagement && <p> Standart kullanıcı erişiminiz var.</p>}
          </div>
        </CardContent>
      </Card>

      {/* Tesisler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5" />
            Erişim Tesisleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          {facilities.length > 0 ? (
            <div className="space-y-2">
              {facilities.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.dangerClass} • {f.employeeCount} çalışan</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Size atanmış tesis bulunamadı.</p>
          )}
        </CardContent>
      </Card>

      {/* Oturum Bilgisi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5" />
            Oturum Bilgisi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Oturumunuz açık. Yetkilendirme token'ınız aktif.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}