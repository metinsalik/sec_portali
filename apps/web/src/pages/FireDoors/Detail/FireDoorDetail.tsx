import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api, { BASE_URL } from '@/lib/api';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardCheck, ArrowLeft, Info, Calendar } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '../../../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';

export default function FireDoorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: door, isLoading: doorLoading } = useQuery({
    queryKey: ['fireDoor', id],
    queryFn: async () => {
      const res = await api.get(`/safety-management/fire-doors/doors/${id}`);
      return res.json();
    },
  });

  const { data: propertiesData } = useQuery({
    queryKey: ['fireDoorProperties'],
    queryFn: async () => {
      const res = await api.get('/safety-management/fire-doors/settings/properties');
      return res.json();
    },
  });

  const { data: inspections, isLoading: inspectionsLoading } = useQuery({
    queryKey: ['fireDoorInspections', id],
    queryFn: async () => {
      const res = await api.get(`/safety-management/fire-doors/doors/${id}/inspections`);
      return res.json();
    },
  });

  if (doorLoading) return <div className="p-6">Yükleniyor...</div>;
  if (!door) return <div className="p-6">Kapı bulunamadı.</div>;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 dark:bg-slate-950/50 pb-12">
      {/* Premium Hero Section */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10" />
        <div className="container mx-auto px-6 py-10 relative z-10">
          <div className="flex flex-col lg:flex-row gap-8 justify-between items-start lg:items-center">
            
            <div className="flex gap-6 items-start">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => navigate('/safety-management/fire-doors/list')}
                className="mt-1 rounded-full w-10 h-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur border-slate-200 dark:border-slate-700 shadow-sm hover:shadow hover:-translate-x-0.5 transition-all"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </Button>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Kapı: {door.doorNo || door.id}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold border border-blue-200 dark:border-blue-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-500"></span>
                    {door.status}
                  </span>
                </div>
                
                <p className="text-base text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                  {door.properties?.Bina ? `${door.properties.Bina || ''} > ${door.properties.Kat || ''} > ${door.properties.Departman || ''} > ${door.properties.Mahal || ''}` : 'Lokasyon Belirtilmemiş'}
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button 
                    onClick={() => navigate(`/safety-management/fire-doors/${door.id}/inspection`)}
                    className="h-10 px-5 text-sm rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                  >
                    <ClipboardCheck className="mr-2 h-4 w-4" /> Yeni Denetim Başlat
                  </Button>
                  
                  {inspections && inspections.length > 0 && (
                    <Button 
                      onClick={() => navigate(`/safety-management/fire-doors/${door.id}/inspection?inspectionId=${inspections[0].id}`)}
                      variant="outline"
                      className="h-10 px-5 text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-all hover:-translate-y-0.5"
                    >
                      <ClipboardCheck className="mr-2 h-4 w-4 text-slate-500" /> Son Denetimi Düzenle
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-4 rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-sm">
              <div className="text-center px-4 border-r border-slate-200 dark:border-slate-700">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Harf Notu</div>
                <div className={`text-4xl font-black ${
                  door.lastGrade === 'A' ? 'text-emerald-500' : 
                  door.lastGrade === 'F' ? 'text-rose-500' : 
                  'text-amber-500'
                }`}>
                  {door.lastGrade || '?'}
                </div>
              </div>
              <div className="text-center px-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Puan</div>
                <div className="text-3xl font-bold text-slate-700 dark:text-slate-200 mt-1">
                  {door.lastScore ?? '-'}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl mt-6">
        <div className="grid gap-6 lg:grid-cols-3 items-start">
          
          {/* Left Column: Properties & Image */}
          <div className="space-y-6 lg:col-span-1">
            {door.photoUrl && (
              <Card className="overflow-hidden border-0 shadow-md rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle className="text-lg flex items-center">Kapı Görseli</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Dialog>
                      <DialogTrigger asChild>
                          <img src={BASE_URL + door.photoUrl} alt="Kapı" className="w-full aspect-video object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
                          <img src={BASE_URL + door.photoUrl} alt="Kapı" className="w-full h-auto max-h-[85vh] object-contain" />
                      </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-md rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" /> Özellikler
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">QR Kod</div>
                    <div className="font-medium text-slate-900 dark:text-slate-200">{door.qrCode || '-'}</div>
                  </div>
                  {door.properties && Object.entries(door.properties).map(([key, value]) => {
                      if (['Bina', 'Kat', 'Departman', 'Mahal'].includes(key)) return null;
                      const propDef = propertiesData?.find((p: any) => p.id === key);
                      const displayKey = propDef ? propDef.name : key;
                      return (
                        <div key={key} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 line-clamp-1">{displayKey}</div>
                          <div className="font-medium text-slate-900 dark:text-slate-200 line-clamp-2">{String(value)}</div>
                        </div>
                      );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Checklists and History */}
          <div className="space-y-6 lg:col-span-2">
            
            {inspections && inspections.length > 0 && (
              <Card className="border-0 shadow-md rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-3 pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-primary" /> Son Denetim Raporu
                      </CardTitle>
                      <CardDescription className="mt-0.5 text-xs">
                        {new Date(inspections[0].inspectionDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihinde yapıldı.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {inspections[0].items?.map((item: any, idx: number) => (
                        <div key={item.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row justify-between gap-4">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-start gap-3">
                                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-xs">
                                    {idx + 1}
                                  </span>
                                  <p className="font-medium text-slate-900 dark:text-slate-200 text-sm leading-snug pt-0.5">
                                    {item.question?.text || 'Bilinmeyen Soru'}
                                  </p>
                                </div>

                                {item.comment && (
                                    <div className="ml-11 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-100 dark:border-amber-900/50 text-sm text-amber-800 dark:text-amber-200/80">
                                        <span className="font-semibold block mb-1">Denetçi Notu:</span> 
                                        {item.comment}
                                    </div>
                                )}

                                <div className="ml-11 flex flex-wrap gap-3">
                                    {item.photos && item.photos.length > 0 ? (
                                        item.photos.map((photo: string, pIdx: number) => (
                                            <Dialog key={pIdx}>
                                                <DialogTrigger asChild>
                                                    <img src={BASE_URL + photo} alt={`Fotoğraf ${pIdx + 1}`} className="w-24 h-24 object-cover rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:scale-105 hover:shadow-md transition-all" />
                                                </DialogTrigger>
                                                <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
                                                    <img src={BASE_URL + photo} alt={`Fotoğraf ${pIdx + 1}`} className="w-full h-auto max-h-[85vh] object-contain" />
                                                </DialogContent>
                                            </Dialog>
                                        ))
                                    ) : item.photoUrl ? (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <img src={BASE_URL + item.photoUrl} alt="Fotoğraf" className="w-24 h-24 object-cover rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:scale-105 hover:shadow-md transition-all" />
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
                                                <img src={BASE_URL + item.photoUrl} alt="Fotoğraf" className="w-full h-auto max-h-[85vh] object-contain" />
                                            </DialogContent>
                                        </Dialog>
                                    ) : null}
                                </div>
                            </div>
                            <div className="sm:ml-4 sm:mt-1 ml-11">
                                <span className={`inline-flex px-4 py-1.5 rounded-full text-xs font-bold shadow-sm whitespace-nowrap
                                    ${item.answer === 'PASS' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                                      item.answer === 'PARTIAL' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                                      item.answer === 'FAIL' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 
                                      'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                                    {item.answer === 'PASS' ? 'Karşılıyor' : item.answer === 'PARTIAL' ? 'Kısmen' : item.answer === 'FAIL' ? 'Karşılamıyor' : 'Kapsam Dışı'}
                                </span>
                            </div>
                        </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-md rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-slate-500" /> Geçmiş Denetimler
                </CardTitle>
                <CardDescription>Bu kapıya ait geçmiş tüm denetim raporları.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-slate-50/30 dark:bg-slate-800/30">
                      <TableHead className="font-semibold text-slate-600 pl-6">Tarih</TableHead>
                      <TableHead className="font-semibold text-slate-600">Denetçi</TableHead>
                      <TableHead className="font-semibold text-slate-600">Harf Notu</TableHead>
                      <TableHead className="font-semibold text-slate-600">Puan</TableHead>
                      <TableHead className="font-semibold text-slate-600">Notlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inspectionsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">Yükleniyor...</TableCell>
                      </TableRow>
                    ) : inspections?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">Henüz denetim yapılmamış.</TableCell>
                      </TableRow>
                    ) : (
                      inspections?.map((insp: any) => (
                        <TableRow key={insp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80">
                          <TableCell className="pl-6 font-medium">{new Date(insp.inspectionDate).toLocaleDateString('tr-TR')}</TableCell>
                          <TableCell className="text-slate-600">{insp.inspectorId}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm
                              ${insp.grade === 'A' ? 'bg-emerald-100 text-emerald-700' : 
                                insp.grade === 'F' ? 'bg-rose-100 text-rose-700' : 
                                'bg-amber-100 text-amber-700'}`}>
                              {insp.grade}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{insp.totalScore} <span className="text-slate-400 text-xs font-normal">/ {insp.maxPossibleScore}</span></TableCell>
                          <TableCell className="text-sm text-slate-500 max-w-xs truncate">{insp.notes || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
