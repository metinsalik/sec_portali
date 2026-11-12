export interface FirstAidParsed {
  goz?: string;
  deri?: string;
  yutma?: string;
  solunum?: string;
  genel?: string;
}

export interface HazardItem {
  code: string;
  text: string;
}

export interface NormalizedResult {
  text: string;
  hasData: boolean;
}

export const SAFE_USAGE_INSTRUCTIONS = [
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

export function capitalizeFirst(s: string): string {
  const t = s.trim();
  if (!t) return t;
  return t.charAt(0).toLocaleUpperCase('tr-TR') + t.slice(1);
}

/**
 * Ham güvenlik metinlerini temizler: boşlukları/noktalamayı düzeltir,
 * tekrarlı başlık etiketlerini siler ve boş durumları işaretler.
 */
export function normalizeText(raw?: string | null, extraHeadings: string[] = []): NormalizedResult {
  if (!raw || typeof raw !== 'string') {
    return { text: 'Bilgi bulunmamaktadır.', hasData: false };
  }

  const urls: string[] = [];
  let s = raw.replace(/https?:\/\/[^\s]+|www\.[^\s]+/gi, (m) => {
    urls.push(m);
    return `XURL${urls.length - 1}X`;
  });

  s = s.replace(/\r\n|\r/g, '\n');
  s = s.replace(/\n{2,}/g, '\uE000');
  s = s.replace(/[\t\n]+/g, ' ');
  s = s.replace(/ {2,}/g, ' ');
  s = s.replace(/\uE000/g, '\n\n');
  s = s.replace(/ *\n\n */g, '\n\n');
  s = s.replace(/\.{2,}/g, '.');
  s = s.replace(/([.,;:!?])(?=[A-ZÇĞİÖŞÜa-zçğıöşü])/g, '$1 ');
  s = s.replace(/XURL(\d+)X/g, (_, idx) => urls[Number(idx)] || '');
  s = s.trim();

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

export function parseHazardDescription(raw?: string | null): HazardItem[] {
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
}

export function parseFirstAid(text: string, hasData: boolean): FirstAidParsed {
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
}

export function getAbsoluteAssetUrl(url?: string | null): string {
  if (!url) return `${window.location.origin}/mlpcare.jpg`;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`;
}

/**
 * Görseli yükleyip isteğe bağlı olarak şeffaf/beyaz kenar boşluklarını kırpar
 * ve PNG data URL döndürür.
 */
export async function loadImageAsPngDataUrl(src: string, cropWhitespace = false): Promise<string | null> {
  let objectUrl: string | null = null;
  let imgSrc = src;

  try {
    const res = await fetch(src, { credentials: 'include' });
    if (res.ok) {
      const blob = await res.blob();
      objectUrl = URL.createObjectURL(blob);
      imgSrc = objectUrl;
    }
  } catch {
    // fetch başarısız olursa doğrudan Image ile dene
  }

  return new Promise(resolve => {
    const img = new Image();
    if (!objectUrl) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      try {
        const w = img.naturalWidth || 128;
        const h = img.naturalHeight || 128;
        if (!w || !h) {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          resolve(null);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);

        if (!cropWhitespace) {
          const out = canvas.toDataURL('image/png');
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          resolve(out);
          return;
        }

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
            if (a >= 20 && !(r > 245 && g > 245 && b > 245)) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (maxX <= minX || maxY <= minY) {
          const out = canvas.toDataURL('image/png');
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          resolve(out);
          return;
        }

        const cropW = maxX - minX + 1;
        const cropH = maxY - minY + 1;
        const size = Math.max(cropW, cropH);
        const outCanvas = document.createElement('canvas');
        outCanvas.width = size;
        outCanvas.height = size;
        const outCtx = outCanvas.getContext('2d');
        if (!outCtx) {
          const out = canvas.toDataURL('image/png');
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          resolve(out);
          return;
        }

        outCtx.drawImage(
          canvas,
          minX,
          minY,
          cropW,
          cropH,
          Math.floor((size - cropW) / 2),
          Math.floor((size - cropH) / 2),
          cropW,
          cropH
        );
        const out = outCanvas.toDataURL('image/png');
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        resolve(out);
      } catch {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        resolve(null);
      }
    };
    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    img.src = imgSrc;
  });
}

/**
 * KKD görseli yüklenemediğinde veya bulunmadığında PDF'deki mavi daire ikonu üretir.
 */
export function createFallbackPpeIconDataUrl(): string | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(48, 48, 44, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Basit gözlük/koruma ikonu
    ctx.beginPath();
    ctx.arc(33, 50, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(63, 50, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(44, 48);
    ctx.lineTo(52, 48);
    ctx.stroke();

    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

