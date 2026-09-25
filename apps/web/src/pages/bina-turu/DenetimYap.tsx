import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CheckCircle2, AlertCircle, Loader2, Search, Info, Upload, Image as ImageIcon, Trash2, X, Paperclip } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || '';

const DenetimYap = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tur, setTur] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [cevaplar, setCevaplar] = useState<Record<number, any>>({});
  const [savingIds, setSavingIds] = useState<Record<number, boolean>>({});
  const [isBulking, setIsBulking] = useState(false);

  // Layout states
  const [searchTerm, setSearchTerm] = useState('');
  const [activeAlan, setActiveAlan] = useState<{ anaGrup: string, alan: string } | null>(null);

  useEffect(() => {
    fetchTurDetay();
  }, [id]);

  const fetchTurDetay = async () => {
    try {
      const res = await api.get(`/bina-turu/turler/${id}`);
      const data = await res.json();
      setTur(data);
      
      const initialCevaplar: Record<number, any> = {};
      data.turSorulari.forEach((ts: any) => {
        if (ts.cevap) {
          initialCevaplar[ts.id] = {
            sonuc: ts.cevap.sonuc,
            aciklama: ts.cevap.aciklama || '',
            fotograflar: ts.cevap.fotograflar || [],
            isSaved: true
          };
        } else {
          initialCevaplar[ts.id] = {
            sonuc: null,
            aciklama: '',
            fotograflar: [],
            isSaved: false
          };
        }
      });
      setCevaplar(initialCevaplar);

      // Set initial active alan
      if (data.turSorulari.length > 0) {
        const firstUnanswered = data.turSorulari.find((ts: any) => !ts.cevap);
        const target = firstUnanswered || data.turSorulari[0];
        setActiveAlan({
          anaGrup: target.soru.anaGrup?.ad || 'Genel',
          alan: target.soru.denetlenenAlan?.ad || 'Genel Alan'
        });
      }

    } catch (err) {
      toast.error('Tur detayları alınamadı.');
      navigate('/bina-turu/turler');
    } finally {
      setLoading(false);
    }
  };

  const autoSaveToBackend = async (turSorusuId: number, dataToSave: any) => {
    if (!dataToSave.sonuc) return;

    setSavingIds(prev => ({ ...prev, [turSorusuId]: true }));
    try {
      const formData = new FormData();
      formData.append('sonuc', dataToSave.sonuc);
      if (dataToSave.aciklama) formData.append('aciklama', dataToSave.aciklama);

      await api.customFetch(`/bina-turu/denetim/${turSorusuId}/cevap`, {
        method: 'POST',
        body: formData
      });

      setCevaplar(prev => ({
        ...prev,
        [turSorusuId]: { ...prev[turSorusuId], isSaved: true }
      }));
      
    } catch (err) {
      toast.error('Otomatik kayıt başarısız oldu.');
    } finally {
      setSavingIds(prev => ({ ...prev, [turSorusuId]: false }));
    }
  };

  // Çoklu Dosya Yükleme (Dosya Seçici, Drag & Drop veya Panodan Yapıştırma)
  const uploadFilesToBackend = async (turSorusuId: number, files: File[]) => {
    if (!files || files.length === 0) return;

    setSavingIds(prev => ({ ...prev, [turSorusuId]: true }));
    try {
      const current = cevaplar[turSorusuId] || {};
      const formData = new FormData();
      formData.append('sonuc', current.sonuc || 'UYGUN_DEGIL');
      if (current.aciklama) formData.append('aciklama', current.aciklama);
      
      files.forEach(file => {
        formData.append('fotograflar', file);
      });

      const res = await api.customFetch(`/bina-turu/denetim/${turSorusuId}/cevap`, {
        method: 'POST',
        body: formData
      });
      const updatedCevap = await res.json();

      setCevaplar(prev => ({
        ...prev,
        [turSorusuId]: { 
          ...prev[turSorusuId], 
          sonuc: updatedCevap.sonuc || 'UYGUN_DEGIL',
          fotograflar: updatedCevap.fotograflar || [],
          isSaved: true 
        }
      }));

      // Tur verisini de senkronize et
      setTur((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          turSorulari: prev.turSorulari.map((ts: any) => 
            ts.id === turSorusuId 
              ? { ...ts, cevap: { ...ts.cevap, ...updatedCevap } } 
              : ts
          )
        };
      });

      toast.success(`${files.length} görsel yüklendi`);
    } catch (err) {
      toast.error('Fotoğraf yükleme başarısız oldu.');
    } finally {
      setSavingIds(prev => ({ ...prev, [turSorusuId]: false }));
    }
  };

  // Fotoğraf Silme
  const deletePhotoFromBackend = async (turSorusuId: number, filename: string) => {
    setSavingIds(prev => ({ ...prev, [turSorusuId]: true }));
    try {
      const res = await api.customFetch(`/bina-turu/denetim/${turSorusuId}/fotograf/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      const updatedCevap = await res.json();

      setCevaplar(prev => ({
        ...prev,
        [turSorusuId]: { 
          ...prev[turSorusuId], 
          fotograflar: updatedCevap.fotograflar || [] 
        }
      }));

      setTur((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          turSorulari: prev.turSorulari.map((ts: any) => 
            ts.id === turSorusuId 
              ? { ...ts, cevap: { ...ts.cevap, fotograflar: updatedCevap.fotograflar || [] } } 
              : ts
          )
        };
      });

      toast.success('Görsel silindi');
    } catch (err) {
      toast.error('Görsel silinemedi.');
    } finally {
      setSavingIds(prev => ({ ...prev, [turSorusuId]: false }));
    }
  };

  const handleCevapChange = (turSorusuId: number, field: string, value: any) => {
    setCevaplar(prev => {
      const current = prev[turSorusuId];
      const updated = {
        ...current,
        [field]: value,
        ...(field === 'sonuc' && value === 'UYGUN' ? { aciklama: '' } : {})
      };
      
      if (field === 'sonuc') {
        autoSaveToBackend(turSorusuId, updated);
      }
      
      return { ...prev, [turSorusuId]: updated };
    });
  };

  const handleBlurOrFileChange = (turSorusuId: number) => {
    autoSaveToBackend(turSorusuId, cevaplar[turSorusuId]);
  };

  const handleTurTamamla = async () => {
    try {
      await api.put(`/bina-turu/turler/${id}/tamamla`, {});
      toast.success('Denetim başarıyla tamamlandı!');
      navigate('/bina-turu/turler');
    } catch (err) {
      toast.error('Tur tamamlanırken hata oluştu.');
    }
  };

  const handleTumunuUygunYap = async () => {
    if (!activeAlan) return;
    const unansweredIds = activeAlanSorulari
      .filter((ts: any) => !cevaplar[ts.id]?.sonuc)
      .map((ts: any) => ts.id);

    if (unansweredIds.length === 0) {
      toast.info('Zaten bu bölümdeki tüm sorular yanıtlanmış.');
      return;
    }

    setIsBulking(true);
    try {
      await api.post('/bina-turu/denetim/bulk-cevap', {
        turSorusuIds: unansweredIds,
        sonuc: 'UYGUN'
      });
      
      setCevaplar(prev => {
        const updated = { ...prev };
        unansweredIds.forEach((id: number) => {
          updated[id] = {
            ...updated[id],
            sonuc: 'UYGUN',
            aciklama: '',
            isSaved: true
          };
        });
        return updated;
      });
      
      toast.success(`${unansweredIds.length} soru UYGUN olarak işaretlendi.`);
    } catch (err) {
      toast.error('Toplu işaretleme başarısız oldu.');
    } finally {
      setIsBulking(false);
    }
  };

  // Group questions by AnaGrup -> Denetlenecek Alan
  const groupedData = useMemo(() => {
    if (!tur || !tur.turSorulari) return {};
    
    const groups: Record<string, Record<string, any[]>> = {};
    
    tur.turSorulari.forEach((ts: any) => {
      const anaGrup = ts.soru.anaGrup?.ad || 'Genel';
      const alan = ts.soru.denetlenenAlan?.ad || 'Genel Alan';
      
      if (!groups[anaGrup]) groups[anaGrup] = {};
      if (!groups[anaGrup][alan]) groups[anaGrup][alan] = [];
      
      groups[anaGrup][alan].push(ts);
    });
    
    return groups;
  }, [tur]);

  if (loading) return <div className="p-4 flex justify-center mt-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!tur || !tur.turSorulari?.length) return <div className="p-4 text-center mt-20">Sorular bulunamadı.</div>;

  const totalSorular = tur.turSorulari.length;
  const answeredSorular = Object.values(cevaplar).filter(c => c.isSaved).length;
  const isAllAnswered = answeredSorular === totalSorular;

  const activeAlanSorulari = activeAlan && groupedData[activeAlan.anaGrup]?.[activeAlan.alan] 
    ? groupedData[activeAlan.anaGrup][activeAlan.alan] 
    : [];

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#F8FAFC] overflow-hidden">
      
      {/* Left Sidebar */}
      <div className="w-[300px] bg-white border-r border-slate-200 flex flex-col shadow-sm z-10 shrink-0">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800 mb-1">Departmanlar</h2>
          <p className="text-xs text-slate-500 mb-3">
            Sonuçlarını görmek için bir departman seçin.
          </p>
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Departman ara..." 
              className="pl-8 bg-slate-50 border-slate-200 h-8 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {Object.keys(groupedData).map((anaGrup) => {
            // Filter alanlar inside this anaGrup by search
            const alanlar = Object.keys(groupedData[anaGrup]).filter(alan => 
              alan.toLowerCase().includes(searchTerm.toLowerCase()) || 
              anaGrup.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (alanlar.length === 0) return null;

            return (
              <div key={anaGrup} className="mb-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                  {anaGrup}
                </div>
                <div className="space-y-0.5">
                  {alanlar.map(alan => {
                    const isActive = activeAlan?.anaGrup === anaGrup && activeAlan?.alan === alan;
                    const sorular = groupedData[anaGrup][alan];
                    const alanAnswered = sorular.filter(ts => cevaplar[ts.id]?.isSaved).length;
                    const isAlanComplete = alanAnswered === sorular.length;

                    return (
                      <button
                        key={alan}
                        onClick={() => setActiveAlan({ anaGrup, alan })}
                        className={`w-full text-left px-3 py-2 rounded-md transition-all border text-sm ${
                          isActive 
                            ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' 
                            : 'bg-white border-transparent text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate pr-2">{alan}</span>
                          {isAlanComplete ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          ) : (
                            <span className="text-[10px] text-slate-400 shrink-0 bg-slate-100 px-1 rounded">
                              {alanAnswered}/{sorular.length}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Bottom Area */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <div className="mb-2 flex justify-between items-center px-1">
            <span className="text-xs font-medium text-slate-500">Genel İlerleme</span>
            <span className="text-xs font-bold text-slate-700">{Math.round((answeredSorular/totalSorular)*100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-blue-500 transition-all duration-500" 
              style={{ width: `${(answeredSorular / totalSorular) * 100}%` }}
            />
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Button 
                    className={`w-full h-9 text-xs font-semibold rounded-md shadow-sm transition-all ${
                      isAllAnswered ? "bg-green-600 hover:bg-green-700 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed hover:bg-slate-200"
                    }`}
                    disabled={!isAllAnswered}
                    onClick={handleTurTamamla}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Denetimi Bitir
                  </Button>
                </div>
              </TooltipTrigger>
              {!isAllAnswered && (
                <TooltipContent side="top" className="text-xs">
                  <p>Kalan {totalSorular - answeredSorular} soruyu yanıtlamadan bitiremezsiniz.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Main Content Area (Right) */}
      <div className="flex-1 overflow-y-auto bg-white">
        {activeAlan ? (
          <div className="max-w-3xl mx-auto p-6 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800">
                  {activeAlan.alan}
                </h1>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {activeAlanSorulari.length} soru
                </span>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="ml-4 text-xs h-7 border-green-200 text-green-700 hover:bg-green-50"
                  onClick={handleTumunuUygunYap}
                  disabled={isBulking || activeAlanSorulari.every((ts:any) => cevaplar[ts.id]?.sonuc)}
                >
                  {isBulking ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />} 
                  {isBulking ? 'İşleniyor...' : 'Tümünü Uygun Yap'}
                </Button>
              </div>
              
              {activeAlanSorulari.length > 0 && activeAlanSorulari.every((ts:any) => cevaplar[ts.id]?.isSaved) && (
                <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-medium border border-green-100">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tamamlandı
                </div>
              )}
            </div>

            {/* Minimal Questions List */}
            <TooltipProvider>
              <div className="space-y-0 pb-20 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {activeAlanSorulari.map((ts: any, index: number) => {
                  const localState = cevaplar[ts.id] || {};
                  const showDofBox = localState.sonuc === 'UYGUN_DEGIL';
                  const isSaving = savingIds[ts.id];
                  const isLast = index === activeAlanSorulari.length - 1;

                  return (
                    <div key={ts.id} className={`p-4 transition-colors hover:bg-slate-50/50 ${!isLast ? 'border-b border-slate-100' : ''}`}>
                      <div className="flex gap-3 items-start">
                        
                        {/* Status / Save Indicator */}
                        <div className="mt-0.5 shrink-0">
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                          ) : localState.isSaved ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-2.5">
                          
                          {/* Question Text & Info */}
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-sm font-medium text-slate-800 leading-snug">
                              {ts.soru.kriter}
                            </p>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-4 h-4 text-slate-400 shrink-0 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Kategori: {ts.soru.kategori?.ad || 'Belirtilmedi'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          {/* Answer Buttons */}
                          <RadioGroup 
                            className="flex gap-2 max-w-sm"
                            value={localState.sonuc || ""}
                            onValueChange={(val) => handleCevapChange(ts.id, 'sonuc', val)}
                          >
                            <label 
                              className={`flex-1 flex items-center justify-center py-1.5 px-3 rounded border text-xs font-medium cursor-pointer transition-colors ${
                                localState.sonuc === 'UYGUN' 
                                  ? 'border-green-400 text-green-700 bg-green-50' 
                                  : 'border-slate-200 text-slate-600 bg-white hover:border-green-200'
                              }`}
                            >
                              <RadioGroupItem value="UYGUN" className="sr-only" />
                              Uygun
                            </label>

                            <label 
                              className={`flex-1 flex items-center justify-center py-1.5 px-3 rounded border text-xs font-medium cursor-pointer transition-colors ${
                                localState.sonuc === 'UYGUN_DEGIL' 
                                  ? 'border-red-400 text-red-700 bg-red-50' 
                                  : 'border-slate-200 text-slate-600 bg-white hover:border-red-200'
                              }`}
                            >
                              <RadioGroupItem value="UYGUN_DEGIL" className="sr-only" />
                              Uygun Değil
                            </label>
                          </RadioGroup>

                          {/* Minimal DÖF Section (Açıklama / Foto) */}
                          {showDofBox && (
                            <div className="mt-3 pt-3 pl-3 border-l-2 border-red-200 animate-in fade-in space-y-3">
                              <p className="text-xs font-medium text-slate-500 mb-1">Açıklama ve Kanıt Fotoğrafları</p>
                              <div>
                                <Textarea 
                                  placeholder="Açıklama veya not girebilirsiniz (Opsiyonel)..." 
                                  value={localState.aciklama}
                                  onChange={(e) => handleCevapChange(ts.id, 'aciklama', e.target.value)}
                                  onBlur={() => handleBlurOrFileChange(ts.id)}
                                  className="h-14 text-xs bg-white resize-none"
                                />
                              </div>

                              {/* Gelişmiş Sürükle-Bırak & Excel/Panodan Resim Yapıştırma Alanı */}
                              <div
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.currentTarget.classList.add('border-blue-500', 'bg-blue-50/50');
                                }}
                                onDragLeave={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50/50');
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50/50');
                                  
                                  const droppedFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
                                  if (droppedFiles.length > 0) {
                                    uploadFilesToBackend(ts.id, droppedFiles);
                                  } else {
                                    toast.error('Lütfen geçerli bir görsel dosyası sürükleyin.');
                                  }
                                }}
                                onPaste={(e) => {
                                  // Excel'den veya panodan kopyalanan resimleri yakalama
                                  const items = e.clipboardData?.items;
                                  if (items) {
                                    const files: File[] = [];
                                    for (let i = 0; i < items.length; i++) {
                                      if (items[i].type.indexOf('image') !== -1) {
                                        const file = items[i].getAsFile();
                                        if (file) {
                                          files.push(file);
                                        }
                                      }
                                    }
                                    if (files.length > 0) {
                                      e.preventDefault();
                                      uploadFilesToBackend(ts.id, files);
                                    }
                                  }
                                }}
                                tabIndex={0}
                                className="group relative border-2 border-dashed border-slate-200 hover:border-blue-400 focus:border-blue-500 rounded-xl p-3 bg-slate-50/50 hover:bg-blue-50/20 transition-all cursor-pointer outline-none"
                              >
                                <div className="flex flex-col items-center justify-center text-center py-2">
                                  <div className="w-8 h-8 rounded-full bg-blue-100/60 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                                    <Upload className="w-4 h-4" />
                                  </div>
                                  <p className="text-xs font-semibold text-slate-700">
                                    Excel'den veya bilgisayardan resmi buraya <span className="text-blue-600 underline">sürükleyip bırakın</span>
                                  </p>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    veya panodan yapıştırın (<kbd className="px-1 py-0.5 bg-slate-200/60 rounded text-[10px] font-mono">Ctrl+V</kbd> / <kbd className="px-1 py-0.5 bg-slate-200/60 rounded text-[10px] font-mono">⌘+V</kbd>) ya da tıklayarak seçin
                                  </p>
                                </div>

                                <input 
                                  type="file" 
                                  multiple
                                  accept="image/*"
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      uploadFilesToBackend(ts.id, Array.from(e.target.files));
                                      e.target.value = '';
                                    }
                                  }}
                                />
                              </div>

                              {/* Yüklenmiş Fotoğraflar Galerisi */}
                              {((localState.fotograflar && localState.fotograflar.length > 0) || (ts.cevap?.fotograflar && ts.cevap.fotograflar.length > 0)) && (() => {
                                const photos: string[] = localState.fotograflar || ts.cevap?.fotograflar || [];
                                return (
                                  <div className="space-y-1.5 pt-1">
                                    <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                                      <Paperclip className="w-3 h-3 text-slate-400" />
                                      Eklenmiş Fotoğraflar ({photos.length}):
                                    </span>
                                    <div className="flex flex-wrap gap-2.5">
                                      {photos.map((fotoName: string, fIdx: number) => {
                                        const imgUrl = `${API}/uploads/${fotoName}`;
                                        return (
                                          <div 
                                            key={`${fotoName}-${fIdx}`} 
                                            className="relative group/thumb w-16 h-16 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 shadow-2xs"
                                          >
                                            <img 
                                              src={imgUrl} 
                                              alt={`Ek ${fIdx + 1}`}
                                              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                              onClick={() => window.open(imgUrl, '_blank')}
                                              title="Büyük boyutta aç"
                                            />
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                deletePhotoFromBackend(ts.id, fotoName);
                                              }}
                                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 hover:bg-red-700 transition-all shadow-sm"
                                              title="Fotoğrafı Kaldır"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}

                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TooltipProvider>
          </div>
        ) : null}
      </div>

    </div>
  );
};

export default DenetimYap;
