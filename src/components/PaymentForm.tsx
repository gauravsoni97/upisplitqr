import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Zap, AlertTriangle, Building2 } from 'lucide-react';
import { calculateSplits, formatINR, getSplitSummary, MAX_UPI_AMOUNT } from '../utils/upi';
import { PaymentFormValues } from '../types';

interface PaymentFormProps {
  onGenerate: (values: PaymentFormValues) => void;
  isLoading?: boolean;
}

const COMMON_HANDLES = ['@okaxis', '@oksbi', '@paytm', '@ybl'];
const QUICK_AMOUNTS = [1999, 2500, 3000, 5000];

export const PaymentForm: React.FC<PaymentFormProps> = ({ onGenerate, isLoading }) => {
  const [upiId, setUpiId] = useState<string>(() => {
    return localStorage.getItem('last_upi_id') || 'gauravsoni@upi';
  });
  const [amountInput, setAmountInput] = useState<string>('2500');
  const [error, setError] = useState<string>('');

  const numericAmount = parseFloat(amountInput) || 0;
  
  // Instant O(1) mathematical summary
  const summary = useMemo(() => getSplitSummary(numericAmount, 1999), [numericAmount]);

  // Bounded splits array (never loops indefinitely or crashes browser)
  const splits = useMemo(() => {
    if (numericAmount <= 0) return [];
    return calculateSplits(numericAmount, 1999);
  }, [numericAmount]);

  useEffect(() => {
    if (upiId.trim()) {
      localStorage.setItem('last_upi_id', upiId.trim());
    }
  }, [upiId]);

  const handleAppendHandle = (handle: string) => {
    const atIndex = upiId.indexOf('@');
    if (atIndex !== -1) {
      setUpiId(upiId.substring(0, atIndex) + handle);
    } else {
      setUpiId((upiId.trim() || 'user') + handle);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUpi = upiId.trim();
    if (!cleanUpi) {
      setError('Enter your UPI ID');
      return;
    }

    if (!cleanUpi.includes('@')) {
      setError('UPI ID must include @ (e.g. name@oksbi or 9876543210@paytm)');
      return;
    }

    if (numericAmount <= 0) {
      setError('Enter valid amount');
      return;
    }

    if (numericAmount > MAX_UPI_AMOUNT) {
      setError(`Amount exceeds NPCI UPI transaction limit of ${formatINR(MAX_UPI_AMOUNT)}. Please enter a lower amount.`);
      return;
    }

    onGenerate({
      upiId: cleanUpi,
      payeeName: '',
      totalAmount: numericAmount,
      maxCap: 1999,
      customNote: 'Payment',
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4 overflow-hidden">
        {/* UPI ID */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="upi-id-input" className="text-xs font-bold text-slate-800">
              Your UPI ID
            </label>
            <span className="text-[11px] text-slate-400">Payment receiver</span>
          </div>

          <input
            id="upi-id-input"
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value.toLowerCase().trim())}
            placeholder="e.g. 9876543210@paytm or name@oksbi"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-900 font-semibold text-sm"
            required
          />

          <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto pb-0.5">
            {COMMON_HANDLES.map((handle) => (
              <button
                key={handle}
                type="button"
                onClick={() => handleAppendHandle(handle)}
                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer shrink-0"
              >
                {handle}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="amount-input" className="text-xs font-bold text-slate-800">
              Total Amount (₹)
            </label>
            <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
              Max ₹1,999 / QR
            </span>
          </div>

          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-400 text-lg font-bold">₹</span>
            <input
              id="amount-input"
              type="number"
              min="1"
              step="any"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="2500"
              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-900 font-bold text-xl"
              required
            />
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 mt-2">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmountInput(amt.toString())}
                className={`flex-1 py-1 text-xs rounded-lg font-medium transition-all ${
                  numericAmount === amt
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* High Amount / UPI Limit Warning Banner */}
        {summary.exceedsLimit && (
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2">
            <div className="flex items-start gap-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm leading-tight text-amber-950">
                  Exceeds UPI Limit ({formatINR(MAX_UPI_AMOUNT)})
                </span>
                <p className="text-amber-800 text-[11px] mt-1 leading-relaxed">
                  NPCI regulates the maximum UPI transaction limit to {formatINR(MAX_UPI_AMOUNT)}. 
                  An amount of <strong>{formatINR(numericAmount)}</strong> would require{' '}
                  <strong>{summary.totalCount.toLocaleString()} QRs</strong>, which is not permitted by UPI banks.
                </p>
              </div>
            </div>

            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAmountInput(MAX_UPI_AMOUNT.toString())}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Set to Max Limit (₹1,00,000)
              </button>
              <span className="text-[10px] text-amber-700 flex items-center gap-1 font-medium">
                <Building2 className="w-3 h-3" />
                Use NEFT/RTGS for larger transfers
              </span>
            </div>
          </div>
        )}

        {/* Dynamic Split Preview (Clean & Instant, Zero Lag) */}
        {!summary.exceedsLimit && numericAmount > 0 && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs overflow-hidden">
            {splits.length === 1 ? (
              <div className="text-slate-600 flex items-center justify-between">
                <span>Single QR Code:</span>
                <strong className="text-slate-900 font-bold">{formatINR(splits[0])}</strong>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    Auto-split ({splits.length} QRs):
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">Total: {formatINR(numericAmount)}</span>
                </div>

                {splits.length <= 4 ? (
                  /* Up to 4 QRs: Clean grid layout */
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {splits.map((chunk, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-2 rounded-lg border border-slate-200 text-center font-bold text-slate-800 text-xs"
                      >
                        <span className="text-[10px] text-slate-400 block font-normal">QR {idx + 1}</span>
                        {formatINR(chunk)}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* More than 4 QRs (up to 51 QRs): Smart grouped breakdown + scrollable chips */
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white p-2 rounded-lg border border-slate-200 text-center">
                        <span className="text-[10px] text-slate-400 block">Full Limit (₹1,999)</span>
                        <span className="font-bold text-slate-900 text-xs">
                          {summary.fullCount} × ₹1,999
                        </span>
                      </div>
                      {summary.remainder > 0 && (
                        <div className="bg-white p-2 rounded-lg border border-slate-200 text-center px-3">
                          <span className="text-[10px] text-slate-400 block">Last QR Balance</span>
                          <span className="font-bold text-emerald-700 text-xs">
                            1 × {formatINR(summary.remainder)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Scrollable strip with bounded DOM rendering */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                      {splits.slice(0, 10).map((chunk, idx) => (
                        <div
                          key={idx}
                          className="shrink-0 bg-white px-2 py-1 rounded-md border border-slate-200 text-center text-[11px] font-semibold text-slate-700 whitespace-nowrap"
                        >
                          <span className="text-slate-400 mr-1 text-[10px]">#{idx + 1}</span>
                          {formatINR(chunk)}
                        </div>
                      ))}
                      {splits.length > 10 && (
                        <div className="shrink-0 bg-slate-200/80 text-slate-600 px-2 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap">
                          +{splits.length - 10} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <button
          id="generate-qr-btn"
          type="submit"
          disabled={isLoading || numericAmount <= 0 || summary.exceedsLimit}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
        >
          <span>
            {summary.exceedsLimit
              ? `Amount Exceeds UPI Limit (Max ${formatINR(MAX_UPI_AMOUNT)})`
              : splits.length > 1
              ? `Generate ${splits.length} QRs (${formatINR(numericAmount)})`
              : `Generate QR (${formatINR(numericAmount)})`}
          </span>
          {!summary.exceedsLimit && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};
