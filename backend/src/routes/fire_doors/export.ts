import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import exceljs from 'exceljs';

export const exportDoors = async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId, filters } = req.query;
    
    if (!facilityId) {
      return res.status(400).json({ error: 'facilityId is required' });
    }

    const facilityIdStr = String(facilityId);
    
    // Build where clause for door filtering
    const doorWhere: any = {};
    if (facilityIdStr !== 'all') {
        doorWhere.facilityId = facilityIdStr;
    }
    const andConditions: any[] = [];
    
    if (filters) {
        try {
            const parsedFilters = JSON.parse(String(filters));
            for (const [key, value] of Object.entries(parsedFilters)) {
                if (value && value !== 'Tümü' && value !== 'all') {
                    if (key === 'grade') {
                        andConditions.push({ lastGrade: String(value) });
                    } else if (key === 'facilityId') {
                        doorWhere.facilityId = String(value);
                    } else {
                        // All other keys are assumed to be in properties
                        andConditions.push({
                            properties: {
                                path: [key],
                                equals: String(value)
                            }
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Error parsing filters JSON for export:", e);
        }
    }

    if (andConditions.length > 0) {
        doorWhere.AND = andConditions;
    }

    const doors = await prisma.fireDoor.findMany({
      where: doorWhere,
      include: {
        facility: {
            select: {
                shortName: true,
                name: true
            }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Yangın Kapıları');

    const propertiesList = await prisma.fireDoorProperty.findMany();
    const propertyIdToNameMap: Record<string, string> = {};
    propertiesList.forEach(prop => {
        propertyIdToNameMap[prop.id] = prop.name;
    });

    // Extract dynamic keys from all door properties, converting UUIDs to names
    const propertyKeys = new Set<string>();
    doors.forEach((door: any) => {
        if (door.properties && typeof door.properties === 'object') {
            const newProps: Record<string, any> = {};
            Object.keys(door.properties).forEach(k => {
                const mappedName = propertyIdToNameMap[k] || k;
                propertyKeys.add(mappedName);
                newProps[mappedName] = door.properties[k];
            });
            door.properties = newProps; // Replace with mapped names
        }
    });

    // Priority keys for properties so they appear first if they exist
    const priorityPropertyKeys = ['Bina', 'Kat', 'Departman', 'Mahal', 'Kapı Çeşidi', 'Yangın Dayanımı'];
    const sortedPropertyKeys = Array.from(propertyKeys).sort((a, b) => {
        const indexA = priorityPropertyKeys.indexOf(a);
        const indexB = priorityPropertyKeys.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });

    // We will structure columns as: 
    // Kapı No, Tesis, Durum, Son Denetim Notu, Puanı, (Dynamic Properties...)
    const baseColumns = [
        { header: 'Kapı No', key: 'doorNo', width: 20 },
        { header: 'Tesis', key: 'facilityName', width: 25 },
        { header: 'Durum', key: 'status', width: 15 },
        { header: 'Son Denetim Notu', key: 'lastGrade', width: 20 },
        { header: 'Son Denetim Puanı', key: 'lastScore', width: 20 },
    ];

    const dynamicColumns = sortedPropertyKeys.map(key => ({
        header: key,
        key: key,
        width: 20
    }));

    worksheet.columns = [...baseColumns, ...dynamicColumns];

    // Style the header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF334155' } // slate-700
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Auto filter
    worksheet.autoFilter = {
        from: 'A1',
        to: {
            row: 1,
            column: worksheet.columns.length
        }
    };

    doors.forEach((door: any) => {
        const rowData: any = {
            doorNo: door.doorNo || '-',
            facilityName: door.facility?.shortName || door.facility?.name || '-',
            status: door.status,
            lastGrade: door.lastGrade || 'Denetim Yok',
            lastScore: door.lastScore !== null ? door.lastScore : '-',
        };

        if (door.properties && typeof door.properties === 'object') {
            const props = door.properties as Record<string, any>;
            Object.keys(props).forEach(k => {
                rowData[k] = props[k];
            });
        }

        const row = worksheet.addRow(rowData);
        
        // Add color for grade
        const gradeCell = row.getCell('lastGrade');
        if (door.lastGrade === 'A') {
            gradeCell.font = { color: { argb: 'FF10B981' }, bold: true }; // emerald-500
        } else if (door.lastGrade === 'F') {
            gradeCell.font = { color: { argb: 'FFE11D48' }, bold: true }; // rose-600
        } else if (door.lastGrade) {
            gradeCell.font = { color: { argb: 'FFF59E0B' }, bold: true }; // amber-500
        }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Yangin_Kapilari_Envanteri.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Error exporting doors:', error);
    res.status(500).json({ error: 'Failed to export doors' });
  }
};
