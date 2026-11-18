import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogCancel 
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, AlertTriangle, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BulkDeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confirmUsername: string) => Promise<void> | void;
  title?: string;
  description?: string;
  itemCount?: number;
  itemName?: string;
  isDeleting?: boolean;
}

export const BulkDeleteConfirmDialog: React.FC<BulkDeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Toplu Silme Onayı',
  description,
  itemCount,
  itemName = 'kayıt',
  isDeleting = false,
}) => {
  const { user } = useAuth();
  const [typedUsername, setTypedUsername] = useState('');

  // Sadece Admin ve Yöneticiler toplu silme yapabilir
  const hasAdminAccess = Boolean(
    user?.isAdmin || 
    user?.isManagement || 
    user?.roles?.includes('admin') || 
    user?.roles?.includes('management')
  );

  const targetUsername = user?.username || '';
  const isMatch = Boolean(
    targetUsername && 
    typedUsername.trim().toLowerCase() === targetUsername.trim().toLowerCase()
  );

  // Modal her açıldığında inputu sıfırla
  useEffect(() => {
    if (isOpen) {
      setTypedUsername('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!isMatch || isDeleting) return;
    await onConfirm(typedUsername.trim());
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <AlertDialogContent className="rounded-2xl border border-destructive/30 shadow-2xl max-w-md p-6 bg-background">
        <AlertDialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0 border border-destructive/20">
              {hasAdminAccess ? <Trash2 className="w-5 h-5 text-destructive" /> : <ShieldAlert className="w-5 h-5 text-destructive" />}
            </div>
            <div>
              <AlertDialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                {title}
              </AlertDialogTitle>
              {typeof itemCount === 'number' && (
                <span className="text-xs font-semibold text-destructive">
                  {itemCount} adet {itemName} seçildi
                </span>
              )}
            </div>
          </div>

          {!hasAdminAccess ? (
            /* Yetkisiz Kullanıcı Uyarısı */
            <div className="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Yetki Yetersiz</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  Toplu silme işlemi yalnızca sistem yöneticileri (Admin / Yönetim) tarafından yapılabilir. Tek tek kayıt silme işlemlerine devam edebilirsiniz.
                </p>
              </div>
            </div>
          ) : (
            /* Yönetici Güvenlik Onay Adımı */
            <div className="space-y-3 pt-1">
              <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-xl text-xs space-y-1 text-destructive">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  <span>DİKKAT: Kalıcı ve Geri Alınamaz İşlem</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {description || `Seçilen ${itemCount ? `${itemCount} adet ` : ''}${itemName} sistemden kalıcı olarak silinecektir. Yanlışlıkla silmeyi önlemek için ek güvenlik doğrulaması gerekmektedir.`}
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-medium text-foreground block">
                  İşlemi onaylamak için kullanıcı adınızı (
                  <span className="font-bold font-mono text-primary select-all">
                    {targetUsername}
                  </span>
                  ) yazınız:
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={typedUsername}
                    onChange={(e) => setTypedUsername(e.target.value)}
                    placeholder={targetUsername}
                    disabled={isDeleting}
                    autoFocus
                    className={cn(
                      "text-xs h-9 font-mono pr-8 transition-all",
                      isMatch 
                        ? "border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-500/5" 
                        : typedUsername 
                          ? "border-destructive/60 ring-1 ring-destructive/20" 
                          : ""
                    )}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && isMatch && !isDeleting) {
                        e.preventDefault();
                        handleConfirm();
                      }
                    }}
                  />
                  {isMatch && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-2.5 top-2.5" />
                  )}
                </div>

                <div className="text-[11px]">
                  {isMatch ? (
                    <span className="text-emerald-600 font-medium">✓ Kullanıcı adı doğrulandı.</span>
                  ) : typedUsername ? (
                    <span className="text-destructive font-medium">Kullanıcı adı eşleşmiyor.</span>
                  ) : (
                    <span className="text-muted-foreground">Devam etmek için kullanıcı adınızı eksiksiz yazmalısınız.</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
          <AlertDialogCancel 
            disabled={isDeleting} 
            className="text-xs h-8 rounded-xl"
            onClick={onClose}
          >
            Vazgeç
          </AlertDialogCancel>

          {hasAdminAccess && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={!isMatch || isDeleting}
              onClick={handleConfirm}
              className="text-xs h-8 rounded-xl gap-1.5 font-bold shadow-xs bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Siliniyor...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Toplu Sil</span>
                </>
              )}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
