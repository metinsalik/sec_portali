import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/lib/api';
import { format } from 'date-fns';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const BinaTuruYillikRaporu = () => {
  const { year } = useParams<{ year: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRapor();
  }, [year]);

  const fetchRapor = async () => {
    try {
      const facilityId = localStorage.getItem('activeFacilityId');
      const res = await api.get(`/bina-turu/yillik-rapor/${year}?facilityId=${facilityId}`);
      setData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data || data.error) {
    return <div className="p-8 text-center text-red-500 font-bold">Rapor bulunamadı veya hata oluştu.</div>;
  }

  const { yilBilgisi, gostergeler, donemTablosu, alanTablosu, anaGrupTablosu, turlarOzeti } = data;

  const formatPercent = (val: number) => Number(val).toFixed(1).replace('.', ',') + '%';

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:py-0 print:bg-white text-sm">
      
      {/* Yazdırma Butonu (Sadece Ekranda Görünür) */}
      <div className="max-w-[210mm] mx-auto mb-4 flex justify-end print:hidden">
        <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
          <Printer className="w-4 h-4 mr-2" /> Yıllık Raporu Yazdır
        </Button>
      </div>

      {/* A4 Kağıt Konteyner */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none print:w-full min-h-[297mm] relative pb-20">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 p-6">
          <div className="w-1/4">
            <img src={yilBilgisi.tesisLogosu} alt="Logo" className="max-h-16 object-contain" />
          </div>
          <div className="w-2/4 text-center">
            <h1 className="text-xl font-black uppercase text-slate-800 tracking-wider">Bina Tesis Turu<br/>{yilBilgisi.yil} Yılı Değerlendirme Raporu</h1>
          </div>
          <div className="w-1/4 text-right text-xs space-y-1 font-medium text-slate-700">
            <p><span className="text-slate-500">Analiz Yılı:</span> {yilBilgisi.yil}</p>
            <p><span className="text-slate-500">Rapor Tarihi:</span> {format(new Date(), 'dd.MM.yyyy')}</p>
            <p><span className="text-slate-500">Tesis:</span> {yilBilgisi.tesisAdi}</p>
          </div>
        </div>

        <div className="p-8 space-y-10">
          
          {/* YÖNETİCİ ÖZETİ (KPI) */}
          <div>
            <h2 className="text-lg font-black text-slate-800 border-b-2 border-slate-800 pb-1 mb-4">1. GENEL PERFORMANS (YÖNETİCİ ÖZETİ)</h2>
            <div className="grid grid-cols-6 gap-2">
              <div className="border border-slate-300 p-3 text-center rounded">
                <div className="text-[10px] text-slate-500 font-bold mb-1">TOPLAM KONTROL</div>
                <div className="text-xl font-black text-slate-800">{gostergeler.toplamSoru}</div>
              </div>
              <div className="border border-slate-300 p-3 text-center rounded bg-green-50">
                <div className="text-[10px] text-green-700 font-bold mb-1">UYGUN</div>
                <div className="text-xl font-black text-green-800">{gostergeler.uygun}</div>
              </div>
              <div className="border border-slate-300 p-3 text-center rounded bg-red-50">
                <div className="text-[10px] text-red-700 font-bold mb-1">UYGUN DEĞİL</div>
                <div className="text-xl font-black text-red-800">{gostergeler.uygunDegil}</div>
              </div>
              <div className="border border-slate-300 p-3 text-center rounded bg-amber-50">
                <div className="text-[10px] text-amber-700 font-bold mb-1">TOPLAM DÖF</div>
                <div className="text-xl font-black text-amber-800">{gostergeler.dfVar}</div>
              </div>
              <div className="border border-slate-300 p-3 text-center rounded bg-slate-800">
                <div className="text-[10px] text-slate-300 font-bold mb-1">GENEL UYGUNLUK</div>
                <div className="text-2xl font-black text-green-400">{formatPercent(gostergeler.uygunlukOrani)}</div>
              </div>
              <div className="border border-slate-300 p-3 text-center rounded">
                <div className="text-[10px] text-slate-500 font-bold mb-1">UYGUNSUZLUK</div>
                <div className="text-2xl font-black text-red-600">{formatPercent(gostergeler.uygunsuzlukOrani)}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* DÖNEMSEL TREND */}
            <div>
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-300 pb-1 mb-3">2. Dönemsel İyileşme Trendi</h2>
              <Table className="border text-xs">
                <TableHeader className="bg-slate-100">
                  <TableRow>
                    <TableHead className="font-bold text-slate-800">Dönem</TableHead>
                    <TableHead className="text-center font-bold text-slate-800">Kontrol</TableHead>
                    <TableHead className="text-center font-bold text-slate-800">Uygunluk %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donemTablosu.map((d: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-bold">{d.donem}. Dönem</TableCell>
                      <TableCell className="text-center">{d.toplam}</TableCell>
                      <TableCell className={`text-center font-bold ${d.uygunlukYuzdesi >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(d.uygunlukYuzdesi)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* ANA GRUP DAĞILIMI */}
            <div>
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-300 pb-1 mb-3">3. Ana Grup Uyum Tablosu</h2>
              <Table className="border text-xs">
                <TableHeader className="bg-slate-100">
                  <TableRow>
                    <TableHead className="font-bold text-slate-800">Kategori</TableHead>
                    <TableHead className="text-center font-bold text-slate-800 text-red-700">İhlal</TableHead>
                    <TableHead className="text-center font-bold text-slate-800">Uyum %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anaGrupTablosu.slice(0, 5).map((g: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium truncate max-w-[150px]" title={g.ad}>{g.ad}</TableCell>
                      <TableCell className="text-center font-bold text-red-600">{g.uygunDegil}</TableCell>
                      <TableCell className="text-center font-bold">{formatPercent(g.uygunlukYuzdesi)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* EN RİSKLİ ALANLAR */}
          <div>
            <h2 className="text-base font-bold text-red-700 border-b border-red-200 pb-1 mb-3 uppercase">4. En Çok Uygunsuzluk Görülen Alanlar (İlk 10)</h2>
            <Table className="border text-xs border-red-100">
              <TableHeader className="bg-red-50">
                <TableRow>
                  <TableHead className="font-bold text-red-900">Denetlenecek Alan</TableHead>
                  <TableHead className="text-center font-bold text-red-900">Toplam Kontrol</TableHead>
                  <TableHead className="text-center font-bold text-red-900">Uygunsuzluk Sayısı</TableHead>
                  <TableHead className="text-center font-bold text-red-900">Alan Uyum Oranı</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alanTablosu.map((a: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-bold text-slate-800">{a.ad}</TableCell>
                    <TableCell className="text-center">{a.toplam}</TableCell>
                    <TableCell className="text-center font-black text-red-600">{a.uygunDegil}</TableCell>
                    <TableCell className="text-center font-bold text-slate-700">{formatPercent(a.uygunlukYuzdesi)}</TableCell>
                  </TableRow>
                ))}
                {alanTablosu.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center py-4 text-slate-500">Yıl boyunca kaydedilmiş bir uygunsuzluk bulunamadı.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* GERÇEKLEŞEN TURLAR / KATILIM */}
          <div className="print:break-after-auto">
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-300 pb-1 mb-3">5. Gerçekleştirilen Denetim Turları ({turlarOzeti.length} Tur)</h2>
            <div className="grid grid-cols-2 gap-4">
              {turlarOzeti.map((tur: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-2 border rounded bg-slate-50 text-xs">
                  <div>
                    <div className="font-bold text-slate-800 line-clamp-1">{tur.ad}</div>
                    <div className="text-[10px] text-slate-500">{format(new Date(tur.baslangicTarihi), 'dd.MM.yyyy')} - {tur.donem}. Dönem</div>
                  </div>
                  <div className={`font-black px-2 py-1 rounded ${tur.uygunlukYuzdesi >= 80 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {formatPercent(tur.uygunlukYuzdesi)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* İMZALAR */}
          <div className="mt-16 pt-8 print:break-inside-avoid">
            <div className="flex justify-between items-end px-12">
              <div className="text-center w-48">
                <div className="border-b border-slate-800 pb-12 mb-2"></div>
                <p className="font-bold text-sm text-slate-800">Kalite Birimi</p>
                <p className="text-[10px] text-slate-500">Onay</p>
              </div>
              <div className="text-center w-48">
                <div className="border-b border-slate-800 pb-12 mb-2"></div>
                <p className="font-bold text-sm text-slate-800">Hastane Yönetimi</p>
                <p className="text-[10px] text-slate-500">Onay</p>
              </div>
            </div>
          </div>
          
        </div>

        {/* YAZDIRMA FOOTER (Her sayfada alta sabitlenir) */}
        <div className="hidden print:flex fixed bottom-0 left-0 right-0 bg-white pt-2 pb-4 border-t border-slate-800 justify-between items-center text-[10px] font-bold text-slate-600 px-8 z-50">
          <span>TEK-F007-02</span>
        </div>

        {/* EKRAN FOOTER (Sadece ekranda görünür) */}
        <div className="print:hidden absolute bottom-0 left-0 right-0 border-t border-slate-200 p-4 flex justify-between items-center text-[10px] font-bold text-slate-500">
          <span>TEK-F007-02</span>
        </div>

      </div>

      <style>{`
        @media print {
          @page {
            margin-bottom: 20mm;
          }
        }
      `}</style>
    </div>
  );
};

export default BinaTuruYillikRaporu;
