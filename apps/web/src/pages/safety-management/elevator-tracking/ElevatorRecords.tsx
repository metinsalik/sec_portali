import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Eye, Trash2, FileText, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { elevatorService } from '@/services/elevator.service';
import ElevatorDashboard from './components/ElevatorDashboard';
import CountdownTimer from './components/CountdownTimer';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { useNavigate, useSearchParams } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export default function ElevatorRecords() {
  const activeFacilityId = localStorage.getItem('activeFacilityId') || '';
  const [elevators, setElevators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [quickViewElevator, setQuickViewElevator] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [pdfReportUrl, setPdfReportUrl] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 20;
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = React.useMemo(() => {
    const f: any = {};
    if (searchParams.get('brand')) f.brand = searchParams.get('brand');
    if (searchParams.get('maintenanceCompany')) f.maintenanceCompany = searchParams.get('maintenanceCompany');
    if (searchParams.get('label')) f.label = searchParams.get('label');
    if (searchParams.get('type')) f.type = searchParams.get('type');
    if (searchParams.get('inspectionStatus')) f.inspectionStatus = searchParams.get('inspectionStatus');
    return f;
  }, [searchParams.toString()]);
  
  const navigate = useNavigate();

  const sortElevators = (data: any[]) => {
    const facilityGroups = data.reduce((acc: any, el: any) => {
      if (!acc[el.facilityId]) acc[el.facilityId] = [];
      acc[el.facilityId].push(el);
      return acc;
    }, {});
    const sortedResult: any[] = [];
    for (const fId in facilityGroups) {
      const group = facilityGroups[fId];
      group.sort((a: any, b: any) => (parseInt(a.elevatorNo) || 0) - (parseInt(b.elevatorNo) || 0));
      const sets: any[][] = [];
      for (const el of group) {
        let placed = false;
        for (const set of sets) {
          if (!set.some((s: any) => s.elevatorNo === el.elevatorNo)) {
            set.push(el); placed = true; break;
          }
        }
        if (!placed) sets.push([el]);
      }
      for (const set of sets) sortedResult.push(...set);
    }
    return sortedResult;
  };

  const fetchElevators = async () => {
    if (!activeFacilityId) return;
    setLoading(true);
    try {
      const data = await elevatorService.getElevatorsByFacility(activeFacilityId, filters);
      setElevators(sortElevators(data));
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching elevators:', error);
      toast.error('Asansörler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElevators();
  }, [activeFacilityId, searchParams.toString()]);

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await elevatorService.deleteElevator(deleteConfirmId);
      toast.success('Asansör silindi');
      fetchElevators();
    } catch (error) {
      toast.error('Asansör silinemedi');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const getLabelColor = (label: string) => {
    if (!label) return 'bg-gray-500 hover:bg-gray-600';
    const l = label.toLowerCase();
    if (l.includes('yeşil')) return 'bg-green-500 hover:bg-green-600';
    if (l.includes('mavi')) return 'bg-blue-500 hover:bg-blue-600';
    if (l.includes('sarı')) return 'bg-yellow-500 hover:bg-yellow-600';
    if (l.includes('kırmızı')) return 'bg-red-500 hover:bg-red-600';
    return 'bg-gray-500 hover:bg-gray-600';
  };

  const handleFilterChange = (type: string, value: string | undefined) => {
    if (value) {
      searchParams.set(type, value);
    } else {
      searchParams.delete(type);
    }
    setSearchParams(searchParams);
  };

  const handleClearFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Asansör Takip Yönetimi</h2>
        <Button onClick={() => navigate('/safety-management/elevator-tracking/new', { state: { search: searchParams.toString() } })}>
          <PlusCircle className="mr-2 h-4 w-4" /> Yeni Asansör
        </Button>
      </div>

      {!loading && (
        <ElevatorDashboard 
          elevators={elevators} 
          onFilterChange={handleFilterChange} 
          onClearFilters={handleClearFilters}
          activeFilters={filters}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Asansör Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Yükleniyor...</div>
          ) : elevators.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Kayıtlı asansör bulunamadı.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {activeFacilityId === 'all' && <TableHead>Tesis</TableHead>}
                      <TableHead>Etiket</TableHead>
                      <TableHead>Tür</TableHead>
                      <TableHead>Bakım Firması</TableHead>
                      <TableHead>Marka</TableHead>
                      <TableHead>Son Muayene</TableHead>
                      <TableHead>Sonraki Muayene</TableHead>
                      <TableHead>Rapor</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const totalPages = Math.ceil(elevators.length / ITEMS_PER_PAGE);
                      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                      const paginatedElevators = elevators.slice(startIndex, startIndex + ITEMS_PER_PAGE);
                      return paginatedElevators.map((elevator, index) => (
                        <TableRow 
                          key={elevator.id + '-' + index} 
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('button')) return;
                            setQuickViewElevator(elevator);
                          }}
                        >
                        {activeFacilityId === 'all' && (
                          <TableCell><Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">{elevator.facility?.name || '-'}</Badge></TableCell>
                        )}
                        <TableCell>
                          <Badge className={getLabelColor(elevator.label)}>{elevator.label || 'Belirsiz'}</Badge>
                        </TableCell>
                        <TableCell>
                          {elevator.type && elevator.type !== '-' ? (
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {elevator.type.split(',').map((t: string, idx: number) => (
                                <Badge 
                                  key={idx} 
                                  variant="outline" 
                                  className="px-2 py-0.5 text-[11px] font-medium bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                >
                                  {t.trim()}
                                </Badge>
                              ))}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{elevator.maintenanceCompany || '-'}</TableCell>
                        <TableCell>{elevator.brand || '-'}</TableCell>
                        <TableCell>{elevator.lastInspectionDate ? format(new Date(elevator.lastInspectionDate), 'dd.MM.yyyy') : '-'}</TableCell>
                        <TableCell>{elevator.nextInspectionDate ? format(new Date(elevator.nextInspectionDate), 'dd.MM.yyyy') : '-'}</TableCell>
                        <TableCell>
                          {elevator.reportUrl ? (
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setPdfReportUrl(BASE_URL + elevator.reportUrl); }} className="text-blue-500 hover:text-blue-700">
                              <FileText className="h-5 w-5" />
                            </Button>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/safety-management/elevator-tracking/${elevator.id}`, { state: { search: searchParams.toString() } })}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteConfirmId(elevator.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination Controls */}
              {elevators.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-b-lg">
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Toplam <span className="font-medium">{elevators.length}</span> kayıttan{' '}
                        <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> -{' '}
                        <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, elevators.length)}</span>{' '}
                        arası gösteriliyor
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <Button
                          variant="outline"
                          className="rounded-l-md px-2 py-2"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="px-4 py-2 text-sm font-semibold border-y border-gray-200">
                          {currentPage} / {Math.ceil(elevators.length / ITEMS_PER_PAGE)}
                        </div>
                        <Button
                          variant="outline"
                          className="rounded-r-md px-2 py-2"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(elevators.length / ITEMS_PER_PAGE)))}
                          disabled={currentPage >= Math.ceil(elevators.length / ITEMS_PER_PAGE)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Quick View Dialog */}
              <Dialog open={!!quickViewElevator} onOpenChange={(open) => !open && setQuickViewElevator(null)}>
                <DialogContent className={`sm:max-w-[500px] border-0 overflow-hidden ${
                  quickViewElevator?.label?.toLowerCase().includes('kırmızı') ? 'bg-red-50' :
                  quickViewElevator?.label?.toLowerCase().includes('sarı') ? 'bg-yellow-50' :
                  quickViewElevator?.label?.toLowerCase().includes('mavi') ? 'bg-blue-50' :
                  quickViewElevator?.label?.toLowerCase().includes('yeşil') ? 'bg-green-50' : 'bg-white'
                }`}>
                  <div className="absolute top-0 left-0 w-1 h-full opacity-50" style={{
                    backgroundColor: quickViewElevator?.label?.toLowerCase().includes('kırmızı') ? '#ef4444' :
                                    quickViewElevator?.label?.toLowerCase().includes('sarı') ? '#eab308' :
                                    quickViewElevator?.label?.toLowerCase().includes('mavi') ? '#3b82f6' :
                                    quickViewElevator?.label?.toLowerCase().includes('yeşil') ? '#22c55e' : '#cbd5e1'
                  }}></div>
                  <DialogHeader className="pb-4 border-b border-gray-200/50">
                    <DialogTitle className="flex justify-between items-center pr-6">
                      <span className="text-xl font-bold">{quickViewElevator?.name || 'Asansör Özeti'}</span>
                      <Badge className={getLabelColor(quickViewElevator?.label)}>{quickViewElevator?.label || 'Belirsiz'}</Badge>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-3 relative z-10">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase">Tesis</p>
                        <p className="font-semibold text-gray-900">{quickViewElevator?.facility?.name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase">Asansör No</p>
                        <p className="font-semibold text-gray-900">{quickViewElevator?.elevatorNo || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase">Tür</p>
                        {quickViewElevator?.type && quickViewElevator.type !== '-' ? (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {quickViewElevator.type.split(',').map((t: string, idx: number) => (
                              <Badge 
                                key={idx} 
                                variant="outline" 
                                className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                              >
                                {t.trim()}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="font-semibold text-gray-900">-</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase">Kapasite</p>
                        <p className="font-semibold text-gray-900">{quickViewElevator?.capacityKg} kg / {quickViewElevator?.capacityPerson} Kişi</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase">Son Muayene</p>
                        <p className="font-semibold text-gray-900">{quickViewElevator?.lastInspectionDate ? format(new Date(quickViewElevator.lastInspectionDate), 'dd.MM.yyyy') : '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase">Sonraki Muayene</p>
                        <p className="font-semibold text-gray-900">{quickViewElevator?.nextInspectionDate ? format(new Date(quickViewElevator.nextInspectionDate), 'dd.MM.yyyy') : '-'}</p>
                      </div>
                    </div>
                    {quickViewElevator?.nextInspectionDate && (
                      <div className="mt-4 relative">
                        <CountdownTimer targetDate={quickViewElevator.nextInspectionDate} />
                      </div>
                    )}
                  </div>
                  <DialogFooter className="pt-2">
                    <Button variant="outline" onClick={() => setQuickViewElevator(null)}>Kapat</Button>
                    <Button onClick={() => {
                      const id = quickViewElevator.id;
                      setQuickViewElevator(null);
                      navigate(`/safety-management/elevator-tracking/${id}`, { state: { search: searchParams.toString() } });
                    }}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Tüm Detayları Gör
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Delete Confirmation Dialog */}
              <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <DialogContent className="sm:max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle className="text-red-600">Asansörü Sil</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p>Bu asansörü sistemden kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm bakım geçmişi de silinecektir.</p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>İptal</Button>
                    <Button variant="destructive" onClick={handleDelete}>Evet, Sil</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* PDF Viewer Dialog */}
              <Dialog open={!!pdfReportUrl} onOpenChange={(open) => !open && setPdfReportUrl(null)}>
                <DialogContent className="max-w-5xl w-[90vw] h-[85vh] flex flex-col p-0 overflow-hidden">
                  <DialogHeader className="p-4 border-b flex flex-row items-center justify-between flex-none bg-white">
                    <DialogTitle>Muayene Raporu</DialogTitle>
                    <div className="mr-8 mt-0 pt-0">
                      <Button variant="outline" size="sm" onClick={() => window.open(pdfReportUrl || '', '_blank')} className="hidden sm:flex">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Yeni Sekmede Aç
                      </Button>
                    </div>
                  </DialogHeader>
                  <div className="flex-1 bg-gray-100 overflow-hidden relative">
                    {pdfReportUrl && (
                      <iframe src={pdfReportUrl} className="w-full h-full border-0 absolute inset-0" title="PDF Raporu" />
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
