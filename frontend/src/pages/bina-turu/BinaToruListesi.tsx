import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Building2, Users, Play, CheckCircle2, ArrowLeft, Calendar, FileText, BarChart3, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import DetayliAnaliz from '@/components/bina-turu/DetayliAnaliz';

const BinaToruListesi = () => {
  const navigate = useNavigate();
  const [turlar, setTurlar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Drill-down State
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);

  useEffect(() => {
    fetchTurlar();
    const handleFacilityChange = () => fetchTurlar();
    window.addEventListener('facilityChanged', handleFacilityChange);
    return () => window.removeEventListener('facilityChanged', handleFacilityChange);
  }, []);

  const fetchTurlar = async () => {
    const facilityId = localStorage.getItem('activeFacilityId');
    if (!facilityId) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get(`/bina-turu/turler?facilityId=${facilityId}`);
      setTurlar(await res.json());
    } catch (err) {
      toast.error('Turlar alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTour = async (id: number) => {
    if (!window.confirm('Bu turu silmek istediğininize emin misiniz? Tüm cevaplar ve eşleşmeler kaybolacaktır.')) return;
    try {
      const res = await api.delete(`/bina-turu/turler/${id}`);
      if (res.ok) {
        toast.success('Tur başarıyla silindi.');
        fetchTurlar();
      } else {
        toast.error('Tur silinirken hata oluştu.');
      }
    } catch (err) {
      toast.error('Tur silinirken hata oluştu.');
    }
  };

  const getDurumBadge = (durum: string) => {
    switch (durum) {
      case 'TASLAK': return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Taslak</span>;
      case 'AKTIF': return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Devam Ediyor</span>;
      case 'TAMAMLANDI': return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Tamamlandı</span>;
      default: return null;
    }
  };

  if (loading) return <div className="p-4 flex justify-center text-slate-500">Yükleniyor...</div>;

  // Veriyi Yıl ve Döneme göre gruplama
  const toursByYearAndPeriod = turlar.reduce((acc, tur: any) => {
    const date = new Date(tur.baslangicTarihi);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    let period = 1;
    if (month >= 4 && month <= 6) period = 2;
    else if (month >= 7 && month <= 9) period = 3;
    else if (month >= 10 && month <= 12) period = 4;

    if (!acc[year]) acc[year] = { tours: [], periods: {} };
    if (!acc[year].periods[period]) acc[year].periods[period] = [];
    
    acc[year].tours.push(tur);
    acc[year].periods[period].push(tur);
    return acc;
  }, {} as Record<number, any>);

  const sortedYears = Object.keys(toursByYearAndPeriod).map(Number).sort((a, b) => b - a);

  // LEVEL 1: YILLAR
  if (selectedYear === null) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Bina Turları (Yıllık)</h1>
            <p className="text-slate-500">Denetim turlarını yıllara göre inceleyin.</p>
          </div>
          <Button onClick={() => navigate('/bina-turu/turler/olustur')}>
            Yeni Tur Oluştur
          </Button>
        </div>

        {sortedYears.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed rounded-xl border-slate-200">
            <p className="text-slate-500 font-medium mb-4">Henüz oluşturulmuş bir bina turu bulunmuyor.</p>
            <Button onClick={() => navigate('/bina-turu/turler/olustur')} variant="outline">İlk Turu Oluştur</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedYears.map(year => {
              const yearData = toursByYearAndPeriod[year];
              return (
                <Card 
                  key={year} 
                  className="cursor-pointer hover:border-blue-400 hover:shadow-lg transition-all"
                  onClick={() => setSelectedYear(year)}
                >
                  <CardContent className="p-8 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                      <Calendar className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-800">{year}</h2>
                      <p className="text-sm font-medium text-slate-500 mt-1">Yıllık Analiz & Turlar</p>
                    </div>
                    <div className="bg-slate-100 px-4 py-2 rounded-lg mt-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-bold text-slate-700">{yearData.tours.length} Toplam Tur</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Tüm Yılların Analizi */}
        {sortedYears.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <BarChart3 className="w-6 h-6 mr-3 text-blue-600" />
              Tüm Yılların Genel Analizi
            </h2>
            <DetayliAnaliz />
          </div>
        )}
      </div>
    );
  }

  // LEVEL 2: DÖNEMLER (ve Yıl Analizleri)
  if (selectedPeriod === null) {
    const periods = toursByYearAndPeriod[selectedYear].periods;
    const sortedPeriods = Object.keys(periods).map(Number).sort((a, b) => b - a);

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setSelectedYear(null)} className="h-10 w-10 p-0 rounded-full hover:bg-slate-200">
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">{selectedYear} Yılı Analizleri</h1>
              <p className="text-slate-500">Dönem bazlı detaylar için bir dönem seçin.</p>
            </div>
          </div>
          <Button onClick={() => navigate('/bina-turu/turler/olustur')}>Yeni Tur Oluştur</Button>
        </div>

        <h3 className="text-xl font-bold text-slate-700 mt-6 mb-4">Dönemler</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {sortedPeriods.map(period => (
            <Card 
              key={period} 
              className="cursor-pointer hover:border-green-400 hover:shadow-md transition-all"
              onClick={() => setSelectedPeriod(period)}
            >
              <CardContent className="p-6 text-center space-y-2">
                <h3 className="text-2xl font-black text-slate-800">{period}. Dönem</h3>
                <p className="text-sm font-medium text-slate-500">{periods[period].length} Tur Bulunuyor</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Yıl Analiz Yeri */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">{selectedYear} Yılı Detaylı Analizi</h2>
            <Button 
              variant="outline" 
              className="text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 font-bold"
              onClick={() => window.open(`/bina-turu/yillik-rapor/${selectedYear}`, '_blank')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Yıllık Rapor Al
            </Button>
          </div>
          <DetayliAnaliz year={selectedYear} />
        </div>
      </div>
    );
  }

  // LEVEL 3: TURLAR (ve Dönem Analizleri)
  const periodTours = toursByYearAndPeriod[selectedYear].periods[selectedPeriod] || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedPeriod(null)} className="h-10 w-10 p-0 rounded-full hover:bg-slate-200">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{selectedYear} - {selectedPeriod}. Dönem Turları</h1>
            <p className="text-slate-500">Bu döneme ait analizler ve denetim turları.</p>
          </div>
        </div>
        <Button onClick={() => navigate('/bina-turu/turler/olustur')}>Yeni Tur Oluştur</Button>
      </div>

      <h3 className="text-xl font-bold text-slate-700 mt-6 mb-4">Gerçekleştirilen Turlar</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {periodTours.map((tur: any) => (
          <Card key={tur.id} className="flex flex-col hover:border-slate-300 transition-all">
            <CardHeader className="pb-3 border-b bg-slate-50/50 rounded-t-xl">
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="text-lg text-slate-800 line-clamp-1" title={tur.ad}>{tur.ad}</CardTitle>
                <div className="flex items-center gap-2">
                  {getDurumBadge(tur.durum)}
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteTour(tur.id)} className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50 ml-1">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-slate-500 font-medium">
                Tarih: {format(new Date(tur.baslangicTarihi), 'dd.MM.yyyy')}
              </p>
            </CardHeader>
            <CardContent className="pt-4 flex-1 flex flex-col">
              
              <div className="space-y-3 text-sm flex-1">
                <div className="flex gap-2">
                  <Building2 className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-700 block">Sorumlu Birimler:</span>
                    <span className="text-slate-500">
                      {tur.sorumluBirimler?.map((b: any) => b.ad).join(', ') || '-'}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Users className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-700 block">Sorumlu Kişiler:</span>
                    <span className="text-slate-500">
                      {tur.sorumluKisiler?.map((k: any) => k.ad).join(', ') || '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-auto">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded">
                    Toplam Soru: {tur._count?.turSorulari || 0}
                  </span>
                </div>
                
                {tur.durum !== 'TAMAMLANDI' ? (
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11" 
                    onClick={() => navigate(`/bina-turu/denetim/${tur.id}`)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {tur.durum === 'TASLAK' ? 'Denetime Başla' : 'Denetime Devam Et'}
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 font-bold h-11"
                    onClick={() => window.open(`/bina-turu/rapor/${tur.id}`, '_blank')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Raporu Görüntüle / Yazdır
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dönem Analiz Yeri */}
      <div className="mt-8 border-t pt-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">{selectedPeriod}. Dönem Detaylı Analizi</h2>
        <DetayliAnaliz year={selectedYear} period={selectedPeriod} />
      </div>
    </div>
  );
};

export default BinaToruListesi;
