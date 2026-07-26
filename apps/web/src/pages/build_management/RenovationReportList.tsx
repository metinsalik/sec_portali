import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRenovationReports, deleteRenovationReport } from '@/services/renovationReportApi';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Edit, Eye, Trash2, Calendar, MapPin, Building } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

interface Props {
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
}

export default function RenovationReportList({ onCreateNew, onEdit, onView }: Props) {
  const [facilityId, setFacilityId] = React.useState(localStorage.getItem('activeFacilityId'));

  React.useEffect(() => {
    const handleFacilityChange = () => {
      setFacilityId(localStorage.getItem('activeFacilityId'));
    };
    window.addEventListener('facilityChanged', handleFacilityChange);
    return () => window.removeEventListener('facilityChanged', handleFacilityChange);
  }, []);

  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ['renovation-reports', facilityId],
    queryFn: () => getRenovationReports(facilityId || ''),
    enabled: !!facilityId
  });

  const handleDelete = async (id: string) => {
    if (confirm('Bu raporu silmek istediğinize emin misiniz?')) {
      try {
        await deleteRenovationReport(id);
        toast.success('Rapor başarıyla silindi');
        refetch();
      } catch (error) {
        toast.error('Rapor silinirken bir hata oluştu');
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">İnşaat Renovasyon Teslim Raporları</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Tesisinizdeki renovasyon teslim raporlarını yönetin</p>
        </div>
        <Button onClick={onCreateNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Yeni Rapor Oluştur
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : reports?.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <Building className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Henüz Rapor Bulunmuyor</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Bu tesise ait herhangi bir inşaat renovasyon teslim raporu bulunamadı.</p>
          <Button onClick={onCreateNew} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            İlk Raporu Oluştur
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports?.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{report.projectName || 'İsimsiz Proje'}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1.5">
                      <MapPin className="w-3.5 h-3.5" /> {report.location || 'Lokasyon Belirtilmemiş'}
                    </CardDescription>
                  </div>
                  <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                    report.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {report.status === 'COMPLETED' ? 'Tamamlandı' : 'Taslak'}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>Değerlendirme: {report.assessmentDate ? format(new Date(report.assessmentDate), 'dd MMMM yyyy', { locale: tr }) : '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>Rapor Tarihi: {report.reportDate ? format(new Date(report.reportDate), 'dd MMMM yyyy', { locale: tr }) : '-'}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="ghost" size="sm" onClick={() => onView(report.id)} className="gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    <Eye className="w-4 h-4" /> Görüntüle
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(report.id)} className="gap-1.5">
                    <Edit className="w-4 h-4" /> Düzenle
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(report.id)} className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
