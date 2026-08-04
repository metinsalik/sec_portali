import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ClipboardCheck, CalendarCheck } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AssignmentModal } from './AssignmentModal';

export default function TemplateListPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [assignmentModal, setAssignmentModal] = useState<{ open: boolean; templateId: string | null; templateTitle: string }>({
    open: false, templateId: null, templateTitle: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/checklists/templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu şablonu silmek istediğinize emin misiniz?')) {
      try {
        await api.delete(`/checklists/templates/${id}`);
        fetchTemplates();
      } catch (error) {
        console.error('Error deleting template', error);
      }
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kontrol Listesi Şablonları</h1>
          <p className="text-muted-foreground">Saha denetimleri için şablon oluşturun ve yönetin.</p>
        </div>
        <Button onClick={() => navigate('/checklists/templates/new')} className="gap-2">
          <Plus className="w-4 h-4" />
          Yeni Şablon Oluştur
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-emerald-500" />
                {template.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="line-clamp-2 mb-4">
                {template.description || 'Açıklama yok.'}
              </CardDescription>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Sürüm: {template.version}</span>
                <span>Kullanım: {template._count?.submissions || 0}</span>
              </div>
              <div className="mt-4 flex gap-2 justify-end">
                <Button variant="secondary" size="sm" onClick={() => setAssignmentModal({ open: true, templateId: template.id, templateTitle: template.title })}>
                  <CalendarCheck className="w-4 h-4 mr-2" />
                  Görevlendir
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate(`/checklists/templates/${template.id}`)}>
                  Detay
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate(`/checklists/templates/${template.id}/edit`)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(template.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {templates.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            Henüz oluşturulmuş bir şablon bulunmuyor.
          </div>
        )}
      </div>

      <AssignmentModal 
        open={assignmentModal.open} 
        onOpenChange={(open) => setAssignmentModal({ ...assignmentModal, open })} 
        templateId={assignmentModal.templateId}
        templateTitle={assignmentModal.templateTitle}
      />
    </div>
  );
}
