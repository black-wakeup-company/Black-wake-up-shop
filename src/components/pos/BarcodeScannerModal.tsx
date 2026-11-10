import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useBoutique } from '../../context/BoutiqueContext';
import { Camera, X, CheckCircle2, AlertCircle, RefreshCw, Barcode, Plus, Volume2, VolumeX } from 'lucide-react';
import { Product } from '../../types/boutique';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductScanned?: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onProductScanned
}) => {
  const { products, addToCart, formatMoney, showToast } = useBoutique();

  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'barcode-camera-scanner-reader';
  const isComponentMounted = useRef(true);
  const keyboardBufferRef = useRef('');
  const lastKeyboardInputAtRef = useRef(0);
  const lastScanAtRef = useRef(0);

  // Play a crisp POS scanner beep using Web Audio API
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, audioCtx.currentTime); // 2.4 kHz clear beep
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // AudioContext unavailable or blocked by browser policy
    }
  };

  const handleBarcodeDetected = (decodedText: string) => {
    const cleanCode = decodedText.trim();
    if (!cleanCode) return;

    // Camera decoders may report the same frame repeatedly; allow a genuine
    // second scan after the short duplicate-protection window.
    const now = Date.now();
    if (cleanCode === lastScannedCode && now - lastScanAtRef.current < 1500) {
      return;
    }
    lastScanAtRef.current = now;
    setLastScannedCode(cleanCode);
    playBeep();

    // Look up in catalogue by barcode or SKU
    const matched = products.find(
      (p) =>
        p.barcode.toLowerCase() === cleanCode.toLowerCase() ||
        p.sku.toLowerCase() === cleanCode.toLowerCase()
    );

    if (matched) {
      setScannedProduct(matched);
      addToCart(matched, 1);
      if (onProductScanned) {
        onProductScanned(matched);
      }
      showToast(`Scanné : ${matched.name} (+1)`, 'success');
      if (navigator.vibrate) {
        navigator.vibrate(80);
      }
    } else {
      setScannedProduct(null);
      showToast(`Code "${cleanCode}" introuvable dans le catalogue`, 'warning');
    }
  };

  // USB and Bluetooth HID barcode readers usually type the code like a
  // keyboard and finish with Enter. Capture only fast key bursts outside
  // editable fields so normal typing and the manual input remain untouched.
  useEffect(() => {
    if (!isOpen) {
      keyboardBufferRef.current = '';
      return;
    }

    const handleKeyboardScannerInput = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable = !!target && (
        target.isContentEditable ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      );
      if (isEditable || event.ctrlKey || event.altKey || event.metaKey) return;

      if (event.key === 'Enter') {
        const scannedCode = keyboardBufferRef.current;
        keyboardBufferRef.current = '';
        if (scannedCode.length >= 4) {
          event.preventDefault();
          handleBarcodeDetected(scannedCode);
        }
        return;
      }

      if (event.key.length !== 1) return;
      const now = Date.now();
      if (now - lastKeyboardInputAtRef.current > 100) {
        keyboardBufferRef.current = '';
      }
      lastKeyboardInputAtRef.current = now;
      keyboardBufferRef.current += event.key;
      if (keyboardBufferRef.current.length > 64) {
        keyboardBufferRef.current = '';
      }
    };

    window.addEventListener('keydown', handleKeyboardScannerInput);
    return () => {
      window.removeEventListener('keydown', handleKeyboardScannerInput);
      keyboardBufferRef.current = '';
    };
  }, [isOpen, products, soundEnabled, lastScannedCode, isScanning]);

  const startScanner = async () => {
    try {
      setScannerError(null);
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {
          // ignore
        }
      }

      const formatsToSupport = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.QR_CODE
      ];

      const html5QrCode = new Html5Qrcode(readerElementId, { formatsToSupport, verbose: false });
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode },
        {
          fps: 15,
          qrbox: { width: 260, height: 160 },
          aspectRatio: 1.3333
        },
        (decodedText) => {
          handleBarcodeDetected(decodedText);
        },
        () => {
          // Frame without barcode detected
        }
      );

      if (isComponentMounted.current) {
        setIsScanning(true);
      }
    } catch (err: any) {
      console.warn('Camera scanner start error:', err);
      if (isComponentMounted.current) {
        setIsScanning(false);
        const errMsg =
          typeof err === 'string'
            ? err
            : err?.message || "Accès à la caméra refusé ou indisponible sur cet appareil.";
        setScannerError(errMsg);
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    if (isComponentMounted.current) {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    isComponentMounted.current = true;
    if (isOpen) {
      // Small timeout to let DOM mount the #barcode-camera-scanner-reader
      const timer = setTimeout(() => {
        startScanner();
      }, 250);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }

    return () => {
      isComponentMounted.current = false;
      stopScanner();
    };
  }, [isOpen, facingMode]);

  const toggleCameraFacing = async () => {
    await stopScanner();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleBarcodeDetected(manualCode.trim());
    setManualCode('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Scanner de Code-barres</h3>
              <p className="text-[11px] text-slate-300">Caméra · Lecteur USB/Bluetooth · Saisie manuelle</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSoundEnabled((v) => !v)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={soundEnabled ? 'Désactiver le bip' : 'Activer le bip'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleCameraFacing}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Changer de caméra"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Camera Viewport & Overlay */}
        <div className="relative bg-black flex-1 min-h-[260px] max-h-[360px] overflow-hidden flex items-center justify-center">
          <div id={readerElementId} className="w-full h-full" />

          {/* Guide reticle */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            <div className="w-64 h-36 border-2 border-emerald-400/80 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
              {/* Corner accents */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-emerald-400" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-emerald-400" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-emerald-400" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-emerald-400" />
              
              {/* Scanning red laser line */}
              <div className="w-full h-0.5 bg-red-500/90 shadow-[0_0_8px_red] absolute top-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <p className="text-white/90 text-xs mt-3 font-medium bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
              Pointez l'objectif vers le code-barres de l'article
            </p>
          </div>

          {/* Scanner Error Fallback */}
          {scannerError && (
            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-white z-10">
              <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
              <h4 className="font-bold text-sm text-white">Caméra inaccessible</h4>
              <p className="text-xs text-slate-300 mt-1 max-w-xs leading-relaxed">
                Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur, ou utilisez la saisie manuelle ci-dessous.
              </p>
              <button
                onClick={startScanner}
                className="mt-3 px-3.5 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Réessayer la caméra</span>
              </button>
            </div>
          )}
        </div>

        {/* Scanned Feedback Card */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 space-y-3">
          {scannedProduct ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="truncate">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">
                    Ajouté au panier !
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {scannedProduct.name}
                  </h4>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {formatMoney(scannedProduct.salePrice)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => addToCart(scannedProduct, 1)}
                className="px-2.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1 shrink-0 shadow-xs cursor-pointer"
                title="Ajouter un autre exemplaire"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+1</span>
              </button>
            </div>
          ) : lastScannedCode ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Code <strong className="font-mono">{lastScannedCode}</strong> non reconnu.
              </span>
            </div>
          ) : null}

          {/* Quick manual entry form */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Entrer ou coller un code-barres manuellement..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              Valider
            </button>
          </form>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500">
              Caméra, lecteur clavier USB/Bluetooth ou saisie manuelle
            </span>
            <button
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Terminer le scan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
