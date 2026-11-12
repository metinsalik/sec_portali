import React, { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import { Flame, Droplets, Phone, Glasses } from 'lucide-react';

interface MaterialPrintCardProps {
  material: any;
  facilityLogoUrl?: string;
  size?: 'A3' | 'A4' | 'A5';
}

interface FirstAidParsed {
  goz?: string;
  deri?: string;
  yutma?: string;
  solunum?: string;
  genel?: string;
}

interface HazardItem {
  code: string;
  text: string;
}

interface NormalizedResult {
  text: string;
  hasData: boolean;
}

interface LayoutMetrics {
  fontSize: number;
  lineHeight: number;
  spaceMult: number;
  overflowFallback: boolean;
}

// Sabit tasarım genişliği ve kâğıt boyutlarına göre yazdırılabilir alan (5mm kenar boşlukları düşülmüş)
const DESIGN_WIDTH = 794;
const PRINTABLE_DIMENSIONS: Record<'A3' | 'A4' | 'A5', { w: number; h: number }> = {
  A3: { w: 287, h: 410 },
  A4: { w: 200, h: 287 },
  A5: { w: 138, h: 200 },
};

const MIN_FONT = Math.round(DESIGN_WIDTH * 0.011 * 4) / 4; // ~8.75 -> ~9px
const MAX_FONT = Math.round(DESIGN_WIDTH * 0.03 * 4) / 4;  // ~23.75 -> ~24px
const BASE_LINE_HEIGHT = 1.35;
const MAX_LINE_HEIGHT = 1.8;
const BASE_GAP = 10;
const BASE_PAD_Y = 9;
const BASE_PAD_X = 14;

const SAFE_USAGE_INSTRUCTIONS = [
  'Kimyasalları yutmayınız. Göz, cilt ve kıyafetle temasından kaçınınız.',
  'Toz, gaz, duman, sis, buhar ve spreylerini solumayınız.',
  'Kimyasalları, üretici talimatı olmadan birbirleriyle karıştırmayınız.',
  'Kullanım sırasında yeterli havalandırma sağlayınız.',
  'Kimyasalın tehlikelerine uygun kişisel koruyucu donanım kullanınız.',
  'Kimyasallarla çalışırken yiyecek ve içecek tüketmeyiniz.',
  'Kullanım sonrası ellerinizi su ve sabunla iyice yıkayınız.',
  'Kimyasalları orijinal veya uygun, etiketli ve kapalı kaplarda saklayınız.',
  'Kimyasalları gıda maddelerinden ve birbirleriyle uyumsuz maddelerden ayrı muhafaza ediniz.',
  'Kimyasalları ısı, doğrudan güneş ışığı ve diğer uygunsuz çevresel koşullardan koruyunuz.',
  'Kimyasal kaplarını devrilme, düşme, sızma ve hasar riskine karşı güvenli şekilde yerleştiriniz.',
  'Kimyasalların taşınması ve aktarılması sırasında sıçrama, dökülme ve sızıntıya karşı gerekli önlemleri alınız.',
  'Kimyasalları kullanım amacı dışında kullanmayınız.',
  'Kimyasal atıkları ve boş ambalajları, tehlike özelliklerine göre uygun atık kaplarında ayrı toplayınız. Tehlikeli atık niteliğindeki malzemeleri evsel atıklara karıştırmayınız.',
];

const SAFE_USAGE_WEIGHT = Math.ceil(
  SAFE_USAGE_INSTRUCTIONS.reduce((sum, line) => sum + line.length, 0) / 2
);

const KNOWN_REPEATED_HEADINGS = [
  'Ekotoksik Bilgiler',
  'Ekolojik Bilgi',
  'Çevresel Tedbirler',
  'Elleçleme ve Depolama',
  'Kullanım ve Depolama',
  'Yangın Durumunda',
  'Yangınla Mücadele Tedbirleri',
  'Kaza Sonucu Yayılma',
  'Kaza Sonucu Serbest Kalması Durumunda Alınacak Tedbirler',
  'İlk Yardım',
  'İlkyardım Önlemleri',
  'İlk Yardım Bilgileri',
  'Tehlike Tanımı',
  'Zararlılık ve Önlem İfadeleri',
].sort((a, b) => b.length - a.length);

/**
 * Ham güvenlik metinlerini temizler: boşlukları/noktalamayı düzeltir,
 * tekrarlı başlık etiketlerini siler ve boş durumları işaretler.
 */
function normalizeText(raw?: string | null, extraHeadings: string[] = []): NormalizedResult {
  if (!raw || typeof raw !== 'string') {
    return { text: 'Bilgi bulunmamaktadır.', hasData: false };
  }

  // URL'leri koruma altına al (XURL... harf ile başladığı için önceki noktalama sonrası boşluk eklenebilir)
  const urls: string[] = [];
  let s = raw.replace(/https?:\/\/[^\s]+|www\.[^\s]+/gi, (m) => {
    urls.push(m);
    return `XURL${urls.length - 1}X`;
  });

  // Satır sonları ve çoklu boşlukları düzenle (çift satır sonunu paragraf için koru)
  s = s.replace(/\r\n|\r/g, '\n');
  s = s.replace(/\n{2,}/g, '\uE000');
  s = s.replace(/[\t\n]+/g, ' ');
  s = s.replace(/ {2,}/g, ' ');
  s = s.replace(/\uE000/g, '\n\n');
  s = s.replace(/ *\n\n */g, '\n\n');

  // Tekrarlı noktaları tek noktaya indir (.. / ... -> .)
  s = s.replace(/\.{2,}/g, '.');

  // Noktalama işareti sonrası harf geliyorsa boşluk ekle (sayısal aralıklar ve ondalıklar etkilenmez)
  s = s.replace(/([.,;:!?])(?=[A-ZÇĞİÖŞÜa-zçğıöşü])/g, '$1 ');

  // URL'leri geri yükle
  s = s.replace(/XURL(\d+)X/g, (_, idx) => urls[Number(idx)] || '');
  s = s.trim();

  // Baştaki tekrarlı kart/bölüm başlıklarını temizle
  const headings = [...extraHeadings, ...KNOWN_REPEATED_HEADINGS]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  let changed = true;
  while (changed) {
    changed = false;
    const lowerS = s.toLocaleLowerCase('tr-TR');
    for (const h of headings) {
      const lowerH = h.toLocaleLowerCase('tr-TR');
      if (lowerS.startsWith(lowerH)) {
        const after = s.slice(h.length);
        if (/^[\s:\-–.]/.test(after) || after.length === 0) {
          s = after.replace(/^[\s:\-–.]+/, '').trim();
          changed = true;
          break;
        }
      }
    }
  }

  const strippedAlphaNum = s.replace(/[\s.,;:!?\-–]/g, '');
  if (!s || s.length < 3 || strippedAlphaNum.length < 3) {
    return { text: 'Bilgi bulunmamaktadır.', hasData: false };
  }

  return { text: s, hasData: true };
}

function capitalizeFirst(s: string): string {
  const t = s.trim();
  if (!t) return t;
  return t.charAt(0).toLocaleUpperCase('tr-TR') + t.slice(1);
}

/**
 * Yüklenen GHS piktogram görsellerindeki farklı kenar boşluklarını (beyaz/şeffaf çerçeve)
 * kırparak tüm tehlike işaretlerinin kartta birebir aynı boyutta görünmesini sağlar.
 */
function GhsPictogramImage({ src, alt }: { src: string; alt: string }) {
  const [normalizedSrc, setNormalizedSrc] = useState<string>(src);

  React.useEffect(() => {
    setNormalizedSrc(src);
    let cancelled = false;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) return;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const { data } = ctx.getImageData(0, 0, w, h);

        let minX = w;
        let minY = h;
        let maxX = -1;
        let maxY = -1;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];
            const isTransparent = a < 20;
            const isNearWhite = r > 245 && g > 245 && b > 245;
            if (!isTransparent && !isNearWhite) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (maxX <= minX || maxY <= minY) return;

        const cropW = maxX - minX + 1;
        const cropH = maxY - minY + 1;
        const size = Math.max(cropW, cropH);

        const outCanvas = document.createElement('canvas');
        outCanvas.width = size;
        outCanvas.height = size;
        const outCtx = outCanvas.getContext('2d');
        if (!outCtx) return;

        const offsetX = Math.floor((size - cropW) / 2);
        const offsetY = Math.floor((size - cropH) / 2);
        outCtx.drawImage(canvas, minX, minY, cropW, cropH, offsetX, offsetY, cropW, cropH);

        const dataUrl = outCanvas.toDataURL('image/png');
        if (!cancelled) {
          setNormalizedSrc(dataUrl);
        }
      } catch {
        // CORS veya canvas erişim hatasında orijinal görseli koru
      }
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <img
      src={normalizedSrc}
      alt={alt}
      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
    />
  );
}

export const MaterialPrintCard = forwardRef<HTMLDivElement, MaterialPrintCardProps>(
  ({ material, facilityLogoUrl = '/mlpcare.jpg', size = 'A4' }, ref) => {
    const { w: printableW, h: printableH } = PRINTABLE_DIMENSIONS[size];
    const targetHeight = Math.round(DESIGN_WIDTH * (printableH / printableW));

    const rootRef = useRef<HTMLDivElement | null>(null);
    const bodyRef = useRef<HTMLDivElement | null>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const isMeasuringRef = useRef(false);
    const overflowFallbackRef = useRef(false);
    const lastDimsRef = useRef({ w: 0, h: 0 });

    const [metrics, setMetrics] = useState<LayoutMetrics>({
      fontSize: MIN_FONT,
      lineHeight: BASE_LINE_HEIGHT,
      spaceMult: 1.0,
      overflowFallback: false,
    });

    const setMergedRootRef = (node: HTMLDivElement | null) => {
      rootRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    };

    const registerCardRef = (idx: number) => (node: HTMLDivElement | null) => {
      cardRefs.current[idx] = node;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // VERİ NORMALİZASYONU VE PARSE İŞLEMLERİ
    // ─────────────────────────────────────────────────────────────────────────
    const hazardNorm = normalizeText(material?.hazardDescription, ['Zararlılık İfadeleri']);
    const firstAidNorm = normalizeText(material?.firstAid, ['İlk Yardım']);
    const fireNorm = normalizeText(material?.fireFightingMeasures, ['Yangın']);
    const spillNorm = normalizeText(material?.accidentalReleaseMeasures, ['Kaza Sonucu']);

    const parseHazardDescription = (raw?: string | null): HazardItem[] => {
      if (!raw || typeof raw !== 'string') return [];

      const lines = raw
        .split(/[\r\n]+/)
        .map(l => normalizeText(l, ['Zararlılık İfadeleri', 'Tehlike Tanımı']))
        .filter(r => r.hasData)
        .map(r => r.text);

      const items: HazardItem[] = [];

      for (const line of lines) {
        const hMatch = line.match(
          /^(H\d{3}[a-zA-Z*]?(?:\s*\+\s*H\d{3}[a-zA-Z*]?)*|EUH\d{3}[a-zA-Z*]?|P\d{3}[a-zA-Z*]?)\s*[:\-\.]?\s*(.*)$/i
        );
        if (hMatch) {
          items.push({
            code: hMatch[1].replace(/\s+/g, '').toUpperCase(),
            text: capitalizeFirst(hMatch[2] ? hMatch[2] : hMatch[1]),
          });
        } else {
          const commaSplit = line.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
          for (const part of commaSplit) {
            const lower = part.toLocaleLowerCase('tr-TR');
            let inferredCode = 'TEHLİKE';
            if (lower.includes('yanıcı') || lower.includes('alev')) inferredCode = 'H225';
            else if (lower.includes('tahriş')) inferredCode = 'H319';
            else if (lower.includes('korozif') || lower.includes('aşındırıcı')) inferredCode = 'H314';
            else if (lower.includes('toksik') || lower.includes('zehir')) inferredCode = 'H301';
            else if (lower.includes('oksit')) inferredCode = 'H272';
            else if (lower.includes('çevre')) inferredCode = 'H410';
            items.push({ code: inferredCode, text: capitalizeFirst(part) });
          }
        }
      }
      return items;
    };

    const parseFirstAid = (text: string, hasData: boolean): FirstAidParsed => {
      if (!hasData) return {};

      const sections: FirstAidParsed = {};
      const regex = /(?:^|[\s.;,\d])(G[Öö]ZLER\s*VE\s*C[İIıi]LT|DER[İIıi]\s*VE\s*G[Öö]Z|G[Öö]Z(?:LE|LER)?\s*(?:[İIıi]LE)?\s*TEMAS(?:[Iıİi])?(?:NDA)?|G[Öö]ZLER|G[Öö]Z|DER[İIıi](?:YLE)?\s*(?:[İIıi]LE)?\s*TEMAS(?:[Iıİi])?(?:NDA)?|C[İIıi]LT(?:LE)?\s*(?:[İIıi]LE)?\s*TEMAS(?:[Iıİi])?(?:NDA)?|DER[İIıi]|C[İIıi]LT|YUTMA(?:S[Iı])?(?:NDA)?|YUTULMAS[Iı]\s*HAL[İIıi]NDE|YUTULURSA|SOLUNUM(?:U)?|SOLUNMAS[Iı]\s*HAL[İIıi]NDE|SOLUMA)\s*[:\-]\s*/gi;

      const matches: { keyStart: number; endOfMatch: number; key: string }[] = [];
      let match;
      while ((match = regex.exec(text)) !== null) {
        const full = match[0];
        const key = match[1];
        const keyStart = match.index + full.toLocaleUpperCase('tr-TR').indexOf(key.toLocaleUpperCase('tr-TR'));
        matches.push({
          keyStart,
          endOfMatch: match.index + full.length,
          key: key.trim().toLocaleUpperCase('tr-TR'),
        });
      }

      if (matches.length === 0) {
        return { genel: text.trim() };
      }

      if (matches[0].keyStart > 0) {
        sections.genel = text.substring(0, matches[0].keyStart).replace(/[\s\d]+$/, '').trim();
      }

      for (let i = 0; i < matches.length; i++) {
        const start = matches[i].endOfMatch;
        const end = i + 1 < matches.length ? matches[i + 1].keyStart : text.length;
        const content = text.substring(start, end).trim().replace(/\s+\d+$/, '').trim();
        if (!content) continue;
        const key = matches[i].key;

        if (key.includes('GÖZLER VE CİLT') || key.includes('DERİ VE GÖZ')) {
          sections.goz = sections.goz ? `${sections.goz} ${content}` : content;
          sections.deri = sections.deri ? `${sections.deri} ${content}` : content;
        } else if (key.includes('GÖZ')) {
          sections.goz = sections.goz ? `${sections.goz} ${content}` : content;
        } else if (key.includes('DERİ') || key.includes('CİLT') || key.includes('CILT')) {
          sections.deri = sections.deri ? `${sections.deri} ${content}` : content;
        } else if (key.includes('YUT')) {
          sections.yutma = sections.yutma ? `${sections.yutma} ${content}` : content;
        } else if (key.includes('SOLU')) {
          sections.solunum = sections.solunum ? `${sections.solunum} ${content}` : content;
        } else {
          sections.genel = (sections.genel ? sections.genel + ' ' : '') + content;
        }
      }

      return sections;
    };

    const hazardItems = parseHazardDescription(material?.hazardDescription);
    const firstAidData = parseFirstAid(firstAidNorm.text, firstAidNorm.hasData);
    const hasStructuredSubsections = Boolean(
      firstAidData.goz || firstAidData.deri || firstAidData.yutma || firstAidData.solunum
    );

    // Gövde satırlarının flex ağırlıkları (satırdaki en uzun gerçek metnin karakter sayısı, min 40)
    const weightRow1 = Math.max(40, hazardNorm.hasData ? hazardNorm.text.length : 0);
    const weightRow2 = Math.max(40, firstAidNorm.hasData ? firstAidNorm.text.length : 0);
    const weightRow3 = Math.max(
      40,
      Math.max(
        fireNorm.hasData ? fireNorm.text.length : 0,
        spillNorm.hasData ? spillNorm.text.length : 0
      )
    );
    const weightRow4 = Math.max(40, SAFE_USAGE_WEIGHT);

    // ─────────────────────────────────────────────────────────────────────────
    // BİNARY SEARCH İLE TEK ORTAK FONT-SIZE, LINE-HEIGHT VE PADDING/GAP HESABI
    // ─────────────────────────────────────────────────────────────────────────
    useLayoutEffect(() => {
      let active = true;

      const applyDomMetrics = (fontPx: number, lh: number, mult: number) => {
        const bodyEl = bodyRef.current;
        if (!bodyEl) return;
        bodyEl.style.fontSize = `${fontPx}px`;
        bodyEl.style.lineHeight = String(lh);
        bodyEl.style.gap = `${Math.round(BASE_GAP * mult * 10) / 10}px`;

        const padY = Math.round(BASE_PAD_Y * mult * 10) / 10;
        const padX = Math.round(BASE_PAD_X * mult * 10) / 10;
        for (const card of cardRefs.current) {
          if (card) {
            card.style.padding = `${padY}px ${padX}px`;
          }
        }
      };

      const doesBodyFit = () => {
        const bodyEl = bodyRef.current;
        if (!bodyEl) return true;
        return (
          bodyEl.scrollHeight <= bodyEl.clientHeight &&
          bodyEl.scrollWidth <= bodyEl.clientWidth
        );
      };

      const runFit = () => {
        if (!active) return;
        const rootEl = rootRef.current;
        const bodyEl = bodyRef.current;
        if (!rootEl || !bodyEl) return;

        isMeasuringRef.current = true;
        try {
          // Ölçüm sırasında kök yüksekliğini kâğıt oranına sabitle (scrollHeight vs clientHeight için)
          rootEl.style.height = `${targetHeight}px`;
          rootEl.style.minHeight = `${targetHeight}px`;

          if (bodyEl.clientHeight <= 0 || bodyEl.clientWidth <= 0) return;

          // 1) Font-size için binary search (~14 iterasyon, 0.25px adım)
          let lo = MIN_FONT;
          let hi = MAX_FONT;
          let bestFont: number | null = null;

          for (let i = 0; i < 14; i++) {
            const mid = Math.floor(((lo + hi) / 2) * 4) / 4;
            applyDomMetrics(mid, BASE_LINE_HEIGHT, 1.0);
            if (doesBodyFit()) {
              bestFont = mid;
              lo = mid + 0.25;
            } else {
              hi = mid - 0.25;
            }
            if (lo > hi) break;
          }

          if (bestFont === null) {
            applyDomMetrics(MIN_FONT, BASE_LINE_HEIGHT, 1.0);
            if (doesBodyFit()) {
              bestFont = MIN_FONT;
            }
          } else if (bestFont < MAX_FONT) {
            const candidate = Math.min(MAX_FONT, Math.round((bestFont + 0.25) * 4) / 4);
            applyDomMetrics(candidate, BASE_LINE_HEIGHT, 1.0);
            if (doesBodyFit()) {
              bestFont = candidate;
            }
          }

          // En kötü durum: min fontta bile sığmıyorsa kesme/scroll yok, sayfa uzasın
          if (bestFont === null) {
            applyDomMetrics(MIN_FONT, BASE_LINE_HEIGHT, 1.0);
            rootEl.style.height = 'auto';
            rootEl.style.minHeight = `${targetHeight}px`;
            overflowFallbackRef.current = true;
            lastDimsRef.current = { w: bodyEl.offsetWidth, h: bodyEl.offsetHeight };

            console.warn('MaterialPrintCard: içerik min fontta sığmadı', {
              size,
              productName: material?.productName,
              scrollHeight: bodyEl.scrollHeight,
              clientHeight: bodyEl.clientHeight,
            });

            setMetrics(prev =>
              prev.fontSize === MIN_FONT &&
              prev.lineHeight === BASE_LINE_HEIGHT &&
              prev.spaceMult === 1.0 &&
              prev.overflowFallback === true
                ? prev
                : {
                    fontSize: MIN_FONT,
                    lineHeight: BASE_LINE_HEIGHT,
                    spaceMult: 1.0,
                    overflowFallback: true,
                  }
            );
            return;
          }

          let bestLh = BASE_LINE_HEIGHT;
          let bestMult = 1.0;

          // 2) Font MAX'a vurduysa kalan boşluğu doldur:
          // a) line-height 1.35 -> 1.8 arası binary search
          // b) kart iç padding ve bölümler arası gap 1x -> 2x arası binary search
          if (bestFont >= MAX_FONT) {
            let lhLo = BASE_LINE_HEIGHT;
            let lhHi = MAX_LINE_HEIGHT;
            bestLh = BASE_LINE_HEIGHT;

            for (let i = 0; i < 10; i++) {
              const midLh = Math.round(((lhLo + lhHi) / 2) * 20) / 20;
              applyDomMetrics(bestFont, midLh, 1.0);
              if (doesBodyFit()) {
                bestLh = midLh;
                lhLo = midLh + 0.05;
              } else {
                lhHi = midLh - 0.05;
              }
              if (lhLo > lhHi) break;
            }

            let mLo = 1.0;
            let mHi = 2.0;
            bestMult = 1.0;

            for (let i = 0; i < 10; i++) {
              const midM = Math.round(((mLo + mHi) / 2) * 20) / 20;
              applyDomMetrics(bestFont, bestLh, midM);
              if (doesBodyFit()) {
                bestMult = midM;
                mLo = midM + 0.05;
              } else {
                mHi = midM - 0.05;
              }
              if (mLo > mHi) break;
            }
          }

          applyDomMetrics(bestFont, bestLh, bestMult);
          rootEl.style.height = `${targetHeight}px`;
          rootEl.style.minHeight = `${targetHeight}px`;
          overflowFallbackRef.current = false;
          lastDimsRef.current = { w: bodyEl.offsetWidth, h: bodyEl.offsetHeight };

          setMetrics(prev =>
            prev.fontSize === bestFont &&
            prev.lineHeight === bestLh &&
            prev.spaceMult === bestMult &&
            prev.overflowFallback === false
              ? prev
              : {
                  fontSize: bestFont,
                  lineHeight: bestLh,
                  spaceMult: bestMult,
                  overflowFallback: false,
                }
          );
        } finally {
          isMeasuringRef.current = false;
        }
      };

      runFit();

      let ro: ResizeObserver | null = null;

      if (typeof ResizeObserver !== 'undefined' && bodyRef.current) {
        ro = new ResizeObserver(() => {
          if (!active || isMeasuringRef.current || !bodyRef.current) return;
          const nw = bodyRef.current.offsetWidth;
          const nh = bodyRef.current.offsetHeight;
          const prev = lastDimsRef.current;
          // Taşma modunda yükseklik otomatik büyüdüğü için yalnızca genişlik değişiminde tekrar ölç
          const changed = overflowFallbackRef.current ? nw !== prev.w : nw !== prev.w || nh !== prev.h;
          if (changed) {
            runFit();
          }
        });
        ro.observe(bodyRef.current);
      }

      if (typeof document !== 'undefined' && document.fonts?.ready) {
        document.fonts.ready.then(() => {
          if (active) runFit();
        });
      }

      return () => {
        active = false;
        ro?.disconnect();
      };
    }, [material, size, targetHeight]);

    const getAbsoluteUrl = (url?: string | null) => {
      if (!url) return `${window.location.origin}/mlpcare.jpg`;
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      if (url.startsWith('/uploads')) {
        return `${window.location.origin}${url}`;
      }
      return `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`;
    };

    // Üst Bölüm Yardımcı Değerleri (tasarım genişliği 794px üzerinde sabit kalır)
    const ghsList = material?.hazardLabels || [];
    const ghsCount = ghsList.length;
    const ghsIconSize = ghsCount <= 2 ? 76 : ghsCount === 3 ? 58 : 44;
    const ghsMaxColWidth = ghsCount <= 2 ? 96 : ghsCount === 3 ? 68 : 64;

    const prodName = material?.productName || material?.name || 'BELİRTİLMEDİ';
    const prodNameFs = prodName.length <= 20 ? '16px' : prodName.length <= 34 ? '14.5px' : '13px';

    const ppeList = material?.ppes || [];
    const ppeIconSize = ppeList.length <= 2 ? 38 : ppeList.length === 3 ? 34 : 28;

    const currentGap = Math.round(BASE_GAP * metrics.spaceMult * 10) / 10;
    const currentPadY = Math.round(BASE_PAD_Y * metrics.spaceMult * 10) / 10;
    const currentPadX = Math.round(BASE_PAD_X * metrics.spaceMult * 10) / 10;
    const cardPaddingStyle = `${currentPadY}px ${currentPadX}px`;

    return (
      <div
        ref={setMergedRootRef}
        style={{
          width: `${DESIGN_WIDTH}px`,
          height: metrics.overflowFallback ? 'auto' : `${targetHeight}px`,
          minHeight: `${targetHeight}px`,
          padding: '18px 20px',
          backgroundColor: '#ffffff',
          color: '#1e293b',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          boxSizing: 'border-box',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ÜST BÖLÜM: BAŞLIK + ÜRÜN BİLGİSİ + ZARARLILIK İŞARETLERİ + KKD/114 */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
            {/* SOL KART: LACİVERT ARKA PLAN */}
            <div
              style={{
                flex: 1,
                backgroundColor: '#0f2744',
                backgroundImage: 'linear-gradient(135deg, #0b2341 0%, #0f2744 50%, #16365c 100%)',
                borderRadius: '12px',
                padding: '10px 15px',
                color: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: '25px',
                    fontWeight: 900,
                    letterSpacing: '0.07em',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    lineHeight: 1.15,
                  }}
                >
                  GÜVENLİK BİLGİ KARTI
                </h1>
              </div>

              <div
                style={{
                  height: '1px',
                  backgroundColor: 'rgba(255, 255, 255, 0.18)',
                  marginTop: '8px',
                  marginBottom: '8px',
                  flexShrink: 0,
                }}
              />

              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: '7px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '12px', alignItems: 'start' }}>
                  <div>
                    <div
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        color: '#67e8f9',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      ÜRÜN ADI
                    </div>
                    <div
                      style={{
                        fontSize: prodNameFs,
                        fontWeight: 800,
                        color: '#ffffff',
                        lineHeight: 1.2,
                        marginTop: '2px',
                        wordBreak: 'break-word',
                      }}
                    >
                      {prodName}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        color: '#67e8f9',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      FİRMA
                    </div>
                    <div
                      style={{
                        fontSize: '15.5px',
                        fontWeight: 800,
                        color: '#ffffff',
                        lineHeight: 1.2,
                        marginTop: '2px',
                        wordBreak: 'break-word',
                      }}
                    >
                      {material?.brandName || material?.supplier || material?.manufacturer || '-'}
                    </div>
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      color: '#67e8f9',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    KULLANIM / UYGULAMA
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#f8fafc',
                      lineHeight: 1.25,
                      marginTop: '2px',
                    }}
                  >
                    {material?.usageMethod || material?.description || '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* SAĞ KART: ZARARLILIK İŞARETLERİ */}
            <div
              style={{
                width: '235px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                padding: '10px 10px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    color: '#64748b',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    marginBottom: '6px',
                  }}
                >
                  ZARARLILIK İŞARETLERİ
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    gap: ghsCount >= 3 ? '6px' : '12px',
                    flexWrap: ghsCount > 3 ? 'wrap' : 'nowrap',
                  }}
                >
                  {ghsCount > 0 ? (
                    ghsList.map((hl: any, idx: number) => (
                      <div
                        key={`ghs-${idx}`}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          flex: ghsCount <= 3 ? '1 1 0px' : undefined,
                          width: ghsCount > 3 ? `${ghsMaxColWidth}px` : undefined,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            width: `${ghsIconSize}px`,
                            height: `${ghsIconSize}px`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {hl.label?.imageUrl ? (
                            <GhsPictogramImage
                              src={getAbsoluteUrl(hl.label.imageUrl)}
                              alt={hl.label.name}
                            />
                          ) : (
                            <div
                              style={{
                                width: `${ghsIconSize - 12}px`,
                                height: `${ghsIconSize - 12}px`,
                                border: '2.5px solid #dc2626',
                                transform: 'rotate(45deg)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#ffffff',
                              }}
                            >
                              <span
                                style={{
                                  transform: 'rotate(-45deg)',
                                  fontSize: '9px',
                                  fontWeight: 900,
                                  color: '#dc2626',
                                }}
                              >
                                {hl.label?.code || '!'}
                              </span>
                            </div>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: ghsCount >= 3 ? '7.2px' : '8.2px',
                            fontWeight: 800,
                            color: '#b91c1c',
                            textAlign: 'center',
                            lineHeight: 1.15,
                            marginTop: '2px',
                            wordBreak: 'break-word',
                          }}
                        >
                          {hl.label?.name?.replace(/ Madde$/i, '') || hl.label?.code || ''}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: '8px', color: '#94a3b8', fontStyle: 'italic', margin: '8px 0' }}>
                      Tehlike işareti belirtilmemiş
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* İKİNCİ ŞERİT: KKD GÖRSELLERİ + UZEM 114 */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
            <div
              style={{
                flex: 1,
                border: '1.5px solid #06b6d4',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                padding: '5px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: ppeList.length >= 3 ? '12px' : '18px',
                minHeight: '42px',
                boxShadow: '0 1px 2px rgba(6,182,212,0.06)',
              }}
            >
              {ppeList.length > 0 ? (
                ppeList.map((p: any, idx: number) => (
                  <div key={`ppe-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {p.ppe?.imageUrl ? (
                      <img
                        src={getAbsoluteUrl(p.ppe.imageUrl)}
                        alt={p.ppe.name}
                        style={{
                          width: `${ppeIconSize}px`,
                          height: `${ppeIconSize}px`,
                          objectFit: 'contain',
                          borderRadius: '50%',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: `${ppeIconSize}px`,
                          height: `${ppeIconSize}px`,
                          borderRadius: '50%',
                          backgroundColor: '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Glasses
                          style={{
                            width: `${ppeIconSize * 0.55}px`,
                            height: `${ppeIconSize * 0.55}px`,
                            color: '#ffffff',
                            strokeWidth: 2,
                          }}
                        />
                      </div>
                    )}
                    <span
                      style={{
                        fontSize: ppeList.length >= 3 ? '9.5px' : '11px',
                        fontWeight: 900,
                        color: '#0369a1',
                        letterSpacing: '0.03em',
                        textTransform: 'uppercase',
                        lineHeight: 1.15,
                      }}
                    >
                      {p.ppe?.name}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      backgroundColor: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Glasses style={{ width: '18px', height: '18px', color: '#ffffff', strokeWidth: 2 }} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 900, color: '#0369a1', letterSpacing: '0.04em' }}>
                    GÖZLÜK KULLAN
                  </span>
                </div>
              )}
            </div>

            <div
              style={{
                width: '235px',
                border: '1.5px solid #fecdd3',
                borderRadius: '10px',
                backgroundColor: '#fff1f2',
                padding: '5px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: '42px',
                boxShadow: '0 1px 2px rgba(225,29,72,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    backgroundColor: '#e11d48',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0,
                  }}
                >
                  <Phone style={{ width: '15px', height: '15px', strokeWidth: 2.5 }} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '8.5px',
                      fontWeight: 900,
                      color: '#be123c',
                      lineHeight: 1.1,
                      textTransform: 'uppercase',
                    }}
                  >
                    ULUSAL ZEHİR<br />DANIŞMA MERKEZİ
                  </div>
                  <div style={{ fontSize: '7.5px', color: '#e11d48', fontWeight: 500, marginTop: '1px' }}>
                    Acil danışma hattı
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: '30px',
                  fontWeight: 900,
                  color: '#e11d48',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                114
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* GÖVDE ALANI: KALAN ALANI TAM KAPLAYAN TEK FONT-SIZE SİSTEMİ         */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <div
          ref={bodyRef}
          style={{
            flex: '1 1 0%',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            fontSize: `${metrics.fontSize}px`,
            lineHeight: metrics.lineHeight,
            gap: `${currentGap}px`,
            textAlign: 'justify',
          }}
        >
          {/* SATIR 1: ZARARLILIK VE ÖNLEM İFADELERİ */}
          <div style={{ flex: `${weightRow1} 1 0px`, display: 'flex', flexDirection: 'column', gap: '0.35em' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4em', flexShrink: 0 }}>
              <div style={{ width: '0.3em', height: '1.15em', backgroundColor: '#06b6d4', borderRadius: '0.15em' }} />
              <h2
                style={{
                  margin: 0,
                  fontSize: '0.95em',
                  fontWeight: 900,
                  color: '#0f172a',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                ZARARLILIK VE ÖNLEM İFADELERİ
              </h2>
            </div>

            <div
              ref={registerCardRef(0)}
              style={{
                flex: 1,
                border: '1px solid #e2e8f0',
                borderRadius: '0.75em',
                backgroundColor: '#ffffff',
                padding: cardPaddingStyle,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              {hazardItems.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                    gap: '0.45em 1.4em',
                    alignItems: 'start',
                    width: '100%',
                  }}
                >
                  {hazardItems.map((item, idx) => (
                    <div
                      key={`haz-${idx}`}
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '0.45em',
                        maxWidth: '100%',
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: '#fff1f2',
                          border: '1px solid #fecdd3',
                          color: '#e11d48',
                          fontSize: '0.9em',
                          fontWeight: 800,
                          padding: '0.1em 0.45em',
                          borderRadius: '0.3em',
                          flexShrink: 0,
                        }}
                      >
                        {item.code}
                      </span>
                      <span
                        style={{
                          fontSize: '1em',
                          fontWeight: 600,
                          color: '#334155',
                          overflowWrap: 'break-word',
                        }}
                      >
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '1em', color: '#94a3b8', fontStyle: 'italic' }}>
                  Bilgi bulunmamaktadır.
                </div>
              )}
            </div>
          </div>

          {/* SATIR 2: ACİL DURUM VE MÜDAHALE BAŞLIĞI + İLK YARDIM KARTI */}
          <div style={{ flex: `${weightRow2} 1 0px`, display: 'flex', flexDirection: 'column', gap: '0.35em' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4em', flexShrink: 0 }}>
              <div style={{ width: '0.3em', height: '1.15em', backgroundColor: '#06b6d4', borderRadius: '0.15em' }} />
              <h2
                style={{
                  margin: 0,
                  fontSize: '0.95em',
                  fontWeight: 900,
                  color: '#0f172a',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                ACİL DURUM VE MÜDAHALE
              </h2>
            </div>

            <div
              ref={registerCardRef(1)}
              style={{
                flex: 1,
                border: '1px solid #e2e8f0',
                borderLeft: '0.32em solid #ef4444',
                borderRadius: '0.75em',
                backgroundColor: '#ffffff',
                padding: cardPaddingStyle,
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                gap: '0.4em',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45em', flexShrink: 0 }}>
                <div
                  style={{
                    width: '1.35em',
                    height: '1.35em',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9em',
                    fontWeight: 900,
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  +
                </div>
                <h3 style={{ margin: 0, fontSize: '0.95em', fontWeight: 800, color: '#0f172a' }}>
                  İlk Yardım
                </h3>
              </div>

              {!firstAidNorm.hasData ? (
                <div style={{ fontSize: '1em', color: '#94a3b8', fontStyle: 'italic' }}>
                  Bilgi bulunmamaktadır.
                </div>
              ) : hasStructuredSubsections ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45em', width: '100%' }}>
                  {firstAidData.genel && (
                    <div
                      style={{
                        fontSize: '1em',
                        color: '#475569',
                        borderBottom: '1px solid #f1f5f9',
                        paddingBottom: '0.35em',
                        overflowWrap: 'break-word',
                      }}
                    >
                      {firstAidData.genel}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '0.5em 1.2em', width: '100%' }}>
                    {firstAidData.goz && (
                      <div>
                        <div style={{ fontSize: '1.1em', fontWeight: 800, color: '#0f172a', marginBottom: '0.1em' }}>
                          Gözle teması halinde
                        </div>
                        <div style={{ fontSize: '1em', color: '#475569', overflowWrap: 'break-word' }}>
                          {firstAidData.goz}
                        </div>
                      </div>
                    )}

                    {firstAidData.yutma && (
                      <div>
                        <div style={{ fontSize: '1.1em', fontWeight: 800, color: '#0f172a', marginBottom: '0.1em' }}>
                          Yutulması halinde
                        </div>
                        <div style={{ fontSize: '1em', color: '#475569', overflowWrap: 'break-word' }}>
                          {firstAidData.yutma}
                        </div>
                      </div>
                    )}

                    {firstAidData.deri && (
                      <div>
                        <div style={{ fontSize: '1.1em', fontWeight: 800, color: '#0f172a', marginBottom: '0.1em' }}>
                          Deriyle teması halinde
                        </div>
                        <div style={{ fontSize: '1em', color: '#475569', overflowWrap: 'break-word' }}>
                          {firstAidData.deri}
                        </div>
                      </div>
                    )}

                    {firstAidData.solunum && (
                      <div>
                        <div style={{ fontSize: '1.1em', fontWeight: 800, color: '#0f172a', marginBottom: '0.1em' }}>
                          Solunması halinde
                        </div>
                        <div style={{ fontSize: '1em', color: '#475569', overflowWrap: 'break-word' }}>
                          {firstAidData.solunum}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '1em', color: '#475569', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
                  {firstAidNorm.text}
                </div>
              )}
            </div>
          </div>

          {/* SATIR 3: YANGIN DURUMUNDA & KAZA SONUCU YAYILMA (AYNI YÜKSEKLİKTE 2 SÜTUN GRİD) */}
          <div
            style={{
              flex: `${weightRow3} 1 0px`,
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              alignItems: 'stretch',
              gap: '0.7em',
            }}
          >
            {/* YANGIN DURUMUNDA */}
            <div
              ref={registerCardRef(2)}
              style={{
                border: '1px solid #e2e8f0',
                borderLeft: '0.32em solid #f59e0b',
                borderRadius: '0.75em',
                backgroundColor: '#ffffff',
                padding: cardPaddingStyle,
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                gap: '0.4em',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45em', flexShrink: 0 }}>
                <div
                  style={{
                    width: '1.4em',
                    height: '1.4em',
                    borderRadius: '50%',
                    backgroundColor: '#fef3c7',
                    color: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Flame style={{ width: '0.85em', height: '0.85em', strokeWidth: 2.5 }} />
                </div>
                <h3 style={{ margin: 0, fontSize: '0.95em', fontWeight: 800, color: '#0f172a' }}>
                  Yangın Durumunda
                </h3>
              </div>
              <div
                style={{
                  fontSize: '1em',
                  color: fireNorm.hasData ? '#475569' : '#94a3b8',
                  fontStyle: fireNorm.hasData ? 'normal' : 'italic',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                }}
              >
                {fireNorm.text}
              </div>
            </div>

            {/* KAZA SONUCU YAYILMA */}
            <div
              ref={registerCardRef(3)}
              style={{
                border: '1px solid #e2e8f0',
                borderLeft: '0.32em solid #06b6d4',
                borderRadius: '0.75em',
                backgroundColor: '#ffffff',
                padding: cardPaddingStyle,
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                gap: '0.4em',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45em', flexShrink: 0 }}>
                <div
                  style={{
                    width: '1.4em',
                    height: '1.4em',
                    borderRadius: '50%',
                    backgroundColor: '#cffafe',
                    color: '#0891b2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Droplets style={{ width: '0.85em', height: '0.85em', strokeWidth: 2.5 }} />
                </div>
                <h3 style={{ margin: 0, fontSize: '0.95em', fontWeight: 800, color: '#0f172a' }}>
                  Kaza Sonucu Yayılma
                </h3>
              </div>
              <div
                style={{
                  fontSize: '1em',
                  color: spillNorm.hasData ? '#475569' : '#94a3b8',
                  fontStyle: spillNorm.hasData ? 'normal' : 'italic',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                }}
              >
                {spillNorm.text}
              </div>
            </div>
          </div>

          {/* SATIR 4: GÜVENLİ KULLANIM TALİMATLARI (SABİT - İSG EMREDİCİ MAVİ ZEMİN / BEYAZ YAZI) */}
          <div style={{ flex: `${weightRow4} 1 0px`, display: 'flex', flexDirection: 'column', gap: '0.35em' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4em', flexShrink: 0 }}>
              <div style={{ width: '0.3em', height: '1.15em', backgroundColor: '#00a3db', borderRadius: '0.15em' }} />
              <h2
                style={{
                  margin: 0,
                  fontSize: '0.95em',
                  fontWeight: 900,
                  color: '#0f172a',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                GÜVENLİ KULLANIM TALİMATLARI
              </h2>
            </div>

            <div
              ref={registerCardRef(4)}
              style={{
                flex: 1,
                border: '1px solid #008ec0',
                borderRadius: '0.75em',
                backgroundColor: '#00a3db',
                color: '#ffffff',
                padding: cardPaddingStyle,
                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) 1px minmax(0, 1fr)',
                  gap: '1em',
                  width: '100%',
                  alignItems: 'stretch',
                }}
              >
                {[SAFE_USAGE_INSTRUCTIONS.slice(0, 8), SAFE_USAGE_INSTRUCTIONS.slice(8)].map((colItems, colIdx) => (
                  <React.Fragment key={`safe-usage-col-${colIdx}`}>
                    {colIdx === 1 && (
                      <div
                        style={{
                          width: '1px',
                          backgroundColor: 'rgba(255, 255, 255, 0.35)',
                        }}
                      />
                    )}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.28em',
                      }}
                    >
                      {colItems.map((instruction, idx) => (
                        <div
                          key={`safe-usage-${colIdx}-${idx}`}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.4em',
                            fontSize: '0.96em',
                            color: '#ffffff',
                            fontWeight: 500,
                            overflowWrap: 'break-word',
                          }}
                        >
                          <span
                            style={{
                              color: '#ffffff',
                              fontWeight: 900,
                              flexShrink: 0,
                              lineHeight: 'inherit',
                            }}
                          >
                            •
                          </span>
                          <span>{instruction}</span>
                        </div>
                      ))}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ALT BİLGİ: FORM KODU                                               */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <div
          style={{
            paddingTop: '4px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: 900,
              color: '#000000',
              letterSpacing: '0.05em',
            }}
          >
            İSG-YRD-47/00
          </span>
        </div>
      </div>
    );
  }
);

MaterialPrintCard.displayName = 'MaterialPrintCard';
