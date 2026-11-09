import React, { useState, useEffect } from 'react';
import { useBoutique } from '../../context/BoutiqueContext';
import { Lock, Unlock, ShoppingBag, Delete, Users, ShieldCheck, AlertCircle } from 'lucide-react';

export const LockScreen: React.FC = () => {
  const {
    isScreenLocked,
    unlockScreen,
    settings,
    activeCashier,
    cashiers,
    setActiveCashier
  } = useBoutique();

  const [pin, setPin] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isSwitchingUser, setIsSwitchingUser] = useState(false);

  useEffect(() => {
    if (isScreenLocked) {
      setPin('');
      setHasError(false);
    }
  }, [isScreenLocked]);

  // Support physical keyboard
  useEffect(() => {
    if (!isScreenLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        setPin('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isScreenLocked, pin]);

  if (!isScreenLocked) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 8) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setHasError(false);

      // Auto-submit if 4 digits entered and matches
      if (nextPin.length === 4) {
        setTimeout(() => {
          const success = unlockScreen(nextPin);
          if (!success) {
            setHasError(true);
            setTimeout(() => setPin(''), 600);
          }
        }, 120);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setHasError(false);
  };

  const handleClear = () => {
    setPin('');
    setHasError(false);
  };

  const handleSubmit = () => {
    if (!pin) return;
    const success = unlockScreen(pin);
    if (!success) {
      setHasError(true);
      setTimeout(() => setPin(''), 600);
    }
  };

  return (
    <div className="fixed inset-0 z-100 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 select-none animate-fade-in text-white">
      {/* Background ambient decorative shapes */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm flex flex-col items-center text-center space-y-6">
        {/* Boutique branding */}
        <div className="flex flex-col items-center space-y-2">
          {settings.logo ? (
            <img
              src={settings.logo}
              alt={settings.boutiqueName}
              className="w-16 h-16 rounded-2xl object-cover bg-white p-1 border border-slate-700 shadow-xl"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20">
              <Lock className="w-8 h-8 text-white stroke-[2.2]" />
            </div>
          )}

          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {settings.boutiqueName || 'BoutiquePro'}
            </h1>
            <p className="text-xs text-slate-400 font-medium">Poste de caisse verrouillé</p>
          </div>
        </div>

        {/* Current user badge & switcher */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2 flex items-center justify-between w-full max-w-xs shadow-md">
          <div className="flex items-center gap-2.5 text-left">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs ${
                activeCashier.avatarColor || 'bg-emerald-600'
              }`}
            >
              {activeCashier.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                Caissier actif
              </span>
              <span className="text-xs font-bold text-slate-200">{activeCashier.name}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSwitchingUser((v) => !v)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Changer de caissier"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>

        {/* User Switch Dropdown if toggled */}
        {isSwitchingUser && (
          <div className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-xl p-2 space-y-1 shadow-2xl animate-fade-in">
            <p className="text-[10px] text-slate-400 px-2 py-1 font-semibold uppercase tracking-wider text-left">
              Sélectionner un compte
            </p>
            {cashiers.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCashier(c);
                  setIsSwitchingUser(false);
                  setPin('');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                  c.id === activeCashier.id
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{c.name}</span>
                <span className="text-[10px] opacity-75">{c.role}</span>
              </button>
            ))}
          </div>
        )}

        {/* PIN Dots Indicator */}
        <div className={`space-y-2 ${hasError ? 'animate-shake' : ''}`}>
          <div className="flex items-center justify-center gap-3 py-2">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    isFilled
                      ? 'bg-emerald-400 scale-110 shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                      : 'border-2 border-slate-700 bg-slate-900'
                  }`}
                />
              );
            })}
          </div>

          {hasError && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Code PIN incorrect</span>
            </div>
          )}
        </div>

        {/* Keypad Grid (3 columns x 4 rows) */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 border border-slate-800/80 text-xl font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center font-mono"
            >
              {digit}
            </button>
          ))}

          {/* Bottom row: Clear, 0, Backspace/Submit */}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-900/60 hover:bg-slate-800 active:bg-slate-700 border border-slate-800/60 text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
          >
            EFFACER
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 border border-slate-800/80 text-xl font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center font-mono"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-900/60 hover:bg-slate-800 active:bg-slate-700 border border-slate-800/60 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
            title="Effacer un chiffre"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Quick hint for standard default PINs */}
        <div className="text-center text-[11px] text-slate-500 pt-2 flex flex-col items-center gap-1">
          <span>Saisissez le code PIN du caissier ou le code PIN administrateur.</span>
          <span className="text-[10px] text-slate-600 font-mono">
            (PIN caissier: {activeCashier.pin} · PIN admin: {settings.adminPin || '1234'})
          </span>
        </div>
      </div>
    </div>
  );
};
