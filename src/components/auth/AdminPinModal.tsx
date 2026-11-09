import React, { useState } from 'react';
import { useBoutique } from '../../context/BoutiqueContext';
import { ShieldCheck, X, Delete } from 'lucide-react';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { unlockAdmin, settings } = useBoutique();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (d: string) => {
    if (pin.length < 6) {
      const nextPin = pin + d;
      setPin(nextPin);
      setError(false);
      // Auto submit if length 4
      if (nextPin.length === 4) {
        if (unlockAdmin(nextPin)) {
          setPin('');
          onSuccess();
        } else {
          setError(true);
          setTimeout(() => setPin(''), 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (unlockAdmin(pin)) {
      setPin('');
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setPin(''), 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="relative w-full max-w-xs bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 p-6 text-center">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
        </div>

        <h3 className="font-bold text-base text-slate-900">Espace Administration</h3>
        <p className="text-xs text-slate-500 mt-1">
          Saisissez votre code PIN administrateur
        </p>

        {/* PIN Dots */}
        <div className="flex items-center justify-center gap-3 my-5">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border transition-all ${
                error
                  ? 'border-rose-500 bg-rose-500 animate-pulse'
                  : pin.length > idx
                  ? 'border-slate-900 bg-slate-900 scale-110'
                  : 'border-slate-300 bg-slate-100'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-rose-600 font-medium mb-3">
            Code PIN incorrect. Réessayez.
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[210px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="w-16 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 font-bold text-lg font-mono transition-all flex items-center justify-center shadow-xs cursor-pointer"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="w-16 h-12 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 font-medium text-xs transition-colors flex items-center justify-center"
          >
            Effacer
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="w-16 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 font-bold text-lg font-mono transition-all flex items-center justify-center shadow-xs cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="w-16 h-12 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Supprimer un chiffre"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
          Code PIN par défaut : <span className="font-mono font-semibold text-slate-600">1234</span>
        </div>
      </div>
    </div>
  );
};
