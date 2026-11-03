import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Building2, 
  Layers, 
  MapPin, 
  Search, 
  Copy, 
  Check, 
  BookOpen,
  Hash
} from 'lucide-react';
import { 
  STANDARD_FACILITY_CODES, 
  STANDARD_FLOORS, 
  STANDARD_BLOCKS 
} from '@/data/locationStandards';
import { toast } from 'sonner';

interface StandardCodesModalProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  defaultTab?: 'facilities' | 'floors' | 'blocks';
}

export default function StandardCodesModal({
  open,
  isOpen,
  onOpenChange,
  onClose,
  defaultTab = 'facilities'
}: StandardCodesModalProps) {
  const isModalOpen = open !== undefined ? open : !!isOpen;
  const handleOpenChange = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    if (!v && onClose) onClose();
  };

  const [activeTab, setActiveTab] = useState<'facilities' | 'floors' | 'blocks'>(defaultTab);
  const [search, setSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`"${code}" panoya kopyalandı.`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredFacilities = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return STANDARD_FACILITY_CODES;
    return STANDARD_FACILITY_CODES.filter(
      f => f.name.toLowerCase().includes(q) || f.code.toLowerCase().includes(q)
    );
  }, [search]);

  const filteredFloors = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return STANDARD_FLOORS;
    return STANDARD_FLOORS.filter(
      fl => fl.name.toLowerCase().includes(q) || fl.code.toLowerCase().includes(q)
    );
  }, [search]);

  const filteredBlocks = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return STANDARD_BLOCKS;
    return STANDARD_BLOCKS.filter(
      b => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-border/60">
        <DialogHeader className="p-5 pb-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Kurumsal Standart Kodlar ve Kısaltmalar Rehberi
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Tesis, bina/blok ve kat tanımlamalarında kullanılan resmi 3 harfli ve standart kısaltma kodları.
              </DialogDescription>
            </div>
          </div>

          <div className="pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="İsim veya kısaltma koduna göre ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8.5 h-9 text-xs rounded-md bg-background"
              />
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-3 h-9 p-1 rounded-md mb-4 bg-muted/60">
              <TabsTrigger value="facilities" className="text-xs rounded-sm gap-1.5 font-medium">
                <Building2 className="w-3.5 h-3.5" />
                Tesisler ({STANDARD_FACILITY_CODES.length})
              </TabsTrigger>
              <TabsTrigger value="floors" className="text-xs rounded-sm gap-1.5 font-medium">
                <Layers className="w-3.5 h-3.5" />
                Katlar ({STANDARD_FLOORS.length})
              </TabsTrigger>
              <TabsTrigger value="blocks" className="text-xs rounded-sm gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5" />
                Bloklar ({STANDARD_BLOCKS.length})
              </TabsTrigger>
            </TabsList>

            {/* 1. Tesisler */}
            <TabsContent value="facilities" className="mt-0 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {filteredFacilities.map((f) => (
                  <div
                    key={f.code}
                    className="flex items-center justify-between p-2.5 rounded-md border border-border/60 bg-card hover:bg-muted/30 transition-colors group"
                  >
                    <span className="text-xs font-semibold text-foreground truncate pr-2" title={f.name}>
                      {f.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(f.code)}
                      className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors font-mono text-xs font-bold"
                      title="Kodu Kopyala"
                    >
                      {f.code}
                      {copiedCode === f.code ? (
                        <Check className="w-2.5 h-2.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* 2. Katlar */}
            <TabsContent value="floors" className="mt-0 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {filteredFloors.map((fl) => (
                  <div
                    key={fl.code}
                    className="flex items-center justify-between p-2.5 rounded-md border border-border/60 bg-card hover:bg-muted/30 transition-colors group"
                  >
                    <span className="text-xs font-semibold text-foreground truncate pr-2">
                      {fl.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(fl.code)}
                      className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors font-mono text-xs font-bold"
                      title="Kodu Kopyala"
                    >
                      {fl.code}
                      {copiedCode === fl.code ? (
                        <Check className="w-2.5 h-2.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* 3. Bloklar */}
            <TabsContent value="blocks" className="mt-0 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {filteredBlocks.map((b) => (
                  <div
                    key={b.code}
                    className="flex items-center justify-between p-2.5 rounded-md border border-border/60 bg-card hover:bg-muted/30 transition-colors group"
                  >
                    <span className="text-xs font-semibold text-foreground truncate pr-2">
                      {b.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(b.code)}
                      className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 transition-colors font-mono text-xs font-bold"
                      title="Kodu Kopyala"
                    >
                      {b.code}
                      {copiedCode === b.code ? (
                        <Check className="w-2.5 h-2.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { StandardCodesModal };
