import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, Printer } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const api = {
  get: async (url: string) => {
    const res = await fetch(`/api${url}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    if (!res.ok) throw new Error('API Error');
    return res;
  },
  delete: async (url: string) => {
    const res = await fetch(`/api${url}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    if (!res.ok) throw new Error('API Error');
    return res;
  }
};

const getFineKinneyResult = (score: number) => {
  if (score > 400) return { label: 'Tolerans Gösterilemez Risk', color: 'bg-red-600 text-white' };
  if (score > 200) return { label: 'Yüksek Risk', color: 'bg-red-500 text-white' };
  if (score > 70) return { label: 'Önemli Risk', color: 'bg-orange-500 text-white' };
  if (score > 20) return { label: 'Olası Risk', color: 'bg-yellow-500 text-black' };
  return { label: 'Önemsiz Risk', color: 'bg-green-500 text-white' };
};

export default function EyewashRiskAnalysisPage() {
  const navigate = useNavigate();
  const facilityId = localStorage.getItem('activeFacilityId');
  const queryClient = useQueryClient();
  const [viewItem, setViewItem] = useState<any>(null);

  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ['eyewash-risk', facilityId],
    queryFn: async () => {
      const res = await api.get(`/hazmat/eyewash-risk?facilityId=${facilityId}`);
      return res.json();
    },
    enabled: !!facilityId
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/hazmat/eyewash-risk/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eyewash-risk'] });
      toast.success('Başarıyla silindi');
    }
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Göz Yıkama / Boy Duşu Risk Analizi</h1>
          <p className="text-muted-foreground">Departman bazlı risk analizi ve göz duşu ihtiyacı belirleme ekranı</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/hazmat/eyewash-risk/report')}>
            <Printer className="w-4 h-4 mr-2" /> Rapor Oluştur
          </Button>
          <Button onClick={() => navigate('/hazmat/eyewash-risk/new')}>
            <Plus className="w-4 h-4 mr-2" /> Yeni Analiz
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="py-4">
            <CardTitle className="text-lg">Yüksek Riskli Alanlar</CardTitle>
            <CardDescription>Şebekeye bağlı en az bir Göz Duşu zorunlu</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analyses.filter((a:any) => a.eyewashRequirementLevel === 'Yüksek Riskli Alanlar').length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="py-4">
            <CardTitle className="text-lg">Orta Riskli Alanlar</CardTitle>
            <CardDescription>Şebekeye bağlı göz duşu veya göz solüsyonu</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analyses.filter((a:any) => a.eyewashRequirementLevel === 'Orta Riskli Alanlar').length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="py-4">
            <CardTitle className="text-lg">Düşük Riskli Alanlar</CardTitle>
            <CardDescription>Göz solüsyonu yeterlidir</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analyses.filter((a:any) => a.eyewashRequirementLevel === 'Düşük Riskli Alanlar').length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Risk Analizleri</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground">Yükleniyor...</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 font-medium">
                  <tr>
                    <th className="p-3 border-b">Tarih</th>
                    <th className="p-3 border-b">Departman</th>
                    <th className="p-3 border-b">Kimyasal Dökülme Saçılma Risk Puanı</th>
                    <th className="p-3 border-b">Biyolojik Dökülme Saçılma Risk Puanı</th>
                    <th className="p-3 border-b">İhtiyaç Seviyesi</th>
                    <th className="p-3 border-b text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {analyses.map((item: any) => {
                    const chemRes = getFineKinneyResult(item.chemScore);
                    const bioRes = getFineKinneyResult(item.bioScore);
                    let reqColor = "bg-green-100 text-green-800";
                    if (item.eyewashRequirementLevel === 'Yüksek Riskli Alanlar') reqColor = "bg-red-100 text-red-800";
                    else if (item.eyewashRequirementLevel === 'Orta Riskli Alanlar') reqColor = "bg-yellow-100 text-yellow-800";

                    return (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3">{new Date(item.analysisDate).toLocaleDateString('tr-TR')}</td>
                        <td className="p-3 font-semibold">{item.department}</td>
                        <td className="p-3">
                          <Badge className={chemRes.color}>{item.chemScore} - {chemRes.label}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={bioRes.color}>{item.bioScore} - {bioRes.label}</Badge>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${reqColor}`}>
                            {item.eyewashRequirementLevel}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/hazmat/eyewash-risk/view/${item.id}`)}><Eye className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/hazmat/eyewash-risk/edit/${item.id}`)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => {
                            if (window.confirm('Silmek istediğinize emin misiniz?')) {
                              deleteMutation.mutate(item.id);
                            }
                          }}><Trash2 className="w-4 h-4" /></Button>
                        </td>
                      </tr>
                    )
                  })}
                  {analyses.length === 0 && (
                    <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Henüz kayıtlı analiz bulunmamaktadır.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


