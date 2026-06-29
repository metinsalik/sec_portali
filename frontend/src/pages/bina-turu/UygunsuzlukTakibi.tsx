import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, ClipboardList, Clock, AlertCircle, Calendar, FileText, BarChart3, Building2, Users } from 'lucide-react';
import DetayliAnaliz from '@/components/bina-turu/DetayliAnaliz';

const UygunsuzlukTakibi = () => {
  const [uygunsuzluklar, setUygunsuzluklar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Drill-down State
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [selectedTurId, setSelectedTurId] = useState<number | null>(null);

  // Modal State
  const [selectedUygunsuzluk, setSelectedUygunsuzluk] = useState<any>(null);
  const [modalType, setModalType] = useState<'ATAMA' | 'KAPATMA' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Aşama 1 State (Atama)
  const [birimler, setBirimler] = useState<any[]>([]);
  const [seciliBirimler, setSeciliBirimler] = useState<number[]>([]);

  // Aşama 2 State (Kapatma)
  const [dofTakipNo, setDofTakipNo] = useState('');
  const [kapatmaKaniti, setKapatmaKaniti] = useState('');
  const [kapatmaDosya, setKapatmaDosya] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
    const handleFacilityChange = () => fetchData();
    window.addEventListener('facilityChanged', handleFacilityChange);
    return () => window.removeEventListener('facilityChanged', handleFacilityChange);
  }, []);

  const fetchData = async () => {
    const facilityId = localStorage.getItem('activeFacilityId');
    if (!facilityId) {
      setLoading(false);
      return;
    }

    try {
      const [uygRes, birimRes] = await Promise.all([
        api.get(`/bina-turu/uygunsuzluklar?facilityId=${facilityId}`),
        api.get(`/bina-turu/ayarlar/sorumlu-birim?facilityId=${facilityId}`)
      ]);
      setUygunsuzluklar(await uygRes.json());
      setBirimler(await birimRes.json());
    } catch (err) {
      toast.error('Veriler alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  const openAtamaModal = (uyg: any) => {
    setSelectedUygunsuzluk(uyg);
    setSeciliBirimler(uyg.sorumluBirimler?.map((b: any) => b.id) || []);
    setModalType('ATAMA');
    setIsModalOpen(true);
  };

  const openKapatmaModal = (uyg: any) => {
    setSelectedUygunsuzluk(uyg);
    setDofTakipNo(uyg.dofTakipNo || '');
    setKapatmaKaniti(uyg.kapatmaKaniti || '');
    setKapatmaDosya(null);
    setModalType('KAPATMA');
    setIsModalOpen(true);
  };

  const handleAtamaYap = async () => {
    if (!selectedUygunsuzluk) return;
    if (seciliBirimler.length === 0) {
      toast.error('En az bir sorumlu birim seçmelisiniz.');
      return;
    }

    try {
      await api.put(`/bina-turu/uygunsuzluklar/${selectedUygunsuzluk.id}`, {
        sorumluBirimIds: seciliBirimler
      });
      toast.success('Atama yapıldı, uygunsuzluk durumu "Devam Ediyor" oldu.');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Hata oluştu.');
    }
  };

  const handleKapat = async () => {
    if (!selectedUygunsuzluk) return;

    try {
      const formData = new FormData();
      formData.append('dofTakipNo', dofTakipNo);
      if (kapatmaKaniti) formData.append('kapatmaKaniti', kapatmaKaniti);
      if (kapatmaDosya) formData.append('kanitDosyalari', kapatmaDosya);

      await api.customFetch(`/bina-turu/uygunsuzluklar/${selectedUygunsuzluk.id}/kapat`, {
        method: 'PUT',
        body: formData
      });
      toast.success('Uygunsuzluk başarıyla kapatıldı.');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      const errorMsg = await err.response?.json();
      toast.error(errorMsg?.error || 'Hata oluştu.');
    }
  };

  if (loading) return <div className="p-4 flex justify-center"><Clock className="w-6 h-6 animate-spin text-slate-400" /></div>;

  // Grup by Tur
  const groupedByTur = uygunsuzluklar.reduce((acc, uyg) => {
    const turId = uyg.turId;
    if (!acc[turId]) {
      acc[turId] = { tur: uyg.tur, uygunsuzluklar: [] };
    }
    acc[turId].uygunsuzluklar.push(uyg);
    return acc;
  }, {} as Record<number, { tur: any, uygunsuzluklar: any[] }>);

  const turListesi = Object.values(groupedByTur).sort((a, b) => new Date(b.tur.baslangicTarihi).getTime() - new Date(a.tur.baslangicTarihi).getTime());

  // Veriyi Yıl ve Döneme göre gruplama
  const toursByYearAndPeriod = turListesi.reduce((acc, item: any) => {
    const date = new Date(item.tur.baslangicTarihi);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    let period = 1;
    if (month >= 4 && month <= 6) period = 2;
    else if (month >= 7 && month <= 9) period = 3;
    else if (month >= 10 && month <= 12) period = 4;

    if (!acc[year]) acc[year] = { tours: [], periods: {} };
    if (!acc[year].periods[period]) acc[year].periods[period] = [];
    
    acc[year].tours.push(item);
    acc[year].periods[period].push(item);
    return acc;
  }, {} as Record<number, any>);

  const sortedYears = Object.keys(toursByYearAndPeriod).map(Number).sort((a, b) => b - a);

  // LEVEL 1: YILLAR
  if (selectedYear === null) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Uygunsuzluk Takibi (Yıllık)</h1>
            <p className="text-slate-500">DÖF ve uygunsuzluk kayıtlarını yıllara göre inceleyin.</p>
          </div>
        </div>

        {sortedYears.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed rounded-xl border-slate-200">
            <p className="text-slate-500 font-medium mb-4">Şu an için kaydedilmiş bir uygunsuzluk bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedYears.map(year => {
              const yearData = toursByYearAndPeriod[year];
              let totalDof = 0;
              yearData.tours.forEach((t:any) => totalDof += t.uygunsuzluklar.length);

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
                      <p className="text-sm font-medium text-slate-500 mt-1">Yıllık DÖF Analizi</p>
                    </div>
                    <div className="bg-slate-100 px-4 py-2 rounded-lg mt-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-bold text-slate-700">{totalDof} Toplam DÖF</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // LEVEL 2: DÖNEMLER
  if (selectedPeriod === null) {
    const periods = toursByYearAndPeriod[selectedYear].periods;
    const sortedPeriods = Object.keys(periods).map(Number).sort((a, b) => b - a);

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <div className="flex items-center border-b border-slate-200 pb-4 gap-4">
          <Button variant="ghost" onClick={() => setSelectedYear(null)} className="h-10 w-10 p-0 rounded-full hover:bg-slate-200">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{selectedYear} Yılı DÖF Analizleri</h1>
            <p className="text-slate-500">Dönem bazlı detaylar için bir dönem seçin.</p>
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-700 mt-6 mb-4">Dönemler</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {sortedPeriods.map(period => {
            let totalDof = 0;
            periods[period].forEach((t:any) => totalDof += t.uygunsuzluklar.length);

            return (
              <Card 
                key={period} 
                className="cursor-pointer hover:border-green-400 hover:shadow-md transition-all"
                onClick={() => setSelectedPeriod(period)}
              >
                <CardContent className="p-6 text-center space-y-2">
                  <h3 className="text-2xl font-black text-slate-800">{period}. Dönem</h3>
                  <p className="text-sm font-medium text-slate-500">{totalDof} DÖF Bulunuyor</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Yıl Analiz Yeri */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">{selectedYear} Yılı Detaylı Analizi</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 font-bold"
                onClick={() => window.open(`/bina-turu/uygunsuzluk-yillik-rapor/${selectedYear}`, '_blank')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Yıllık Uygunsuzluk Raporu
              </Button>
              <Button 
                variant="outline" 
                className="text-indigo-700 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 font-bold"
                onClick={() => window.open(`/bina-turu/yillik-rapor/${selectedYear}`, '_blank')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Yıllık Tur Raporu
              </Button>
            </div>
          </div>
          <DetayliAnaliz year={selectedYear} />
        </div>
      </div>
    );
  }

  // LEVEL 3: TURLAR
  if (selectedTurId === null) {
    const periodTours = toursByYearAndPeriod[selectedYear].periods[selectedPeriod] || [];

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <div className="flex items-center border-b border-slate-200 pb-4 gap-4">
          <Button variant="ghost" onClick={() => setSelectedPeriod(null)} className="h-10 w-10 p-0 rounded-full hover:bg-slate-200">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{selectedYear} - {selectedPeriod}. Dönem DÖF Kayıtları</h1>
            <p className="text-slate-500">Bu döneme ait analizler ve denetim turlarının uygunsuzlukları.</p>
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-700 mt-6 mb-4">Gerçekleştirilen Turlar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {periodTours.map((item: any) => {
            const acik = item.uygunsuzluklar.filter((u:any) => u.durum === 'ACIK').length;
            const devam = item.uygunsuzluklar.filter((u:any) => u.durum === 'DEVAM_EDIYOR').length;
            const kapali = item.uygunsuzluklar.filter((u:any) => u.durum === 'KAPALI').length;
            const total = item.uygunsuzluklar.length;

            return (
              <Card 
                key={item.tur.id} 
                className="cursor-pointer hover:border-blue-300 hover:shadow-md transition-all border-slate-200"
                onClick={() => setSelectedTurId(item.tur.id)}
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{item.tur.ad}</h3>
                      <p className="text-xs font-medium text-slate-500">
                        Denetim Tarihi: {format(new Date(item.tur.baslangicTarihi), 'dd.MM.yyyy')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="bg-slate-50">{total} DÖF</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 p-0 h-auto font-bold text-xs" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          window.open(`/bina-turu/rapor/${item.tur.id}`, '_blank'); 
                        }}
                      >
                        Rapor Al
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 text-xs font-medium">
                    <div className="flex-1 bg-red-50 text-red-700 px-3 py-2 rounded-md border border-red-100 flex justify-between">
                      <span>Atanmadı</span>
                      <span className="font-bold">{acik}</span>
                    </div>
                    <div className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-md border border-blue-100 flex justify-between">
                      <span>Devam</span>
                      <span className="font-bold">{devam}</span>
                    </div>
                    <div className="flex-1 bg-green-50 text-green-700 px-3 py-2 rounded-md border border-green-100 flex justify-between">
                      <span>Kapalı</span>
                      <span className="font-bold">{kapali}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Dönem Analiz Yeri */}
        <div className="mt-8 border-t pt-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">{selectedPeriod}. Dönem Detaylı Analizi</h2>
          <DetayliAnaliz year={selectedYear} period={selectedPeriod} />
        </div>
      </div>
    );
  }

  // LEVEL 4: KANBAN BOARD
  const activeTurData = groupedByTur[selectedTurId];
  if (!activeTurData) {
    setSelectedTurId(null);
    return null;
  }

  const columns = {
    ACIK: activeTurData.uygunsuzluklar.filter(u => u.durum === 'ACIK'),
    DEVAM_EDIYOR: activeTurData.uygunsuzluklar.filter(u => u.durum === 'DEVAM_EDIYOR'),
    KAPALI: activeTurData.uygunsuzluklar.filter(u => u.durum === 'KAPALI')
  };

  const KanbanCard = ({ uyg, type }: { uyg: any, type: string }) => (
    <div 
      className={`bg-white p-3 rounded-lg border shadow-sm transition-all ${type === 'ACIK' ? 'cursor-pointer hover:border-red-400 hover:shadow-md' : type === 'DEVAM_EDIYOR' ? 'cursor-pointer hover:border-blue-400 hover:shadow-md' : 'border-green-200'}`}
      onClick={() => {
        if (type === 'ACIK') openAtamaModal(uyg);
        if (type === 'DEVAM_EDIYOR') openKapatmaModal(uyg);
      }}
    >
      <div className="flex items-start gap-2 mb-2">
        <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${type === 'ACIK' ? 'text-red-500' : type === 'DEVAM_EDIYOR' ? 'text-blue-500' : 'text-green-500'}`} />
        <p className="text-xs font-semibold text-slate-700 leading-snug line-clamp-2">
          {uyg.cevap?.turSorusu?.soru?.kriter || 'Belirtilmedi'}
        </p>
      </div>
      {uyg.cevap?.aciklama && (
        <div className="bg-slate-50 p-2 rounded text-[11px] text-slate-600 border border-slate-100 mb-2 line-clamp-2">
          {uyg.cevap.aciklama}
        </div>
      )}
      
      {type === 'DEVAM_EDIYOR' && (
        <div className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block font-medium">
          Sorumlu: {uyg.sorumluBirimler?.map((b: any) => b.ad).join(', ') || 'Atanmamış'}
        </div>
      )}

      {type === 'KAPALI' && (
        <div className="text-[10px] space-y-1 mt-2">
          <div className="bg-green-50 text-green-700 px-2 py-1 rounded inline-block font-medium border border-green-100">
            Takip No: {uyg.dofTakipNo}
          </div>
          {uyg.kapatmaTarihi && (
            <div className="text-slate-400 font-medium">
              Kapatıldı: {format(new Date(uyg.kapatmaTarihi), 'dd.MM.yyyy')}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#F8FAFC]">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedTurId(null)} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">{activeTurData.tur.ad} DÖF Takibi</h1>
            <p className="text-xs font-medium text-slate-500">Tarih: {format(new Date(activeTurData.tur.baslangicTarihi), 'dd.MM.yyyy')} | {selectedYear} - {selectedPeriod}. Dönem</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 font-bold h-9"
          onClick={() => window.open(`/bina-turu/uygunsuzluk-rapor/${selectedTurId}`, '_blank')}
        >
          <FileText className="w-4 h-4 mr-2" />
          Uygunsuzluk ve Aksiyon Raporu
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-4 md:p-6">
        <div className="flex gap-6 min-w-max h-full">
          
          {/* ACIK Column */}
          <div className="w-80 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Atanmadı
              </h3>
              <Badge variant="outline" className="bg-white">{columns.ACIK.length}</Badge>
            </div>
            <div className="bg-slate-100/50 p-2.5 rounded-xl border border-slate-200/60 flex-1 overflow-y-auto space-y-2.5 custom-scrollbar">
              {columns.ACIK.map(u => <KanbanCard key={u.id} uyg={u} type="ACIK" />)}
              {columns.ACIK.length === 0 && <div className="text-center p-4 text-xs text-slate-400 font-medium">Bu sütunda kayıt yok</div>}
            </div>
          </div>

          {/* DEVAM_EDIYOR Column */}
          <div className="w-80 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Devam Ediyor
              </h3>
              <Badge variant="outline" className="bg-white">{columns.DEVAM_EDIYOR.length}</Badge>
            </div>
            <div className="bg-slate-100/50 p-2.5 rounded-xl border border-slate-200/60 flex-1 overflow-y-auto space-y-2.5 custom-scrollbar">
              {columns.DEVAM_EDIYOR.map(u => <KanbanCard key={u.id} uyg={u} type="DEVAM_EDIYOR" />)}
              {columns.DEVAM_EDIYOR.length === 0 && <div className="text-center p-4 text-xs text-slate-400 font-medium">Bu sütunda kayıt yok</div>}
            </div>
          </div>

          {/* KAPALI Column */}
          <div className="w-80 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Tamamlandı
              </h3>
              <Badge variant="outline" className="bg-white">{columns.KAPALI.length}</Badge>
            </div>
            <div className="bg-slate-100/50 p-2.5 rounded-xl border border-slate-200/60 flex-1 overflow-y-auto space-y-2.5 custom-scrollbar">
              {columns.KAPALI.map(u => <KanbanCard key={u.id} uyg={u} type="KAPALI" />)}
              {columns.KAPALI.length === 0 && <div className="text-center p-4 text-xs text-slate-400 font-medium">Bu sütunda kayıt yok</div>}
            </div>
          </div>

        </div>
      </div>

      {/* MODALS */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modalType === 'ATAMA' ? 'Sorumlu Birim Ata' : 'Uygunsuzluğu Kapat'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedUygunsuzluk && (
            <div className="space-y-5 mt-2">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-1">Soru</p>
                <p className="text-sm font-semibold text-slate-800 leading-snug mb-3">
                  {selectedUygunsuzluk.cevap?.turSorusu?.soru?.kriter}
                </p>
                <p className="text-xs text-slate-500 font-medium mb-1">Tespit Edilen Uygunsuzluk</p>
                <p className="text-sm font-semibold text-red-600 leading-snug">
                  {selectedUygunsuzluk.cevap?.aciklama || 'Açıklama girilmemiş.'}
                </p>
              </div>

              {modalType === 'ATAMA' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wider">Sorumlu Birimler</label>
                    <div className="border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 bg-white custom-scrollbar">
                      {birimler.map(b => (
                        <div key={b.id} className="flex items-center space-x-2 p-1 hover:bg-slate-50 rounded">
                          <Checkbox 
                            id={`b-${b.id}`} 
                            checked={seciliBirimler.includes(b.id)}
                            onCheckedChange={(c) => {
                              setSeciliBirimler(p => c ? [...p, b.id] : p.filter(id => id !== b.id));
                            }}
                          />
                          <label htmlFor={`b-${b.id}`} className="text-sm font-medium text-slate-700 cursor-pointer">{b.ad}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleAtamaYap} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white">
                    Atamayı Kaydet ve Başlat
                  </Button>
                </div>
              )}

              {modalType === 'KAPATMA' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">DÖF Takip Numarası (Opsiyonel)</label>
                    <Input 
                      value={dofTakipNo} 
                      onChange={e => setDofTakipNo(e.target.value)} 
                      placeholder="Örn: DOF-2024-001"
                      className="bg-white border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Kapatma Açıklaması (Opsiyonel)</label>
                    <Textarea 
                      value={kapatmaKaniti} 
                      onChange={e => setKapatmaKaniti(e.target.value)} 
                      placeholder="Yapılan düzeltici işlemler..."
                      className="bg-white border-slate-200 resize-none h-20 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Kanıt Fotoğrafı / Doküman (Opsiyonel)</label>
                    <Input 
                      type="file" 
                      onChange={e => setKapatmaDosya(e.target.files?.[0] || null)} 
                      className="bg-white border-slate-200 text-sm cursor-pointer"
                    />
                  </div>
                  <Button onClick={handleKapat} className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-bold">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Kapat
                  </Button>
                </div>
              )}

            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default UygunsuzlukTakibi;
