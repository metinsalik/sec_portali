import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { ImageUploadWithPreview, type PhotoItem } from '@/components/fm200/ImageUploadWithPreview';
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  FileCheck,
  Building2,
  Flame,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Send,
  Eye,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export default function Fm200WorkOrdersPage() {
  const queryClient = useQueryClient();
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [laneFilter, setLaneFilter] = useState<string>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Kanıt Ekleme & Uygulandı Modalı
  const [actionJob, setActionJob] = useState<any | null>(null);
  const [actionEvidences, setActionEvidences] = useState<PhotoItem[]>([]);
  const [actionCompanyTrackNo, setActionCompanyTrackNo] = useState('');

  // Doğrulama & Onay Modalı (Teknik Sorumlu)
  const [verifyJob, setVerifyJob] = useState<any | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [createPhysicalFollowUp, setCreatePhysicalFollowUp] = useState(false);
  const [followUpTitle, setFollowUpTitle] = useState('');

  // Tesisleri Çek
  const { data: facilities = [] } = useQuery<any[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) throw new Error('Tesisler alınamadı');
      return res.json();
    }
  });

  // İş Emirlerini Çek
  const { data: workOrders = [], isLoading } = useQuery<any[]>({
    queryKey: ['fm200WorkOrders', selectedFacilityId, statusFilter, laneFilter, responsibleFilter],
    queryFn: async () => {
      let url = `/fm200/work-orders?facilityId=${selectedFacilityId}&status=${statusFilter}&trackLane=${laneFilter}&responsible=${responsibleFilter}`;
      const res = await api.get(url);
      if (!res.ok) throw new Error('İş emirleri alınamadı');
      return res.json();
    }
  });

  // Saha Aksiyonu (Uygulandı Yap)
  const submitActionMutation = useMutation({
    mutationFn: async () => {
      if (!actionJob) return;
      const res = await api.post(`/fm200/work-orders/${actionJob.id}/action`, {
        companyTrackNo: actionCompanyTrackNo,
        evidences: actionEvidences.map(e => ({
          fileType: 'Foto_Sonrasi',
          fileUrl: e.url,
          fileName: e.name
        }))
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'İşlem kaydedilemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fm200WorkOrders'] });
      queryClient.invalidateQueries({ queryKey: ['fm200Locations'] });
      toast.success('İş kaydı kanıtlarla birlikte "Uygulandı" olarak işaretlendi.');
      setActionJob(null);
      setActionEvidences([]);
      setActionCompanyTrackNo('');
    },
    onError: (err: any) => toast.error(err.message)
  });

  // Doğrulama & Onay (Tamamlandı veya Revize)
  const verifyMutation = useMutation({
    mutationFn: async (decision: 'Tamamlandi' | 'Revize_Gerekli') => {
      if (!verifyJob) return;
      const res = await api.post(`/fm200/work-orders/${verifyJob.id}/verify`, {
        decision,
        revisionNote,
        createPhysicalFollowUp,
        followUpTitle
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Doğrulama başarısız');
      }
      return res.json();
    },
    onSuccess: (_, decision) => {
      queryClient.invalidateQueries({ queryKey: ['fm200WorkOrders'] });
      queryClient.invalidateQueries({ queryKey: ['fm200Locations'] });
      if (decision === 'Tamamlandi') {
        toast.success('İş emri teknik sorumlu tarafından onaylanarak kapatıldı.');
      } else {
        toast.warning('İş emri revizyon notuyla birlikte sahaya geri gönderildi.');
      }
      setVerifyJob(null);
      setRevisionNote('');
      setCreatePhysicalFollowUp(false);
      setFollowUpTitle('');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const filteredOrders = workOrders.filter(w => {
    const q = searchQuery.toLowerCase();
    return (
      w.title?.toLowerCase().includes(q) ||
      w.sourceCode?.toLowerCase().includes(q) ||
      w.location?.systemUid?.toLowerCase().includes(q) ||
      w.location?.roomType?.toLowerCase().includes(q) ||
      w.location?.facility?.name?.toLowerCase().includes(q)
    );
  });

  const activeFac = facilities.find((f: any) => f.id === actionJob?.location?.facilityId || f.id === selectedFacilityId);

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Açıklama */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0051d5] dark:text-[#b4c5ff]">
            Kanıta Dayalı Yaşam Döngüsü (State Machine)
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            FM-200 İş Emirleri & Uygunsuzluk Yönetimi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Saha ve dokümantasyon uygunsuzluklarının döngüsel takibi: Planlandı ➔ Uygulandı (Fotoğraf Kanıtı) ➔ Teknik Sorumlu Doğrulaması (Tamamlandı veya Revize).
          </p>
        </div>

        {/* Özet Sayaçlar */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 text-center">
            <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-semibold">Açık / Planlanan</span>
            <span className="text-base font-extrabold text-amber-800 dark:text-amber-300">
              {workOrders.filter(w => w.status === 'Planlandi').length}
            </span>
          </div>
          <div className="px-3 py-2 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900 text-center">
            <span className="text-[10px] text-purple-700 dark:text-purple-400 block font-semibold">Doğrulama Bekleyen</span>
            <span className="text-base font-extrabold text-purple-800 dark:text-purple-300">
              {workOrders.filter(w => w.status === 'Uygulandi').length}
            </span>
          </div>
          <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 text-center">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-semibold">Kapatılan</span>
            <span className="text-base font-extrabold text-emerald-800 dark:text-emerald-300">
              {workOrders.filter(w => w.status === 'Tamamlandi').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filtre Çubuğu */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <div>
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
          >
            <option value="all">Tüm Tesisler ({facilities.length})</option>
            {facilities.map((f: any) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="Planlandi">Planlandı</option>
            <option value="Uygulandi">Uygulandı (Onay Bekliyor)</option>
            <option value="Revize_Gerekli">Revize Gerekli</option>
            <option value="Tamamlandi">Tamamlandı</option>
          </select>
        </div>

        <div>
          <select
            value={laneFilter}
            onChange={(e) => setLaneFilter(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
          >
            <option value="all">Tüm Kulvarlar (Fiziksel / Doküman)</option>
            <option value="Fiziksel">Fiziksel Yol (Saha İşi)</option>
            <option value="Dokuman">Doküman Yolu (Mühendislik / Ofis)</option>
          </select>
        </div>

        <div>
          <select
            value={responsibleFilter}
            onChange={(e) => setResponsibleFilter(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
          >
            <option value="all">Tüm Sorumlular</option>
            <option value="Teknik">Teknik Hizmetler</option>
            <option value="Firma">Yetkili Firma</option>
          </select>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="İş adı, kod veya UID ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-white dark:bg-slate-900 text-xs"
          />
        </div>
      </div>

      {/* İş Emirleri Listesi */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">İş emirleri yükleniyor...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Kayıtlı İş Emri Bulunmuyor
          </h3>
          <p className="text-xs text-slate-500 mt-1">Seçili filtrelere uygun herhangi bir iş emri bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((job) => {
            const isEscalated = job.repeatCount > 1;

            return (
              <div
                key={job.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:border-primary/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {job.sourceCode}
                    </span>
                    <span className="font-mono text-xs text-primary font-semibold">
                      {job.location?.systemUid}
                    </span>
                    <span className="text-xs text-slate-400">
                      · {job.location?.facility?.shortName || job.location?.facility?.name} ({job.location?.roomType})
                    </span>

                    {/* Kulvar Rozeti */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        job.trackLane === 'Fiziksel'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                      }`}
                    >
                      {job.trackLane} Yol
                    </span>

                    {/* Sorumlu Rozeti */}
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {job.responsible}
                    </span>

                    {/* Mükerrer Sayaç / Eskalasyon Bayrağı (Spesifikasyon Bölüm 13.1) */}
                    {isEscalated && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {job.repeatCount} Dönemdir Devam Ediyor
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {job.title}
                  </h4>

                  {/* Revizyon Notu Varsa */}
                  {job.status === 'Revize_Gerekli' && job.revisionNote && (
                    <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs text-red-800 dark:text-red-300 flex items-start gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        <b>Teknik Sorumlu Notu:</b> {job.revisionNote}
                      </span>
                    </div>
                  )}

                  {/* Kanıt Görselleri Küçük Küçük */}
                  {job.evidences?.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-slate-400">Kanıtlar ({job.evidences.length}):</span>
                      {job.evidences.map((ev: any) => (
                        <a
                          key={ev.id}
                          href={ev.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-7 h-7 rounded border border-slate-200 overflow-hidden shrink-0 hover:scale-110 transition-transform"
                        >
                          <img src={ev.fileUrl} alt="Kanıt" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sağ Kolon: Durum ve Aksiyon Butonları */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      job.status === 'Tamamlandi'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200'
                        : job.status === 'Uygulandi'
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200'
                        : job.status === 'Revize_Gerekli'
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {job.status === 'Tamamlandi'
                      ? 'Tamamlandı'
                      : job.status === 'Uygulandi'
                      ? 'Doğrulama Bekliyor'
                      : job.status === 'Revize_Gerekli'
                      ? 'Revize Gerekli'
                      : 'Planlandı'}
                  </span>

                  {/* Buton: Personel/Firma için Kanıt Ekle & Uygulandı Yap */}
                  {job.status !== 'Tamamlandi' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActionJob(job);
                          setActionCompanyTrackNo(job.companyTrackNo || '');
                        }}
                        className="text-xs h-8 rounded-lg"
                      >
                        Kanıt Ekle & Uygulandı
                      </Button>

                      {/* Teknik Sorumlu Doğrulama Butonu (Özellikle Uygulandı durumunda) */}
                      <Button
                        size="sm"
                        onClick={() => {
                          setVerifyJob(job);
                          setFollowUpTitle(`Yeni tasarıma uygun olarak 1 adet ilave nozul montajı`);
                        }}
                        className="text-xs h-8 rounded-lg bg-[#0051d5] hover:bg-[#0042b0] text-white"
                      >
                        İncele & Onayla
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Kanıt Ekleme & "Uygulandı" Modalı */}
      <Dialog open={!!actionJob} onOpenChange={() => setActionJob(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              Saha Aksiyonu ve Fotoğraflı Kanıt Girişi
            </DialogTitle>
            <DialogDescription>
              İş tanımına istinaden yapılan onarım veya temin edilen dokümana ait görsel kanıtları yükleyin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                İş Tanımı:
              </span>
              <p className="text-slate-600 dark:text-slate-400">{actionJob?.title}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Firma Takip / Servis Fişi No
              </label>
              <Input
                placeholder="Ör: SRV-2026-9912"
                value={actionCompanyTrackNo}
                onChange={(e) => setActionCompanyTrackNo(e.target.value)}
                className="h-9 mt-1 text-xs font-mono"
              />
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <ImageUploadWithPreview
                facilityId={actionJob?.location?.facility?.id || selectedFacilityId}
                facilityName={activeFac?.name}
                photos={actionEvidences}
                onChange={setActionEvidences}
                label="Onarım / Kanıt Fotoğrafları"
                description="Tamamlanan işin net çekilmiş fotoğrafını yükleyin."
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setActionJob(null)}>
              İptal
            </Button>
            <Button
              onClick={() => submitActionMutation.mutate()}
              disabled={submitActionMutation.isPending || actionEvidences.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {submitActionMutation.isPending ? 'İşleniyor...' : 'Uygulandı Olarak Bildir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teknik Sorumlu İnceleme & Onay Modalı */}
      <Dialog open={!!verifyJob} onOpenChange={() => setVerifyJob(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0051d5]" />
              Teknik Sorumlu Doğrulama Ekranı
            </DialogTitle>
            <DialogDescription>
              Yüklenen kanıtları değerlendirerek işi nihai olarak onaylayın veya revizyon notuyla sahaya iade edin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
                {verifyJob?.sourceCode} — {verifyJob?.location?.systemUid}
              </span>
              <p className="text-slate-600 dark:text-slate-400">{verifyJob?.title}</p>
            </div>

            {/* Kanıt Önizleme */}
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Sunulan Kanıtlar:
              </span>
              {verifyJob?.evidences?.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {verifyJob.evidences.map((ev: any) => (
                    <a
                      key={ev.id}
                      href={ev.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="aspect-square rounded-lg border border-slate-200 overflow-hidden block hover:opacity-90"
                    >
                      <img src={ev.fileUrl} alt="Kanıt" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-amber-600 italic">
                  Henüz bu iş için fotoğraflı kanıt yüklenmemiştir.
                </p>
              )}
            </div>

            {/* Düzeltme İstenirse Zorunlu Not */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Revizyon / Ret Gerekçesi (Düzeltme İsteniyorsa Zorunlu)
              </label>
              <Input
                placeholder="Ör: Fitil yenilenmiş ancak kasa kenarında hala sızıntı boşluğu var..."
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                className="h-9 mt-1 text-xs"
              />
            </div>

            {/* Spesifikasyon Bölüm 9.2: Doküman işinden Fiziksel İş Doğurma */}
            {verifyJob?.trackLane === 'Dokuman' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-blue-950 dark:text-blue-200">
                  <input
                    type="checkbox"
                    checked={createPhysicalFollowUp}
                    onChange={(e) => setCreatePhysicalFollowUp(e.target.checked)}
                    className="rounded text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>Doküman incelemesi sahada yeni bir fiziksel tadilat gerektiriyor</span>
                </label>

                {createPhysicalFollowUp && (
                  <div className="pt-1">
                    <label className="text-[11px] font-medium text-blue-800 dark:text-blue-300">
                      Açılacak Yeni Fiziksel İş Tanımı:
                    </label>
                    <Input
                      value={followUpTitle}
                      onChange={(e) => setFollowUpTitle(e.target.value)}
                      className="h-8 text-xs bg-white mt-1"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => verifyMutation.mutate('Revize_Gerekli')}
              disabled={!revisionNote || verifyMutation.isPending}
              className="text-xs text-red-600 border-red-300 hover:bg-red-50 w-full sm:w-auto"
            >
              Düzeltme İste (Sahaya İade)
            </Button>

            <Button
              onClick={() => verifyMutation.mutate('Tamamlandi')}
              disabled={verifyMutation.isPending}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
            >
              {verifyMutation.isPending ? 'Onaylanıyor...' : 'Onayla ve Tamamlandı Olarak Kapat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
