import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, FolderTree, Plus, ChevronRight } from 'lucide-react';

const DefinitionsPage = () => {
  const categories = [
    { name: 'Elektrik Güvenliği', sub: ['Pano Kontrolü', 'Topraklama', 'LOTO'] },
    { name: 'Yüksekte Çalışma', sub: ['Yaşam Hatları', 'İskele Kayıtları', 'Emniyet Kemerleri'] },
    { name: 'Kişisel Koruyucu Donanım', sub: ['Baret', 'İş Ayakkabısı', 'Gözlük'] },
  ];

  const departments = ['Üretim', 'Lojistik', 'Bakım Onarım', 'İdari İşler', 'Kalite'];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-blue-600" /> Kategori Hiyerarşisi
            </h2>
            <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" /> Yeni Kategori</Button>
          </div>
          <div className="space-y-3">
            {categories.map((cat) => (
              <Card key={cat.name} className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-slate-900">{cat.name}</span>
                    <Badge variant="secondary">{cat.sub.length} Alt Kategori</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {cat.sub.map(s => <span key={s} className="bg-slate-50 px-2 py-1 rounded border border-slate-100">{s}</span>)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" /> Departmanlar
            </h2>
            <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" /> Yeni Departman</Button>
          </div>
          <Card className="border-slate-200">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {departments.map((dept) => (
                  <div key={dept} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                    <span className="text-sm font-medium text-slate-700">{dept}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default DefinitionsPage;
