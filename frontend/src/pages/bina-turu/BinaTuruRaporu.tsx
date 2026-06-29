import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api, { BASE_URL } from '@/lib/api';
import { format } from 'date-fns';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const BinaTuruRaporu = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRapor();
  }, [id]);

  const getPhotoUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) return `${BASE_URL}${url}`;
    if (url.startsWith('uploads')) return `${BASE_URL}/${url}`;
    return `${BASE_URL}/uploads/${url}`;
  };

  const fetchRapor = async () => {
    try {
      const res = await api.get(`/bina-turu/rapor/${id}`);
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

  const { turBilgisi, analiz, sorular } = data;
  const { gostergeler, anaGrupTablosu, alanTablosu } = analiz;

  const formatPercent = (val: number) => Number(val).toFixed(1).replace('.', ',') + '%';

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:py-0 print:bg-white text-sm">
      
      {/* Yazdırma Butonu (Sadece Ekranda Görünür) */}
      <div className="max-w-[210mm] mx-auto mb-4 flex justify-end print:hidden">
        <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
          <Printer className="w-4 h-4 mr-2" /> Raporu Yazdır
        </Button>
      </div>

      {/* A4 Kağıt Konteyner */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none print:w-full">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 p-6">
          <div className="w-1/4">
            <img src={turBilgisi.tesisLogosu} alt="Logo" className="max-h-16 object-contain" />
          </div>
          <div className="w-2/4 text-center">
            <h1 className="text-xl font-bold uppercase text-slate-800 tracking-wider">Bina Tesis Turu<br/>Kontrol Formu</h1>
          </div>
          <div className="w-1/4 text-right text-xs space-y-1 font-medium text-slate-700">
            <p><span className="text-slate-500">Denetim Adı:</span> {turBilgisi.ad}</p>
            <p><span className="text-slate-500">Tarih:</span> {format(new Date(turBilgisi.baslangicTarihi), 'dd.MM.yyyy')}</p>
            <p><span className="text-slate-500">Tesis:</span> {turBilgisi.tesisAdi}</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          
          {/* KATILAN BİRİMLER */}
          <div>
            <h2 className="font-bold text-slate-800 border-b border-slate-300 pb-1 mb-2 uppercase text-xs">Denetime Katılan Birimler</h2>
            <p className="text-sm text-slate-700">
              {turBilgisi.katilanBirimler?.map((b: any) => b.ad).join(', ') || 'Belirtilmemiş'}
            </p>
          </div>

          {/* KPI */}
          <div className="grid grid-cols-6 gap-2">
            <div className="border border-slate-300 p-2 text-center rounded">
              <div className="text-[10px] text-slate-500 font-bold">KONTROL SATIRI</div>
              <div className="text-lg font-black text-slate-800">{gostergeler.toplamSoru}</div>
            </div>
            <div className="border border-slate-300 p-2 text-center rounded bg-green-50">
              <div className="text-[10px] text-green-700 font-bold">UYGUN</div>
              <div className="text-lg font-black text-green-800">{gostergeler.uygun}</div>
            </div>
            <div className="border border-slate-300 p-2 text-center rounded bg-red-50">
              <div className="text-[10px] text-red-700 font-bold">UYGUN DEĞİL</div>
              <div className="text-lg font-black text-red-800">{gostergeler.uygunDegil}</div>
            </div>
            <div className="border border-slate-300 p-2 text-center rounded bg-amber-50">
              <div className="text-[10px] text-amber-700 font-bold">DÖF VAR</div>
              <div className="text-lg font-black text-amber-800">{gostergeler.dfVar}</div>
            </div>
            <div className="border border-slate-300 p-2 text-center rounded">
              <div className="text-[10px] text-slate-500 font-bold">UYGUNLUK %</div>
              <div className="text-lg font-black text-slate-800">{formatPercent(gostergeler.uygunlukOrani)}</div>
            </div>
            <div className="border border-slate-300 p-2 text-center rounded">
              <div className="text-[10px] text-slate-500 font-bold">UYGUNSUZLUK %</div>
              <div className="text-lg font-black text-slate-800">{formatPercent(gostergeler.uygunsuzlukOrani)}</div>
            </div>
          </div>

          {/* ANA GRUP TABLOSU */}
          <div>
            <h2 className="font-bold text-slate-800 border-b border-slate-300 pb-1 mb-2 uppercase text-xs">Ana Grup Bazlı Analiz</h2>
            <Table className="border text-xs">
              <TableHeader className="bg-slate-100">
                <TableRow>
                  <TableHead className="font-bold text-slate-800">Ana Grup</TableHead>
                  <TableHead className="text-center font-bold text-slate-800">Toplam</TableHead>
                  <TableHead className="text-center font-bold text-slate-800">Uygun</TableHead>
                  <TableHead className="text-center font-bold text-slate-800">Uygun Değil</TableHead>
                  <TableHead className="text-center font-bold text-slate-800">Uygunluk %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anaGrupTablosu.map((g: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{g.ad}</TableCell>
                    <TableCell className="text-center">{g.toplam}</TableCell>
                    <TableCell className="text-center text-green-700">{g.uygun}</TableCell>
                    <TableCell className="text-center text-red-700">{g.uygunDegil}</TableCell>
                    <TableCell className="text-center font-bold">{formatPercent(g.uygunlukYuzdesi)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* ALAN TABLOSU */}
          <div className="print:break-after-page">
            <h2 className="font-bold text-slate-800 border-b border-slate-300 pb-1 mb-2 uppercase text-xs">Denetlenecek Alan Bazlı Analiz</h2>
            <Table className="border text-xs">
              <TableHeader className="bg-slate-100">
                <TableRow>
                  <TableHead className="font-bold text-slate-800">Denetlenecek Alan</TableHead>
                  <TableHead className="text-center font-bold text-slate-800">Toplam</TableHead>
                  <TableHead className="text-center font-bold text-slate-800">Uygun</TableHead>
                  <TableHead className="text-center font-bold text-slate-800">Uygun Değil</TableHead>
                  <TableHead className="text-center font-bold text-slate-800">Uygunluk %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alanTablosu.map((a: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{a.ad}</TableCell>
                    <TableCell className="text-center">{a.toplam}</TableCell>
                    <TableCell className="text-center text-green-700">{a.uygun}</TableCell>
                    <TableCell className="text-center text-red-700">{a.uygunDegil}</TableCell>
                    <TableCell className="text-center font-bold">{formatPercent(a.uygunlukYuzdesi)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* SORULAR */}
          <div>
            <h2 className="text-lg font-black text-slate-800 mb-4 border-b-2 border-slate-800 pb-2">KONTROL LİSTESİ VE DETAYLAR</h2>
            
            {sorular.map((alanObj: any, aIdx: number) => (
              <div key={aIdx} className="mb-6 print:break-inside-avoid">
                <div className="bg-slate-800 text-white px-3 py-1.5 font-bold text-sm mb-2 rounded-t">
                  {alanObj.alanAdi}
                </div>
                
                <div className="border border-t-0 border-slate-300 rounded-b overflow-hidden">
                  {alanObj.soruListesi.map((ts: any, sIdx: number) => {
                    const isUygun = ts.cevap?.sonuc === 'UYGUN';
                    const isUygunDegil = ts.cevap?.sonuc === 'UYGUN_DEGIL';
                    
                    return (
                      <div key={sIdx} className={`p-3 border-b border-slate-200 last:border-b-0 ${sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} print:break-inside-avoid`}>
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800 text-xs mb-2">{ts.soru.kriter}</p>
                            
                            {/* Açıklama Kutusu */}
                            <div className="border border-dashed border-slate-300 bg-white p-2 min-h-[50px] text-slate-500 text-[11px] rounded">
                              <span className="font-bold text-slate-400 uppercase">Açıklama: </span>
                              {ts.cevap?.aciklama || ''}
                            </div>
                          </div>
                          
                          <div className="w-48 shrink-0 flex flex-col gap-2">
                            <div className="flex justify-between gap-2">
                              <div className="flex items-center gap-1">
                                <div className={`w-4 h-4 border border-slate-400 rounded-sm flex items-center justify-center ${isUygun ? 'bg-green-500 border-green-600 text-white' : 'bg-white'}`}>
                                  {isUygun && '✓'}
                                </div>
                                <span className="text-[10px] font-bold text-slate-700">UYGUN</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className={`w-4 h-4 border border-slate-400 rounded-sm flex items-center justify-center ${isUygunDegil ? 'bg-red-500 border-red-600 text-white' : 'bg-white'}`}>
                                  {isUygunDegil && '✓'}
                                </div>
                                <span className="text-[10px] font-bold text-slate-700">UYGUN DEĞİL</span>
                              </div>
                            </div>
                            
                            {/* Fotoğraf Kutusu */}
                            <div className="flex-1 border border-dashed border-slate-300 bg-slate-100 rounded flex flex-col items-center justify-center p-2">
                              {ts.cevap?.fotograflar?.length > 0 ? (
                                <div className="flex flex-wrap gap-1 justify-center">
                                  {ts.cevap.fotograflar.map((f: string, idx: number) => (
                                    <img key={idx} src={getPhotoUrl(f)} alt="Kanıt" className="max-h-20 object-contain" />
                                  ))}
                                </div>
                              ) : ts.cevap?.fotografDosyasi ? (
                                <img src={getPhotoUrl(ts.cevap.fotografDosyasi)} alt="Kanıt" className="max-h-20 object-contain" />
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium">Fotoğraf / Kanıt Alanı</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* İMZALAR */}
          <div className="mt-16 print:break-inside-avoid">
            <h2 className="font-bold text-slate-800 border-b border-slate-300 pb-1 mb-6 uppercase text-xs text-center">İMZALAR (DENETİME KATILAN BİRİMLER)</h2>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-16">
              {turBilgisi.katilanBirimler?.map((b: any, i: number) => (
                <div key={i} className="w-48 text-center">
                  <div className="border-b border-slate-400 pb-8 mb-2"></div>
                  <p className="font-bold text-xs text-slate-800">{b.ad}</p>
                  <p className="text-[10px] text-slate-500">Yetkili İmza</p>
                </div>
              ))}
              {(!turBilgisi.katilanBirimler || turBilgisi.katilanBirimler.length === 0) && (
                <div className="w-48 text-center">
                  <div className="border-b border-slate-400 pb-8 mb-2"></div>
                  <p className="font-bold text-xs text-slate-800">Kalite Birimi</p>
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* YAZDIRMA FOOTER (Her sayfada alta sabitlenir) */}
        <div className="hidden print:flex fixed bottom-0 left-0 right-0 bg-white pt-2 pb-4 border-t border-slate-800 justify-between items-center text-[10px] font-bold text-slate-600 px-8 z-50">
          <span>TEK-F007-02</span>
          {/* Tarayıcılar CSS ile toplam sayfa sayısını desteklemediği için yazdırma diyalogundaki varsayılan sayfa numaralarını kullanmak daha sağlıklıdır, ancak manuel bir alan bırakıyoruz */}
          <span></span>
        </div>

        {/* EKRAN FOOTER (Sadece ekranda görünür) */}
        <div className="print:hidden border-t border-slate-200 p-4 flex justify-between items-center text-[10px] font-bold text-slate-500">
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

export default BinaTuruRaporu;
