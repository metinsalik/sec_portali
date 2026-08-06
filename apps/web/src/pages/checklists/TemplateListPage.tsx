import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ClipboardCheck, CalendarCheck } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Folder, FolderOpen } from 'lucide-react';
import { AssignmentModal } from './AssignmentModal';
import { TemplateGroupModal } from './TemplateGroupModal';

export default function TemplateListPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  const [assignmentModal, setAssignmentModal] = useState<{ open: boolean; templateId: string | null; templateTitle: string }>({
    open: false, templateId: null, templateTitle: ''
  });
  
  const [groupModal, setGroupModal] = useState<{ open: boolean; groupId: string | null }>({
    open: false, groupId: null
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [templatesRes, groupsRes] = await Promise.all([
        api.get('/checklists/templates'),
        api.get('/checklists/groups')
      ]);
      const [templatesData, groupsData] = await Promise.all([
        templatesRes.json(),
        groupsRes.json()
      ]);
      setTemplates(templatesData);
      setGroups(groupsData);
    } catch (error) {
      console.error('Error fetching data', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu şablonu silmek istediğinize emin misiniz?')) {
      try {
        await api.delete(`/checklists/templates/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting template', error);
      }
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (confirm('Bu grubu silmek istediğinize emin misiniz? Grubun içindeki şablonlar silinmez, ancak kategorisiz kalır. Devam etmek istiyor musunuz?')) {
      try {
        await api.delete(`/checklists/groups/${id}`);
        if (selectedGroupId === id) setSelectedGroupId(null);
        fetchData();
      } catch (error: any) {
        console.error('Error deleting group', error);
        alert(error.message || 'Grup silinirken hata oluştu');
      }
    }
  };

  const filteredTemplates = selectedGroupId
    ? templates.filter(t => t.groupId === selectedGroupId)
    : templates;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kontrol Listesi Şablonları</h1>
          <p className="text-muted-foreground">Saha denetimleri için şablon oluşturun ve yönetin.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setGroupModal({ open: true, groupId: null })} className="gap-2">
            <Folder className="w-4 h-4" />
            Yeni Grup Ekle
          </Button>
          <Button onClick={() => navigate('/checklists/templates/new')} className="gap-2">
            <Plus className="w-4 h-4" />
            Yeni Şablon Oluştur
          </Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        <Button 
          variant={selectedGroupId === null ? "default" : "outline"} 
          onClick={() => setSelectedGroupId(null)}
          className="whitespace-nowrap"
        >
          Tümü
        </Button>
        {groups.map(g => (
          <Button 
            key={g.id}
            variant={selectedGroupId === g.id ? "default" : "outline"} 
            onClick={() => setSelectedGroupId(g.id)}
            className="whitespace-nowrap gap-2"
          >
            {selectedGroupId === g.id ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
            {g.name}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
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
              {template.group && (
                <div className="mb-4">
                  <Badge variant="outline" className="gap-1 items-center">
                    <Folder className="w-3 h-3" />
                    {template.group.name}
                  </Badge>
                </div>
              )}
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
        
        {filteredTemplates.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            {selectedGroupId ? "Bu gruba ait şablon bulunamadı." : "Henüz oluşturulmuş bir şablon bulunmuyor."}
          </div>
        )}
      </div>

      <AssignmentModal 
        open={assignmentModal.open} 
        onOpenChange={(open) => setAssignmentModal({ ...assignmentModal, open })} 
        templateId={assignmentModal.templateId}
        templateTitle={assignmentModal.templateTitle}
      />

      <TemplateGroupModal 
        open={groupModal.open}
        onOpenChange={(open) => setGroupModal({ ...groupModal, open })}
        groupId={groupModal.groupId}
        onSuccess={fetchData}
      />
    </div>
  );
}
