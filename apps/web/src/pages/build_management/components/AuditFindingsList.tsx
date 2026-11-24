import React, { useMemo, useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Calendar,
  Building2,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  FileText,
  AlertTriangle,
  ArrowUpDown,
  Layers,
  Download,
  Camera,
  Compass,
  Tag,
  ShieldAlert,
  RotateCcw,
  ExternalLink,
  ImageOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import {
  type Finding,
  type RiskLevel,
  RISK_LEVELS,
  RISK_COLORS,
  normalizeRiskLevel,
  getRiskBadgeClass,
  getRiskBorderClass,
} from '../types';
import { ImprovementMediaLightbox } from '../../operations/improvements/ImprovementMediaManager';

type SortMode = 'LOCATION' | 'RISK_DESC' | 'NO_ASC' | 'DATE_ASC';

const RISK_PRIORITY: Record<RiskLevel, number> = {
  Kritik: 1,
  Yüksek: 2,
  Önemli: 3,
  Olası: 4,
  Önemsiz: 5,
};

interface ParsedLoc {
  building: string;
  floor: string;
  department: string;
  room: string;
}

function parseFindingLocation(f: Finding): ParsedLoc {
  const areaParts = (f.area || '')
    .split('>')
    .map((s) => s.trim())
    .filter(Boolean);

  // Deduplicate adjacent identical segments (e.g. "Ana Bina > Ana Bina")
  const dedupArea: string[] = [];
  for (const p of areaParts) {
    if (dedupArea.length === 0 || dedupArea[dedupArea.length - 1].toLocaleLowerCase('tr-TR') !== p.toLocaleLowerCase('tr-TR')) {
      dedupArea.push(p);
    }
  }

  const building = (f.building || dedupArea[0] || 'Belirtilmemiş Bina').trim();
  const floor = (f.floor || dedupArea[1] || 'Belirtilmemiş Kat').trim();
  const department = (f.department || dedupArea[2] || 'Belirtilmemiş Birim').trim();
  const room = (f.room || f.subarea || dedupArea[3] || '').trim();

  return { building, floor, department, room };
}

export function formatCleanLocation(f: Finding): string {
  const { building, floor, department, room } = parseFindingLocation(f);
  const rawParts = [building, floor, department, room].filter(
    (p) => p && !p.startsWith('Belirtilmemiş')
  );
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const part of rawParts) {
    const key = part.toLocaleLowerCase('tr-TR');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(part);
    }
  }
  return unique.length > 0 ? unique.join(' › ') : 'Lokasyon Belirtilmemiş';
}

interface AuditFindingsListProps {
  findings: Finding[];
  isPublished: boolean;
  onView: (finding: Finding) => void;
  onEdit: (finding: Finding) => void;
  onDelete: (finding: Finding) => void;
  onToggleStatus: (finding: Finding) => void;
}

export const AuditFindingsList: React.FC<AuditFindingsListProps> = ({
  findings,
  isPublished,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  // Fiziksel Kapsam & Lokasyon Gezgini state (Risk modülüyle birebir aynı 4 kademe)
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  // Bağlantılı Filtreler (Risk, Kategori, Durum, Arama, Sıralama)
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('RISK_DESC');

  const [lightboxState, setLightboxState] = useState<{
    photos: { url: string; name: string; type: string; size?: number }[];
    index: number;
  } | null>(null);
  const [previewFinding, setPreviewFinding] = useState<Finding | null>(null);

  // 1. Ön filtre (Risk + Kategori + Durum + Arama) — Lokasyon ağacındaki sayaçlar bağlantılı çalışır!
  const nonLocationFiltered = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase('tr-TR');
    return findings.filter((f) => {
      const normRisk = normalizeRiskLevel(f.risk);
      if (riskFilter !== 'ALL' && normRisk !== riskFilter) return false;
      if (categoryFilter !== 'ALL' && (f.category || 'Kategorisiz') !== categoryFilter) return false;
      if (statusFilter === 'OPEN' && f.status === 'Tamamlanan') return false;
      if (statusFilter === 'CLOSED' && f.status !== 'Tamamlanan') return false;
      if (q) {
        const loc = formatCleanLocation(f);
        const depts = (f.departments || []).join(' ');
        const hay = `${f.no} ${f.findingDesc} ${f.riskDesc || ''} ${f.recommendation || ''} ${f.category || ''} ${loc} ${depts}`.toLocaleLowerCase('tr-TR');
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [findings, riskFilter, categoryFilter, statusFilter, searchQuery]);

  // 2. Fiziksel Lokasyon Ağacı (tüm bulgulardan yapıyı kur, sayaçları aktif bağlantılı filtreden al)
  const locationTree = useMemo(() => {
    const tree: Record<
      string,
      {
        count: number;
        floors: Record<
          string,
          {
            count: number;
            depts: Record<
              string,
              {
                count: number;
                rooms: Record<string, number>;
              }
            >;
          }
        >;
      }
    > = {};

    const ensureNode = (loc: ParsedLoc) => {
      if (!tree[loc.building]) tree[loc.building] = { count: 0, floors: {} };
      if (!tree[loc.building].floors[loc.floor]) tree[loc.building].floors[loc.floor] = { count: 0, depts: {} };
      if (!tree[loc.building].floors[loc.floor].depts[loc.department]) {
        tree[loc.building].floors[loc.floor].depts[loc.department] = { count: 0, rooms: {} };
      }
      if (loc.room && tree[loc.building].floors[loc.floor].depts[loc.department].rooms[loc.room] === undefined) {
        tree[loc.building].floors[loc.floor].depts[loc.department].rooms[loc.room] = 0;
      }
    };

    findings.forEach((f) => ensureNode(parseFindingLocation(f)));
    nonLocationFiltered.forEach((f) => {
      const loc = parseFindingLocation(f);
      ensureNode(loc);
      tree[loc.building].count += 1;
      tree[loc.building].floors[loc.floor].count += 1;
      tree[loc.building].floors[loc.floor].depts[loc.department].count += 1;
      if (loc.room) {
        tree[loc.building].floors[loc.floor].depts[loc.department].rooms[loc.room] += 1;
      }
    });

    return tree;
  }, [findings, nonLocationFiltered]);

  const buildingEntries = useMemo(
    () => Object.entries(locationTree).sort(([a], [b]) => a.localeCompare(b, 'tr-TR')),
    [locationTree]
  );

  // Tek bina varsa otomatik seç (Risk ekranıyla aynı deneyim)
  useEffect(() => {
    if (buildingEntries.length === 1 && !selectedBuilding) {
      setSelectedBuilding(buildingEntries[0][0]);
    }
  }, [buildingEntries, selectedBuilding]);

  const activeBuildingNode = selectedBuilding ? locationTree[selectedBuilding] : null;
  const activeFloorNode =
    activeBuildingNode && selectedFloor ? activeBuildingNode.floors[selectedFloor] : null;
  const activeDeptNode =
    activeFloorNode && selectedDept ? activeFloorNode.depts[selectedDept] : null;

  // 3. Lokasyon kapsamındaki bulgular (Risk & Kategori bağlantılı sayaçları için)
  const locationScopedFindings = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase('tr-TR');
    return findings.filter((f) => {
      const loc = parseFindingLocation(f);
      if (selectedBuilding && loc.building !== selectedBuilding) return false;
      if (selectedFloor && loc.floor !== selectedFloor) return false;
      if (selectedDept && loc.department !== selectedDept) return false;
      if (selectedRoom && loc.room !== selectedRoom) return false;
      if (statusFilter === 'OPEN' && f.status === 'Tamamlanan') return false;
      if (statusFilter === 'CLOSED' && f.status !== 'Tamamlanan') return false;
      if (q) {
        const locStr = formatCleanLocation(f);
        const depts = (f.departments || []).join(' ');
        const hay = `${f.no} ${f.findingDesc} ${f.riskDesc || ''} ${f.recommendation || ''} ${f.category || ''} ${locStr} ${depts}`.toLocaleLowerCase('tr-TR');
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [findings, selectedBuilding, selectedFloor, selectedDept, selectedRoom, statusFilter, searchQuery]);

  // Bağlantılı Risk sayaçları (aktif lokasyon + kategori kapsamına göre)
  const riskCounts = useMemo(() => {
    const counts: Record<RiskLevel, number> = {
      Kritik: 0,
      Yüksek: 0,
      Önemli: 0,
      Olası: 0,
      Önemsiz: 0,
    };
    locationScopedFindings.forEach((f) => {
      if (categoryFilter !== 'ALL' && (f.category || 'Kategorisiz') !== categoryFilter) return;
      counts[normalizeRiskLevel(f.risk)] += 1;
    });
    return counts;
  }, [locationScopedFindings, categoryFilter]);

  // Bağlantılı Kategori sayaçları (aktif lokasyon + risk kapsamına göre)
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    findings.forEach((f) => {
      const c = f.category || 'Kategorisiz';
      if (!map.has(c)) map.set(c, 0);
    });
    locationScopedFindings.forEach((f) => {
      if (riskFilter !== 'ALL' && normalizeRiskLevel(f.risk) !== riskFilter) return;
      const c = f.category || 'Kategorisiz';
      map.set(c, (map.get(c) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'tr-TR'));
  }, [findings, locationScopedFindings, riskFilter]);

  // 4. Final Filtrelenmiş & Sıralanmış Liste
  const filteredFindings = useMemo(() => {
    return locationScopedFindings.filter((f) => {
      if (riskFilter !== 'ALL' && normalizeRiskLevel(f.risk) !== riskFilter) return false;
      if (categoryFilter !== 'ALL' && (f.category || 'Kategorisiz') !== categoryFilter) return false;
      return true;
    });
  }, [locationScopedFindings, riskFilter, categoryFilter]);

  const sortedFindings = useMemo(() => {
    const copy = [...filteredFindings];
    if (sortMode === 'RISK_DESC') {
      copy.sort((a, b) => {
        const diff = RISK_PRIORITY[normalizeRiskLevel(a.risk)] - RISK_PRIORITY[normalizeRiskLevel(b.risk)];
        return diff !== 0 ? diff : (a.no || '').localeCompare(b.no || '', 'tr-TR');
      });
    } else if (sortMode === 'NO_ASC') {
      copy.sort((a, b) => (a.no || '').localeCompare(b.no || '', 'tr-TR'));
    } else if (sortMode === 'DATE_ASC') {
      copy.sort((a, b) => {
        const da = a.targetDate ? new Date(a.targetDate).getTime() : Number.MAX_SAFE_INTEGER;
        const db = b.targetDate ? new Date(b.targetDate).getTime() : Number.MAX_SAFE_INTEGER;
        return da - db;
      });
    } else {
      copy.sort((a, b) => formatCleanLocation(a).localeCompare(formatCleanLocation(b), 'tr-TR'));
    }
    return copy;
  }, [filteredFindings, sortMode]);

  const groupedByLocation = useMemo(() => {
    if (sortMode !== 'LOCATION') return null;
    const map = new Map<string, Finding[]>();
    sortedFindings.forEach((f) => {
      const loc = formatCleanLocation(f);
      if (!map.has(loc)) map.set(loc, []);
      map.get(loc)!.push(f);
    });
    return Array.from(map.entries());
  }, [sortedFindings, sortMode]);

  const hasAnyFilter =
    Boolean(selectedFloor || selectedDept || selectedRoom) ||
    (buildingEntries.length > 1 && Boolean(selectedBuilding)) ||
    riskFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    searchQuery.trim() !== '';

  const resetAllFilters = () => {
    if (buildingEntries.length > 1) setSelectedBuilding(null);
    setSelectedFloor(null);
    setSelectedDept(null);
    setSelectedRoom(null);
    setRiskFilter('ALL');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setSearchQuery('');
  };

  const renderFindingCard = (f: Finding) => {
    const normRisk = normalizeRiskLevel(f.risk);
    const borderLeft = getRiskBorderClass(normRisk);
    const isCarryover = Boolean(f.history && f.history !== 'Yeni kayıt oluşturuldu.');
    const photos = (f.files || []).filter((file) => file.type?.startsWith('image/'));
    const docs = (f.files || []).filter((file) => !file.type?.startsWith('image/'));
    const allDepts = Array.from(
      new Set([...(f.departments || []), ...(f.steps?.map((s) => s.department) || [])])
    ).filter(Boolean);
    const isOverdue =
      f.status !== 'Tamamlanan' && Boolean(f.targetDate) && new Date(f.targetDate!) < new Date();
    const cleanLoc = formatCleanLocation(f);

    return (
      <div
        key={f.id}
        className={`bg-card border border-border rounded-lg border-l-4 ${borderLeft} overflow-hidden transition-all duration-200 hover:border-border/80 hover:shadow-xs flex flex-col sm:flex-row sm:min-h-[156px]`}
      >
        {/* Sol: Kart Yüksekliğinde Kapak Görseli (Yoksa Sabit Placeholder) */}
        <div className="sm:w-[156px] shrink-0 border-b sm:border-b-0 sm:border-r border-border/60 bg-muted/25 relative">
          {photos.length > 0 ? (
            <button
              type="button"
              onClick={() => setLightboxState({ photos, index: 0 })}
              className="relative group w-full h-36 sm:h-full block overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title="Fotoğrafları önizle ve gez"
            >
              <img
                src={photos[0].url}
                alt={photos[0].name}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white">
                <Eye className="w-5 h-5" />
              </span>
              {photos.length > 1 && (
                <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-semibold inline-flex items-center gap-1 tabular-nums">
                  <Camera className="w-3 h-3" /> {photos.length}
                </span>
              )}
            </button>
          ) : (
            <div className="w-full h-24 sm:h-full flex flex-col items-center justify-center gap-1.5 p-3 text-center text-muted-foreground/60 select-none">
              <ImageOff className="w-5 h-5 opacity-60" />
              <span className="text-[11px] leading-tight">Görseli bulunmamaktadır</span>
            </div>
          )}
        </div>

        {/* Orta: Sade & Okunaklı Özet İçerik */}
        <div className="flex-1 min-w-0 p-3.5 sm:p-4 flex flex-col justify-between gap-2.5">
          {/* Üst Rozet Satırı */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-foreground tabular-nums tracking-tight mr-0.5">
              {f.no}
            </span>
            <Badge className={`text-[11px] border py-0 h-5 ${getRiskBadgeClass(normRisk)}`}>
              {normRisk}
            </Badge>
            {f.category && (
              <Badge variant="outline" className="text-[11px] py-0 h-5 font-normal text-muted-foreground">
                {f.category}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={`text-[10px] py-0 h-5 gap-1 ${
                f.status === 'Tamamlanan'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                  : f.status === 'Kısmen İyileştirilen'
                  ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
              }`}
            >
              {f.status === 'Tamamlanan' ? (
                <CheckCircle className="w-2.5 h-2.5" />
              ) : (
                <AlertTriangle className="w-2.5 h-2.5" />
              )}
              {f.status || 'Yeni Tespit Edilen'}
            </Badge>
            {isCarryover && (
              <Badge
                variant="outline"
                className="text-[10px] py-0 h-5 bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30"
              >
                Devreden
              </Badge>
            )}
            {sortMode !== 'LOCATION' && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground ml-auto max-w-[280px] truncate">
                <MapPin className="w-3 h-3 shrink-0 text-primary/70" />
                <span className="truncate">{cleanLoc}</span>
              </span>
            )}
          </div>

          {/* Belirgin Tespit + Risk (Yan Yana, Maks. 2 Satır) & Öneri (Altında, Maks. 2 Satır) */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/70 block mb-0.5">
                  Tespit
                </span>
                <p className="text-xs sm:text-[13px] font-medium text-foreground leading-snug line-clamp-2">
                  {f.findingDesc || 'Belirtilmemiş.'}
                </p>
              </div>
              <div className="min-w-0 md:border-l md:border-border/60 md:pl-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600/80 dark:text-red-400/90 block mb-0.5">
                  Risk
                </span>
                <p className="text-xs sm:text-[13px] text-foreground/90 leading-snug line-clamp-2">
                  {f.riskDesc || 'Belirtilmemiş.'}
                </p>
              </div>
            </div>

            <div className="min-w-0 pt-1 border-t border-border/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80 block mb-0.5">
                Öneri
              </span>
              <p className="text-xs sm:text-[13px] text-foreground/90 leading-snug line-clamp-2">
                {f.recommendation || 'Belirtilmemiş.'}
              </p>
            </div>
          </div>

          {/* Alt Meta Satırı */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 border-t border-border/50 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="text-foreground/90 font-medium">
                {allDepts.length > 0 ? allDepts.join(', ') : 'Departman atanmadı'}
              </span>
            </span>
            <span
              className={`inline-flex items-center gap-1 tabular-nums ${
                isOverdue ? 'text-destructive font-semibold' : ''
              }`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              {f.targetDate ? new Date(f.targetDate).toLocaleDateString('tr-TR') : 'Termin yok'}
              {isOverdue && ' (Gecikti)'}
            </span>
            {docs.length > 0 && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <FileText className="w-3.5 h-3.5 shrink-0" /> {docs.length} doküman
              </span>
            )}
          </div>
        </div>

        {/* Sağ: Sabit İnce İkon Aksiyon Sütunu (Tooltip'li) */}
        <div className="sm:w-[46px] shrink-0 border-t sm:border-t-0 sm:border-l border-border/70 bg-muted/15 p-1.5 flex flex-row sm:flex-col items-center justify-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="default"
                size="icon"
                onClick={() => onView(f)}
                className="h-7 w-7"
                aria-label="Detay Sayfası"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              Detay Sayfası
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setPreviewFinding(f)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                aria-label="Hızlı İncele"
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              Hızlı İncele
            </TooltipContent>
          </Tooltip>

          {!isPublished && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(f)}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    aria-label="Düzenle"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs">
                  Düzenle
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleStatus(f)}
                    className={`h-7 w-7 ${
                      f.status === 'Tamamlanan'
                        ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-500/10'
                        : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10'
                    }`}
                    aria-label={f.status === 'Tamamlanan' ? 'Tekrar Aç' : 'Bulguyu Kapat'}
                  >
                    {f.status === 'Tamamlanan' ? (
                      <X className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs">
                  {f.status === 'Tamamlanan' ? 'Tekrar Aç (Geri Al)' : 'Bulguyu Kapat'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(f)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    aria-label="Bulguyu Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs">
                  Bulguyu Sil
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* ─── FİZİKSEL KAPSAM & LOKASYON GEZGİNİ + BAĞLANTILI RİSK & KATEGORİ FİLTRELERİ ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        {/* SOL (7/12): Fiziksel Kapsam & Lokasyon Gezgini (Risk ekranıyla birebir aynı kademeli yapı) */}
        <div className="xl:col-span-7 rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-3.5 py-2.5 bg-muted/30 border-b border-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Compass className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground truncate">
                Fiziksel Kapsam &amp; Lokasyon Gezgini
              </span>
            </div>
            {(selectedFloor || selectedDept || selectedRoom || (buildingEntries.length > 1 && selectedBuilding)) && (
              <button
                type="button"
                onClick={() => {
                  if (buildingEntries.length > 1) setSelectedBuilding(null);
                  setSelectedFloor(null);
                  setSelectedDept(null);
                  setSelectedRoom(null);
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 shrink-0"
              >
                <RotateCcw className="w-3 h-3" /> Kapsamı Temizle
              </button>
            )}
          </div>

          <div className="p-3.5 space-y-3">
            {/* 1. SEVİYE: BİNALAR */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" /> 1. Bina
                </span>
                <span className="text-muted-foreground/80">{buildingEntries.length} Bina</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {buildingEntries.map(([bName, bNode]) => {
                  const isSelected = selectedBuilding === bName;
                  return (
                    <button
                      key={bName}
                      type="button"
                      onClick={() => {
                        if (isSelected && buildingEntries.length > 1) {
                          setSelectedBuilding(null);
                          setSelectedFloor(null);
                          setSelectedDept(null);
                          setSelectedRoom(null);
                        } else {
                          setSelectedBuilding(bName);
                          setSelectedFloor(null);
                          setSelectedDept(null);
                          setSelectedRoom(null);
                        }
                      }}
                      className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-200 ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-2xs font-semibold'
                          : 'bg-background hover:bg-muted text-foreground border-border'
                      }`}
                    >
                      <span>{bName}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${
                          isSelected
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {bNode.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. SEVİYE: KATLAR */}
            {activeBuildingNode && (
              <div className="pt-2.5 border-t border-border/60 space-y-1.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-500" /> 2. Kat ({selectedBuilding})
                  </span>
                  <span className="text-muted-foreground/80">
                    {Object.keys(activeBuildingNode.floors).length} Kat
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(activeBuildingNode.floors).map(([fName, fNode]) => {
                    const isSelected = selectedFloor === fName;
                    return (
                      <button
                        key={fName}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedFloor(null);
                            setSelectedDept(null);
                            setSelectedRoom(null);
                          } else {
                            setSelectedFloor(fName);
                            setSelectedDept(null);
                            setSelectedRoom(null);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-200 ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                            : 'bg-background hover:bg-muted text-foreground border-border'
                        }`}
                      >
                        <span>{fName}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {fNode.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. SEVİYE: BİRİMLER */}
            {activeFloorNode && (
              <div className="pt-2.5 border-t border-border/60 space-y-1.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-500" /> 3. Birim ({selectedFloor})
                  </span>
                  <span className="text-muted-foreground/80">
                    {Object.keys(activeFloorNode.depts).length} Birim
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(activeFloorNode.depts).map(([dName, dNode]) => {
                    const isSelected = selectedDept === dName;
                    return (
                      <button
                        key={dName}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedDept(null);
                            setSelectedRoom(null);
                          } else {
                            setSelectedDept(dName);
                            setSelectedRoom(null);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-200 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-semibold'
                            : 'bg-background hover:bg-muted text-foreground border-border'
                        }`}
                      >
                        <span>{dName}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {dNode.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. SEVİYE: MAHALLER */}
            {activeDeptNode && Object.keys(activeDeptNode.rooms).length > 0 && (
              <div className="pt-2.5 border-t border-border/60 space-y-1.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" /> 4. Mahal ({selectedDept})
                  </span>
                  <span className="text-muted-foreground/80">
                    {Object.keys(activeDeptNode.rooms).length} Mahal
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(activeDeptNode.rooms).map(([rName, rCount]) => {
                    const isSelected = selectedRoom === rName;
                    return (
                      <button
                        key={rName}
                        type="button"
                        onClick={() => setSelectedRoom(isSelected ? null : rName)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-200 ${
                          isSelected
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs font-semibold'
                            : 'bg-background hover:bg-muted text-foreground border-border'
                        }`}
                      >
                        <MapPin className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-amber-500'}`} />
                        <span>{rName}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {rCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SAĞ (5/12): Bağlantılı Risk & Kategori Filtreleri (Aramalı Seçim Menüleri) */}
        <div className="xl:col-span-5 rounded-lg border border-border bg-card flex flex-col">
          <div className="px-3.5 py-2.5 bg-muted/30 border-b border-border flex items-center justify-between gap-2 rounded-t-lg">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground">
                Bağlantılı Risk &amp; Kategori Filtreleri
              </span>
            </div>
            {(riskFilter !== 'ALL' || categoryFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setRiskFilter('ALL');
                  setCategoryFilter('ALL');
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Temizle
              </button>
            )}
          </div>

          <div className="p-3.5 space-y-3 flex-1">
            {/* Risk Seviyesi (Aramalı / Renk Noktalı Açılır Menü) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Risk Seviyesi
              </label>
              <SearchableSelect
                value={riskFilter === 'ALL' ? '' : riskFilter}
                onChange={(val) => setRiskFilter(val || 'ALL')}
                options={RISK_LEVELS.map((r) => ({
                  value: r,
                  label: r,
                  dotColor: RISK_COLORS[r],
                  sublabel: `${riskCounts[r] || 0} bulgu`,
                }))}
                placeholder="Tüm risk seviyeleri"
                searchPlaceholder="Risk seviyesi ara..."
                allowClear
              />
            </div>

            {/* Kategori (Aramalı Açılır Menü) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" /> Kategori ({categoryCounts.length})
              </label>
              <SearchableSelect
                value={categoryFilter === 'ALL' ? '' : categoryFilter}
                onChange={(val) => setCategoryFilter(val || 'ALL')}
                options={categoryCounts.map(([catName, count]) => ({
                  value: catName,
                  label: catName,
                  sublabel: `${count} bulgu`,
                }))}
                placeholder="Tüm kategoriler"
                searchPlaceholder="Kategori ara..."
                allowClear
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── ARAMA, DURUM & SIRALAMA ÇUBUĞU ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 rounded-lg border border-border bg-muted/20">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Bulgu no, tespit, lokasyon veya departman ara..."
            className="h-8 pl-8 text-xs bg-background"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground hidden md:inline">
            <strong className="text-foreground tabular-nums">{filteredFindings.length}</strong> / {findings.length} bulgu
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Durum filtresi"
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="OPEN">Açık Bulgular</option>
            <option value="CLOSED">Kapatılanlar</option>
          </select>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              aria-label="Sıralama"
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="LOCATION">Lokasyon Bazlı Grupla</option>
              <option value="RISK_DESC">Risk Önceliği (Kritik → Önemsiz)</option>
              <option value="NO_ASC">Bulgu No (Artan)</option>
              <option value="DATE_ASC">Termin Tarihi (En Yakın)</option>
            </select>
          </div>

          {hasAnyFilter && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetAllFilters}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Sıfırla
            </Button>
          )}
        </div>
      </div>

      {/* ─── BULGU LİSTESİ ─── */}
      {sortedFindings.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-border rounded-lg text-xs text-muted-foreground space-y-2">
          <p>Seçili kapsam ve filtrelere uygun bulgu bulunamadı.</p>
          {hasAnyFilter && (
            <Button type="button" variant="outline" size="sm" onClick={resetAllFilters} className="h-7 text-xs">
              Tüm Filtreleri Temizle
            </Button>
          )}
        </div>
      ) : groupedByLocation ? (
        <div className="space-y-4">
          {groupedByLocation.map(([locName, locFindings]) => {
            const openCount = locFindings.filter((f) => f.status !== 'Tamamlanan').length;
            return (
              <div key={locName} className="space-y-2">
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                      {locName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="secondary" className="text-[11px] tabular-nums">
                      {locFindings.length} bulgu
                    </Badge>
                    {openCount > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[11px] tabular-nums bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                      >
                        {openCount} açık
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-2.5 pl-0 sm:pl-2">
                  {locFindings.map((f) => renderFindingCard(f))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2.5">{sortedFindings.map((f) => renderFindingCard(f))}</div>
      )}

      {/* Hızlı Önizleme Dialog'u (İncele) */}
      <Dialog open={Boolean(previewFinding)} onOpenChange={(open) => !open && setPreviewFinding(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {previewFinding && (() => {
            const pfRisk = normalizeRiskLevel(previewFinding.risk);
            const pfPhotos = (previewFinding.files || []).filter((fl) => fl.type?.startsWith('image/'));
            const pfDocs = (previewFinding.files || []).filter((fl) => !fl.type?.startsWith('image/'));
            const pfDepts = Array.from(
              new Set([
                ...(previewFinding.departments || []),
                ...(previewFinding.steps?.map((s) => s.department) || []),
              ])
            ).filter(Boolean);

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-base font-bold flex items-center gap-2 flex-wrap">
                    <span className="tabular-nums">{previewFinding.no}</span>
                    <Badge className={`text-xs border ${getRiskBadgeClass(pfRisk)}`}>{pfRisk}</Badge>
                    {previewFinding.category && (
                      <Badge variant="outline" className="text-xs font-normal">
                        {previewFinding.category}
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-xs flex items-center gap-1.5 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{formatCleanLocation(previewFinding)}</span>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3.5 py-2 text-xs">
                  <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      Tespit (Mevcut Durum)
                    </span>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {previewFinding.findingDesc || 'Belirtilmemiş.'}
                    </p>
                  </div>

                  {(previewFinding.riskDesc || previewFinding.recommendation) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {previewFinding.riskDesc && (
                        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-red-700 dark:text-red-400 block">
                            Risk
                          </span>
                          <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                            {previewFinding.riskDesc}
                          </p>
                        </div>
                      )}
                      {previewFinding.recommendation && (
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary block">
                            Öneri / Düzeltici Faaliyet
                          </span>
                          <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                            {previewFinding.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <strong className="text-foreground font-medium">
                        {pfDepts.length > 0 ? pfDepts.join(', ') : 'Departman atanmadı'}
                      </strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <Calendar className="w-3.5 h-3.5" />
                      {previewFinding.targetDate
                        ? new Date(previewFinding.targetDate).toLocaleDateString('tr-TR')
                        : 'Termin yok'}
                    </span>
                  </div>

                  {(pfPhotos.length > 0 || pfDocs.length > 0) && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      {pfPhotos.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {pfPhotos.map((photo, idx) => (
                            <button
                              key={photo.url || idx}
                              type="button"
                              onClick={() => setLightboxState({ photos: pfPhotos, index: idx })}
                              className="relative group w-16 h-16 rounded-md overflow-hidden border border-border"
                            >
                              <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                              <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye className="w-4 h-4" />
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {pfDocs.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {pfDocs.map((doc, idx) => (
                            <a
                              key={doc.url || idx}
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-muted/30 hover:bg-muted text-xs text-foreground"
                            >
                              <FileText className="w-3.5 h-3.5 text-primary" />
                              <span className="truncate max-w-[180px]">{doc.name}</span>
                              <Download className="w-3 h-3 text-muted-foreground" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewFinding(null)}
                  >
                    Kapat
                  </Button>
                  {!isPublished && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const target = previewFinding;
                        setPreviewFinding(null);
                        onEdit(target);
                      }}
                      className="gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Düzenle
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const target = previewFinding;
                      setPreviewFinding(null);
                      onView(target);
                    }}
                    className="gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Tam Detay Sayfası
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* High-Quality Lightbox (İyileştirme Takip Modülü ile Birebir Aynı) */}
      {lightboxState && (
        <ImprovementMediaLightbox
          photos={lightboxState.photos}
          initialIndex={lightboxState.index}
          onClose={() => setLightboxState(null)}
        />
      )}
    </div>
  );
};
