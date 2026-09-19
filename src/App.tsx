import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { PaymentForm } from './components/PaymentForm';
import { QRDisplay } from './components/QRDisplay';
import { PaymentFormValues, SplitResult, SplitQRItem } from './types';
import { 
  calculateSplits, 
  buildUpiDeepLink, 
  generateQrDataUrl, 
  playPaymentSuccessSound,
  MAX_UPI_AMOUNT 
} from './utils/upi';

export default function App() {
  const [splitResult, setSplitResult] = useState<SplitResult | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSharedView, setIsSharedView] = useState<boolean>(false);

  const generateSplits = async (upiId: string, rawAmount: number, note: string = 'Payment') => {
    setIsGenerating(true);

    try {
      const amount = Math.min(rawAmount, MAX_UPI_AMOUNT);
      const splits = calculateSplits(amount, 1999);
      const totalChunks = splits.length;

      const chunks: SplitQRItem[] = await Promise.all(
        splits.map(async (chunkAmount, idx) => {
          const index = idx + 1;
          const chunkNote = totalChunks > 1
            ? `Part ${index}/${totalChunks}`
            : note;

          const upiUrl = buildUpiDeepLink({
            upiId,
            payeeName: '',
            amount: chunkAmount,
            note: chunkNote,
          });

          const qrDataUrl = await generateQrDataUrl(upiUrl);

          return {
            id: `qr_${Date.now()}_${index}`,
            index,
            totalChunks,
            amount: chunkAmount,
            upiUrl,
            qrDataUrl,
            status: 'pending' as const,
            note: chunkNote,
          };
        })
      );

      setSplitResult({
        totalAmount: amount,
        maxCap: 1999,
        upiId,
        payeeName: '',
        chunks,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } catch (err) {
      console.error('Failed to generate QR codes:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSplits = async (values: PaymentFormValues) => {
    const amount = typeof values.totalAmount === 'number' 
      ? values.totalAmount 
      : parseFloat(values.totalAmount) || 0;
    
    setIsSharedView(false);
    await generateSplits(values.upiId, amount, values.customNote || 'Payment');
  };

  // Automatically check for shareable URL query parameters on initial page load
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const href = window.location.href;
      let search = window.location.search;
      if (!search && href.includes('?')) {
        search = href.substring(href.indexOf('?'));
      }

      const params = new URLSearchParams(search);
      let rawUpi = params.get('upi') || params.get('pa') || params.get('vpa');
      let rawAmount = params.get('amount') || params.get('am') || params.get('amt');

      // Also check hash in case WhatsApp or mobile redirects placed params after #
      if ((!rawUpi || !rawAmount) && window.location.hash) {
        const hash = window.location.hash;
        if (hash.includes('?')) {
          const hashParams = new URLSearchParams(hash.substring(hash.indexOf('?')));
          rawUpi = rawUpi || hashParams.get('upi') || hashParams.get('pa') || hashParams.get('vpa');
          rawAmount = rawAmount || hashParams.get('amount') || hashParams.get('am') || hashParams.get('amt');
        }
      }

      if (rawUpi && rawAmount) {
        let cleanUpi = '';
        try {
          cleanUpi = decodeURIComponent(rawUpi).trim().replace(/['"]/g, '');
        } catch {
          cleanUpi = rawUpi.trim().replace(/['"]/g, '');
        }

        const cleanAmountStr = rawAmount.replace(/[^0-9.]/g, '');
        const parsedAmount = parseFloat(cleanAmountStr);

        if (cleanUpi && cleanUpi.includes('@') && parsedAmount > 0) {
          setIsSharedView(true);
          generateSplits(cleanUpi, parsedAmount, 'Payment');
        }
      }
    } catch (err) {
      console.error('Error reading shared link parameters:', err);
    }
  }, []);

  const handleTogglePaid = (chunkId: string) => {
    if (!splitResult) return;

    let newlyPaid = false;
    let willCompleteAll = false;

    const updatedChunks = splitResult.chunks.map((item) => {
      if (item.id === chunkId) {
        const nextStatus: 'pending' | 'paid' = item.status === 'paid' ? 'pending' : 'paid';
        if (nextStatus === 'paid') {
          newlyPaid = true;
        }
        return {
          ...item,
          status: nextStatus,
          paidAt: nextStatus === 'paid' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        };
      }
      return item;
    });

    const paidCount = updatedChunks.filter((item) => item.status === 'paid').length;
    if (paidCount === updatedChunks.length && newlyPaid) {
      willCompleteAll = true;
    }

    setSplitResult({
      ...splitResult,
      chunks: updatedChunks,
    });

    if (newlyPaid) {
      playPaymentSuccessSound();

      confetti({
        particleCount: willCompleteAll ? 90 : 40,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#10b981', '#059669', '#3b82f6', '#f59e0b'],
      });
    }
  };

  const handleReset = () => {
    setSplitResult(null);
    setIsSharedView(false);
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      <Header 
        hasActivePayment={!!splitResult} 
        onReset={handleReset} 
      />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-3 sm:py-5 flex flex-col justify-center">
        {!splitResult ? (
          <PaymentForm 
            onGenerate={handleGenerateSplits} 
            isLoading={isGenerating} 
          />
        ) : (
          <QRDisplay
            items={splitResult.chunks}
            upiId={splitResult.upiId}
            totalAmount={splitResult.totalAmount}
            onTogglePaid={handleTogglePaid}
            onReset={handleReset}
            isSharedView={isSharedView}
          />
        )}
      </main>
    </div>
  );
}
