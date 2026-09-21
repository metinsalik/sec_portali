import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty } from '@/components/ui/combobox';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Save, AlertTriangle, Layers, Pencil, CheckCircle2, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import LocationCascadingSelector from '@/components/shared/LocationCascadingSelector';
import { toast } from 'react-hot-toast';

export default function FacilityInventoryFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const initialDepartmentId = searchParams.get('departmentId');
  const returnTo = location.state?.returnTo || (initialDepartmentId ? `/hazmat/departments/${initialDepartmentId}` : '/hazmat/inventory');
  const activeFacilityId = localStorage.getItem('activeFacilityId');
  const queryClient = useQueryClient();

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(initialDepartmentId ? [initialDepartmentId] : []);
  
  const [cascadingSelection, setCascadingSelection] = useState<string>(initialDepartmentId || '');
  const [openMaterial, setOpenMaterial] = useState(false);
  const [openDept, setOpenDept] = useState(false);
  const [deptSearch, setDeptSearch] = useState('');

  // Matrix data state: departmentId -> { minQuantity, maxQuantity }
  const [matrixState, setMatrixState] = useState<Record<string, { minQuantity: string, maxQuantity: string }>>({});

  // Missing facility item states
  const [newAmountValue, setNewAmountValue] = useState('1');
  const [newUnitId, setNewUnitId] = useState('');

  // Dual mode: If departmentId is provided, we assign multiple materials to this department
  const isDepartmentMode = !!initialDepartmentId;

  // Selected materials for department mode: array of material IDs
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  // Material matrix state: materialId -> { minQuantity, maxQuantity }
  const [materialMatrixState, setMaterialMatrixState] = useState<Record<string, { minQuantity: string, maxQuantity: string }>>({});

  // Fetch initial department & existing inventory if departmentId is provided
  const { data: deptDetailsData, isLoading: isLoadingDeptDetails } = useQuery({
    queryKey: ['hazmat-department-details', initialDepartmentId, activeFacilityId],
    queryFn: async () => {
      if (!initialDepartmentId || !activeFacilityId) return null;
      try {
        const res = await api.get(`/hazmat/inventory/department/${initialDepartmentId}?facilityId=${activeFacilityId}`);
        if (!res.ok) return null;
        return await res.json();
      } catch (e) {
        return null;
      }
    },
    enabled: isDepartmentMode && !!activeFacilityId
  });

  const initialDeptData = deptDetailsData?.department;

  // Populate selected materials & existing quantities for this department
  useEffect(() => {
    if (isDepartmentMode && deptDetailsData?.inventoryItems) {
      const initialMatIds: string[] = [];
      const initialMatState: Record<string, { minQuantity: string, maxQuantity: string }> = {};

      deptDetailsData.inventoryItems.forEach((item: any) => {
        if (item.materialId) {
          initialMatIds.push(item.materialId);
          initialMatState[item.materialId] = {
            minQuantity: item.minQuantity != null ? String(item.minQuantity) : '',
            maxQuantity: item.maxQuantity != null ? String(item.maxQuantity) : ''
          };
        }
      });

      setSelectedMaterialIds(initialMatIds);
      setMaterialMatrixState(initialMatState);
    }
  }, [isDepartmentMode, deptDetailsData]);

  // Fetch facility locations to resolve any department name even without material selected
  const { data: allLocations = [] } = useQuery<any[]>({
    queryKey: ['facility-locations', activeFacilityId],
    queryFn: async () => {
      if (!activeFacilityId) return [];
      try {
        const res = await api.get(`/risks/facilities/${activeFacilityId}/locations`);
        if (!res.ok) return [];
        return await res.json();
      } catch (e) {
        return [];
      }
    },
    enabled: !!activeFacilityId
  });

  // 1. Fetch facility materials for the combobox / list
  const { data: rawFacilityItems = [], isLoading: isLoadingMaterials } = useQuery<any[]>({
    queryKey: ['facility-inventory-summary', activeFacilityId],
    queryFn: async () => {
      if (!activeFacilityId) return [];
      const res = await api.get(`/hazmat/inventory/summary?facilityId=${activeFacilityId}`);
      if (!res.ok) throw new Error('Failed to fetch facility inventory');
      const data = await res.json();
      return data.facilityItems || [];
    },
    enabled: !!activeFacilityId
  });

  const materialsData = useMemo(() => {
    return rawFacilityItems.map((fi: any) => ({
      ...fi.material,
      amountValue: fi.amountValue || 1,
      unitName: fi.unit?.name || 'Birim Yok'
    }));
  }, [rawFacilityItems]);

  // Fetch specific facility item for the selected material to get amountValue and unit (in single material mode)
  const { data: selectedFacilityItem } = useQuery({
    queryKey: ['facility-material-item', activeFacilityId, selectedMaterialId],
    queryFn: async () => {
      if (!activeFacilityId || !selectedMaterialId) return null;
      const res = await api.get(`/hazmat/materials/${selectedMaterialId}?facilityId=${activeFacilityId}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.facilityItem || null;
    },
    enabled: !isDepartmentMode && !!activeFacilityId && !!selectedMaterialId
  });

  const { data: unitsData = [] } = useQuery<any[]>({
    queryKey: ['units'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/units');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const selectedMaterialItem = useMemo(() => {
    return materialsData.find((item: any) => item.id === selectedMaterialId);
  }, [materialsData, selectedMaterialId]);

  const filteredMaterials = useMemo(() => {
    if (!searchQuery) return materialsData;
    const q = searchQuery.toLowerCase();
    return materialsData.filter((item: any) => {
      const name = item.productName?.toLowerCase() || '';
      const brand = item.brandName?.toLowerCase() || '';
      return name.includes(q) || brand.includes(q);
    });
  }, [materialsData, searchQuery]);

  // 2. Fetch inventory matrix for selected material (single material mode)
  const { data: matrixData, isLoading: isLoadingMatrix } = useQuery({
    queryKey: ['inventory-matrix', activeFacilityId, selectedMaterialId],
    queryFn: async () => {
      if (!activeFacilityId || !selectedMaterialId) return null;
      try {
        const res = await api.get(`/hazmat/inventory?facilityId=${activeFacilityId}&materialId=${selectedMaterialId}`);
        if (!res.ok) {
          console.error('Inventory fetch failed with status', res.status);
          return { departments: [], inventoryItems: [] };
        }
        return await res.json();
      } catch (err) {
        console.error('Inventory fetch error:', err);
        return { departments: [], inventoryItems: [] };
      }
    },
    enabled: !isDepartmentMode && !!activeFacilityId && !!selectedMaterialId
  });

  // Sync state when matrixData loads (single material mode)
  useEffect(() => {
    if (!isDepartmentMode && matrixData) {
      const initialState: Record<string, { minQuantity: string, maxQuantity: string }> = {};
      const { departments, inventoryItems } = matrixData;
      const preSelectedDepts: string[] = [];

      departments.forEach((dept: any) => {
        const existingItem = inventoryItems.find((inv: any) => inv.departmentId === dept.id);
        if (existingItem) {
          preSelectedDepts.push(dept.id);
        }
        initialState[dept.id] = {
          minQuantity: existingItem?.minQuantity?.toString() || '',
          maxQuantity: existingItem?.maxQuantity?.toString() || ''
        };
      });

      setSelectedDepartments(preSelectedDepts);
      setMatrixState(initialState);
    }
  }, [isDepartmentMode, matrixData]);

  // 4. Save mutation (handles both Department Mode and Material Mode)
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isDepartmentMode) {
        // Bulk save multiple materials to one department
        const items = selectedMaterialIds.map(matId => {
          const values = materialMatrixState[matId] || { minQuantity: '', maxQuantity: '' };
          return {
            materialId: matId,
            minQuantity: values.minQuantity,
            maxQuantity: values.maxQuantity
          };
        });

        const res = await api.post('/hazmat/inventory/department-bulk', {
          facilityId: activeFacilityId,
          locationId: initialDepartmentId,
          items
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.details || data.error || 'Kaydedilemedi');
        }
        return;
      }

      // Standard single material distribution mode
      if (!selectedFacilityItem) {
        const facRes = await api.post('/hazmat/materials/facility', {
          facilityId: activeFacilityId,
          materialId: selectedMaterialId,
          amountValue: newAmountValue,
          unitId: newUnitId
        });
        if (!facRes.ok) throw new Error('Tesis için ambalaj bilgisi kaydedilemedi');
      }

      const matrixArray = selectedDepartments.map(departmentId => {
        const values = matrixState[departmentId] || { minQuantity: '', maxQuantity: '' };
        return {
          locationId: departmentId,
          minQuantity: values.minQuantity,
          maxQuantity: values.maxQuantity
        };
      });

      const res = await api.post('/hazmat/inventory', {
        facilityId: activeFacilityId,
        materialId: selectedMaterialId,
        matrix: matrixArray
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.details || data.error || 'Failed to save');
      }
    },
    onSuccess: () => {
      toast.success('Envanter başarıyla güncellendi');
      if (isDepartmentMode) {
        queryClient.invalidateQueries({ queryKey: ['hazmat-department-details', initialDepartmentId, activeFacilityId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['inventory-matrix', activeFacilityId, selectedMaterialId] });
      }
      queryClient.invalidateQueries({ queryKey: ['facility-inventory-summary', activeFacilityId] });
      queryClient.invalidateQueries({ queryKey: ['hazmat-departments', activeFacilityId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary', activeFacilityId] });
      navigate(returnTo);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Kaydedilirken bir hata oluştu');
      console.error('Save error:', error);
    }
  });

  const handleDepartmentToggle = (departmentId: string) => {
    setSelectedDepartments(prev => 
      prev.includes(departmentId) 
        ? prev.filter(id => id !== departmentId)
        : [...prev, departmentId]
    );
  };

  const handleInputChange = (departmentId: string, field: 'minQuantity' | 'maxQuantity', value: string) => {
    setMatrixState(prev => ({
      ...prev,
      [departmentId]: {
        ...prev[departmentId],
        [field]: value
      }
    }));
  };

  const handleMaterialInputChange = (materialId: string, field: 'minQuantity' | 'maxQuantity', value: string) => {
    setMaterialMatrixState(prev => ({
      ...prev,
      [materialId]: {
        ...prev[materialId],
        [field]: value
      }
    }));
  };

  const handleToggleMaterialSelect = (materialId: string) => {
    setSelectedMaterialIds(prev => {
      if (prev.includes(materialId)) {
        return prev.filter(id => id !== materialId);
      } else {
        if (!materialMatrixState[materialId]) {
          setMaterialMatrixState(p => ({ ...p, [materialId]: { minQuantity: '', maxQuantity: '' } }));
        }
        return [...prev, materialId];
      }
    });
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  const amountValue = selectedFacilityItem?.amountValue || 1;
  const unitName = selectedFacilityItem?.unit?.name || 'Birim Yok';
  
  const calculateTotal = (quantityStr: string) => {
    const qty = parseFloat(quantityStr);
    if (isNaN(qty)) return '-';
    return `${(qty * amountValue).toFixed(2)} ${unitName}`;
  };

  const calculateMaterialTotal = (matId: string, quantityStr: string) => {
    const qty = parseFloat(quantityStr);
    if (isNaN(qty)) return '-';
    const mat = materialsData.find((m: any) => m.id === matId);
    const av = mat?.amountValue || 1;
    const un = mat?.unitName || '';
    return `${(qty * av).toFixed(2)} ${un}`;
  };


  // Derived filtered departments based on selection
  const selectedDepartmentsData = useMemo(() => {
    if (!matrixData?.departments) return [];
    return matrixData.departments.filter((d: any) => selectedDepartments.includes(d.id));
  }, [matrixData, selectedDepartments]);

  const filteredDepartments = useMemo(() => {
    if (!matrixData?.departments) return [];
    return matrixData.departments.filter((d: any) => {
      if (!d) return false;
      // Exclude cleaning carts unless it is specifically the pre-selected one
      if (d.isCleaningCart && d.id !== initialDepartmentId) return false;
      
      const fullName = `${d.isCleaningCart ? '[Temizlik Arabası] ' : ''}${d.building ? d.building + ' / ' : ''}${d.floor ? d.floor + ' / ' : ''}${d.name || ''} ${d.description ? '/ ' + d.description : ''}`.toLowerCase();
      return fullName.includes(deptSearch.toLowerCase());
    });
  }, [matrixData, deptSearch, initialDepartmentId]);

  const getLocationName = (deptId: string) => {
    if (deptId.startsWith('group:')) {
      const parts = deptId.split(':');
      if (parts.length >= 4) {
        const level = parts[1];
        const path = parts.slice(3).join(':');
        const levelText = level === 'building' ? 'Bina Geneli' : level === 'floor' ? 'Kat Geneli' : 'Grup';
        return `${path} (${levelText})`;
      }
      return deptId;
    }
    const dept = matrixData?.departments?.find((d: any) => d.id === deptId) 
      || (initialDeptData?.id === deptId ? initialDeptData : null)
      || allLocations.find((l: any) => l.id === deptId);
      
    if (!dept) return deptId;
    return `${dept.building ? dept.building + ' / ' : ''}${dept.floor ? dept.floor + ' / ' : ''}${dept.name || dept.department || dept.description || deptId}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isDepartmentMode ? 'Departmana Envanter Ata' : 'Envanter Ekle'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isDepartmentMode
              ? 'Seçili departmana tesisinizde bulunan birden çok tehlikeli maddeyi ekleyin ve miktar sınırlarını belirleyin.'
              : 'Tesise yeni bir tehlikeli madde tanımlayın ve lokasyonlara miktar atamalarını yapın.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(returnTo)}>
          İptal ve Geri Dön
        </Button>
      </div>

      {isDepartmentMode ? (
        /* ================= DEPARTMENT MODE ================= */
        <div className="space-y-6">
          {/* Card 1: Hedef Lokasyon Bilgisi */}
          <Card className="border-primary/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">1</span>
                Hedef Departman / Lokasyon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <div className="font-semibold text-base">
                    {getLocationName(initialDepartmentId || '')}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Bu sayfadaki tüm malzeme atamaları yukarıdaki lokasyona kaydedilecektir.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Tehlikeli Madde Seçimi (Birden Çok Seçim) */}
          <Card className="border-primary/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">2</span>
                    Tehlikeli Madde Seçimi (Çoklu Seçim)
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Bu departmanda bulundurulacak tehlikeli maddeleri işaretleyin.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs px-2.5 py-1">
                  {selectedMaterialIds.length} Madde Seçildi
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="Listeden hızlıca arayın (ürün adı veya marka)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>

              {isLoadingMaterials ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Malzemeler yükleniyor...</div>
              ) : filteredMaterials.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground border rounded-lg">
                  {searchQuery ? 'Aramanıza uygun malzeme bulunamadı.' : 'Tesisinize ait tehlikeli madde kaydı bulunamadı.'}
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto border rounded-lg divide-y bg-background">
                  {filteredMaterials.map((mat: any) => {
                    const isChecked = selectedMaterialIds.includes(mat.id);
                    return (
                      <div
                        key={mat.id}
                        onClick={() => handleToggleMaterialSelect(mat.id)}
                        className={cn(
                          "flex items-center justify-between p-3 cursor-pointer transition-colors hover:bg-muted/40",
                          isChecked && "bg-primary/5"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => handleToggleMaterialSelect(mat.id)}
                          />
                          <div>
                            <div className="font-medium text-sm">
                              {mat.productName}
                              {mat.brandName && (
                                <span className="text-muted-foreground font-normal ml-1">({mat.brandName})</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Ambalaj: 1 Kutu = {mat.amountValue} {mat.unitName}
                            </div>
                          </div>
                        </div>
                        {isChecked && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Seçildi
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Miktar Girişi (Seçilen Maddeler İçin Tablo) */}
          {selectedMaterialIds.length > 0 && (
            <Card className="border-primary/20 shadow-sm relative overflow-hidden animate-in fade-in duration-300">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">3</span>
                    Miktar Girişi
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Seçtiğiniz maddeler için minimum ve maksimum kutu sayılarını girin.
                  </CardDescription>
                </div>
                <Button onClick={handleSave} disabled={saveMutation.isPending} size="lg" className="shadow-md">
                  <Save className="w-4 h-4 mr-2" />
                  {saveMutation.isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 font-medium">
                      <tr>
                        <th className="px-4 py-3">Madde Adı</th>
                        <th className="px-4 py-3">Ambalaj Bilgisi</th>
                        <th className="px-4 py-3 w-[140px]">Min Kutu</th>
                        <th className="px-4 py-3 w-[140px]">Max Kutu</th>
                        <th className="px-4 py-3 text-right">Toplam Miktar</th>
                        <th className="px-3 py-3 w-[50px]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedMaterialIds.map((matId: string) => {
                        const mat = materialsData.find((m: any) => m.id === matId);
                        const values = materialMatrixState[matId] || { minQuantity: '', maxQuantity: '' };
                        return (
                          <tr key={matId} className="hover:bg-muted/20">
                            <td className="px-4 py-3 font-medium">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                                <div>
                                  <div>{mat?.productName || 'Bilinmeyen Madde'}</div>
                                  {mat?.brandName && (
                                    <div className="text-xs text-muted-foreground font-normal">{mat.brandName}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              1 Kutu = {mat?.amountValue || 1} {mat?.unitName || ''}
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={values.minQuantity}
                                onChange={(e) => handleMaterialInputChange(matId, 'minQuantity', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={values.maxQuantity}
                                onChange={(e) => handleMaterialInputChange(matId, 'maxQuantity', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3 text-right text-muted-foreground">
                              <div className="text-xs mb-1">
                                Min: <span className="font-medium text-foreground">{calculateMaterialTotal(matId, values.minQuantity)}</span>
                              </div>
                              <div className="text-xs">
                                Max: <span className="font-medium text-foreground">{calculateMaterialTotal(matId, values.maxQuantity)}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleToggleMaterialSelect(matId)}
                                className="text-muted-foreground hover:text-red-600 p-1"
                                title="Listeden Çıkar"
                              >
                                &times;
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* ================= MATERIAL MODE (Tek bir maddeyi lokasyonlara dağıtma) ================= */
        <>
          <div className="space-y-4">
            <Card className="border-primary/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm">1</span>
                  Tehlikeli Madde Seçimi
                </CardTitle>
                <CardDescription>Lokasyonlara dağıtmak istediğiniz tehlikeli maddeyi seçin.</CardDescription>
              </CardHeader>
              <CardContent>
                <Popover open={openMaterial} onOpenChange={setOpenMaterial}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openMaterial}
                      className="w-full md:w-[600px] justify-between text-left font-normal"
                    >
                      {selectedMaterialId
                        ? `${selectedMaterialItem?.productName} ${selectedMaterialItem?.brandName ? `(${selectedMaterialItem.brandName})` : ''}`
                        : "Tehlikeli Madde Ara ve Seç..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[600px] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput 
                        placeholder="Madde ara..." 
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList>
                        {filteredMaterials.length === 0 ? (
                          <CommandEmpty>Madde bulunamadı.</CommandEmpty>
                        ) : (
                          <CommandGroup>
                            {filteredMaterials.map((item: any) => (
                              <CommandItem
                                key={item.id}
                                value={item.id}
                                onSelect={() => {
                                  setSelectedMaterialId(item.id);
                                  setOpenMaterial(false);
                                  setSearchQuery("");
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedMaterialId === item.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {item.productName} {item.brandName ? `(${item.brandName})` : ''}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {selectedMaterialItem && (
                  <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20 flex items-center gap-3">
                    <Layers className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium text-primary">Kutu / Ambalaj Bilgisi</p>
                      {selectedFacilityItem ? (
                        <p className="text-sm text-muted-foreground mt-1">
                          Bu ürün tesise <strong>1 Kutu = {amountValue} {unitName}</strong> olarak tanımlanmıştır.
                        </p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          <p className="text-sm text-muted-foreground">Bu ürün tesisinize ilk kez eklenecek. Lütfen kutu/ambalaj miktarını belirtin:</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">1 Kutu = </span>
                            <Input 
                              type="number" 
                              className="w-24 h-8" 
                              value={newAmountValue} 
                              onChange={(e) => setNewAmountValue(e.target.value)} 
                              min="0.1" 
                              step="0.1"
                            />
                            <select 
                              className="flex h-8 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                              value={newUnitId}
                              onChange={(e) => setNewUnitId(e.target.value)}
                            >
                              <option value="">Birim Seçin</option>
                              {unitsData.map((u: any) => (
                                <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-primary/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm">2</span>
                  Lokasyon Seçimi
                </CardTitle>
                <CardDescription>Bu ürünün bulunacağı lokasyonları işaretleyin.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-2">Bu ürünün bulunacağı lokasyonu seçip listeye ekleyin.</p>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1 border rounded-md p-4">
                      <LocationCascadingSelector 
                        locations={(matrixData?.departments && matrixData.departments.length > 0) ? matrixData.departments : allLocations}
                        value={cascadingSelection}
                        onChange={(val) => setCascadingSelection(val)}
                      />
                    </div>
                    <Button 
                      type="button" 
                      onClick={() => {
                        if (cascadingSelection && !selectedDepartments.includes(cascadingSelection)) {
                          setSelectedDepartments([...selectedDepartments, cascadingSelection]);
                          if (!matrixState[cascadingSelection]) {
                            setMatrixState(prev => ({...prev, [cascadingSelection]: { minQuantity: '', maxQuantity: '' }}));
                          }
                        }
                      }}
                      disabled={!cascadingSelection || selectedDepartments.includes(cascadingSelection)}
                      className="mb-4"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Listeye Ekle
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedDepartments.length > 0 && (
              <Card className="border-primary/20 shadow-sm relative overflow-hidden animate-in fade-in duration-300">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm">3</span>
                      Miktar Girişi
                    </CardTitle>
                    <CardDescription className="mt-1">Seçtiğiniz lokasyonlar için miktar sınırlarını belirleyin.</CardDescription>
                  </div>
                  <Button onClick={handleSave} disabled={saveMutation.isPending} size="lg" className="shadow-md">
                    <Save className="w-4 h-4 mr-2" />
                    {saveMutation.isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 font-medium">
                        <tr>
                          <th className="px-4 py-3">Lokasyon</th>
                          <th className="px-4 py-3 w-[150px]">Min Kutu</th>
                          <th className="px-4 py-3 w-[150px]">Max Kutu</th>
                          <th className="px-4 py-3 text-right">Toplam Miktar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedDepartments.map((deptId: string) => {
                          const values = matrixState[deptId] || { minQuantity: '', maxQuantity: '' };
                          return (
                            <tr key={deptId} className="hover:bg-muted/20">
                              <td className="px-4 py-4 font-medium flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                {getLocationName(deptId)}
                              </td>
                              <td className="px-4 py-3">
                                <Input 
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={values.minQuantity}
                                  onChange={(e) => handleInputChange(deptId, 'minQuantity', e.target.value)}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Input 
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={values.maxQuantity}
                                  onChange={(e) => handleInputChange(deptId, 'maxQuantity', e.target.value)}
                                />
                              </td>
                              <td className="px-4 py-3 text-right text-muted-foreground">
                                <div className="text-xs mb-1">
                                  Min: <span className="font-medium text-foreground">{calculateTotal(values.minQuantity)}</span>
                                </div>
                                <div className="text-xs">
                                  Max: <span className="font-medium text-foreground">{calculateTotal(values.maxQuantity)}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
