import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const decisions = await prisma.ohsBoardDecision.findMany({
    include: {
      meeting: {
        include: {
          facility: true
        }
      },
      category: true,
      subCategory: true,
      department: true,
      actions: true
    }
  });

  if (decisions.length === 0) {
    console.log("Hiç karar bulunamadı.");
    return;
  }

  const csvRows = [];
  
  // Headers
  const headers = [
    "ID (decisionId)", 
    "MeetingID", 
    "FacilityID",
    "FacilityName", 
    "MeetingDate", 
    "MeetingNo",
    "DecisionNumber", 
    "DecisionText", 
    "CategoryID",
    "CategoryName", 
    "SubCategoryID",
    "SubCategoryName", 
    "DepartmentID",
    "DepartmentName", 
    "Priority", 
    "Status", 
    "DueDateType", 
    "DueDate", 
    "Periodicity", 
    "Remarks",
    "ActionsCount",
    "ActionsText"
  ];
  
  csvRows.push(headers.join(";"));

  for (const d of decisions) {
    // Escape quotes and newlines for CSV
    const escapeCsv = (str: string | null | undefined) => {
      if (!str) return "";
      const escaped = str.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const actionsText = d.actions.map(a => `[${a.createdAt.toISOString()}] ${a.createdBy || 'Unknown'}: ${a.actionText}`).join(" | ");

    const row = [
      d.id,
      d.meetingId,
      d.meeting?.facilityId || "",
      escapeCsv(d.meeting?.facility?.name),
      d.meeting?.meetingDate ? d.meeting.meetingDate.toISOString() : "",
      escapeCsv(d.meeting?.meetingNo),
      escapeCsv(d.decisionNumber),
      escapeCsv(d.decisionText),
      d.categoryId,
      escapeCsv(d.category?.name),
      d.subCategoryId || "",
      escapeCsv(d.subCategory?.name),
      d.departmentId,
      escapeCsv(d.department?.name),
      escapeCsv(d.priority),
      escapeCsv(d.status),
      escapeCsv(d.dueDateType),
      d.dueDate ? d.dueDate.toISOString() : "",
      escapeCsv(d.periodicity),
      escapeCsv(d.remarks),
      d.actions?.length || 0,
      escapeCsv(actionsText)
    ];
    csvRows.push(row.join(";"));
  }

  // BOM for Excel to recognize UTF-8
  const bom = "\uFEFF";
  fs.writeFileSync("../isg_kurul_kararlari.csv", bom + csvRows.join("\n"), "utf8");
  console.log("Başarıyla isg_kurul_kararlari.csv dosyasına aktarıldı.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
