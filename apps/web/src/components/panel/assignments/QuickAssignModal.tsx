import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  UserPlus,
  Clock,
  CreditCard,
  Loader2,
  Info,
  AlertTriangle,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface QuickAssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facility: any;
  type: "IGU" | "Hekim" | "DSP" | "Vekil";
  onSuccess?: () => void;
}

export function QuickAssignModal({
  open,
  onOpenChange,
  facility,
  type,
  onSuccess,
}: QuickAssignModalProps) {
  const queryClient = useQueryClient();

  const [assignType, setAssignType] = useState<"IGU" | "Hekim" | "DSP" | "Vekil">(type);
  const [assignmentMode, setAssignmentMode] = useState<"Kısmi Zamanlı" | "Tam Zamanlı">(
    "Kısmi Zamanlı"
  );
  const [openCombobox, setOpenCombobox] = useState(false);

  React.useEffect(() => {
    if (open) {
      setAssignType(type);
    }
  }, [type, open]);

  const [formData, setFormData] = useState({
    professionalId: "",
    employerRepId: "",
    durationMinutes: "",
    isFullTime: false,
    startDate: new Date().toISOString().split("T")[0],
    costType: "Aylık Sabit",
    unitPrice: "",
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<any>(null);

  const doAssign = async (data: any, confirmed = false) => {
    const res = await api.post(
      "/panel/assignments",
      confirmed ? { ...data, confirmed: true } : data
    );
    if (!res.ok) {
      const err = await res.json();
      if (err.code === "PROFESSIONAL_ASSIGNED_ELSEWHERE") {
        setPendingAssignment(data);
        setShowConfirmDialog(true);
        return null;
      }
      throw new Error(err.error || "Atama yapılamadı");
    }
    return res.json();
  };

  const assignMutation = useMutation({
    mutationFn: (data: any) => doAssign(data),
    onSuccess: (result) => {
      if (!result) return;
      queryClient.invalidateQueries({ queryKey: ["facilities-with-compliance"] });
      queryClient.invalidateQueries({ queryKey: ["facility-detail", facility?.id] });
      queryClient.invalidateQueries({ queryKey: ["panel-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["assignments-status"] });
      toast.success("Atama başarıyla tamamlandı.");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (error.message !== "PROFESSIONAL_ASSIGNED_ELSEWHERE") {
        toast.error(error.message);
      }
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () => doAssign(pendingAssignment, true),
    onSuccess: (result) => {
      if (!result) return;
      queryClient.invalidateQueries({ queryKey: ["facilities-with-compliance"] });
      queryClient.invalidateQueries({ queryKey: ["facility-detail", facility?.id] });
      queryClient.invalidateQueries({ queryKey: ["panel-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["assignments-status"] });
      toast.success("Atama başarıyla tamamlandı.");
      setShowConfirmDialog(false);
      setPendingAssignment(null);
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setShowConfirmDialog(false);
      setPendingAssignment(null);
    },
  });

  React.useEffect(() => {
    if (facility && open) {
      let duration = 0;
      if (assignType === "IGU") {
        const req = facility.compliance?.igu?.requiredMinutes || 0;
        const ass = facility.compliance?.igu?.assignedMinutes || 0;
        duration = req - ass;
      } else if (assignType === "Hekim") {
        const req = facility.compliance?.hekim?.requiredMinutes || 0;
        const ass = facility.compliance?.hekim?.assignedMinutes || 0;
        duration = req - ass;
      } else if (assignType === "DSP") {
        duration = 0;
      } else if (assignType === "Vekil") {
        duration = 11700;
      }

      const isFT = assignmentMode === "Tam Zamanlı" || assignType === "Vekil";
      setFormData((prev) => ({
        ...prev,
        durationMinutes: isFT ? "11700" : Math.max(0, duration).toString(),
        isFullTime: isFT,
      }));
    }
  }, [facility, assignType, assignmentMode, open]);

  const { data: professionals = [] } = useQuery<any[]>({
    queryKey: ["professionals", "active"],
    queryFn: async () => {
      const res = await api.get("/panel/professionals");
      if (!res.ok) throw new Error("Yüklenemedi");
      return res.json();
    },
    enabled: open && assignType !== "Vekil",
  });

  const { data: employerReps = [] } = useQuery<any[]>({
    queryKey: ["employers", "active"],
    queryFn: async () => {
      const res = await api.get("/panel/employers");
      if (!res.ok) throw new Error("Yüklenemedi");
      return res.json();
    },
    enabled: open && assignType === "Vekil",
  });

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facility) return;

    assignMutation.mutate({
      facilityId: facility.id,
      type: assignType,
      professionalId: assignType !== "Vekil" ? formData.professionalId : undefined,
      employerRepId: assignType === "Vekil" ? formData.employerRepId : undefined,
      durationMinutes: parseInt(formData.durationMinutes) || 0,
      isFullTime: assignmentMode === "Tam Zamanlı" || assignType === "Vekil",
      startDate: formData.startDate,
      costType: formData.costType,
      unitPrice: formData.unitPrice,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-[95vw] max-h-[90vh] p-0 overflow-hidden rounded-lg border border-border bg-card shadow-lg flex flex-col gap-0">
        <DialogHeader className="px-5 py-3.5 bg-muted/30 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                Hızlı Atama Yap
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground truncate mt-0.5">
                {facility?.name || facility?.facilityName} — {assignType} ataması
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleAssignSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Atama Rolü *</Label>
                <Select
                  value={assignType}
                  onValueChange={(v: any) => {
                    setAssignType(v);
                    setFormData((prev) => ({
                      ...prev,
                      professionalId: "",
                      employerRepId: "",
                    }));
                  }}
                >
                  <SelectTrigger className="w-full h-9 rounded-lg border-border text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="IGU" className="text-xs">İSG Uzmanı</SelectItem>
                    <SelectItem value="Hekim" className="text-xs">İşyeri Hekimi</SelectItem>
                    <SelectItem value="DSP" className="text-xs">Diğer Sağlık Personeli</SelectItem>
                    <SelectItem value="Vekil" className="text-xs">İşveren Vekili</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  {assignType === "Vekil" ? "İşveren Vekili *" : "Profesyonel *"}
                </Label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      className="w-full justify-between rounded-lg border-border h-9 text-xs font-normal px-3"
                    >
                      <span className="truncate">
                        {assignType === "Vekil" && formData.employerRepId
                          ? employerReps.find((r: any) => r.id.toString() === formData.employerRepId)?.fullName
                          : assignType !== "Vekil" && formData.professionalId
                            ? professionals.find((p: any) => p.id.toString() === formData.professionalId)?.fullName
                            : "Kişi seçin..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-lg border-border" align="start">
                    <Command>
                      <CommandInput placeholder="Kişi ara..." className="h-9 text-xs" />
                      <CommandList className="max-h-56">
                        <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                          Kişi bulunamadı.
                        </CommandEmpty>
                        <CommandGroup>
                          {assignType === "Vekil"
                            ? employerReps.map((r: any) => (
                              <CommandItem
                                key={r.id}
                                value={r.fullName}
                                onSelect={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    employerRepId: r.id.toString(),
                                  }));
                                  setOpenCombobox(false);
                                }}
                                className="text-xs py-1.5 px-2.5 cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-3.5 w-3.5",
                                    formData.employerRepId === r.id.toString()
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {r.fullName} ({r.title || "İşveren Vekili"})
                              </CommandItem>
                            ))
                            : professionals
                              .filter((p: any) => {
                                if (assignType === "IGU") {
                                  const isVeryDangerous = facility?.dangerClass === "Çok Tehlikeli";
                                  const hasAClassAssigned = facility?.assignments?.some(
                                    (a: any) =>
                                      a.type === "IGU" &&
                                      a.professional?.titleClass === "A Sınıfı IGU"
                                  );
                                  if (isVeryDangerous && !hasAClassAssigned) {
                                    return p.titleClass === "A Sınıfı IGU";
                                  }
                                  return p.titleClass.includes("IGU");
                                }
                                if (assignType === "Hekim") return p.titleClass === "İşyeri Hekimi";
                                if (assignType === "DSP") return p.titleClass === "DSP";
                                return false;
                              })
                              .map((p: any) => (
                                <CommandItem
                                  key={p.id}
                                  value={p.fullName}
                                  onSelect={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      professionalId: p.id.toString(),
                                    }));
                                    setOpenCombobox(false);
                                  }}
                                  className="text-xs py-1.5 px-2.5 cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-3.5 w-3.5",
                                      formData.professionalId === p.id.toString()
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {p.fullName} ({p.titleClass})
                                </CommandItem>
                              ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {assignType !== "Vekil" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Atama Türü *</Label>
                  <Select
                    value={assignmentMode}
                    onValueChange={(v: any) => {
                      setAssignmentMode(v);
                      if (v === "Tam Zamanlı") {
                        setFormData((prev) => ({ ...prev, durationMinutes: "11700" }));
                      }
                    }}
                  >
                    <SelectTrigger className="w-full h-9 rounded-lg border-border text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="Kısmi Zamanlı" className="text-xs">Kısmi Zamanlı</SelectItem>
                      <SelectItem value="Tam Zamanlı" className="text-xs">Tam Zamanlı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Süre (Dk/Ay) *</Label>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, durationMinutes: e.target.value }))
                    }
                    required
                    readOnly={assignmentMode === "Tam Zamanlı" || assignType === "Vekil"}
                    className={cn(
                      "pl-8 h-9 rounded-lg text-xs tabular-nums",
                      (assignmentMode === "Tam Zamanlı" || assignType === "Vekil") &&
                      "bg-muted text-muted-foreground"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Başlangıç Tarihi *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  required
                  className="h-9 rounded-lg text-xs tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Maliyet Tipi</Label>
                <Select
                  value={formData.costType}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, costType: v }))}
                >
                  <SelectTrigger className="w-full h-9 rounded-lg border-border text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="Aylık Sabit" className="text-xs">Aylık Sabit</SelectItem>
                    <SelectItem value="Saatlik" className="text-xs">Saatlik</SelectItem>
                    <SelectItem value="Çalışan Başı" className="text-xs">Çalışan Başı</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-medium text-foreground">Birim Fiyat (₺)</Label>
                <div className="relative">
                  <CreditCard className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, unitPrice: e.target.value }))
                    }
                    className="pl-8 h-9 rounded-lg text-xs tabular-nums"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                Atama yapılmadan önce personelin kalan kapasitesi sistem tarafından otomatik kontrol edilir. Kapasite yetersizse işlem reddedilir.
              </p>
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 rounded-none px-5 py-3.5 bg-muted/30 border-t border-border shrink-0 gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 rounded-lg text-xs"
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={
                assignMutation.isPending ||
                (assignType === "Vekil" ? !formData.employerRepId : !formData.professionalId)
              }
              className="h-8 px-4 rounded-lg text-xs font-semibold gap-1.5"
            >
              {assignMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Atamayı Tamamla
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="sm:max-w-md rounded-lg border border-border bg-card p-0 overflow-hidden gap-0">
          <AlertDialogHeader className="px-5 py-4 bg-muted/30 border-b border-border">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <AlertDialogTitle className="text-sm font-semibold text-foreground">
                  Çoklu Tesis Atama Onayı
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Bu profesyonel zaten başka bir tesiste aktif olarak atanmış durumda. Yine de bu tesise eklemek istiyor musunuz?
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mx-0 mb-0 rounded-none px-5 py-3.5 bg-card border-t border-border gap-2 sm:gap-2">
            <AlertDialogCancel
              onClick={() => {
                setShowConfirmDialog(false);
                setPendingAssignment(null);
              }}
              className="h-8 rounded-lg text-xs mt-0"
            >
              Vazgeç
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
              className="h-8 rounded-lg text-xs gap-1.5"
            >
              {confirmMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Onayla ve Ekle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
