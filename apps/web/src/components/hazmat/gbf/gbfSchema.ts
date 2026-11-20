export interface GbfKeyValue {
  label: string;
  value: string;
}

export interface GbfTable {
  headers: string[];
  rows: string[][];
}

export interface GbfTextBox {
  title: string;
  text: string;
}

export interface GbfCustomHeading {
  id: string;
  title: string;
  text: string;
  rows: GbfKeyValue[];
  tables: GbfTable[];
  textBoxes: GbfTextBox[];
}

export interface GbfSubData {
  text: string;
  rows: GbfKeyValue[];
  tables: GbfTable[];
  textBoxes: GbfTextBox[];
  headings: GbfCustomHeading[];
}

export interface GbfSectionData {
  raw: string;
  sub: Record<string, GbfSubData>;
  custom: GbfKeyValue[];
}

export interface GbfDoc {
  kind: 'karışım' | 'madde';
  regime: string;
  sourceName: string;
  originalSections: Record<string, string>;
  sections: Record<number, GbfSectionData>;
}

export type GbfSectionDef = {
  num: number;
  title: string;
  subs: Array<{ code: string; title: string }>;
};

export const GBF_SECTIONS: GbfSectionDef[] = [
  {
    num: 1,
    title: 'Madde/karışım ve tedarikçi kimliği',
    subs: [
      { code: '1.1', title: 'Madde / karışım kimliği' },
      { code: '1.2', title: 'Belirlenmiş ve tavsiye edilmeyen kullanımlar' },
      { code: '1.3', title: 'GBF tedarikçisinin bilgileri' },
      { code: '1.4', title: 'Acil durum telefon numarası' },
    ],
  },
  {
    num: 2,
    title: 'Zararlılık tanımlanması',
    subs: [
      { code: '2.1', title: 'Madde veya karışımın sınıflandırılması' },
      { code: '2.2', title: 'Etiket unsurları' },
      { code: '2.3', title: 'Diğer zararlar' },
    ],
  },
  {
    num: 3,
    title: 'Bileşimi / içindekiler hakkında bilgi',
    subs: [
      { code: '3.1', title: 'Maddeler' },
      { code: '3.2', title: 'Karışımlar' },
    ],
  },
  {
    num: 4,
    title: 'İlk yardım önlemleri',
    subs: [
      { code: '4.1', title: 'İlk yardım önlemlerinin açıklaması' },
      { code: '4.2', title: 'Akut ve gecikmiş belirtiler ve etkiler' },
      { code: '4.3', title: 'Acil tıbbi müdahale ve özel tedavi' },
    ],
  },
  {
    num: 5,
    title: 'Yangınla mücadele önlemleri',
    subs: [
      { code: '5.1', title: 'Yangın söndürücüler' },
      { code: '5.2', title: 'Madde/karışımdan kaynaklanan özel zararlar' },
      { code: '5.3', title: 'Yangın söndürme ekipleri için tavsiyeler' },
    ],
  },
  {
    num: 6,
    title: 'Kaza sonucu yayılmaya karşı önlemler',
    subs: [
      { code: '6.1', title: 'Kişisel önlemler, donanım ve acil durum' },
      { code: '6.2', title: 'Çevresel önlemler' },
      { code: '6.3', title: 'Muhafaza ve temizleme yöntemleri' },
      { code: '6.4', title: 'Diğer bölümlere atıflar' },
    ],
  },
  {
    num: 7,
    title: 'Elleçleme ve depolama',
    subs: [
      { code: '7.1', title: 'Güvenli elleçleme için önlemler' },
      { code: '7.2', title: 'Uyuşmazlıklar dâhil güvenli depolama koşulları' },
      { code: '7.3', title: 'Belirli son kullanımlar' },
    ],
  },
  {
    num: 8,
    title: 'Maruz kalma kontrolleri / kişisel korunma',
    subs: [
      { code: '8.1', title: 'Kontrol parametreleri' },
      { code: '8.2', title: 'Maruz kalma kontrolleri' },
    ],
  },
  {
    num: 9,
    title: 'Fiziksel ve kimyasal özellikler',
    subs: [
      { code: '9.1', title: 'Temel fiziksel ve kimyasal özellikler' },
      { code: '9.2', title: 'Diğer bilgiler' },
    ],
  },
  {
    num: 10,
    title: 'Kararlılık ve tepkime',
    subs: [
      { code: '10.1', title: 'Tepkime' },
      { code: '10.2', title: 'Kimyasal kararlılık' },
      { code: '10.3', title: 'Zararlı tepkime olasılığı' },
      { code: '10.4', title: 'Kaçınılması gereken durumlar' },
      { code: '10.5', title: 'Kaçınılması gereken maddeler' },
      { code: '10.6', title: 'Zararlı bozunma ürünleri' },
    ],
  },
  {
    num: 11,
    title: 'Toksikolojik bilgiler',
    subs: [{ code: '11.1', title: 'Toksik etkiler hakkında bilgi' }],
  },
  {
    num: 12,
    title: 'Ekolojik bilgiler',
    subs: [
      { code: '12.1', title: 'Toksisite' },
      { code: '12.2', title: 'Kalıcılık ve bozunabilirlik' },
      { code: '12.3', title: 'Biyobirikim potansiyeli' },
      { code: '12.4', title: 'Toprakta hareketlilik' },
      { code: '12.5', title: 'PBT / vPvB değerlendirmesi' },
      { code: '12.6', title: 'Diğer olumsuz etkiler' },
    ],
  },
  {
    num: 13,
    title: 'Bertaraf etme bilgileri',
    subs: [{ code: '13.1', title: 'Atık işleme yöntemleri' }],
  },
  {
    num: 14,
    title: 'Taşımacılık bilgileri',
    subs: [
      { code: '14.1', title: 'UN numarası' },
      { code: '14.2', title: 'Uygun UN taşımacılık adı' },
      { code: '14.3', title: 'Taşımacılık zararlılık sınıf(lar)ı' },
      { code: '14.4', title: 'Ambalajlama grubu' },
      { code: '14.5', title: 'Çevresel zararlar' },
      { code: '14.6', title: 'Kullanıcı için özel önlemler' },
      { code: '14.7', title: 'Dökme deniz taşımacılığı' },
    ],
  },
  {
    num: 15,
    title: 'Mevzuat bilgileri',
    subs: [
      { code: '15.1', title: 'Madde / karışıma özgü güvenlik, sağlık ve çevre mevzuatı' },
      { code: '15.2', title: 'Kimyasal güvenlik değerlendirmesi' },
    ],
  },
  {
    num: 16,
    title: 'Diğer bilgiler',
    subs: [],
  },
];

export const GBF_SUGGEST: Record<string, string[]> = {
  '1.1': ['Ürün adı', 'Ürün kodu', 'Madde kimliği', 'CAS / EC / kayıt no'],
  '1.2': ['Belirlenmiş kullanım', 'Tavsiye edilmeyen kullanım'],
  '1.3': ['Tedarikçi / üretici', 'Adres', 'Telefon', 'E-posta'],
  '1.4': ['Tedarikçi acil telefonu', 'UZEM / ulusal acil iletişim'],
  '2.1': ['Fiziksel zararlar', 'Sağlık zararları', 'Çevresel zararlar'],
  '2.2': ['Piktogramlar', 'Uyarı kelimesi', 'H ifadeleri', 'P ifadeleri', 'EUH ifadeleri'],
  '2.3': ['PBT / vPvB', 'Diğer zararlar'],
  '4.1': ['Genel bilgi', 'Soluma', 'Yutma', 'Cilt teması', 'Göz teması', 'İlk yardım personelinin korunması'],
  '4.2': ['Soluma belirtileri', 'Yutma belirtileri', 'Cilt belirtileri', 'Göz belirtileri'],
  '4.3': ['Doktora bilgi', 'Özel tedavi'],
  '5.1': ['Uygun yangın söndürme maddeleri', 'Uygun olmayan söndürme maddeleri'],
  '5.2': ['Özel zararlar', 'Zararlı yanma ürünleri'],
  '5.3': ['Müdahale önlemleri', 'Yangın söndürme ekibi KKD', 'Söndürme suyunun kontrolü'],
  '6.1': ['Kişisel önlemler', 'KKD', 'Acil müdahale prosedürleri'],
  '6.2': ['Çevresel önlemler'],
  '6.3': ['Küçük döküntüler', 'Büyük döküntüler', 'Temizleme malzemesi', 'Bertaraf'],
  '7.1': ['Kullanım tedbirleri', 'Mesleki hijyen'],
  '7.2': ['Depolama koşulları', 'Uyumsuz maddeler', 'Depolama sınıfı'],
  '8.1': ['TWA', 'STEL', 'DNEL / PNEC', 'Biyolojik sınır'],
  '8.2': ['Mühendislik kontrolleri', 'Göz / yüz koruması', 'El koruması', 'Vücut koruması', 'Solunum koruması', 'Hijyen tedbirleri', 'Çevresel maruziyet'],
  '9.1': ['Görünüm / fiziksel hâl', 'Renk', 'Koku', 'pH', 'Parlama noktası', 'Kaynama noktası', 'Alevlenirlik', 'Buhar basıncı', 'Yoğunluk', 'Çözünürlük', 'Viskozite', 'Patlama sınırları'],
  '11.1': ['Akut toksisite (oral)', 'Akut toksisite (dermal)', 'Akut toksisite (soluma)', 'Cilt aşınması / tahrişi', 'Göz hasarı / tahrişi', 'Hassaslaşma', 'Mutajenite', 'Kanserojenite', 'Üreme toksisitesi', 'BHOT tek / tekrar', 'Aspirasyon zararı'],
  '12.1': ['Akut sucul toksisite', 'Kronik sucul toksisite'],
  '13.1': ['Atık işleme', 'Ambalaj bertarafı', 'Atık kodu'],
  '16': ['Kısaltmalar', 'H ifadelerinin açık metni', 'Kaynaklar', 'Eğitim tavsiyesi', 'KDU adı', 'KDU belge numarası', 'KDU belge tarihi', 'Revizyon değişiklikleri'],
};

const GBF_EXPECTED: Record<number, string[]> = {
  1: ['madd', 'kimlig', 'urun', 'tedarik'],
  2: ['zararl', 'etiket', 'sinif'],
  3: ['karisim', 'madd', 'bilesim'],
  4: ['ilk yard', 'semptom', 'mudahale'],
  5: ['yang', 'sondur', 'ozel'],
  6: ['kisisel', 'cevre', 'muhafaza', 'diger'],
  7: ['ellec', 'depol', 'kullanim'],
  8: ['kontrol', 'maruz'],
  9: ['fiziksel', 'kimyasal', 'ozellik', 'diger'],
  10: ['tepkime', 'kararl', 'stabilite', 'reaktivite', 'zararl', 'kacini', 'bozunma'],
  11: ['toksik'],
  12: ['toksisite', 'kalicilik', 'biyobirikim', 'toprak', 'pbt', 'olumsuz'],
  13: ['atik'],
  14: ['un', 'tasima', 'sinif', 'ambalaj', 'cevre', 'kullanici', 'deniz'],
  15: ['mevzuat', 'guvenlik'],
  16: [],
};

export function gbfUid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function normTr(v: string): string {
  return String(v || '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('ı', 'i')
    .replace(/\s+/g, ' ')
    .trim();
}

export function createEmptySub(): GbfSubData {
  return { text: '', rows: [], tables: [], textBoxes: [], headings: [] };
}

export function createEmptyGbfDoc(): GbfDoc {
  const sections: Record<number, GbfSectionData> = {};
  for (let n = 1; n <= 16; n += 1) {
    sections[n] = { raw: '', sub: {}, custom: [] };
  }
  return {
    kind: 'karışım',
    regime: 'KKDİK Ek-2',
    sourceName: '',
    originalSections: {},
    sections,
  };
}

export function normalizeGbfDoc(raw: unknown): GbfDoc {
  const base = createEmptyGbfDoc();
  if (!raw || typeof raw !== 'object') return base;
  const d = raw as Record<string, unknown>;

  if (d.kind === 'madde' || d.kind === 'karışım') base.kind = d.kind;
  if (typeof d.regime === 'string' && d.regime) base.regime = d.regime;
  if (typeof d.sourceName === 'string') base.sourceName = d.sourceName;
  if (d.originalSections && typeof d.originalSections === 'object') {
    base.originalSections = { ...(d.originalSections as Record<string, string>) };
  }

  const rawSections = (d.sections || {}) as Record<string, Partial<GbfSectionData>>;
  for (let n = 1; n <= 16; n += 1) {
    const s = rawSections[n] || rawSections[String(n)] || {};
    const subMap: Record<string, GbfSubData> = {};
    if (s.sub && typeof s.sub === 'object') {
      for (const [k, v] of Object.entries(s.sub)) {
        if (!v || typeof v !== 'object') continue;
        subMap[k] = {
          text: String(v.text || ''),
          rows: Array.isArray(v.rows) ? v.rows.map((r) => ({ label: String(r?.label || ''), value: String(r?.value || '') })) : [],
          tables: Array.isArray(v.tables)
            ? v.tables.map((t) => ({
                headers: Array.isArray(t?.headers) ? t.headers.map(String) : [],
                rows: Array.isArray(t?.rows) ? t.rows.map((row) => (Array.isArray(row) ? row.map(String) : [])) : [],
              }))
            : [],
          textBoxes: Array.isArray(v.textBoxes)
            ? v.textBoxes.map((b) => ({ title: String(b?.title || ''), text: String(b?.text || '') }))
            : [],
          headings: Array.isArray(v.headings)
            ? v.headings.map((h) => ({
                id: String(h?.id || gbfUid()),
                title: String(h?.title || ''),
                text: String(h?.text || ''),
                rows: Array.isArray(h?.rows) ? h.rows.map((r) => ({ label: String(r?.label || ''), value: String(r?.value || '') })) : [],
                tables: Array.isArray(h?.tables)
                  ? h.tables.map((t) => ({
                      headers: Array.isArray(t?.headers) ? t.headers.map(String) : [],
                      rows: Array.isArray(t?.rows) ? t.rows.map((row) => (Array.isArray(row) ? row.map(String) : [])) : [],
                    }))
                  : [],
                textBoxes: Array.isArray(h?.textBoxes)
                  ? h.textBoxes.map((b) => ({ title: String(b?.title || ''), text: String(b?.text || '') }))
                  : [],
              }))
            : [],
        };
      }
    }
    base.sections[n] = {
      raw: String(s.raw || ''),
      sub: subMap,
      custom: Array.isArray(s.custom) ? s.custom.map((c) => ({ label: String(c?.label || ''), value: String(c?.value || '') })) : [],
    };
  }

  return base;
}

export function isSectionStructured(s: GbfSectionData | undefined): boolean {
  if (!s) return false;
  const hasSub = Object.values(s.sub || {}).some(
    (x) =>
      x.text?.trim() ||
      x.rows?.some((r) => r.label?.trim() || r.value?.trim()) ||
      x.tables?.some((t) => t.rows?.some((row) => row.some((c) => c.trim()))) ||
      x.textBoxes?.some((b) => b.title?.trim() || b.text?.trim()) ||
      x.headings?.some(
        (h) =>
          h.title?.trim() ||
          h.text?.trim() ||
          h.rows?.some((r) => r.label?.trim() || r.value?.trim()) ||
          h.tables?.some((t) => t.headers?.some((v) => v.trim()) || t.rows?.some((row) => row.some((v) => v.trim()))) ||
          h.textBoxes?.some((b) => b.title?.trim() || b.text?.trim())
      )
  );
  const hasCustom = s.custom?.some((c) => c.label?.trim() || c.value?.trim());
  return Boolean(hasSub || hasCustom);
}

export function countGbfProgress(doc: GbfDoc): { any: number; structured: number } {
  let any = 0;
  let structured = 0;
  for (let n = 1; n <= 16; n += 1) {
    const s = doc.sections[n];
    const isStruct = isSectionStructured(s);
    if (s?.raw?.trim() || isStruct) any += 1;
    if (isStruct) structured += 1;
  }
  return { any, structured };
}

export function getVisibleSubsForSection(num: number, kind: 'karışım' | 'madde'): Array<{ code: string; title: string }> {
  const def = GBF_SECTIONS[num - 1];
  if (!def) return [];
  if (num === 3) {
    return def.subs.filter((s) => (kind === 'karışım' ? s.code === '3.2' : s.code === '3.1'));
  }
  if (def.subs.length === 0) {
    return [{ code: '16', title: 'Diğer bilgiler' }];
  }
  return def.subs;
}

/**
 * Tek bir bölümün ham metnini (raw) resmi alt başlıklara (1.1, 1.2...) otomatik ayırır.
 */
export function splitSubtext(sectionNum: number, raw: string, kind: 'karışım' | 'madde'): Record<string, string> {
  const result: Record<string, string> = {};
  const subs = getVisibleSubsForSection(sectionNum, kind);
  const lines = raw.split(/\r?\n/);
  let currentKey: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (currentKey && buffer.length) {
      result[currentKey] = buffer.join('\n').trim();
    }
  };

  for (const line of lines) {
    const m = line.match(/^\s*(\d{1,2})\.(\d{1,2})\.?\s*(.*)$/);
    if (m && Number(m[1]) === sectionNum) {
      const k = `${m[1]}.${m[2]}`;
      const matched = subs.find((s) => s.code === k);
      if (matched) {
        const tail = normTr(m[3]);
        const expected = normTr(matched.title);
        const tokens = expected.split(' ').filter((v) => v.length >= 4);
        const accepted = tokens.some((t) => tail.includes(t.slice(0, Math.min(5, t.length)))) || !tail;
        if (accepted) {
          flush();
          currentKey = k;
          buffer = [];
          continue;
        }
      }
    }
    if (currentKey) buffer.push(line);
  }
  flush();
  return result;
}

/**
 * 16 bölümlük tam SDS metnini bölüm başlıklarından algılayıp 1..16'ya ayırır.
 */
export function splitFullSdsText(input: string): { sections: Record<number, string>; matched: number; skipped: string } {
  const lines = input.split(/\r?\n/);
  const sections: Record<number, string> = {};
  let current: number | null = null;
  let matched = 0;
  const skipped: string[] = [];

  const isTitle = (line: string): number | null => {
    const s = line.trim();
    const m =
      s.match(/^BÖLÜM\s+(\d{1,2})\s*[:.\-]\s*(.+)$/i) ||
      s.match(/^(\d{1,2})\s*[-]\s*\)?\s*(.+)$/) ||
      s.match(/^(\d{1,2})\s*\)\s*(.+)$/) ||
      s.match(/^(\d{1,2})\.\s*([A-ZÇĞİÖŞÜ]{3,}.+)$/) ||
      s.match(/^(3)(ÜRÜN İÇERİK BİLGİSİ.*)$/);
    if (!m) return null;
    const n = Number(m[1]);
    if (n < 1 || n > 16) return null;
    const tail = normTr(m[2]);
    if (!tail || tail.length < 5) return null;
    const aliases = [normTr(GBF_SECTIONS[n - 1].title), ...(GBF_EXPECTED[n] || [])];
    const terms = aliases.filter((x) => x.length >= 4);
    if (
      terms.some((x) => tail.includes(x.slice(0, Math.min(5, x.length)))) ||
      (n === 1 && tail.includes('urun ve tedarik')) ||
      (n === 3 && tail.includes('icerik'))
    ) {
      return n;
    }
    return null;
  };

  for (const l of lines) {
    const n = isTitle(l);
    if (n !== null && (!current || n >= current || (current === 16 && n === 1))) {
      current = n;
      matched += 1;
      continue;
    }
    if (current === null) skipped.push(l);
    else sections[current] = (sections[current] || '') + l + '\n';
  }
  return { sections, matched, skipped: skipped.join('\n') };
}

/**
 * Yapısal bir bölümü mevcut 15 düz metin kolonuna (PrintCardModal / arama / geriye uyumluluk) çevirir.
 */
export function flattenGbfSectionToText(sectionNum: number, s: GbfSectionData | undefined, kind: 'karışım' | 'madde'): string {
  if (!s) return '';
  if (!isSectionStructured(s)) {
    return s.raw?.trim() || '';
  }

  const parts: string[] = [];
  const subs = getVisibleSubsForSection(sectionNum, kind);

  for (const subDef of subs) {
    const sub = s.sub?.[subDef.code];
    if (!sub) continue;
    const subLines: string[] = [];
    if (sub.text?.trim()) subLines.push(sub.text.trim());
    for (const b of sub.textBoxes || []) {
      if (b.title?.trim() || b.text?.trim()) {
        subLines.push([b.title?.trim(), b.text?.trim()].filter(Boolean).join('\n'));
      }
    }
    for (const r of sub.rows || []) {
      if (r.label?.trim() || r.value?.trim()) {
        subLines.push(r.label?.trim() ? `${r.label.trim()}: ${r.value?.trim() || ''}` : r.value?.trim() || '');
      }
    }
    for (const t of sub.tables || []) {
      const nonEmptyRows = (t.rows || []).filter((row) => row.some((c) => c.trim()));
      if (nonEmptyRows.length) {
        if (t.headers?.some((h) => h.trim())) subLines.push(t.headers.join(' | '));
        for (const row of nonEmptyRows) subLines.push(row.join(' | '));
      }
    }
    for (const h of sub.headings || []) {
      const hLines: string[] = [];
      if (h.text?.trim()) hLines.push(h.text.trim());
      for (const r of h.rows || []) {
        if (r.label?.trim() || r.value?.trim()) {
          hLines.push(r.label?.trim() ? `${r.label.trim()}: ${r.value?.trim() || ''}` : r.value?.trim() || '');
        }
      }
      for (const b of h.textBoxes || []) {
        if (b.title?.trim() || b.text?.trim()) {
          hLines.push([b.title?.trim(), b.text?.trim()].filter(Boolean).join('\n'));
        }
      }
      for (const t of h.tables || []) {
        const nonEmptyRows = (t.rows || []).filter((row) => row.some((c) => c.trim()));
        if (nonEmptyRows.length) {
          if (t.headers?.some((hdr) => hdr.trim())) hLines.push(t.headers.join(' | '));
          for (const row of nonEmptyRows) hLines.push(row.join(' | '));
        }
      }
      if (h.title?.trim() || hLines.length) {
        subLines.push([h.title?.trim() ? `[${h.title.trim()}]` : '', ...hLines].filter(Boolean).join('\n'));
      }
    }

    if (subLines.length) {
      parts.push(`${subDef.code} ${subDef.title}\n${subLines.join('\n')}`);
    }
  }

  for (const c of s.custom || []) {
    if (c.label?.trim() || c.value?.trim()) {
      parts.push(c.label?.trim() ? `${c.label.trim()}: ${c.value?.trim() || ''}` : c.value?.trim() || '');
    }
  }

  return parts.join('\n\n').trim() || s.raw?.trim() || '';
}

export function extractLegacyFieldsFromGbf(doc: GbfDoc) {
  const flat = (n: number) => flattenGbfSectionToText(n, doc.sections[n], doc.kind);
  return {
    usageMethod: flat(1),
    hazardDescription: flat(2),
    composition: flat(3),
    firstAid: flat(4),
    fireFightingMeasures: flat(5),
    accidentalReleaseMeasures: flat(6),
    handlingAndStorage: flat(7),
    exposureControls: flat(8),
    physicalProperties: flat(9),
    stabilityAndReactivity: flat(10),
    toxicologicalInfo: flat(11),
    ecologicalInfo: flat(12),
    disposalConsiderations: flat(13),
    transportInfo: flat(14),
    regulatoryInfo: flat(15),
    otherInfo: flat(16),
  };
}

/**
 * Mevcut (eski) HazmatMaterial kaydını GBF Akış yapısına çevirir (sıfır veri kaybı).
 */
export function hydrateGbfFromMaterial(mat: Record<string, unknown> | null | undefined): GbfDoc {
  if (!mat) return createEmptyGbfDoc();
  if (mat.sdsStructuredData && typeof mat.sdsStructuredData === 'object') {
    const normalized = normalizeGbfDoc(mat.sdsStructuredData);
    if (mat.productKind === 'madde' || mat.productKind === 'karışım') normalized.kind = mat.productKind;
    if (typeof mat.sdsRegime === 'string' && mat.sdsRegime) normalized.regime = mat.sdsRegime;
    return normalized;
  }

  const doc = createEmptyGbfDoc();
  if (mat.productKind === 'madde' || mat.productKind === 'karışım') doc.kind = mat.productKind;
  if (typeof mat.sdsRegime === 'string' && mat.sdsRegime) doc.regime = mat.sdsRegime;

  const legacyMap: Array<[number, string]> = [
    [1, String(mat.usageMethod || '')],
    [2, String(mat.hazardDescription || '')],
    [3, String(mat.composition || '')],
    [4, String(mat.firstAid || '')],
    [5, String(mat.fireFightingMeasures || '')],
    [6, String(mat.accidentalReleaseMeasures || '')],
    [7, String(mat.handlingAndStorage || '')],
    [8, String(mat.exposureControlsPpe || mat.exposureControls || '')],
    [9, String(mat.physicalAndChemicalProperties || mat.physicalProperties || '')],
    [10, String(mat.stabilityAndReactivity || '')],
    [11, String(mat.toxicologicalInformation || mat.toxicologicalInfo || '')],
    [12, String(mat.ecologicalInformation || mat.ecologicalInfo || '')],
    [13, String(mat.disposalConsiderations || '')],
    [14, String(mat.transportInfo || '')],
    [15, String(mat.regulatoryInfo || '')],
    [16, String(mat.otherInfo || '')],
  ];

  for (const [n, val] of legacyMap) {
    if (val.trim()) {
      doc.sections[n].raw = val.trim();
    }
  }
  return doc;
}
