import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api, { BASE_URL } from '@/lib/api';
import { format } from 'date-fns';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const UygunsuzlukRaporu = () => {
  const { turId } = useParams<{ turId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRapor();
  }, [turId]);

  const getPhotoUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) return `${BASE_URL}${url}`;
    if (url.startsWith('uploads')) return `${BASE_URL}/${url}`;
    return `${BASE_URL}/uploads/${url}`;
  };

  const fetchRapor = async () => {
    try {
      const res = await api.get(`/bina-turu/uygunsuzluk-raporlari/tur/${turId}`);
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

  const { turBilgisi, istatistikler, uygunsuzluklar } = data;

  const renderDurum = (durum: string) => {
    switch (durum) {
      case 'ACIK': return <span className="text-red-600 font-bold">Atanmadı</span>;
      case 'DEVAM_EDIYOR': return <span className="text-amber-600 font-bold">Devam Ediyor</span>;
      case 'KAPALI': return <span className="text-green-600 font-bold">Tamamlandı</span>;
      default: return <span>Bilinmiyor</span>;
    }
  };

  const parseKapatmaKaniti = (kanit: string | null) => {
    if (!kanit) return { text: '', images: [] };
    const parts = kanit.split(/\n?Dosya:\s*/).filter(Boolean);
    const textParts: string[] = [];
    const images: string[] = [];
    parts.forEach(p => {
      const cleanP = p.trim();
      if (/\.(jpg|jpeg|png|gif|webp)$/i.test(cleanP) || /^[a-f0-9]{32}$/i.test(cleanP)) {
        images.push(cleanP);
      } else {
        textParts.push(p);
      }
    });
    return { text: textParts.join(' '), images };
  };

  const sortedUygunsuzluklar = [...uygunsuzluklar].sort((a: any, b: any) => {
    const durumOrder: Record<string, number> = { 'DEVAM_EDIYOR': 1, 'KAPALI': 2, 'ACIK': 3 };
    const orderA = durumOrder[a.uygunsuzluk.durum] || 99;
    const orderB = durumOrder[b.uygunsuzluk.durum] || 99;
    return orderA - orderB;
  });

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:py-0 print:bg-white text-sm">
      
      {/* Yazdırma Butonu */}
      <div className="max-w-[210mm] mx-auto mb-4 flex justify-end print:hidden">
        <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
          <Printer className="w-4 h-4 mr-2" /> Raporu Yazdır
        </Button>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none print:w-full min-h-[297mm] relative pb-20">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 p-6">
          <div className="w-1/4">
            <img src={turBilgisi.tesisLogosu} alt="Logo" className="max-h-16 object-contain" />
          </div>
          <div className="w-2/4 text-center">
            <h1 className="text-xl font-black uppercase text-slate-800 tracking-wider">Bina Tesis Turu<br/>Uygunsuzluk ve Aksiyon Raporu</h1>
          </div>
          <div className="w-1/4 text-right text-xs space-y-1 font-medium text-slate-700">
            <p><span className="text-slate-500">Tur Adı:</span> {turBilgisi.ad}</p>
            <p><span className="text-slate-500">Tur Tarihi:</span> {format(new Date(turBilgisi.baslangicTarihi), 'dd.MM.yyyy')}</p>
            <p><span className="text-slate-500">Tesis:</span> {turBilgisi.tesisAdi}</p>
          </div>
        </div>

        <div className="p-8 space-y-10">
          
          {/* KPI */}
          <div>
            <h2 className="text-lg font-black text-slate-800 border-b-2 border-slate-800 pb-1 mb-4">1. UYGUNSUZLUK ÖZETİ</h2>
            <div className="grid grid-cols-5 gap-4">
              <div className="border border-slate-300 p-3 text-center rounded bg-slate-50">
                <div className="text-[10px] text-slate-500 font-bold mb-1">TOPLAM TESPİT</div>
                <div className="text-2xl font-black text-slate-800">{istatistikler.toplam}</div>
              </div>
              <div className="border border-red-200 p-3 text-center rounded bg-red-50">
                <div className="text-[10px] text-red-700 font-bold mb-1">ATANMADI</div>
                <div className="text-xl font-black text-red-800">{istatistikler.atanmadi}</div>
              </div>
              <div className="border border-amber-200 p-3 text-center rounded bg-amber-50">
                <div className="text-[10px] text-amber-700 font-bold mb-1">DEVAM EDİYOR</div>
                <div className="text-xl font-black text-amber-800">{istatistikler.devamEdiyor}</div>
              </div>
              <div className="border border-green-200 p-3 text-center rounded bg-green-50">
                <div className="text-[10px] text-green-700 font-bold mb-1">TAMAMLANDI</div>
                <div className="text-xl font-black text-green-800">{istatistikler.tamamlandi}</div>
              </div>
              <div className="border border-slate-800 p-3 text-center rounded bg-slate-800">
                <div className="text-[10px] text-slate-300 font-bold mb-1">ÇÖZÜM ORANI</div>
                <div className="text-2xl font-black text-green-400">
                  {istatistikler.toplam > 0 ? Number(istatistikler.cozumOrani).toFixed(1).replace('.', ',') + '%' : '100%'}
                </div>
              </div>
            </div>
          </div>

          {/* LİSTE */}
          <div>
            <h2 className="text-lg font-black text-slate-800 border-b-2 border-slate-800 pb-1 mb-4">2. UYGUNSUZLUK LİSTESİ VE AKSİYONLAR</h2>
            
            {uygunsuzluklar.length === 0 ? (
              <div className="text-center py-8 text-slate-500 italic">Bu turda kaydedilmiş herhangi bir uygunsuzluk bulunmamaktadır.</div>
            ) : (
              <div className="space-y-3">
                {sortedUygunsuzluklar.map((item: any, i: number) => {
                  const { text: kapatmaText, images: kapatmaImages } = parseKapatmaKaniti(item.uygunsuzluk.kapatmaKaniti);
                  
                  return (
                  <div key={i} className="border border-slate-300 rounded p-2 break-inside-avoid shadow-sm text-xs">
                    <div className="flex justify-between items-start mb-1 border-b border-slate-200 pb-1">
                      <div>
                        <div className="text-xs font-bold text-slate-500 mb-1">{item.alan}</div>
                        <div className="font-bold text-sm text-slate-800">{item.soruMetni}</div>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <div className="text-xs bg-slate-100 px-2 py-1 border rounded font-mono mb-1">{item.uygunsuzluk.dofTakipNo || 'DÖF Yok'}</div>
                        <div className="text-xs">{renderDurum(item.uygunsuzluk.durum)}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <span className="font-bold text-slate-600 block mb-0.5">Atanan Birim:</span>
                        <span className="text-slate-800">{item.uygunsuzluk.sorumluBirimler?.[0]?.ad || 'Atanmadı'}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-600 block mb-0.5">Tespit Açıklaması:</span>
                        <span className="text-slate-800 italic">{item.cevap?.aciklama || '-'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="font-bold text-slate-600 block mb-0.5">Kapatma / Aksiyon Notu:</span>
                        <span className="text-slate-800">{kapatmaText || 'Henüz aksiyon alınmadı veya not girilmedi.'}</span>
                      </div>
                    </div>

                    {/* Fotoğraflar */}
                    {(item.cevap?.fotograflar?.length > 0 || kapatmaImages.length > 0) && (
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <div className="flex gap-4">
                          {/* Tespit Fotoğrafları */}
                          {item.cevap?.fotograflar?.length > 0 && (
                            <div className="flex-1">
                              <span className="font-bold text-slate-600 block mb-1 text-[10px] border-b border-slate-200 pb-0.5">Tespit (Öncesi)</span>
                              <div className="flex flex-wrap gap-1">
                                {item.cevap.fotograflar.map((foto: string, idx: number) => (
                                  <img key={`tespit-${idx}`} src={getPhotoUrl(foto)} alt="Tespit" className="h-20 w-auto object-cover rounded shadow-sm border border-slate-300" />
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Kapatma Fotoğrafları */}
                          {kapatmaImages.length > 0 && (
                            <div className="flex-1">
                              <span className="font-bold text-slate-600 block mb-1 text-[10px] border-b border-slate-200 pb-0.5">Kapatma (Sonrası)</span>
                              <div className="flex flex-wrap gap-1">
                                {kapatmaImages.map((foto: string, idx: number) => (
                                  <img key={`kapatma-${idx}`} src={getPhotoUrl(foto)} alt="Kapatma" className="h-20 w-auto object-cover rounded shadow-sm border border-slate-300" />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )})}
              </div>
            )}
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

export default UygunsuzlukRaporu;
