import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const api = {
  get: async (url: string) => {
    const res = await fetch(`/api${url}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    if (!res.ok) throw new Error('API Error');
    return res;
  }
};

const getFineKinneyResult = (score: number) => {
  if (score > 400) return { label: 'Tolerans Gösterilemez Risk', color: 'bg-red-600 text-white', points: 5 };
  if (score > 200) return { label: 'Yüksek Risk', color: 'bg-red-500 text-white', points: 4 };
  if (score > 70) return { label: 'Önemli Risk', color: 'bg-orange-500 text-white', points: 3 };
  if (score > 20) return { label: 'Olası Risk', color: 'bg-yellow-500 text-black', points: 2 };
  return { label: 'Önemsiz Risk', color: 'bg-green-500 text-white', points: 1 };
};

export default function EyewashRiskAnalysisViewPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const facilityId = localStorage.getItem('activeFacilityId');

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['eyewash-risk', facilityId],
    queryFn: async () => {
      const res = await api.get(`/hazmat/eyewash-risk?facilityId=${facilityId}`);
      return res.json();
    },
    enabled: !!facilityId && !!id,
  });

  const data = analyses?.find((x: any) => x.id === id);

  if (isLoading) return <div className="p-6">Yükleniyor...</div>;
  if (!data) return <div className="p-6">Analiz bulunamadı.</div>;

  const chemRes = getFineKinneyResult(data.chemScore || 0);
  const bioRes = getFineKinneyResult(data.bioScore || 0);

  const renderRequirementLevel = () => {
    const level = data.eyewashRequirementLevel || 'Düşük Riskli Alanlar';
    let colorClass = 'bg-green-100 text-green-950 border-green-300 dark:bg-green-950/50 dark:text-green-200 dark:border-green-800';
    let desc = 'Yeterli sayıda Göz Solüsyonu bulunmalıdır. Koruyucu ekipman kullanımı zorunlu değildir.';
    
    if (level === 'Yüksek Riskli Alanlar') {
      colorClass = 'bg-red-100 text-red-950 border-red-300 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800';
      desc = 'Şebekeye bağlı en az bir Göz Duşu İstasyonu bulunmalıdır. Çalışanlar ve ziyaretçiler için koruyucu ekipman (gözlük, eldiven, önlük) kullanımı zorunludur.';
    } else if (level === 'Orta Riskli Alanlar') {
      colorClass = 'bg-yellow-100 text-yellow-950 border-yellow-300 dark:bg-yellow-950/50 dark:text-yellow-200 dark:border-yellow-800';
      desc = 'Şebekeye bağlı bir Göz Duşu veya yeterli Göz Solüsyonu bulunmalıdır. Asgari koruyucu gözlük zorunludur.';
    }

    return (
      <div className={cn("p-4 rounded-xl border-2", colorClass)}>
        <div className="font-bold text-xl">{level}</div>
        <div className="text-base mt-2 opacity-90 leading-relaxed">{desc}</div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/hazmat/eyewash-risk')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Risk Analizi Detayları</h1>
            <p className="text-muted-foreground">{data.department} Departmanı Göz Duşu İhtiyacı Analiz Raporu</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => window.print()} className="hidden md:flex">
          <Printer className="w-4 h-4 mr-2" />
          Yazdır
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-8 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-6 rounded-xl border border-border/50">
            <div><span className="font-semibold text-muted-foreground block text-sm mb-1">Departman</span> <div className="text-lg font-medium">{data.department || '-'}</div></div>
            <div><span className="font-semibold text-muted-foreground block text-sm mb-1">Analiz Tarihi</span> <div className="text-lg font-medium">{new Date(data.analysisDate).toLocaleDateString('tr-TR')}</div></div>
            <div><span className="font-semibold text-muted-foreground block text-sm mb-1">Alan Yüz Ölçümü (m²)</span> <div className="text-lg font-medium">{data.areaSquareMeters || '-'}</div></div>
            <div><span className="font-semibold text-muted-foreground block text-sm mb-1">Personel Sayısı (Maks)</span> <div className="text-lg font-medium">{data.maxPersonnel || '-'}</div></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 border rounded-xl p-6 border-l-4 border-l-blue-500 bg-card">
              <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-400">Kimyasal Dökülme Saçılma Risk Puanı</h3>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-black">{data.chemScore || 0}</div>
                <Badge className={cn("text-sm px-3 py-1", chemRes.color)}>{chemRes.label}</Badge>
              </div>
            </div>
            <div className="space-y-4 border rounded-xl p-6 border-l-4 border-l-rose-500 bg-card">
              <h3 className="font-semibold text-lg text-rose-700 dark:text-rose-400">Biyolojik Dökülme Saçılma Risk Puanı</h3>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-black">{data.bioScore || 0}</div>
                <Badge className={cn("text-sm px-3 py-1", bioRes.color)}>{bioRes.label}</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-muted/30 p-6 rounded-xl border border-border/50">
            <h3 className="text-xl font-bold">Göz Duşu İhtiyacı Bakımından Risk Seviyesi Sonucu</h3>
            {renderRequirementLevel()}
          </div>

          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <h4 className="font-bold text-lg border-b pb-2">Genel Değerlendirme</h4>
              <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed bg-muted/10 p-4 rounded-lg border">{data.evaluationNotes || 'Belirtilmemiş.'}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-bold text-lg border-b pb-2">Aksiyon Planı</h4>
              <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed bg-muted/10 p-4 rounded-lg border">{data.actionPlan || 'Belirtilmemiş.'}</p>
            </div>
          </div>

          <div className="border-t pt-8 space-y-6">
            <h3 className="font-bold text-xl text-primary">İyileştirme Takibi ve Etkinlik Ölçümü</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/10 p-6 rounded-xl border border-border/50">
              <div><span className="font-semibold text-muted-foreground block text-sm mb-1">İyileştirme Açıklaması</span> <div className="font-medium">{data.improvementDescription || '-'}</div></div>
              <div><span className="font-semibold text-muted-foreground block text-sm mb-1">Tamamlanma Tarihi</span> <div className="font-medium">{data.improvementTargetDate ? new Date(data.improvementTargetDate).toLocaleDateString('tr-TR') : '-'}</div></div>
              <div><span className="font-semibold text-muted-foreground block text-sm mb-1">Etkinlik Ölçüm Yöntemi</span> <div className="font-medium">{data.effectivenessMethod || '-'}</div></div>
              <div><span className="font-semibold text-muted-foreground block text-sm mb-1">Kontrol Sorumlusu</span> <div className="font-medium">{data.improvementController || '-'}</div></div>
              <div className="col-span-1 md:col-span-2">
                <span className="font-semibold text-muted-foreground block text-sm mb-1">Sonuç</span>
                <p className="font-medium whitespace-pre-wrap">{data.improvementResult || '-'}</p>
              </div>
              {data.improvementImageUrl && (
                <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t">
                  <span className="font-semibold text-muted-foreground block text-sm mb-2">İyileştirme Görseli</span>
                  <a href={data.improvementImageUrl} target="_blank" rel="noreferrer">
                    <img src={data.improvementImageUrl} alt="İyileştirme" className="h-48 object-contain rounded border bg-white p-1 hover:opacity-90 transition-opacity" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
