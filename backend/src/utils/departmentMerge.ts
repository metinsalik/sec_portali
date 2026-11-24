import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function normalizeDeptName(value: string | null | undefined): string {
  return (value || '').trim().replace(/\s+/g, ' ');
}

export function normalizeDeptKey(value: string | null | undefined): string {
  return normalizeDeptName(value).toLocaleLowerCase('tr-TR');
}

function splitCommaList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => normalizeDeptName(s))
    .filter(Boolean);
}

function replaceInList(items: string[], oldKeys: Set<string>, newName: string): { changed: boolean; next: string[] } {
  let changed = false;
  const result: string[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const trimmed = normalizeDeptName(item);
    if (!trimmed) continue;
    const key = normalizeDeptKey(trimmed);
    const replaced = oldKeys.has(key) ? newName : trimmed;
    if (oldKeys.has(key) && replaced !== trimmed) {
      changed = true;
    } else if (oldKeys.has(key)) {
      changed = true;
    }
    const nextKey = normalizeDeptKey(replaced);
    if (!seen.has(nextKey)) {
      seen.add(nextKey);
      result.push(replaced);
    } else if (oldKeys.has(key)) {
      changed = true;
    }
  }

  if (result.length !== items.length) changed = true;
  return { changed, next: result };
}

export interface DependencyBreakdownItem {
  module: string;
  label: string;
  count: number;
}

export interface DepartmentDependencyReport {
  department: { id: number; name: string };
  hasDependencies: boolean;
  totalCount: number;
  breakdown: DependencyBreakdownItem[];
}

export async function getDepartmentDependencies(deptId: number): Promise<DepartmentDependencyReport> {
  const dept = await prisma.department.findUnique({ where: { id: deptId } });
  if (!dept) {
    throw new Error('Departman bulunamadı.');
  }

  const targetKey = normalizeDeptKey(dept.name);

  const [
    incidentsCount,
    notebooksCount,
    users,
    risks,
    improvements,
    irscFindings,
    irscActions,
    irscTemplates,
    fireSafetyItems,
    fireEquipResp,
    fireEquipments,
    buildForms,
    ohsDepts,
    btUnits,
  ] = await Promise.all([
    prisma.extraordinaryIncident.count({ where: { departmentId: deptId } }),
    prisma.notebookItem.count({ where: { departmentId: deptId } }),
    prisma.user.findMany({ where: { department: { not: null } }, select: { department: true } }),
    prisma.riskLifecycle.findMany({
      select: {
        improvementResponsible: true,
        postImprovementResponsible: true,
        controlResponsible: true,
      },
    }),
    prisma.improvementRecord.findMany({
      where: { assignedTo: { not: null } },
      select: { assignedTo: true },
    }),
    prisma.integratedFinding.findMany({ select: { departments: true } }),
    prisma.integratedAction.findMany({ select: { department: true } }),
    prisma.irscFindingTemplate.findMany({ select: { defaultDepartments: true } }),
    prisma.fireSafetyItem.findMany({ select: { responsible: true } }),
    prisma.fireEquipmentResponsible.findMany({
      where: { department: { not: null } },
      select: { department: true },
    }),
    prisma.fireEquipment.findMany({
      where: { responsibleUnit: { not: null } },
      select: { responsibleUnit: true },
    }),
    prisma.buildDesignForm.findMany({ select: { requester: true, relatedDepartments: true } }),
    prisma.ohsBoardDepartment.findMany({ select: { name: true } }),
    prisma.bTSorumluBirim.findMany({ select: { ad: true } }),
  ]);

  const usersCount = users.filter((u) => normalizeDeptKey(u.department) === targetKey).length;

  const risksCount = risks.filter((r) => {
    const all = [
      ...splitCommaList(r.improvementResponsible),
      ...splitCommaList(r.postImprovementResponsible),
      ...splitCommaList(r.controlResponsible),
    ];
    return all.some((t) => normalizeDeptKey(t) === targetKey);
  }).length;

  const improvementsCount = improvements.filter((r) =>
    splitCommaList(r.assignedTo).some((t) => normalizeDeptKey(t) === targetKey)
  ).length;

  const irscCount =
    irscFindings.filter((f) => (f.departments || []).some((d) => normalizeDeptKey(d) === targetKey)).length +
    irscActions.filter((a) => normalizeDeptKey(a.department) === targetKey).length +
    irscTemplates.filter((t) => (t.defaultDepartments || []).some((d) => normalizeDeptKey(d) === targetKey)).length;

  const fireSafetyCount = fireSafetyItems.filter((i) => normalizeDeptKey(i.responsible) === targetKey).length;

  const fireEquipCount =
    fireEquipResp.filter((r) => normalizeDeptKey(r.department) === targetKey).length +
    fireEquipments.filter((e) => normalizeDeptKey(e.responsibleUnit) === targetKey).length;

  const buildCount = buildForms.filter((f) => {
    if (normalizeDeptKey(f.requester) === targetKey) return true;
    if (f.relatedDepartments) {
      try {
        const parsed = JSON.parse(f.relatedDepartments);
        if (Array.isArray(parsed) && parsed.some((d) => normalizeDeptKey(String(d)) === targetKey)) return true;
      } catch {
        if (splitCommaList(f.relatedDepartments).some((d) => normalizeDeptKey(d) === targetKey)) return true;
      }
    }
    return false;
  }).length;

  const ohsCount = ohsDepts.filter((d) => normalizeDeptKey(d.name) === targetKey).length;
  const btCount = btUnits.filter((u) => normalizeDeptKey(u.ad) === targetKey).length;

  const breakdown: DependencyBreakdownItem[] = [
    { module: 'users', label: 'Kullanıcılar', count: usersCount },
    { module: 'improvements', label: 'İyileştirme ve Aksiyon Takip', count: improvementsCount },
    { module: 'risks', label: 'Risk Yönetimi (Sorumlu)', count: risksCount },
    { module: 'renovation_report', label: 'Merkezi Denetim (IRSC) & Havuz', count: irscCount },
    { module: 'incidents', label: 'Olağanüstü Olaylar', count: incidentsCount },
    { module: 'notebooks', label: 'İSG Defterleri', count: notebooksCount },
    { module: 'fire_safety', label: 'Yangın Güvenliği Kontrolü', count: fireSafetyCount },
    { module: 'fire_equipment', label: 'Yangın Ekipmanları', count: fireEquipCount },
    { module: 'build_management', label: 'Yapı / Tadilat Yönetimi', count: buildCount },
    { module: 'ohs_board', label: 'İSG Kurul Birimleri', count: ohsCount },
    { module: 'bina_turu', label: 'Bina Turu Sorumlu Birimleri', count: btCount },
  ].filter((item) => item.count > 0);

  const totalCount = breakdown.reduce((sum, item) => sum + item.count, 0);

  return {
    department: { id: dept.id, name: dept.name },
    hasDependencies: totalCount > 0,
    totalCount,
    breakdown,
  };
}

export async function getDepartmentsWithUsage() {
  const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
  const keyToCount = new Map<string, number>();
  const idToCount = new Map<number, number>();

  const bumpKey = (val: string | null | undefined) => {
    const k = normalizeDeptKey(val);
    if (!k) return;
    keyToCount.set(k, (keyToCount.get(k) || 0) + 1);
  };

  const [
    incidentGroups,
    notebookGroups,
    users,
    risks,
    improvements,
    irscFindings,
    irscActions,
    irscTemplates,
    fireSafetyItems,
    fireEquipResp,
    fireEquipments,
    buildForms,
    ohsDepts,
    btUnits,
  ] = await Promise.all([
    prisma.extraordinaryIncident.groupBy({ by: ['departmentId'], _count: true }),
    prisma.notebookItem.groupBy({ by: ['departmentId'], where: { departmentId: { not: null } }, _count: true }),
    prisma.user.findMany({ where: { department: { not: null } }, select: { department: true } }),
    prisma.riskLifecycle.findMany({
      select: { improvementResponsible: true, postImprovementResponsible: true, controlResponsible: true },
    }),
    prisma.improvementRecord.findMany({ where: { assignedTo: { not: null } }, select: { assignedTo: true } }),
    prisma.integratedFinding.findMany({ select: { departments: true } }),
    prisma.integratedAction.findMany({ select: { department: true } }),
    prisma.irscFindingTemplate.findMany({ select: { defaultDepartments: true } }),
    prisma.fireSafetyItem.findMany({ select: { responsible: true } }),
    prisma.fireEquipmentResponsible.findMany({ where: { department: { not: null } }, select: { department: true } }),
    prisma.fireEquipment.findMany({ where: { responsibleUnit: { not: null } }, select: { responsibleUnit: true } }),
    prisma.buildDesignForm.findMany({ select: { requester: true, relatedDepartments: true } }),
    prisma.ohsBoardDepartment.findMany({ select: { name: true } }),
    prisma.bTSorumluBirim.findMany({ select: { ad: true } }),
  ]);

  for (const g of incidentGroups) {
    idToCount.set(g.departmentId, (idToCount.get(g.departmentId) || 0) + g._count);
  }
  for (const g of notebookGroups) {
    if (g.departmentId != null) {
      idToCount.set(g.departmentId, (idToCount.get(g.departmentId) || 0) + g._count);
    }
  }
  for (const u of users) bumpKey(u.department);
  for (const r of risks) {
    const uniq = new Set([
      ...splitCommaList(r.improvementResponsible).map(normalizeDeptKey),
      ...splitCommaList(r.postImprovementResponsible).map(normalizeDeptKey),
      ...splitCommaList(r.controlResponsible).map(normalizeDeptKey),
    ]);
    uniq.forEach((k) => { if (k) keyToCount.set(k, (keyToCount.get(k) || 0) + 1); });
  }
  for (const imp of improvements) {
    const uniq = new Set(splitCommaList(imp.assignedTo).map(normalizeDeptKey));
    uniq.forEach((k) => { if (k) keyToCount.set(k, (keyToCount.get(k) || 0) + 1); });
  }
  for (const f of irscFindings) (f.departments || []).forEach(bumpKey);
  for (const a of irscActions) bumpKey(a.department);
  for (const t of irscTemplates) (t.defaultDepartments || []).forEach(bumpKey);
  for (const i of fireSafetyItems) bumpKey(i.responsible);
  for (const r of fireEquipResp) bumpKey(r.department);
  for (const e of fireEquipments) bumpKey(e.responsibleUnit);
  for (const bf of buildForms) {
    const uniq = new Set<string>();
    if (bf.requester) uniq.add(normalizeDeptKey(bf.requester));
    if (bf.relatedDepartments) {
      try {
        const parsed = JSON.parse(bf.relatedDepartments);
        if (Array.isArray(parsed)) parsed.forEach((d) => uniq.add(normalizeDeptKey(String(d))));
      } catch {
        splitCommaList(bf.relatedDepartments).forEach((d) => uniq.add(normalizeDeptKey(d)));
      }
    }
    uniq.forEach((k) => { if (k) keyToCount.set(k, (keyToCount.get(k) || 0) + 1); });
  }
  for (const d of ohsDepts) bumpKey(d.name);
  for (const b of btUnits) bumpKey(b.ad);

  return departments.map((d) => ({
    ...d,
    usageCount: (idToCount.get(d.id) || 0) + (keyToCount.get(normalizeDeptKey(d.name)) || 0),
  }));
}

export async function syncDepartmentsFromModules() {
  const existing = await prisma.department.findMany({ select: { name: true } });
  const existingKeys = new Set(existing.map((d) => normalizeDeptKey(d.name)));
  const candidates = new Map<string, string>();

  const collect = (val: string | null | undefined) => {
    const cleaned = normalizeDeptName(val);
    if (!cleaned || cleaned.length < 2) return;
    const key = normalizeDeptKey(cleaned);
    if (!existingKeys.has(key) && !candidates.has(key)) {
      candidates.set(key, cleaned);
    }
  };

  const [
    opDepts,
    riskDepts,
    buildDepts,
    ohsDepts,
    btUnits,
    renovationSettings,
    fireSafetySettings,
    improvementSettings,
    users,
    fireEquipResp,
    fireEquipments,
    improvements,
    risks,
    irscFindings,
    irscActions,
  ] = await Promise.all([
    prisma.operationsDepartment.findMany({ select: { name: true } }),
    prisma.riskDepartmentSetting.findMany({ select: { name: true } }),
    prisma.buildDepartmentSetting.findMany({ select: { name: true } }),
    prisma.ohsBoardDepartment.findMany({ select: { name: true } }),
    prisma.bTSorumluBirim.findMany({ select: { ad: true } }),
    prisma.renovationReportSetting.findMany({ select: { departments: true } }),
    prisma.fireSafetySetting.findMany({ select: { responsibles: true } }),
    prisma.improvementSetting.findMany({ where: { key: 'responsibles' }, select: { value: true } }),
    prisma.user.findMany({ where: { department: { not: null } }, select: { department: true } }),
    prisma.fireEquipmentResponsible.findMany({ where: { department: { not: null } }, select: { department: true } }),
    prisma.fireEquipment.findMany({ where: { responsibleUnit: { not: null } }, select: { responsibleUnit: true } }),
    prisma.improvementRecord.findMany({ where: { assignedTo: { not: null } }, select: { assignedTo: true } }),
    prisma.riskLifecycle.findMany({
      select: { improvementResponsible: true, postImprovementResponsible: true, controlResponsible: true },
    }),
    prisma.integratedFinding.findMany({ select: { departments: true } }),
    prisma.integratedAction.findMany({ select: { department: true } }),
  ]);

  opDepts.forEach((d) => collect(d.name));
  riskDepts.forEach((d) => collect(d.name));
  buildDepts.forEach((d) => collect(d.name));
  ohsDepts.forEach((d) => collect(d.name));
  btUnits.forEach((u) => collect(u.ad));

  for (const rs of renovationSettings) {
    if (Array.isArray(rs.departments)) {
      (rs.departments as any[]).forEach((item) => collect(typeof item === 'string' ? item : item?.name));
    }
  }
  for (const fs of fireSafetySettings) {
    if (Array.isArray(fs.responsibles)) {
      (fs.responsibles as any[]).forEach((item) => collect(typeof item === 'string' ? item : item?.name));
    }
  }
  for (const is of improvementSettings) {
    if (Array.isArray(is.value)) {
      (is.value as any[]).forEach((item) => collect(typeof item === 'string' ? item : item?.name));
    }
  }

  users.forEach((u) => collect(u.department));
  fireEquipResp.forEach((r) => collect(r.department));
  fireEquipments.forEach((e) => collect(e.responsibleUnit));
  improvements.forEach((i) => splitCommaList(i.assignedTo).forEach(collect));
  risks.forEach((r) => {
    splitCommaList(r.improvementResponsible).forEach(collect);
    splitCommaList(r.postImprovementResponsible).forEach(collect);
    splitCommaList(r.controlResponsible).forEach(collect);
  });
  irscFindings.forEach((f) => (f.departments || []).forEach(collect));
  irscActions.forEach((a) => collect(a.department));

  const addedNames: string[] = [];
  for (const name of candidates.values()) {
    await prisma.department.create({ data: { name } });
    addedNames.push(name);
  }

  const totalCount = await prisma.department.count();
  return {
    addedCount: addedNames.length,
    addedNames: addedNames.sort((a, b) => a.localeCompare(b, 'tr-TR')),
    totalCount,
  };
}

async function propagateDepartmentChangeTx(
  tx: any,
  oldNames: string[],
  newName: string,
  oldIds?: number[],
  targetId?: number
): Promise<number> {
  const oldKeys = new Set(oldNames.map(normalizeDeptKey).filter(Boolean));
  if (oldKeys.size === 0) return 0;

  let transferredCount = 0;

  // 1. FK relations on Department
  if (oldIds && oldIds.length > 0 && targetId != null) {
    const incRes = await tx.extraordinaryIncident.updateMany({
      where: { departmentId: { in: oldIds } },
      data: { departmentId: targetId },
    });
    const nbRes = await tx.notebookItem.updateMany({
      where: { departmentId: { in: oldIds } },
      data: { departmentId: targetId },
    });
    transferredCount += incRes.count + nbRes.count;
  }

  // 2. User.department (User model's primary key is username)
  const users = await tx.user.findMany({
    where: { department: { not: null } },
    select: { username: true, department: true },
  });
  for (const u of users) {
    if (oldKeys.has(normalizeDeptKey(u.department))) {
      await tx.user.update({ where: { username: u.username }, data: { department: newName } });
      transferredCount++;
    }
  }

  // 3. RiskLifecycle (comma-separated responsible fields)
  const risks = await tx.riskLifecycle.findMany({
    select: {
      id: true,
      improvementResponsible: true,
      postImprovementResponsible: true,
      controlResponsible: true,
    },
  });
  for (const r of risks) {
    const r1 = replaceInList(splitCommaList(r.improvementResponsible), oldKeys, newName);
    const r2 = replaceInList(splitCommaList(r.postImprovementResponsible), oldKeys, newName);
    const r3 = replaceInList(splitCommaList(r.controlResponsible), oldKeys, newName);
    if (r1.changed || r2.changed || r3.changed) {
      await tx.riskLifecycle.update({
        where: { id: r.id },
        data: {
          ...(r1.changed ? { improvementResponsible: r1.next.join(', ') } : {}),
          ...(r2.changed ? { postImprovementResponsible: r2.next.join(', ') } : {}),
          ...(r3.changed ? { controlResponsible: r3.next.join(', ') } : {}),
        },
      });
      transferredCount++;
    }
  }

  // 4. ImprovementRecord.assignedTo (comma-separated)
  const improvements = await tx.improvementRecord.findMany({
    where: { assignedTo: { not: null } },
    select: { id: true, assignedTo: true },
  });
  for (const imp of improvements) {
    const res = replaceInList(splitCommaList(imp.assignedTo), oldKeys, newName);
    if (res.changed) {
      await tx.improvementRecord.update({
        where: { id: imp.id },
        data: { assignedTo: res.next.join(', ') },
      });
      transferredCount++;
    }
  }

  // 5. IntegratedFinding.departments (String[]) & IntegratedAction.department & IrscFindingTemplate.defaultDepartments
  const irscFindings = await tx.integratedFinding.findMany({ select: { id: true, departments: true } });
  for (const f of irscFindings) {
    const res = replaceInList(f.departments || [], oldKeys, newName);
    if (res.changed) {
      await tx.integratedFinding.update({ where: { id: f.id }, data: { departments: res.next } });
      transferredCount++;
    }
  }

  const irscActions = await tx.integratedAction.findMany({ select: { id: true, department: true } });
  for (const a of irscActions) {
    if (oldKeys.has(normalizeDeptKey(a.department))) {
      await tx.integratedAction.update({ where: { id: a.id }, data: { department: newName } });
      transferredCount++;
    }
  }

  const irscTemplates = await tx.irscFindingTemplate.findMany({ select: { id: true, defaultDepartments: true } });
  for (const t of irscTemplates) {
    const res = replaceInList(t.defaultDepartments || [], oldKeys, newName);
    if (res.changed) {
      await tx.irscFindingTemplate.update({ where: { id: t.id }, data: { defaultDepartments: res.next } });
      transferredCount++;
    }
  }

  // 6. FireSafetyItem.responsible
  const fireSafetyItems = await tx.fireSafetyItem.findMany({ select: { id: true, responsible: true } });
  for (const item of fireSafetyItems) {
    if (oldKeys.has(normalizeDeptKey(item.responsible))) {
      await tx.fireSafetyItem.update({ where: { id: item.id }, data: { responsible: newName } });
      transferredCount++;
    }
  }

  // 7. FireEquipmentResponsible.department & FireEquipment.responsibleUnit
  const fireEquipResp = await tx.fireEquipmentResponsible.findMany({
    where: { department: { not: null } },
    select: { id: true, department: true },
  });
  for (const r of fireEquipResp) {
    if (oldKeys.has(normalizeDeptKey(r.department))) {
      await tx.fireEquipmentResponsible.update({ where: { id: r.id }, data: { department: newName } });
      transferredCount++;
    }
  }

  const fireEquipments = await tx.fireEquipment.findMany({
    where: { responsibleUnit: { not: null } },
    select: { id: true, responsibleUnit: true },
  });
  for (const e of fireEquipments) {
    if (oldKeys.has(normalizeDeptKey(e.responsibleUnit))) {
      await tx.fireEquipment.update({ where: { id: e.id }, data: { responsibleUnit: newName } });
      transferredCount++;
    }
  }

  // 8. BuildDesignForm.requester & relatedDepartments
  const buildForms = await tx.buildDesignForm.findMany({
    select: { id: true, requester: true, relatedDepartments: true },
  });
  for (const bf of buildForms) {
    let changed = false;
    const data: Record<string, any> = {};
    if (bf.requester && oldKeys.has(normalizeDeptKey(bf.requester))) {
      data.requester = newName;
      changed = true;
    }
    if (bf.relatedDepartments) {
      try {
        const parsed = JSON.parse(bf.relatedDepartments);
        if (Array.isArray(parsed)) {
          const res = replaceInList(parsed.map(String), oldKeys, newName);
          if (res.changed) {
            data.relatedDepartments = JSON.stringify(res.next);
            changed = true;
          }
        }
      } catch {
        const res = replaceInList(splitCommaList(bf.relatedDepartments), oldKeys, newName);
        if (res.changed) {
          data.relatedDepartments = res.next.join(', ');
          changed = true;
        }
      }
    }
    if (changed) {
      await tx.buildDesignForm.update({ where: { id: bf.id }, data });
      transferredCount++;
    }
  }

  // 9. OhsBoardDepartment (per-facility unique [facilityId, name])
  // (Not: FacilityLocation.department fiziksel lokasyon/klinik birimidir — ör. Acil Servis > Kırmızı Triyaj; kurumsal müdürlük/departman ile karıştırılmaz.)
  const ohsDepts = await tx.ohsBoardDepartment.findMany({ select: { id: true, facilityId: true, name: true } });
  for (const d of ohsDepts) {
    if (!oldKeys.has(normalizeDeptKey(d.name))) continue;
    const existingTarget = await tx.ohsBoardDepartment.findFirst({
      where: { facilityId: d.facilityId, name: { equals: newName, mode: 'insensitive' }, id: { not: d.id } },
    });
    if (existingTarget) {
      await tx.ohsBoardDecision.updateMany({ where: { departmentId: d.id }, data: { departmentId: existingTarget.id } });
      await tx.ohsBoardMember.updateMany({ where: { departmentId: d.id }, data: { departmentId: existingTarget.id } });
      await tx.ohsBoardDepartment.delete({ where: { id: d.id } });
    } else {
      await tx.ohsBoardDepartment.update({ where: { id: d.id }, data: { name: newName } });
    }
    transferredCount++;
  }

  // 11. BTSorumluBirim (per-facility)
  const btUnits = await tx.bTSorumluBirim.findMany({ select: { id: true, facilityId: true, ad: true } });
  for (const u of btUnits) {
    if (!oldKeys.has(normalizeDeptKey(u.ad))) continue;
    const existingTarget = await tx.bTSorumluBirim.findFirst({
      where: { facilityId: u.facilityId, ad: { equals: newName, mode: 'insensitive' }, id: { not: u.id } },
    });
    if (existingTarget) {
      await tx.bTSorumluKisi.updateMany({ where: { birimId: u.id }, data: { birimId: existingTarget.id } });
      const tours = await tx.bTTur.findMany({
        where: { sorumluBirimler: { some: { id: u.id } } },
        select: { id: true, sorumluBirimler: { select: { id: true } } },
      });
      for (const tour of tours) {
        const alreadyConnected = tour.sorumluBirimler.some((b: any) => b.id === existingTarget.id);
        await tx.bTTur.update({
          where: { id: tour.id },
          data: {
            sorumluBirimler: alreadyConnected
              ? { disconnect: { id: u.id } }
              : { disconnect: { id: u.id }, connect: { id: existingTarget.id } },
          },
        });
      }
      const issues = await tx.bTUygunsuzluk.findMany({
        where: { sorumluBirimler: { some: { id: u.id } } },
        select: { id: true, sorumluBirimler: { select: { id: true } } },
      });
      for (const issue of issues) {
        const alreadyConnected = issue.sorumluBirimler.some((b: any) => b.id === existingTarget.id);
        await tx.bTUygunsuzluk.update({
          where: { id: issue.id },
          data: {
            sorumluBirimler: alreadyConnected
              ? { disconnect: { id: u.id } }
              : { disconnect: { id: u.id }, connect: { id: existingTarget.id } },
          },
        });
      }
      await tx.bTSorumluBirim.delete({ where: { id: u.id } });
    } else {
      await tx.bTSorumluBirim.update({ where: { id: u.id }, data: { ad: newName } });
    }
    transferredCount++;
  }

  // 12. Legacy settings tables cleanup (run outside main tx via helper so optional tables never abort merge)
  return transferredCount;
}

async function cleanupLegacySettingsTables(oldNames: string[], newName: string) {
  const oldKeys = new Set(oldNames.map(normalizeDeptKey).filter(Boolean));
  if (oldKeys.size === 0) return;

  const safeRun = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (e) {
      console.warn('Legacy department settings cleanup warning:', e);
    }
  };

  await safeRun(async () => {
    const opDepts = await prisma.operationsDepartment.findMany({ select: { id: true, name: true } });
    for (const d of opDepts) {
      if (!oldKeys.has(normalizeDeptKey(d.name))) continue;
      const existingTarget = await prisma.operationsDepartment.findFirst({
        where: { name: { equals: newName, mode: 'insensitive' }, id: { not: d.id } },
      });
      if (existingTarget) {
        await prisma.operationsDepartment.delete({ where: { id: d.id } });
      } else {
        await prisma.operationsDepartment.update({ where: { id: d.id }, data: { name: newName } });
      }
    }
  });

  await safeRun(async () => {
    const riskDepts = await prisma.riskDepartmentSetting.findMany({ select: { id: true, facilityId: true, name: true } });
    for (const d of riskDepts) {
      if (!oldKeys.has(normalizeDeptKey(d.name))) continue;
      const existingTarget = await prisma.riskDepartmentSetting.findFirst({
        where: { facilityId: d.facilityId, name: { equals: newName, mode: 'insensitive' }, id: { not: d.id } },
      });
      if (existingTarget) {
        await prisma.riskDepartmentSetting.delete({ where: { id: d.id } });
      } else {
        await prisma.riskDepartmentSetting.update({ where: { id: d.id }, data: { name: newName } });
      }
    }
  });

  await safeRun(async () => {
    const buildDepts = await prisma.buildDepartmentSetting.findMany({ select: { id: true, facilityId: true, name: true } });
    for (const d of buildDepts) {
      if (!oldKeys.has(normalizeDeptKey(d.name))) continue;
      const existingTarget = await prisma.buildDepartmentSetting.findFirst({
        where: { facilityId: d.facilityId, name: { equals: newName, mode: 'insensitive' }, id: { not: d.id } },
      });
      if (existingTarget) {
        await prisma.buildDepartmentSetting.delete({ where: { id: d.id } });
      } else {
        await prisma.buildDepartmentSetting.update({ where: { id: d.id }, data: { name: newName } });
      }
    }
  });

  await safeRun(async () => {
    const renSettings = await prisma.renovationReportSetting.findMany({ select: { id: true, departments: true } });
    for (const rs of renSettings) {
      if (!Array.isArray(rs.departments)) continue;
      const items = rs.departments as any[];
      const seen = new Set<string>();
      let changed = false;
      const next: any[] = [];
      for (const item of items) {
        const rawName = typeof item === 'string' ? item : item?.name;
        if (!rawName) continue;
        const isOld = oldKeys.has(normalizeDeptKey(rawName));
        const finalName = isOld ? newName : rawName;
        if (isOld) changed = true;
        const k = normalizeDeptKey(finalName);
        if (!seen.has(k)) {
          seen.add(k);
          next.push(typeof item === 'string' ? finalName : { ...item, name: finalName });
        } else if (isOld) {
          changed = true;
        }
      }
      if (changed) {
        await prisma.renovationReportSetting.update({ where: { id: rs.id }, data: { departments: next } });
      }
    }
  });

  await safeRun(async () => {
    const fireSettings = await prisma.fireSafetySetting.findMany({ select: { id: true, responsibles: true } });
    for (const fs of fireSettings) {
      if (!Array.isArray(fs.responsibles)) continue;
      const items = fs.responsibles as any[];
      const seen = new Set<string>();
      let changed = false;
      const next: any[] = [];
      for (const item of items) {
        const rawName = typeof item === 'string' ? item : item?.name;
        if (!rawName) continue;
        const isOld = oldKeys.has(normalizeDeptKey(rawName));
        const finalName = isOld ? newName : rawName;
        if (isOld) changed = true;
        const k = normalizeDeptKey(finalName);
        if (!seen.has(k)) {
          seen.add(k);
          next.push(typeof item === 'string' ? finalName : { ...item, name: finalName });
        } else if (isOld) {
          changed = true;
        }
      }
      if (changed) {
        await prisma.fireSafetySetting.update({ where: { id: fs.id }, data: { responsibles: next } });
      }
    }
  });

  await safeRun(async () => {
    const impSettings = await prisma.improvementSetting.findMany({ where: { key: 'responsibles' }, select: { id: true, value: true } });
    for (const is of impSettings) {
      if (!Array.isArray(is.value)) continue;
      const res = replaceInList((is.value as any[]).map(String), oldKeys, newName);
      if (res.changed) {
        await prisma.improvementSetting.update({ where: { id: is.id }, data: { value: res.next } });
      }
    }
  });
}

export async function renameDepartmentSafe(id: number, rawNewName: string) {
  const newName = normalizeDeptName(rawNewName);
  if (!newName) throw new Error('Departman adı zorunludur.');

  const current = await prisma.department.findUnique({ where: { id } });
  if (!current) throw new Error('Departman bulunamadı.');

  const duplicate = await prisma.department.findFirst({
    where: { id: { not: id }, name: { equals: newName, mode: 'insensitive' } },
  });
  if (duplicate) {
    throw new Error(`"${duplicate.name}" adında bir departman zaten mevcut. Aynı ada çevirmek yerine Birleştir (Merge) işlemini kullanın.`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.department.update({ where: { id }, data: { name: newName } });
    if (normalizeDeptKey(current.name) !== normalizeDeptKey(newName) || current.name !== newName) {
      await propagateDepartmentChangeTx(tx, [current.name], newName);
    }
    return res;
  }, { timeout: 60000, maxWait: 15000 });

  if (normalizeDeptKey(current.name) !== normalizeDeptKey(newName) || current.name !== newName) {
    await cleanupLegacySettingsTables([current.name], newName);
  }
  return updated;
}

export async function mergeDepartments(sourceIds: number[], targetId: number) {
  const cleanSourceIds = Array.from(new Set(sourceIds.filter((id) => Number.isInteger(id) && id !== targetId)));
  if (cleanSourceIds.length === 0) {
    throw new Error('Birleştirilecek en az bir kaynak departman seçilmelidir.');
  }

  const [target, sources] = await Promise.all([
    prisma.department.findUnique({ where: { id: targetId } }),
    prisma.department.findMany({ where: { id: { in: cleanSourceIds } } }),
  ]);

  if (!target) throw new Error('Hedef departman bulunamadı.');
  if (sources.length === 0) throw new Error('Kaynak departman(lar) bulunamadı.');

  const sourceNames = sources.map((s) => s.name);

  const transferredCount = await prisma.$transaction(async (tx) => {
    const count = await propagateDepartmentChangeTx(tx, sourceNames, target.name, cleanSourceIds, target.id);
    await tx.department.deleteMany({ where: { id: { in: cleanSourceIds } } });
    return count;
  }, { timeout: 60000, maxWait: 15000 });

  await cleanupLegacySettingsTables(sourceNames, target.name);

  return {
    success: true,
    mergedCount: sources.length,
    transferredRecordsCount: transferredCount,
    target,
    message: `${sources.length} departman "${target.name}" altında birleştirildi (${transferredCount} ilişkili kayıt güncellendi).`,
  };
}
