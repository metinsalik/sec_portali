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
import { Save, AlertTriangle, Layers, Pencil, CheckCircle2, Check, ChevronsUpDown } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function FacilityInventoryFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialDepartmentId = searchParams.get('departmentId');
  const activeFacilityId = localStorage.getItem('activeFacilityId');
  const queryClient = useQueryClient();

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(initialDepartmentId ? [initialDepartmentId] : []);
  
  const [openMaterial, setOpenMaterial] = useState(false);
  const [openDept, setOpenDept] = useState(false);
  const [deptSearch, setDeptSearch] = useState('');

  // Matrix data state: departmentId -> { minQuantity, maxQuantity }
  const [matrixState, setMatrixState] = useState<Record<string, { minQuantity: string, maxQuantity: string }>>({});

  // Missing facility item states
  const [newAmountValue, setNewAmountValue] = useState('1');
  const [newUnitId, setNewUnitId] = useState('');

  // 1. Fetch ALL global materials for the combobox
  const { data: materialsData = [], isLoading: isLoadingMaterials } = useQuery<any[]>({
    queryKey: ['global-materials'],
    queryFn: async () => {
      const res = await api.get('/hazmat/materials/search');
      if (!res.ok) throw new Error('Failed to fetch global materials');
      return res.json();
    }
  });

  // Fetch specific facility item for the selected material to get amountValue and unit
  const { data: selectedFacilityItem } = useQuery({
    queryKey: ['facility-material-item', activeFacilityId, selectedMaterialId],
    queryFn: async () => {
      if (!activeFacilityId || !selectedMaterialId) return null;
      const res = await api.get(`/hazmat/materials/${selectedMaterialId}?facilityId=${activeFacilityId}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.facilityItem || null;
    },
    enabled: !!activeFacilityId && !!selectedMaterialId
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
  // 2. Fetch inventory matrix for selected material
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
    enabled: !!activeFacilityId && !!selectedMaterialId
  });

  // Sync state when matrixData loads
  useEffect(() => {
    if (matrixData) {
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

      if (initialDepartmentId && !preSelectedDepts.includes(initialDepartmentId)) {
        preSelectedDepts.push(initialDepartmentId);
      }

      setSelectedDepartments(preSelectedDepts);
      setMatrixState(initialState);
    }
  }, [matrixData, initialDepartmentId]);

  // 3. Fetch summary for the summary table
  const { data: summaryData } = useQuery({
    queryKey: ['inventory-summary', activeFacilityId],
    queryFn: async () => {
      if (!activeFacilityId) return [];
      const res = await api.get(`/hazmat/inventory/summary?facilityId=${activeFacilityId}`);
      if (!res.ok) throw new Error('Failed to fetch summary');
      const data = await res.json();
      return data.inventoryItems;
    },
    enabled: !!activeFacilityId
  });

  // 4. Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // If facility item doesn't exist, create it first
      if (!selectedFacilityItem) {
        const facRes = await api.post('/hazmat/materials/facility', {
          facilityId: activeFacilityId,
          materialId: selectedMaterialId,
          amountValue: newAmountValue,
          unitId: newUnitId
        });
        if (!facRes.ok) throw new Error('Tesis için ambalaj bilgisi kaydedilemedi');
      }

      // Only save for selected departments
      const matrixArray = selectedDepartments.map(departmentId => {
        const values = matrixState[departmentId] || { minQuantity: '', maxQuantity: '' };
        return {
          departmentId,
          minQuantity: values.minQuantity,
          maxQuantity: values.maxQuantity
        };
      });

      // Pass an empty array if all deselected to clear them
      const res = await api.post('/hazmat/inventory', {
        facilityId: activeFacilityId,
        materialId: selectedMaterialId,
        matrix: matrixArray
      });
      if (!res.ok) throw new Error('Failed to save');
    },
    onSuccess: () => {
      toast.success('Envanter başarıyla güncellendi');
      queryClient.invalidateQueries({ queryKey: ['inventory-matrix', activeFacilityId, selectedMaterialId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary', activeFacilityId] });
      queryClient.invalidateQueries({ queryKey: ['facility-material-item', activeFacilityId, selectedMaterialId] });
      if (initialDepartmentId) {
        navigate(`/hazmat/departments/${initialDepartmentId}`);
      } else {
        navigate('/hazmat/inventory');
      }
    },
    onError: () => {
      toast.error('Kaydedilirken bir hata oluştu');
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

  const groupedSummary = useMemo(() => {
    if (!summaryData) return [];
    
    const groups: Record<string, any> = {};
    summaryData.forEach((item: any) => {
      const matId = item.material.id;
      if (!groups[matId]) {
        groups[matId] = {
          materialId: matId,
          productName: item.material.productName,
          brandName: item.material.brandName,
          hazardLabels: item.material.hazardLabels || [],
          ppes: item.material.ppes || [],
          departments: []
        };
      }
      groups[matId].departments.push(item.department.name);
    });
    
    return Object.values(groups);
  }, [summaryData]);

  // Derived filtered departments based on selection
  const selectedDepartmentsData = useMemo(() => {
    if (!matrixData?.departments) return [];
    return matrixData.departments.filter((d: any) => selectedDepartments.includes(d.id));
  }, [matrixData, selectedDepartments]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Envanter Ekle</h1>
          <p className="text-muted-foreground mt-1">
            Tesise yeni bir tehlikeli madde tanımlayın ve departmanlara miktar atamalarını yapın.
          </p>
        </div>
        <Button variant="outline" onClick={() => initialDepartmentId ? navigate(`/hazmat/departments/${initialDepartmentId}`) : navigate('/hazmat/inventory')}>
          İptal ve Geri Dön
        </Button>
      </div>

      <div className="space-y-4">
        <Card className="border-primary/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm">1</span>
              Tehlikeli Madde Seçimi
            </CardTitle>
            <CardDescription>Departmanlara dağıtmak istediğiniz tehlikeli maddeyi seçin.</CardDescription>
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

      {selectedMaterialId && matrixData && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-primary/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm">2</span>
                Departman Seçimi
              </CardTitle>
              <CardDescription>Bu ürünün bulunacağı departmanları işaretleyin.</CardDescription>
            </CardHeader>
            <CardContent>
              {!matrixData ? (
                <div className="text-center py-6 text-muted-foreground">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-destructive" />
                  <p>Departmanlar yüklenirken bir sorun oluştu (Yetki eksiği olabilir).</p>
                </div>
              ) : matrixData.departments?.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Tesisinize ait hiç departman bulunamadı. Lütfen ayarlardan departman ekleyin.</p>
                </div>
              ) : (
                <Popover open={openDept} onOpenChange={setOpenDept}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openDept}
                      className="w-full md:w-[600px] justify-between font-normal"
                    >
                      {selectedDepartments.length > 0
                        ? `${selectedDepartments.length} departman seçildi`
                        : "Departman Ara ve Seç..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[600px] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput 
                        placeholder="Departman ara..." 
                        value={deptSearch}
                        onValueChange={setDeptSearch}
                      />
                      <CommandList>
                        {matrixData.departments?.filter((d: any) => d.name.toLowerCase().includes(deptSearch.toLowerCase())).length === 0 ? (
                          <CommandEmpty>Departman bulunamadı.</CommandEmpty>
                        ) : (
                          <CommandGroup>
                            {matrixData.departments
                              ?.filter((d: any) => d.name.toLowerCase().includes(deptSearch.toLowerCase()))
                              .map((dept: any) => (
                              <CommandItem
                                key={dept.id}
                                value={dept.id}
                                onSelect={() => {
                                  handleDepartmentToggle(dept.id);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedDepartments.includes(dept.id) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {dept.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
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
                  <CardDescription className="mt-1">Seçtiğiniz departmanlar için kutu sınırlarını belirleyin.</CardDescription>
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
                        <th className="px-4 py-3">Departman</th>
                        <th className="px-4 py-3 w-[150px]">Min Kutu</th>
                        <th className="px-4 py-3 w-[150px]">Max Kutu</th>
                        <th className="px-4 py-3 text-right">Toplam Miktar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedDepartmentsData.map((dept: any) => {
                        const values = matrixState[dept.id] || { minQuantity: '', maxQuantity: '' };
                        return (
                          <tr key={dept.id} className="hover:bg-muted/20">
                            <td className="px-4 py-4 font-medium flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              {dept.name}
                            </td>
                            <td className="px-4 py-3">
                              <Input 
                                type="number"
                                min="0"
                                placeholder="0"
                                value={values.minQuantity}
                                onChange={(e) => handleInputChange(dept.id, 'minQuantity', e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input 
                                type="number"
                                min="0"
                                placeholder="0"
                                value={values.maxQuantity}
                                onChange={(e) => handleInputChange(dept.id, 'maxQuantity', e.target.value)}
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
      )}
    </div>
  );
}
