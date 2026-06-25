import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

const SoruBankasiExcel = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    const facilityId = localStorage.getItem('activeFacilityId');
    if (!facilityId) return;
    try {
      const res = await api.get(`/bina-turu/soru-bankasi?facilityId=${facilityId}`);
      setQuestions(await res.json());
    } catch (err) {
      toast.error('Sorular alınamadı.');
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Mevcut Soru Bankası ({questions.length} Soru)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="p-3 font-medium">Ana Grup</th>
                  <th className="p-3 font-medium">Denetlenen Alan</th>
                  <th className="p-3 font-medium">Kategori</th>
                  <th className="p-3 font-medium">Kriter/Soru</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id} className="border-t">
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
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">Henüz soru eklenmemiş.</td>
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
