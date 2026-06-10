const XLSX = require('xlsx');

const workbook = XLSX.readFile('/Users/metinsalik/Desktop/sec_portali/Tesis Yönetimi ve Güvenliği RD_2026 Radyoloji.xlsx');
const sheet = workbook.Sheets['RD Fine Kinney (Konsolide)'];
const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

const headerRowIdx = 5; // row 6 in 1-indexed
const rawHeaders = raw[headerRowIdx] || [];
const subHeaders = raw[headerRowIdx + 1] || [];

function normalizeHeader(h) {
  return (h || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

let currentParent = '';
const headers = [];
const maxColLen = Math.max(rawHeaders.length, subHeaders.length);

for (let colIdx = 0; colIdx < maxColLen; colIdx++) {
  const parentVal = rawHeaders[colIdx];
  if (parentVal !== undefined && parentVal !== null && String(parentVal).trim() !== '') {
    currentParent = String(parentVal).trim();
  }

  const subVal = subHeaders[colIdx] || null;
  let combined = currentParent;
  if (subVal !== undefined && subVal !== null && String(subVal).trim() !== '') {
    combined = `${currentParent} ${String(subVal).trim()}`;
  }
  
  headers[colIdx] = normalizeHeader(combined);
}

console.log("Constructed Headers:");
headers.forEach((h, i) => console.log(`${i}: ${h}`));
