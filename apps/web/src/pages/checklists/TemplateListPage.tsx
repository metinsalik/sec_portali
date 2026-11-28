import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  ClipboardCheck,
  Send,
  Folder,
  FolderOpen,
  Eye,
  LayoutGrid,
  FileText,
  BarChart2,
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AssignmentModal } from './AssignmentModal';
import { TemplateGroupModal } from './TemplateGroupModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function TemplateListPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const [assignmentModal, setAssignmentModal] = useState<{
    open: boolean;
    templateId: string | null;
    templateTitle: string;
  }>({
    open: false,
    templateId: null,
    templateTitle: '',
  });

  const [groupModal, setGroupModal] = useState<{ open: boolean; groupId: string | null }>({
    open: false,
    groupId: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [templatesRes, groupsRes] = await Promise.all([
        api.get('/checklists/templates'),
        api.get('/checklists/groups'),
      ]);
      const [templatesData, groupsData] = await Promise.all([
        templatesRes.json(),
        groupsRes.json(),
      ]);
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
      setGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (error) {
      console.error('Error fetching data', error);
      toast.error('Veriler yüklenirken bir hata oluştu.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/checklists/templates/${id}`);
      toast.success('Şablon başarıyla silindi.');
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting template', error);
      toast.error('Şablon silinirken bir hata oluştu.');
    }
  };

  const filteredTemplates = selectedGroupId
    ? templates.filter((t) => t.groupId === selectedGroupId)
    : templates;

  return (
    <div className="max-w-[1400px] mx-auto space-y-5 pb-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Şablon ve Grup Yönetimi
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Kontrol listesi şablonları oluşturun, tesislere anlık veya periyodik olarak gönderin.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGroupModal({ open: true, groupId: null })}
            className="h-9 text-xs gap-1.5"
          >
            <Folder className="w-3.5 h-3.5" />
            Kategori (Grup) Ekle
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/checklists/templates/new')}
            className="h-9 text-xs gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Yeni Şablon Oluştur
          </Button>
        </div>
      </div>

      {/* GROUP FILTER BAR */}
      <div className="bg-muted/30 p-1.5 rounded-lg border border-border/80">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          <Button
            variant={selectedGroupId === null ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedGroupId(null)}
            className="h-8 text-xs whitespace-nowrap gap-1.5"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Tüm Şablonlar
            <Badge variant="outline" className="ml-1 text-[10px] tabular-nums">
              {templates.length}
            </Badge>
          </Button>

          <Separator orientation="vertical" className="h-6 my-auto" />

          {groups.map((g) => (
            <Button
              key={g.id}
              variant={selectedGroupId === g.id ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedGroupId(g.id)}
              className="h-8 text-xs whitespace-nowrap gap-1.5"
            >
              {selectedGroupId === g.id ? (
                <FolderOpen className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              {g.name}
            </Button>
          ))}
        </div>
      </div>

      {/* TEMPLATES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className="group rounded-lg border-border/80 hover:border-primary/40 transition-all duration-200 flex flex-col bg-card"
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1.5 min-w-0">
                  {template.group && (
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold">
                      {template.group.name}
                    </Badge>
                  )}
                  <CardTitle className="text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                    {template.title}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 pb-3">
              <CardDescription className="line-clamp-2 text-xs min-h-[34px]">
                {template.description || 'Bu şablon için açıklama girilmemiş.'}
              </CardDescription>

              <div className="mt-4 flex items-center gap-3 text-[11px] font-medium text-muted-foreground tabular-nums">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  v{template.version}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <BarChart2 className="w-3.5 h-3.5" />
                  {template._count?.submissions || 0} denetim
                </span>
              </div>
            </CardContent>

            <CardFooter className="pt-3 pb-3.5 px-4 border-t border-border/60 bg-muted/20 flex flex-wrap gap-2 justify-between items-center">
              <Button
                size="sm"
                onClick={() =>
                  setAssignmentModal({
                    open: true,
                    templateId: template.id,
                    templateTitle: template.title,
                  })
                }
                className="h-8 text-xs gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Tesislere Gönder
              </Button>

              <div className="flex items-center gap-1">
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/checklists?templateId=${template.id}`)}
                        className="h-8 w-8 text-primary"
                      >
                        <BarChart2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Konsolide Sonuçlar</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/checklists/templates/${template.id}/preview`)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Şablon Önizleme</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/checklists/templates/${template.id}/edit`)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Düzenle</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget({ id: template.id, title: template.title })}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Sil</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg bg-muted/15">
          <ClipboardCheck className="w-8 h-8 text-muted-foreground mb-3" />
          <h3 className="text-sm font-semibold text-foreground mb-1">Şablon Bulunamadı</h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-4">
            {selectedGroupId
              ? 'Seçili gruba ait kontrol listesi şablonu bulunmuyor.'
              : 'Henüz bir şablon oluşturulmamış. Yeni bir şablon oluşturarak başlayın.'}
          </p>
          <Button size="sm" onClick={() => navigate('/checklists/templates/new')} className="gap-1.5">
            <Plus className="w-4 h-4" />
            İlk Şablonu Oluştur
          </Button>
        </div>
      )}

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

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Şablonu Sil</DialogTitle>
            <DialogDescription className="text-xs">
              <strong>{deleteTarget?.title}</strong> şablonunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              İptal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
            >
              Evet, Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
