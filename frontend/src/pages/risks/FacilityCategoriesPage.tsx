import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, LayoutGrid, List as ListIcon, ChevronRight, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const API = import.meta.env.VITE_API_URL || '';

export default function FacilityCategoriesPage() {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  
  const token = localStorage.getItem('token');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMainCategory, setFilterMainCategory] = useState(initialCategory);
  const [filterSubCategory, setFilterSubCategory] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

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
    return Array.from(new Set(facilityRisks.map((r: any) => r.riskCategory).filter(Boolean))) as string[];
  }, [facilityRisks]);

  const uniqueSubCategories = useMemo(() => {
    let list = facilityRisks;
    if (filterMainCategory) {
      list = list.filter((r: any) => r.riskCategory === filterMainCategory);
    }
    return Array.from(new Set(list.map((r: any) => r.subCategory).filter(Boolean))) as string[];
  }, [facilityRisks, filterMainCategory]);

  // Alt kategori ana kategori değişince sıfırlansın
  useEffect(() => {
    if (filterMainCategory && filterSubCategory) {
      const subExists = facilityRisks.some((r: any) => r.riskCategory === filterMainCategory && r.subCategory === filterSubCategory);
      if (!subExists) setFilterSubCategory('');
    }
  }, [filterMainCategory]);

  // Kategori İstatistikleri (Liste ve Kartlar için veri)
  const categoryStats = useMemo(() => {
    const stats: Record<string, { name: string, mainCategory: string, riskCount: number, acikCount: number, mudahaleCount: number, takipCount: number, kapaliCount: number }> = {};
    
    facilityRisks.forEach((r: any) => {
      const mainCat = r.riskCategory || 'Belirtilmemiş';
      const subCat = r.subCategory || 'Diğer';
      
      // Gruplama mantığı: Eğer alt kategori filtresi varsa sadece o alt kategoriyi göster.
      // Eğer sadece ana kategori filtresi varsa o ana kategorideki alt kategorileri veya genel olarak göster?
      // Biz burada her Ana Kategori - Alt Kategori kombinasyonunu ayrı bir kart olarak gösterebiliriz veya
      // Ana Kategorileri gösterip içine tıklayınca altları listeleyebiliriz.
      // Kullanıcı isteği: "Her Ana kategori için bir kart yapalım. O Kategori sayfasında Ana Kategori ve Alt Kategorilere göre filitre olsun."
      // O halde her satır/kart = Ana Kategori (veya filtrelenmişse Alt Kategori detayı)
      // En iyisi, Ana Kategori bazlı istatistikleri göstermek. Eğer alt kategori seçilirse sadece o alt kategoriyi göster.
      
      let key = mainCat;
      let displayName = mainCat;
      
      if (filterSubCategory) {
        if (r.subCategory !== filterSubCategory) return;
        key = `${mainCat} - ${subCat}`;
        displayName = subCat;
      } else if (filterMainCategory && !filterSubCategory) {
        if (r.riskCategory !== filterMainCategory) return;
        // Sadece bir ana kategori seçiliyse alt kategorileri listeleyelim
        key = subCat;
        displayName = subCat;
      } else {
        // Hiçbir filtre yoksa ana kategorileri göster
        key = mainCat;
        displayName = mainCat;
      }

      if (!stats[key]) {
        stats[key] = { name: displayName, mainCategory: mainCat, riskCount: 0, acikCount: 0, mudahaleCount: 0, takipCount: 0, kapaliCount: 0 };
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

      {/* Arama ve Görünüm Modu */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card dark:bg-slate-900 p-4 rounded-xl border border-border form-shadow">
        <div className="flex flex-col sm:flex-row flex-1 gap-4 w-full">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Kategori ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm"
            />
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
        
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg w-full lg:w-auto">
          <Button 
            variant={viewMode === 'card' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('card')}
            className="flex-1 lg:flex-none px-3"
          >
            <LayoutGrid className="w-4 h-4 mr-2" /> Kart
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('list')}
            className="flex-1 lg:flex-none px-3"
          >
            <ListIcon className="w-4 h-4 mr-2" /> Liste
          </Button>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
