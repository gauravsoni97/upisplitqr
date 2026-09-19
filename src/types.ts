export interface SplitQRItem {
  id: string;
  index: number;
  totalChunks: number;
  amount: number;
  upiUrl: string;
  qrDataUrl: string;
  status: 'pending' | 'paid';
  paidAt?: string;
  note: string;
}

export interface PaymentFormValues {
  upiId: string;
  payeeName: string;
  totalAmount: number | string;
  maxCap: number;
  customNote: string;
}

export interface SplitResult {
  totalAmount: number;
  maxCap: number;
  upiId: string;
  payeeName: string;
  chunks: SplitQRItem[];
  createdAt: string;
}
