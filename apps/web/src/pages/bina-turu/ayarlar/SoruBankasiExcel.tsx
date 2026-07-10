import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileSpreadsheet, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const SoruBankasiExcel = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    const facilityId = localStorage.getItem('activeFacilityId');
    if (!facilityId) return;
    try {
      const res = await api.get(`/bina-turu/soru-bankasi?facilityId=${facilityId}`);
      setQuestions(await res.json());
      setSelectedIds([]);
    } catch (err) {
      toast.error('Sorular alınamadı.');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(questions.map(q => q.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleDeleteBulk = async (deleteAll = false) => {
    const facilityId = localStorage.getItem('activeFacilityId');
    if (!facilityId) return;

    if (!deleteAll && selectedIds.length === 0) {
      toast.error('Lütfen silinecek soruları seçin.');
      return;
    }

    if (!confirm(deleteAll ? 'Tüm soru bankasını silmek istediğinize emin misiniz?' : 'Seçili soruları silmek istediğinize emin misiniz?')) {
      return;
    }

    setDeleting(true);
    try {
      const res = await api.customFetch('/bina-turu/soru-bankasi/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityId, ids: selectedIds, deleteAll })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Sorular silindi.');
        fetchQuestions();
      } else {
        toast.error(data.error || 'Silme işlemi başarısız.');
      }
    } catch (err) {
      toast.error('Silme işlemi sırasında hata oluştu.');
    } finally {
      setDeleting(false);
    }
  };

  const handleUpload = async () => {
    const facilityId = localStorage.getItem('activeFacilityId');
    if (!facilityId) {
      toast.error('Lütfen sol menüden işlem yapmak istediğiniz tesisi seçin.');
      return;
    }
    if (!file) {
      toast.error('Lütfen yüklenecek Excel dosyasını seçin.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('facilityId', facilityId);

    setUploading(true);
    try {
      const res = await api.customFetch('/bina-turu/soru-bankasi/excel-yukle', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Excel başarıyla yüklendi.');
        setFile(null);
        fetchQuestions();
      } else {
        toast.error(data.error || 'Yükleme başarısız.');
      }
    } catch (err) {
      toast.error('Excel yükleme sırasında bir hata oluştu.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Soru Bankası Excel Yükleme</CardTitle>
          <CardDescription>
            Soru bankasına excel dosyası yükleyerek Ana Grup, Denetlenen Alan, Kategori ve Soruları toplu olarak ekleyebilirsiniz.
            (Sütunlar: 1. Ana Grup, 2. Denetlenen Alan, 3. Soru/Kriter, 4. Kategori)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Input 
              type="file" 
              accept=".xlsx, .xls"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="max-w-md"
            />
            <Button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? (
                <span className="animate-spin mr-2">⏳</span>
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Excel Yükle
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              Mevcut Soru Bankası ({questions.length} Soru)
            </CardTitle>
          </div>
          <div className="flex gap-2">
            {selectedIds.length > 0 && (
              <Button variant="destructive" onClick={() => handleDeleteBulk(false)} disabled={deleting}>
                <Trash2 className="w-4 h-4 mr-2" />
                Seçilileri Sil ({selectedIds.length})
              </Button>
            )}
            <Button variant="destructive" onClick={() => handleDeleteBulk(true)} disabled={deleting || questions.length === 0}>
              <Trash2 className="w-4 h-4 mr-2" />
              Tüm Soruları Sil
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="p-3 w-[50px]">
                    <Checkbox 
                      checked={questions.length > 0 && selectedIds.length === questions.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="p-3 font-medium">Ana Grup</th>
                  <th className="p-3 font-medium">Denetlenen Alan</th>
                  <th className="p-3 font-medium">Kategori</th>
                  <th className="p-3 font-medium">Kriter/Soru</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id} className="border-t">
                    <td className="p-3">
                      <Checkbox 
                        checked={selectedIds.includes(q.id)}
                        onCheckedChange={(checked) => handleSelectOne(checked as boolean, q.id)}
                      />
                    </td>
                    <td className="p-3">{q.anaGrup?.ad}</td>
                    <td className="p-3">{q.denetlenenAlan?.ad}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {q.kategori?.ad}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{q.kriter}</td>
                  </tr>
                ))}
                {questions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">Henüz soru eklenmemiş.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SoruBankasiExcel;
