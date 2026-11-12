import ExcelJS from 'exceljs';
import {
  SAFE_USAGE_INSTRUCTIONS,
  normalizeText,
  parseHazardDescription,
  parseFirstAid,
  getAbsoluteAssetUrl,
  loadImageAsPngDataUrl,
  createFallbackPpeIconDataUrl,
} from './hazmatCardUtils';

function estimateRowHeight(text: string, approxCharsPerLine: number, minHeight = 18, lineHeight = 12.2): number {
  if (!text) return minHeight;
  const paragraphs = text.split(/\r?\n/);
  let totalLines = 0;
  for (const p of paragraphs) {
    totalLines += Math.max(1, Math.ceil(p.length / Math.max(12, approxCharsPerLine)));
  }
  return Math.max(minHeight, Math.ceil(totalLines * lineHeight + 6));
}

function applyBoxBorder(
  ws: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  colorArgb: string,
  style: ExcelJS.BorderStyle = 'thin',
  leftAccentColorArgb?: string
) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cell = ws.getCell(r, c);
      const border: Partial<ExcelJS.Borders> = { ...(cell.border || {}) };
      if (r === startRow) border.top = { style, color: { argb: colorArgb } };
      if (r === endRow) border.bottom = { style, color: { argb: colorArgb } };
      if (c === startCol) {
        border.left = leftAccentColorArgb
          ? { style: 'thick', color: { argb: leftAccentColorArgb } }
          : { style, color: { argb: colorArgb } };
      }
      if (c === endCol) border.right = { style, color: { argb: colorArgb } };
      cell.border = border;
    }
  }
}

function fillRange(
  ws: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  fgColorArgb: string
) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      ws.getCell(r, c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: fgColorArgb },
      };
    }
  }
}

export async function exportMaterialCardToExcel(
  material: any,
  size: 'A3' | 'A4' | 'A5' = 'A4'
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'İSG Yönetim Sistemi';
  wb.created = new Date();

  const paperSize = (size === 'A3' ? 8 : size === 'A5' ? 11 : 9) as ExcelJS.PaperSize;
  const ws = wb.addWorksheet('Güvenlik Bilgi Kartı', {
    views: [{ showGridLines: false }],
    pageSetup: {
      paperSize,
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.25,
        bottom: 0.25,
        header: 0.1,
        footer: 0.1,
      },
    },
  });

  // 12 sütunlu grid: A-H sol (~%67), I-L sağ (~%33)
  ws.columns = Array.from({ length: 12 }, () => ({ width: 10.5 }));

  const prodName = material?.productName || material?.name || 'BELİRTİLMEDİ';
  const firmName = material?.brandName || material?.supplier || material?.manufacturer || '-';
  const usageMethod = material?.usageMethod || material?.description || '-';

  const hazardItems = parseHazardDescription(material?.hazardDescription);
  const firstAidNorm = normalizeText(material?.firstAid, ['İlk Yardım']);
  const firstAidData = parseFirstAid(firstAidNorm.text, firstAidNorm.hasData);
  const hasStructuredFirstAid = Boolean(
    firstAidData.goz || firstAidData.deri || firstAidData.yutma || firstAidData.solunum
  );
  const fireNorm = normalizeText(material?.fireFightingMeasures, ['Yangın']);
  const spillNorm = normalizeText(material?.accidentalReleaseMeasures, ['Kaza Sonucu']);

  const ghsList: any[] = material?.hazardLabels || [];
  const ppeList: any[] = material?.ppes || [];

  // ───────────────────────────────────────────────────────────────────────────
  // 1. ÜST BÖLÜM (Satır 1-6)
  // ───────────────────────────────────────────────────────────────────────────
  ws.getRow(1).height = 28;
  ws.getRow(2).height = 14;
  ws.getRow(3).height = 22;
  ws.getRow(4).height = 14;
  ws.getRow(5).height = 18;
  ws.getRow(6).height = 24;

  // Sol lacivert kart (A1:H6)
  fillRange(ws, 1, 1, 6, 8, 'FF0F2744');
  applyBoxBorder(ws, 1, 1, 6, 8, 'FF0F2744', 'medium');

  ws.mergeCells('A1:H1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'GÜVENLİK BİLGİ KARTI';
  titleCell.font = { name: 'Calibri', size: 17, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  for (let c = 1; c <= 8; c++) {
    ws.getCell(1, c).border = {
      ...ws.getCell(1, c).border,
      bottom: { style: 'thin', color: { argb: 'FF2E4D73' } },
    };
  }

  ws.mergeCells('A2:E2');
  const prodLbl = ws.getCell('A2');
  prodLbl.value = 'ÜRÜN ADI';
  prodLbl.font = { name: 'Calibri', size: 8, bold: true, color: { argb: 'FF67E8F9' } };
  prodLbl.alignment = { vertical: 'bottom', horizontal: 'left', indent: 1 };

  ws.mergeCells('F2:H2');
  const firmLbl = ws.getCell('F2');
  firmLbl.value = 'FİRMA';
  firmLbl.font = { name: 'Calibri', size: 8, bold: true, color: { argb: 'FF67E8F9' } };
  firmLbl.alignment = { vertical: 'bottom', horizontal: 'left', indent: 1 };

  ws.mergeCells('A3:E3');
  const prodVal = ws.getCell('A3');
  prodVal.value = prodName;
  prodVal.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  prodVal.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: true };

  ws.mergeCells('F3:H3');
  const firmVal = ws.getCell('F3');
  firmVal.value = firmName;
  firmVal.font = { name: 'Calibri', size: 11.5, bold: true, color: { argb: 'FFFFFFFF' } };
  firmVal.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: true };

  ws.mergeCells('A4:H4');
  const usageLbl = ws.getCell('A4');
  usageLbl.value = 'KULLANIM / UYGULAMA';
  usageLbl.font = { name: 'Calibri', size: 8, bold: true, color: { argb: 'FF67E8F9' } };
  usageLbl.alignment = { vertical: 'bottom', horizontal: 'left', indent: 1 };

  ws.mergeCells('A5:H6');
  const usageVal = ws.getCell('A5');
  usageVal.value = usageMethod;
  usageVal.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFF8FAFC' } };
  usageVal.alignment = { vertical: 'top', horizontal: 'left', indent: 1, wrapText: true };

  // Sağ Zararlılık İşaretleri kartı (I1:L6)
  fillRange(ws, 1, 9, 6, 12, 'FFFFFFFF');
  applyBoxBorder(ws, 1, 9, 6, 12, 'FFCBD5E1', 'thin');

  ws.mergeCells('I1:L1');
  const ghsTitle = ws.getCell('I1');
  ghsTitle.value = 'ZARARLILIK İŞARETLERİ';
  ghsTitle.font = { name: 'Calibri', size: 8.5, bold: true, color: { argb: 'FF64748B' } };
  ghsTitle.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('I2:L5');
  if (ghsList.length === 0) {
    const emptyGhs = ws.getCell('I2');
    emptyGhs.value = 'Tehlike işareti belirtilmemiş';
    emptyGhs.font = { name: 'Calibri', size: 8.5, italic: true, color: { argb: 'FF94A3B8' } };
    emptyGhs.alignment = { vertical: 'middle', horizontal: 'center' };
    ws.mergeCells('I6:L6');
  } else {
    const maxGhs = Math.min(ghsList.length, 4);
    // Her işaret ve altındaki etiket için sütun aralıkları (I=9..L=12)
    const ghsColRanges: [number, number][] =
      maxGhs === 1
        ? [[9, 12]]
        : maxGhs === 2
          ? [[9, 10], [11, 12]]
          : maxGhs === 3
            ? [[9, 9], [10, 11], [12, 12]]
            : [[9, 9], [10, 10], [11, 11], [12, 12]];

    for (let i = 0; i < maxGhs; i++) {
      const hl = ghsList[i];
      const [cStart, cEnd] = ghsColRanges[i];
      const colCenterZeroBased = (cStart - 1 + cEnd) / 2;

      if (hl?.label?.imageUrl) {
        const pngUrl = await loadImageAsPngDataUrl(getAbsoluteAssetUrl(hl.label.imageUrl), true);
        if (pngUrl) {
          const imgId = wb.addImage({ base64: pngUrl, extension: 'png' });
          ws.addImage(imgId, {
            tl: { col: colCenterZeroBased - 0.36, row: 1.15 },
            ext: { width: 54, height: 54 },
          });
        }
      }

      if (cEnd > cStart) {
        ws.mergeCells(6, cStart, 6, cEnd);
      }
      const lblCell = ws.getCell(6, cStart);
      lblCell.value = hl?.label?.name?.replace(/ Madde$/i, '') || hl?.label?.code || '';
      lblCell.font = { name: 'Calibri', size: maxGhs >= 3 ? 7.5 : 8, bold: true, color: { argb: 'FFB91C1C' } };
      lblCell.alignment = { vertical: 'top', horizontal: 'center', wrapText: true };
    }
  }

  // Boşluk satırı
  ws.getRow(7).height = 7;

  // ───────────────────────────────────────────────────────────────────────────
  // 2. ŞERİT: KKD VE UZEM 114 (Satır 8-9)
  // ───────────────────────────────────────────────────────────────────────────
  ws.getRow(8).height = 19;
  ws.getRow(9).height = 19;

  fillRange(ws, 8, 1, 9, 8, 'FFFFFFFF');
  applyBoxBorder(ws, 8, 1, 9, 8, 'FF06B6D4', 'medium');

  const fallbackPpeIcon = createFallbackPpeIconDataUrl();
  if (ppeList.length > 0) {
    const maxPpe = Math.min(ppeList.length, 4);
    // İkon ve metin hücrelerini ayrı sütunlara yerleştir (çakışma sıfır)
    const ppeSlots: { iconCol: number; textStart: number; textEnd: number }[] =
      maxPpe === 1
        ? [{ iconCol: 3, textStart: 4, textEnd: 6 }]
        : maxPpe === 2
          ? [
            { iconCol: 1, textStart: 2, textEnd: 4 },
            { iconCol: 5, textStart: 6, textEnd: 8 },
          ]
          : maxPpe === 3
            ? [
              { iconCol: 1, textStart: 2, textEnd: 3 },
              { iconCol: 4, textStart: 5, textEnd: 6 },
              { iconCol: 7, textStart: 8, textEnd: 8 },
            ]
            : [
              { iconCol: 1, textStart: 2, textEnd: 2 },
              { iconCol: 3, textStart: 4, textEnd: 4 },
              { iconCol: 5, textStart: 6, textEnd: 6 },
              { iconCol: 7, textStart: 8, textEnd: 8 },
            ];

    for (let i = 0; i < maxPpe; i++) {
      const p = ppeList[i];
      const slot = ppeSlots[i];
      const loadedIcon = p?.ppe?.imageUrl
        ? await loadImageAsPngDataUrl(getAbsoluteAssetUrl(p.ppe.imageUrl), true)
        : null;
      const iconDataUrl = loadedIcon || fallbackPpeIcon;

      if (iconDataUrl) {
        const imgId = wb.addImage({ base64: iconDataUrl, extension: 'png' });
        ws.addImage(imgId, {
          tl: { col: slot.iconCol - 1 + 0.25, row: 7.18 },
          ext: { width: 30, height: 30 },
        });
      }

      ws.mergeCells(8, slot.textStart, 9, slot.textEnd);
      const tCell = ws.getCell(8, slot.textStart);
      tCell.value = (p?.ppe?.name || '').toLocaleUpperCase('tr-TR');
      tCell.font = {
        name: 'Calibri',
        size: maxPpe >= 3 ? 8.5 : 9.5,
        bold: true,
        color: { argb: 'FF0369A1' },
      };
      tCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    }
  } else {
    if (fallbackPpeIcon) {
      const imgId = wb.addImage({ base64: fallbackPpeIcon, extension: 'png' });
      ws.addImage(imgId, {
        tl: { col: 2.25, row: 7.18 },
        ext: { width: 30, height: 30 },
      });
    }
    ws.mergeCells('D8:F9');
    const ppeCell = ws.getCell('D8');
    ppeCell.value = 'GÖZLÜK KULLAN';
    ppeCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0369A1' } };
    ppeCell.alignment = { vertical: 'middle', horizontal: 'left' };
  }

  // UZEM 114 (I8:L9)
  fillRange(ws, 8, 9, 9, 12, 'FFFFF1F2');
  applyBoxBorder(ws, 8, 9, 9, 12, 'FFFECDD3', 'medium');
  ws.mergeCells('I8:J9');
  const uzemLbl = ws.getCell('I8');
  uzemLbl.value = {
    richText: [
      { text: 'ULUSAL ZEHİR\nDANIŞMA MERKEZİ\n', font: { name: 'Calibri', size: 8, bold: true, color: { argb: 'FFBE123C' } } },
      { text: 'Acil danışma hattı', font: { name: 'Calibri', size: 7.5, color: { argb: 'FFE11D48' } } },
    ],
  };
  uzemLbl.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: true };

  ws.mergeCells('K8:L9');
  const uzemNum = ws.getCell('K8');
  uzemNum.value = '114';
  uzemNum.font = { name: 'Calibri', size: 22, bold: true, color: { argb: 'FFE11D48' } };
  uzemNum.alignment = { vertical: 'middle', horizontal: 'center' };

  let row = 10;
  ws.getRow(row++).height = 8;

  // ───────────────────────────────────────────────────────────────────────────
  // 3. ZARARLILIK VE ÖNLEM İFADELERİ
  // ───────────────────────────────────────────────────────────────────────────
  ws.mergeCells(row, 1, row, 12);
  const hazTitle = ws.getCell(row, 1);
  hazTitle.value = 'ZARARLILIK VE ÖNLEM İFADELERİ';
  hazTitle.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  hazTitle.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getCell(row, 1).border = { left: { style: 'thick', color: { argb: 'FF06B6D4' } } };
  ws.getRow(row++).height = 18;

  if (hazardItems.length === 0) {
    ws.mergeCells(row, 1, row, 12);
    fillRange(ws, row, 1, row, 12, 'FFFFFFFF');
    applyBoxBorder(ws, row, 1, row, 12, 'FFE2E8F0');
    const c = ws.getCell(row, 1);
    c.value = 'Bilgi bulunmamaktadır.';
    c.font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FF94A3B8' } };
    c.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws.getRow(row++).height = 22;
  } else {
    const startHazRow = row;
    for (let i = 0; i < hazardItems.length; i += 2) {
      const left = hazardItems[i];
      const right = hazardItems[i + 1];
      ws.mergeCells(row, 1, row, 6);
      ws.mergeCells(row, 7, row, 12);
      fillRange(ws, row, 1, row, 12, 'FFFFFFFF');

      const lCell = ws.getCell(row, 1);
      lCell.value = {
        richText: [
          { text: `[${left.code}] `, font: { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFE11D48' } } },
          { text: left.text, font: { name: 'Calibri', size: 9.5, color: { argb: 'FF334155' } } },
        ],
      };
      lCell.alignment = { vertical: 'middle', horizontal: 'justify', wrapText: true, indent: 1 };

      if (right) {
        const rCell = ws.getCell(row, 7);
        rCell.value = {
          richText: [
            { text: `[${right.code}] `, font: { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFE11D48' } } },
            { text: right.text, font: { name: 'Calibri', size: 9.5, color: { argb: 'FF334155' } } },
          ],
        };
        rCell.alignment = { vertical: 'middle', horizontal: 'justify', wrapText: true, indent: 1 };
      }

      const h1 = estimateRowHeight(`${left.code} ${left.text}`, 64, 18, 12.2);
      const h2 = right ? estimateRowHeight(`${right.code} ${right.text}`, 64, 18, 12.2) : 18;
      ws.getRow(row++).height = Math.max(h1, h2);
    }
    applyBoxBorder(ws, startHazRow, 1, row - 1, 12, 'FFE2E8F0');
  }

  ws.getRow(row++).height = 8;

  // ───────────────────────────────────────────────────────────────────────────
  // 4. ACİL DURUM VE MÜDAHALE (İLK YARDIM)
  // ───────────────────────────────────────────────────────────────────────────
  ws.mergeCells(row, 1, row, 12);
  const emTitle = ws.getCell(row, 1);
  emTitle.value = 'ACİL DURUM VE MÜDAHALE';
  emTitle.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  emTitle.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getCell(row, 1).border = { left: { style: 'thick', color: { argb: 'FF06B6D4' } } };
  ws.getRow(row++).height = 18;

  const faStartRow = row;
  ws.mergeCells(row, 1, row, 12);
  fillRange(ws, row, 1, row, 12, 'FFFFFFFF');
  const faHeader = ws.getCell(row, 1);
  faHeader.value = '✚  İlk Yardım';
  faHeader.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  faHeader.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(row++).height = 20;

  if (!firstAidNorm.hasData) {
    ws.mergeCells(row, 1, row, 12);
    fillRange(ws, row, 1, row, 12, 'FFFFFFFF');
    const c = ws.getCell(row, 1);
    c.value = 'Bilgi bulunmamaktadır.';
    c.font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FF94A3B8' } };
    c.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws.getRow(row++).height = 22;
  } else if (hasStructuredFirstAid) {
    if (firstAidData.genel) {
      ws.mergeCells(row, 1, row, 12);
      fillRange(ws, row, 1, row, 12, 'FFFFFFFF');
      const gCell = ws.getCell(row, 1);
      gCell.value = firstAidData.genel;
      gCell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF475569' } };
      gCell.alignment = { vertical: 'top', horizontal: 'justify', wrapText: true, indent: 1 };
      ws.getRow(row++).height = estimateRowHeight(firstAidData.genel, 128, 18, 12.2);
    }

    const faEntries = [
      firstAidData.goz ? { label: 'Gözle teması halinde', text: firstAidData.goz } : null,
      firstAidData.yutma ? { label: 'Yutulması halinde', text: firstAidData.yutma } : null,
      firstAidData.deri ? { label: 'Deriyle teması halinde', text: firstAidData.deri } : null,
      firstAidData.solunum ? { label: 'Solunması halinde', text: firstAidData.solunum } : null,
    ].filter(Boolean) as { label: string; text: string }[];

    for (let i = 0; i < faEntries.length; i += 2) {
      const left = faEntries[i];
      const right = faEntries[i + 1];
      ws.mergeCells(row, 1, row, 6);
      ws.mergeCells(row, 7, row, 12);
      fillRange(ws, row, 1, row, 12, 'FFFFFFFF');

      const lCell = ws.getCell(row, 1);
      lCell.value = {
        richText: [
          { text: `${left.label}\n`, font: { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF0F172A' } } },
          { text: left.text, font: { name: 'Calibri', size: 9, color: { argb: 'FF475569' } } },
        ],
      };
      lCell.alignment = { vertical: 'top', horizontal: 'justify', wrapText: true, indent: 1 };

      if (right) {
        const rCell = ws.getCell(row, 7);
        rCell.value = {
          richText: [
            { text: `${right.label}\n`, font: { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF0F172A' } } },
            { text: right.text, font: { name: 'Calibri', size: 9, color: { argb: 'FF475569' } } },
          ],
        };
        rCell.alignment = { vertical: 'top', horizontal: 'justify', wrapText: true, indent: 1 };
      }

      const h1 = estimateRowHeight(`${left.label}\n${left.text}`, 66, 24, 12.2);
      const h2 = right ? estimateRowHeight(`${right.label}\n${right.text}`, 66, 24, 12.2) : 24;
      ws.getRow(row++).height = Math.max(h1, h2);
    }
  } else {
    ws.mergeCells(row, 1, row, 12);
    fillRange(ws, row, 1, row, 12, 'FFFFFFFF');
    const c = ws.getCell(row, 1);
    c.value = firstAidNorm.text;
    c.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF475569' } };
    c.alignment = { vertical: 'top', horizontal: 'justify', wrapText: true, indent: 1 };
    ws.getRow(row++).height = estimateRowHeight(firstAidNorm.text, 128, 22, 12.2);
  }
  applyBoxBorder(ws, faStartRow, 1, row - 1, 12, 'FFE2E8F0', 'thin', 'FFEF4444');

  ws.getRow(row++).height = 8;

  // ───────────────────────────────────────────────────────────────────────────
  // 5. YANGIN DURUMUNDA & KAZA SONUCU YAYILMA
  // ───────────────────────────────────────────────────────────────────────────
  const row3Start = row;
  ws.mergeCells(row, 1, row, 6);
  ws.mergeCells(row, 7, row, 12);
  fillRange(ws, row, 1, row, 12, 'FFFFFFFF');

  const fireTitle = ws.getCell(row, 1);
  fireTitle.value = 'Yangın Durumunda';
  fireTitle.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  fireTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  const spillTitle = ws.getCell(row, 7);
  spillTitle.value = 'Kaza Sonucu Yayılma';
  spillTitle.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  spillTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(row++).height = 20;

  ws.mergeCells(row, 1, row, 6);
  ws.mergeCells(row, 7, row, 12);
  fillRange(ws, row, 1, row, 12, 'FFFFFFFF');

  const fireCell = ws.getCell(row, 1);
  fireCell.value = fireNorm.text;
  fireCell.font = {
    name: 'Calibri',
    size: 9.5,
    italic: !fireNorm.hasData,
    color: { argb: fireNorm.hasData ? 'FF475569' : 'FF94A3B8' },
  };
  fireCell.alignment = { vertical: 'top', horizontal: 'justify', wrapText: true, indent: 1 };

  const spillCell = ws.getCell(row, 7);
  spillCell.value = spillNorm.text;
  spillCell.font = {
    name: 'Calibri',
    size: 9.5,
    italic: !spillNorm.hasData,
    color: { argb: spillNorm.hasData ? 'FF475569' : 'FF94A3B8' },
  };
  spillCell.alignment = { vertical: 'top', horizontal: 'justify', wrapText: true, indent: 1 };

  const hFire = estimateRowHeight(fireNorm.text, 64, 28, 12.2);
  const hSpill = estimateRowHeight(spillNorm.text, 64, 28, 12.2);
  ws.getRow(row++).height = Math.max(hFire, hSpill);

  applyBoxBorder(ws, row3Start, 1, row - 1, 6, 'FFE2E8F0', 'thin', 'FFF59E0B');
  applyBoxBorder(ws, row3Start, 7, row - 1, 12, 'FFE2E8F0', 'thin', 'FF06B6D4');

  ws.getRow(row++).height = 8;

  // ───────────────────────────────────────────────────────────────────────────
  // 6. GÜVENLİ KULLANIM TALİMATLARI (#00A3DB MAVİ ZEMİN / BEYAZ YAZI)
  // ───────────────────────────────────────────────────────────────────────────
  ws.mergeCells(row, 1, row, 12);
  const safeTitle = ws.getCell(row, 1);
  safeTitle.value = 'GÜVENLİ KULLANIM TALİMATLARI';
  safeTitle.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  safeTitle.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getCell(row, 1).border = { left: { style: 'thick', color: { argb: 'FF00A3DB' } } };
  ws.getRow(row++).height = 18;

  const safeStartRow = row;
  const leftSafe = SAFE_USAGE_INSTRUCTIONS.slice(0, 8);
  const rightSafe = SAFE_USAGE_INSTRUCTIONS.slice(8);
  const safeTextLeft = leftSafe.map(t => `• ${t}`).join('\n');
  const safeTextRight = rightSafe.map(t => `• ${t}`).join('\n');

  ws.mergeCells(row, 1, row, 6);
  ws.mergeCells(row, 7, row, 12);
  fillRange(ws, row, 1, row, 12, 'FF00A3DB');

  const safeLeftCell = ws.getCell(row, 1);
  safeLeftCell.value = safeTextLeft;
  safeLeftCell.font = { name: 'Calibri', size: 9, bold: false, color: { argb: 'FFFFFFFF' } };
  safeLeftCell.alignment = { vertical: 'top', horizontal: 'justify', wrapText: true, indent: 1 };

  const safeRightCell = ws.getCell(row, 7);
  safeRightCell.value = safeTextRight;
  safeRightCell.font = { name: 'Calibri', size: 9, bold: false, color: { argb: 'FFFFFFFF' } };
  safeRightCell.alignment = { vertical: 'top', horizontal: 'justify', wrapText: true, indent: 1 };

  const hSafeL = estimateRowHeight(safeTextLeft, 68, 95, 12.2);
  const hSafeR = estimateRowHeight(safeTextRight, 68, 95, 12.2);
  ws.getRow(row++).height = Math.max(hSafeL, hSafeR);

  applyBoxBorder(ws, safeStartRow, 1, row - 1, 12, 'FF008EC0', 'thin');
  // İki sütun arası zarif beyaz çizgi
  ws.getCell(safeStartRow, 6).border = {
    ...ws.getCell(safeStartRow, 6).border,
    right: { style: 'thin', color: { argb: 'FF7DD3FC' } },
  };
  ws.getCell(safeStartRow, 7).border = {
    ...ws.getCell(safeStartRow, 7).border,
    left: { style: 'thin', color: { argb: 'FF7DD3FC' } },
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 7. ALT BİLGİ: FORM KODU (İSG-YRD-47/00)
  // ───────────────────────────────────────────────────────────────────────────
  ws.mergeCells(row, 1, row, 12);
  const footerCell = ws.getCell(row, 1);
  footerCell.value = 'İSG-YRD-47/00';
  footerCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF000000' } };
  footerCell.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(row).height = 16;

  // Dosya indir
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const safeName = String(prodName)
    .replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ\s_-]/g, '')
    .trim()
    .replace(/\s+/g, '_') || 'Guvenlik_Bilgi_Karti';

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}_Guvenlik_Bilgi_Karti_${size}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

