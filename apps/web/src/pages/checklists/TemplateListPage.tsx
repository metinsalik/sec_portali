import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ClipboardCheck, CalendarCheck, Folder, FolderOpen, Eye, LayoutGrid, FileText, Settings, BarChart2 } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AssignmentModal } from './AssignmentModal';
import { TemplateGroupModal } from './TemplateGroupModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

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
      toast.error('Veriler yüklenirken bir hata oluştu.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu şablonu silmek istediğinize emin misiniz?')) {
      try {
        await api.delete(`/checklists/templates/${id}`);
        toast.success('Şablon başarıyla silindi.');
        fetchData();
      } catch (error) {
        console.error('Error deleting template', error);
        toast.error('Şablon silinirken bir hata oluştu.');
      }
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (confirm('Bu grubu silmek istediğinize emin misiniz? Grubun içindeki şablonlar silinmez, ancak kategorisiz kalır. Devam etmek istiyor musunuz?')) {
      try {
        await api.delete(`/checklists/groups/${id}`);
        if (selectedGroupId === id) setSelectedGroupId(null);
        toast.success('Grup silindi.');
        fetchData();
      } catch (error: any) {
        console.error('Error deleting group', error);
        toast.error(error.message || 'Grup silinirken hata oluştu');
      }
    }
  };

  const filteredTemplates = selectedGroupId
    ? templates.filter(t => t.groupId === selectedGroupId)
    : templates;

  return (
    <div className="container mx-auto p-6 max-w-[1400px] space-y-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Şablon Yönetimi</h1>
          </div>
          <p className="text-slate-500 text-lg ml-12">
            Saha denetimleri için kontrol listesi şablonları oluşturun, gruplayın ve yönetin.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => setGroupModal({ open: true, groupId: null })} className="gap-2 h-11 px-5 border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-semibold transition-all">
            <Folder className="w-4 h-4" />
            Kategori (Grup) Ekle
          </Button>
          <Button onClick={() => navigate('/checklists/templates/new')} className="gap-2 h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm hover:shadow font-semibold transition-all">
            <Plus className="w-5 h-5" />
            Yeni Şablon Oluştur
          </Button>
        </div>
      </div>

      {/* FILTER (GROUPS) SECTION */}
      <div className="bg-slate-50/50 p-2 rounded-2xl border border-slate-100">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Button 
            variant={selectedGroupId === null ? "default" : "ghost"} 
            onClick={() => setSelectedGroupId(null)}
            className={`whitespace-nowrap px-6 rounded-xl font-semibold transition-all ${selectedGroupId === null ? 'bg-white text-indigo-700 shadow-sm border border-slate-200 hover:bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Tüm Şablonlar
            <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 border-none">{templates.length}</Badge>
          </Button>
          
          <Separator orientation="vertical" className="h-8 my-auto mx-1" />
          
          {groups.map(g => (
            <div key={g.id} className="flex items-center group">
              <Button 
                variant={selectedGroupId === g.id ? "default" : "ghost"} 
                onClick={() => setSelectedGroupId(g.id)}
                className={`whitespace-nowrap px-5 rounded-xl font-medium transition-all gap-2 ${selectedGroupId === g.id ? 'bg-white text-indigo-700 shadow-sm border border-slate-200 hover:bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
              >
                {selectedGroupId === g.id ? <FolderOpen className="w-4 h-4 text-indigo-500" /> : <Folder className="w-4 h-4" />}
                {g.name}
              </Button>
              {/* Optional: Add a small delete button for the group visible on hover */}
            </div>
          ))}
        </div>
      </div>

      {/* TEMPLATES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-slate-200 flex flex-col rounded-2xl overflow-hidden bg-white">
            
            <CardHeader className="pb-4 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-50 to-transparent opacity-50 rounded-bl-full pointer-events-none" />
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1 z-10">
                  {template.group && (
                    <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 uppercase text-[10px] tracking-wider font-bold mb-2">
                      {template.group.name}
                    </Badge>
                  )}
                  <CardTitle className="text-xl font-bold leading-tight text-slate-800 group-hover:text-indigo-700 transition-colors">
                    {template.title}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 pb-4">
              <CardDescription className="line-clamp-2 text-sm text-slate-500 leading-relaxed min-h-[40px]">
                {template.description || 'Bu şablon için herhangi bir açıklama girilmemiş.'}
              </CardDescription>
              
              <div className="mt-6 flex items-center gap-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Sürüm: v{template.version}
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <div className="flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5" />
                  Kullanım: {template._count?.submissions || 0}
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-4 pb-5 px-6 border-t bg-slate-50/50 flex flex-wrap gap-2 justify-between items-center">
              
              <Button 
                onClick={() => setAssignmentModal({ open: true, templateId: template.id, templateTitle: template.title })}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm font-semibold h-9 px-4 gap-2 transition-all"
              >
                <CalendarCheck className="w-4 h-4" />
                Görevlendir
              </Button>

              <div className="flex items-center gap-1">
                <TooltipProvider delayDuration={200}>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/checklists/templates/${template.id}`)} className="h-9 w-9 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg">
                        <BarChart2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Analiz ve İstatistikler</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/checklists/templates/${template.id}/preview`)} className="h-9 w-9 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Şablon Önizleme</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/checklists/templates/${template.id}/edit`)} className="h-9 w-9 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Şablonu Düzenle</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)} className="h-9 w-9 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-rose-600 text-white border-rose-600">Sil</TooltipContent>
                  </Tooltip>

                </TooltipProvider>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
        
      {filteredTemplates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <ClipboardCheck className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Şablon Bulunamadı</h3>
          <p className="text-slate-500 max-w-sm mb-6">
            {selectedGroupId 
              ? "Seçtiğiniz gruba ait henüz bir kontrol listesi şablonu oluşturulmamış." 
              : "Sistemde henüz oluşturulmuş bir şablon bulunmuyor. Yeni bir şablon oluşturarak başlayın."}
          </p>
          <Button onClick={() => navigate('/checklists/templates/new')} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-6 h-11 font-semibold shadow-sm">
            <Plus className="w-5 h-5 mr-2" />
            İlk Şablonu Oluştur
          </Button>
        </div>
      )}

      {/* MODALS */}
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
