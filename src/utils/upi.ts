import QRCode from 'qrcode';

export const MAX_UPI_AMOUNT = 100000; // ₹1 Lakh NPCI UPI guideline
export const MAX_QR_SPLITS = 51; // Max 51 splits (100,000 / 1999)

export interface SplitSummary {
  fullCount: number;
  remainder: number;
  totalCount: number;
  exceedsLimit: boolean;
}

/**
 * Fast O(1) mathematical summary of splits without generating arrays
 */
export function getSplitSummary(totalAmount: number, maxCap: number = 1999): SplitSummary {
  if (totalAmount <= 0) {
    return { fullCount: 0, remainder: 0, totalCount: 0, exceedsLimit: false };
  }
  const exceedsLimit = totalAmount > MAX_UPI_AMOUNT;
  const fullCount = Math.floor(totalAmount / maxCap);
  const remainder = Math.round((totalAmount % maxCap) * 100) / 100;
  const totalCount = fullCount + (remainder > 0.001 ? 1 : 0);
  return { fullCount, remainder, totalCount, exceedsLimit };
}

/**
 * Splits total amount into chunks safely up to MAX_QR_SPLITS
 * Example: 2500 with cap 1999 -> [1999, 501]
 */
export function calculateSplits(totalAmount: number, maxCap: number = 1999): number[] {
  if (totalAmount <= 0) return [];
  if (totalAmount <= maxCap) {
    return [Math.round(totalAmount * 100) / 100];
  }

  // Safety guard against browser freeze on extreme inputs
  const clampedAmount = Math.min(totalAmount, MAX_UPI_AMOUNT);
  const fullCount = Math.floor(clampedAmount / maxCap);
  const remainder = Math.round((clampedAmount % maxCap) * 100) / 100;

  const splits: number[] = new Array(fullCount).fill(maxCap);
  if (remainder > 0.001) {
    splits.push(remainder);
  }

  return splits;
}

/**
 * Builds standard NPCI UPI payment deep link
 * Format: upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
 */
export function buildUpiDeepLink(params: {
  upiId: string;
  payeeName?: string;
  amount: number;
  note?: string;
}): string {
  const cleanUpi = params.upiId.trim();
  const url = new URL('upi://pay');
  url.searchParams.set('pa', cleanUpi);

  if (params.payeeName && params.payeeName.trim()) {
    url.searchParams.set('pn', params.payeeName.trim());
  }

  url.searchParams.set('am', params.amount.toFixed(2));
  url.searchParams.set('cu', 'INR');

  if (params.note && params.note.trim()) {
    url.searchParams.set('tn', params.note.trim());
  }

  // URLSearchParams uses '+' for spaces by default, let's make sure it's cleanly standard for all UPI apps
  return decodeURIComponent(url.toString().replace(/upi:\/\/\?/, 'upi://pay?'));
}

/**
 * Generates high quality QR code data URL with dark crisp pixels and white margin
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  return await QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 480,
    color: {
      dark: '#0f172a', // slate-900 for modern aesthetic
      light: '#ffffff',
    },
  });
}

/**
 * Formats amount in Indian Rupees (₹)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/**
 * Validates UPI ID syntax (e.g., username@bank or mobile@upi)
 */
export function isValidUpiId(upiId: string): boolean {
  if (!upiId) return false;
  // Must contain an '@' and letters/digits on both sides
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(upiId.trim());
}

export interface ParsedUpiQr {
  upiId: string;
  payeeName?: string;
  amount?: number;
  note?: string;
}

const VPA_IN_TEXT = /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/;

const readParam = (params: URLSearchParams, keys: string[]) => {
  for (const key of keys) {
    const value = params.get(key)?.trim();
    if (value) return value;
  }
  return '';
};

const parseAmount = (raw: string) => {
  const amount = parseFloat(raw.replace(/[^0-9.]/g, ''));
  return Number.isFinite(amount) && amount > 0 ? amount : undefined;
};

/**
 * Reads a UPI ID (and optional amount/name) from a scanned QR payload.
 * Supports upi://, intent://, query strings, bare VPAs, and Bharat QR text.
 */
export function parseUpiQrPayload(raw: string): ParsedUpiQr | null {
  const text = raw.trim();
  if (!text) return null;

  if (isValidUpiId(text)) {
    return { upiId: text.toLowerCase() };
  }

  let params = new URLSearchParams();
  const queryStart = text.indexOf('?');
  if (queryStart >= 0) {
    let query = text.slice(queryStart + 1);
    const hashIndex = query.search(/#Intent|#/i);
    if (hashIndex >= 0) query = query.slice(0, hashIndex);
    params = new URLSearchParams(query);
  } else {
    try {
      const normalized = text.replace(/^intent:/i, 'upi:');
      if (normalized.includes('://')) {
        params = new URL(normalized).searchParams;
      }
    } catch {
      // Fall through to regex
    }
  }

  const upiId = (
    readParam(params, ['pa', 'vpa', 'upi']) ||
    text.match(VPA_IN_TEXT)?.[0] ||
    ''
  ).toLowerCase();

  if (!isValidUpiId(upiId)) return null;

  const payeeName = readParam(params, ['pn', 'name']);
  const note = readParam(params, ['tn', 'note']);
  const amount = parseAmount(readParam(params, ['am', 'amount', 'amt']));

  return {
    upiId,
    payeeName: payeeName || undefined,
    note: note || undefined,
    amount,
  };
}

/**
 * Audio synthesis for pleasant payment chime
 */
export function playPaymentSuccessSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Friendly 2-tone harmonic chime (E5 -> B5 -> E6)
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.01, startTime);
      gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    playNote(659.25, now, 0.25);        // E5
    playNote(987.77, now + 0.12, 0.35);  // B5
    playNote(1318.51, now + 0.24, 0.55); // E6
  } catch {
    // Graceful fallback if audio context blocked by browser gesture
  }
}
