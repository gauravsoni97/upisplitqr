import { PaymentMode } from '../types';

export interface HistoryItem {
  id: string;
  mode: PaymentMode;
  upiId: string;
  payeeName: string;
  amount: number;
  note: string;
  createdAt: number;
}

const HISTORY_KEY = 'upi_payment_history';
const MAX_HISTORY = 8;

const readJson = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore private-mode / storage failures
  }
};

export function getHistory(): HistoryItem[] {
  const items = readJson<HistoryItem[]>(HISTORY_KEY, []);
  return Array.isArray(items) ? items : [];
}

export function addHistory(entry: Omit<HistoryItem, 'id' | 'createdAt'>) {
  const next: HistoryItem = {
    ...entry,
    id: `h_${Date.now()}`,
    createdAt: Date.now(),
  };
  const items = [next, ...getHistory().filter((item) => !(item.upiId === entry.upiId && item.amount === entry.amount && item.mode === entry.mode))].slice(0, MAX_HISTORY);
  writeJson(HISTORY_KEY, items);
}
