import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, LayoutGrid, List as ListIcon, ChevronRight, FolderTree, Merge, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import CategoryMergeModal from './CategoryMergeModal';

const API = import.meta.env.VITE_API_URL || '';

export default function FacilityCategoriesPage() {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isManager = true;

  const storageKey = `facility_cat_filters_${facilityId}`;
  const loadStored = (k: string, def: any) => {
    try {
      const s = sessionStorage.getItem(storageKey);
      if (s) {
        const p = JSON.parse(s);
        if (p[k] !== undefined) return p[k];
      }
    } catch (e) {}
    return def;
  };

  const [searchQuery, setSearchQuery] = useState<string>(() => loadStored('searchQuery', ''));
  const [filterMainCategory, setFilterMainCategory] = useState<string>(() => initialCategory || loadStored('filterMainCategory', ''));
  const [filterSubCategory, setFilterSubCategory] = useState<string>(() => loadStored('filterSubCategory', ''));
  const [viewMode, setViewMode] = useState<'card' | 'list'>(() => loadStored('viewMode', 'card'));
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeInitialSource, setMergeInitialSource] = useState('');
  const [mergeInitialType, setMergeInitialType] = useState<'mainCategory' | 'subCategory'>('subCategory');

  useEffect(() => {
    const fromUrl = searchParams.get('category');
    if (fromUrl !== null) {
      setFilterMainCategory(fromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify({
      searchQuery,
      filterMainCategory,
      filterSubCategory,
      viewMode
    }));
  }, [searchQuery, filterMainCategory, filterSubCategory, viewMode, storageKey]);

  // Tesis Bilgisi
  const { data: facilities = [] } = useQuery({
    queryKey: ['risk-facilities'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/facilities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

  const facility = facilities.find((f: any) => f.id === facilityId);

  // Riskler
  const { data: facilityRisks = [], isLoading } = useQuery({
    queryKey: ['facility-risks', facilityId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/lifecycle?facilityId=${facilityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Tesis riskleri alınamadı');
      return res.json();
    },
    enabled: !!facilityId,
  });

  // Filtre Seçenekleri
  const uniqueMainCategories = useMemo(() => {
    const map = new Map<string, string>();
    facilityRisks.forEach((r: any) => {
      const cat = (r.riskCategory || '').trim();
      if (cat) map.set(cat.toLocaleLowerCase('tr'), cat); // Overwrites with last seen or keeps. Actually, let's keep first seen: if (!map.has(key)) map.set(key, cat)
    });
    const finalMap = new Map<string, string>();
    facilityRisks.forEach((r: any) => {
      const cat = (r.riskCategory || '').trim();
      if (cat && !finalMap.has(cat.toLocaleLowerCase('tr'))) finalMap.set(cat.toLocaleLowerCase('tr'), cat);
    });
    return Array.from(finalMap.values()).sort();
  }, [facilityRisks]);

  const uniqueSubCategories = useMemo(() => {
    const finalMap = new Map<string, string>();
    facilityRisks.forEach((r: any) => {
      const mainCat = (r.riskCategory || '').trim();
      if (filterMainCategory && mainCat.toLocaleLowerCase('tr') !== filterMainCategory.trim().toLocaleLowerCase('tr')) return;
      const subCat = (r.subCategory || '').trim();
      if (subCat && !finalMap.has(subCat.toLocaleLowerCase('tr'))) finalMap.set(subCat.toLocaleLowerCase('tr'), subCat);
    });
    return Array.from(finalMap.values()).sort();
  }, [facilityRisks, filterMainCategory]);

  // Alt kategori ana kategori değişince sıfırlansın
  useEffect(() => {
    if (filterMainCategory && filterSubCategory) {
      const subExists = facilityRisks.some((r: any) => 
        (r.riskCategory || '').trim().toLocaleLowerCase('tr') === filterMainCategory.trim().toLocaleLowerCase('tr') && 
        (r.subCategory || '').trim().toLocaleLowerCase('tr') === filterSubCategory.trim().toLocaleLowerCase('tr')
      );
      if (!subExists) setFilterSubCategory('');
    }
  }, [filterMainCategory, filterSubCategory, facilityRisks]);

  // Kategori İstatistikleri (Liste ve Kartlar için veri)
  const categoryStats = useMemo(() => {
    const stats: Record<string, { name: string, mainCategory: string, riskCount: number, acikCount: number, mudahaleCount: number, takipCount: number, kapaliCount: number }> = {};
    
    facilityRisks.forEach((r: any) => {
      const mainCat = (r.riskCategory || 'Belirtilmemiş').trim();
      const subCat = (r.subCategory || 'Diğer').trim();
      
      const mainCatLower = mainCat.toLocaleLowerCase('tr');
      const subCatLower = subCat.toLocaleLowerCase('tr');
      
      // Gruplama mantığı
      let key = mainCatLower;
      let displayName = mainCat;
      const passMainCategory = mainCat; // To preserve original case in URL
      
      if (filterSubCategory) {
        if (subCatLower !== filterSubCategory.trim().toLocaleLowerCase('tr')) return;
        key = `${mainCatLower} - ${subCatLower}`;
        displayName = subCat;
      } else if (filterMainCategory && !filterSubCategory) {
        if (mainCatLower !== filterMainCategory.trim().toLocaleLowerCase('tr')) return;
        key = subCatLower;
        displayName = subCat;
      } else {
        key = mainCatLower;
        displayName = mainCat;
      }

      if (!stats[key]) {
        stats[key] = { name: displayName, mainCategory: passMainCategory, riskCount: 0, acikCount: 0, mudahaleCount: 0, takipCount: 0, kapaliCount: 0 };
      }
      
      stats[key].riskCount++;
      if (r.status === 'ACIK_TEHLIKE') stats[key].acikCount++;
      else if (r.status === 'ILK_MUDAHALE_EDILDI') stats[key].mudahaleCount++;
      else if (r.status === 'TAKIP_SURECINDE') stats[key].takipCount++;
      else if (r.status === 'KAPATILDI_GUVENLI') stats[key].kapaliCount++;
    });

    let result = Object.values(stats);
    
    if (searchQuery) {
      result = result.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    return result.sort((a, b) => b.riskCount - a.riskCount);
  }, [facilityRisks, filterMainCategory, filterSubCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/risks/facility/${facilityId}`)} className="h-8 px-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> {facility?.name || 'Tesis'}
          </Button>
          <div className="h-5 w-px bg-border" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">Tüm Kategoriler</h1>
            <p className="text-xs text-muted-foreground">{facility?.name} kapsamındaki tüm risk kategorileri</p>
          </div>
        </div>

        {isManager && (
          <Button
            size="sm"
            onClick={() => {
              setMergeInitialType(filterMainCategory ? 'subCategory' : 'subCategory');
              setMergeInitialSource('');
              setMergeModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
            title="Excel yüklemelerinde farklı yazılmış mükerrer kategorileri tek bir çatı altında birleştirin"
          >
            <Merge className="w-4 h-4" />
            Kategorileri Birleştir
          </Button>
        )}
      </div>

      {/* Arama ve Görünüm Modu */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card dark:bg-slate-900 p-4 rounded-xl border border-border form-shadow">
        <div className="flex flex-col sm:flex-row flex-1 gap-4 w-full">
          <div className="relative flex-1 sm:max-w-xs flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Kategori ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <select 
            value={filterMainCategory} 
            onChange={(e) => setFilterMainCategory(e.target.value)}
            className="bg-background border border-input rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none w-full sm:w-48"
          >
            <option value="">Tüm Ana Kategoriler</option>
            {uniqueMainCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select 
            value={filterSubCategory} 
            onChange={(e) => setFilterSubCategory(e.target.value)}
            disabled={!filterMainCategory || uniqueSubCategories.length === 0}
            className="bg-background border border-input rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none w-full sm:w-48 disabled:opacity-50"
          >
            <option value="">Tüm Alt Kategoriler</option>
            {uniqueSubCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <Button
            size="sm"
            onClick={() => {
              setMergeInitialType(filterMainCategory ? 'subCategory' : 'mainCategory');
              setMergeInitialSource('');
              setMergeModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs h-9 shadow-sm flex items-center gap-1.5"
            title="Mükerrer kategorileri tek bir çatı altında birleştirin"
          >
            <Merge className="w-4 h-4" />
            Kategorileri Birleştir
          </Button>

          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
            <Button 
              variant={viewMode === 'card' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('card')}
              className="px-3 h-7 text-xs"
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-1.5" /> Kart
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('list')}
              className="px-3 h-7 text-xs"
            >
              <ListIcon className="w-3.5 h-3.5 mr-1.5" /> Liste
            </Button>
          </div>
        </div>
      </div>

      {/* İçerik */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : categoryStats.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
          <FolderTree className="w-10 h-10 opacity-30 mx-auto mb-3" />
          <p className="font-medium">Aramaya uygun kategori bulunamadı</p>
        </div>
      ) : viewMode === 'card' ? (
        /* KART GÖRÜNÜMÜ */
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {categoryStats.map((cat: any, idx: number) => {
            const hasRisk = cat.riskCount > 0;
            return (
              <div
                key={idx}
                onClick={() => {
                  if (!filterMainCategory) {
                    setFilterMainCategory(cat.name);
                  } else {
                    navigate(`/risks/facility/${facilityId}/category-details?mainCat=${encodeURIComponent(cat.mainCategory)}&subCat=${encodeURIComponent(cat.name)}`);
                  }
                }}
                className="bg-card dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 form-shadow hover:border-primary transition-colors flex flex-col h-full cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <h5 className="text-lg font-bold text-foreground line-clamp-2 pr-2 leading-tight" title={cat.name}>{cat.name}</h5>
                  <span className={`text-xs px-2 py-1 rounded shrink-0 ${hasRisk ? 'bg-error/10 text-error font-medium' : 'bg-muted text-muted-foreground'}`}>
                    {cat.riskCount} Risk
                  </span>
                </div>
                
                <div className="mb-6 flex-1 space-y-1.5 mt-2">
                  {hasRisk ? (
                    <>
                      {(cat.acikCount > 0) && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-600"></div>
                          <span className="text-sm text-muted-foreground">Açık Tehlike</span>
                          <span className="ml-auto font-bold text-red-600">{cat.acikCount}</span>
                        </div>
                      )}
                      {(cat.mudahaleCount > 0) && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <span className="text-sm text-muted-foreground">İlk Müdahale</span>
                          <span className="ml-auto font-bold text-orange-500">{cat.mudahaleCount}</span>
                        </div>
                      )}
                      {(cat.takipCount > 0) && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                          <span className="text-sm text-muted-foreground">Takipte</span>
                          <span className="ml-auto font-bold text-blue-600">{cat.takipCount}</span>
                        </div>
                      )}
                      {(cat.kapaliCount > 0) && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                          <span className="text-sm text-muted-foreground">Kapatıldı</span>
                          <span className="ml-auto font-bold text-emerald-600">{cat.kapaliCount}</span>
                        </div>
                      )}
                      {!(cat.acikCount > 0) && !(cat.mudahaleCount > 0) && !(cat.takipCount > 0) && !(cat.kapaliCount > 0) && (
                        <div className="italic text-muted-foreground text-sm">Durum bilgisi yok</div>
                      )}
                    </>
                  ) : (
                    <div className="italic text-muted-foreground text-sm">Risk kaydı yok</div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {!filterMainCategory ? 'Ana Kategori' : 'Alt Kategori'}
                  </span>
                  {isManager && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMergeInitialType(!filterMainCategory ? 'mainCategory' : 'subCategory');
                        setMergeInitialSource(cat.name);
                        setMergeModalOpen(true);
                      }}
                      className="h-7 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 flex items-center gap-1 font-semibold"
                      title="Bu kategoriyi birleştir"
                    >
                      <Merge className="w-3.5 h-3.5" />
                      Birleştir
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LİSTE GÖRÜNÜMÜ */
        <div className="bg-card dark:bg-slate-900 border border-border rounded-xl overflow-hidden form-shadow">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Kategori Adı</th>
                <th className="px-6 py-4 font-medium">Seviye</th>
                <th className="px-6 py-4 font-medium text-center">Toplam Risk</th>
                <th className="px-6 py-4 font-medium text-center">Açık Tehlike</th>
                {isManager && <th className="px-6 py-4 font-medium text-right">İşlem</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categoryStats.map((cat: any, idx: number) => {
                return (
                  <tr 
                    key={idx} 
                    onClick={() => {
                      if (!filterMainCategory) {
                        setFilterMainCategory(cat.name);
                      } else {
                        navigate(`/risks/facility/${facilityId}/category-details?mainCat=${encodeURIComponent(cat.mainCategory)}&subCat=${encodeURIComponent(cat.name)}`);
                      }
                    }}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <FolderTree className="w-4 h-4 text-primary opacity-50" />
                        {cat.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {!filterMainCategory ? 'Ana Kategori' : 'Alt Kategori'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-muted font-medium">
                        {cat.riskCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {cat.acikCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-error/10 text-error font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                          {cat.acikCount}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    {isManager && (
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setMergeInitialType(!filterMainCategory ? 'mainCategory' : 'subCategory');
                            setMergeInitialSource(cat.name);
                            setMergeModalOpen(true);
                          }}
                          className="h-8 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 font-semibold inline-flex items-center gap-1"
                        >
                          <Merge className="w-3.5 h-3.5 text-indigo-600" />
                          Birleştir
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Yönetici Kategori Birleştirme Modalı */}
      {isManager && (
        <CategoryMergeModal
          open={mergeModalOpen}
          onOpenChange={setMergeModalOpen}
          facilityId={facilityId || ''}
          facilityRisks={facilityRisks}
          initialMergeType={mergeInitialType}
          initialSourceCategory={mergeInitialSource}
          initialSourceMainCategory={filterMainCategory}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['facility-risks', facilityId] });
            queryClient.invalidateQueries({ queryKey: ['risk-settings'] });
          }}
        />
      )}
    </div>
  );
}
