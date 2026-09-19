import React, { useEffect, useId, useRef, useState } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { parseUpiQrPayload, ParsedUpiQr } from '../utils/upi';

interface QrScannerModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onScan: (parsed: ParsedUpiQr) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  open,
  title,
  onClose,
  onScan,
}) => {
  const readerId = useId().replace(/:/g, '');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  onScanRef.current = onScan;
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    let cancelled = false;
    const startCamera = async () => {
      setError('');
      setStarting(true);
      try {
        const scanner = new Html5Qrcode(readerId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 12, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            const parsed = parseUpiQrPayload(decoded);
            if (!parsed) {
              setError('This QR is not a valid UPI code. Try another QR.');
              return;
            }
            onScanRef.current(parsed);
          },
          () => undefined
        );
      } catch {
        if (!cancelled) {
          setError('Camera not available. Upload a QR image instead.');
        }
      } finally {
        if (!cancelled) setStarting(false);
      }
    };

    const timer = window.setTimeout(startCamera, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        Promise.resolve(scanner.stop())
          .catch(() => undefined)
          .finally(() => {
            Promise.resolve(scanner.clear()).catch(() => undefined);
          });
      }
    };
  }, [open, readerId]);

  if (!open) return null;

  const handleFile = async (file: File) => {
    setError('');
    try {
      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode(readerId);
        scannerRef.current = scanner;
      } else if (scanner.isScanning) {
        await scanner.stop();
      }
      const decoded = await scanner.scanFile(file, true);
      const parsed = parseUpiQrPayload(decoded);
      if (!parsed) {
        setError('This image is not a valid UPI QR.');
        return;
      }
      onScan(parsed);
    } catch {
      setError('Could not read a UPI QR from that image.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close scanner"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] cursor-pointer"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-scan-title"
        className="relative w-full max-w-md overflow-hidden flex flex-col bg-white rounded-3xl border border-slate-200 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
          <div>
            <h2 id="qr-scan-title" className="text-lg font-extrabold text-slate-900 tracking-tight">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Point the camera at a UPI QR. We only read the UPI ID.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4">
          <div className="relative overflow-hidden rounded-2xl bg-slate-950 aspect-square">
            <div id={readerId} className="w-full h-full qr-reader" />
            {starting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
                <Camera className="w-6 h-6 animate-pulse" />
                <p className="text-xs font-semibold">Starting camera...</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="mx-4 mt-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <div className="p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
              event.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full min-h-11 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-sm font-bold cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <ImagePlus className="w-4 h-4" />
            Upload QR image
          </button>
        </div>
      </section>
    </div>
  );
};
