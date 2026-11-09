import React, { useState } from 'react';
import { useBoutique } from '../../context/BoutiqueContext';
import { TrendingUp, ArrowRightLeft, Check, X, DollarSign, Calculator } from 'lucide-react';

interface ExchangeRateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExchangeRateModal: React.FC<ExchangeRateModalProps> = ({ isOpen, onClose }) => {
  const { exchangeRateUSD, updateExchangeRate } = useBoutique();

  const [rateInput, setRateInput] = useState(exchangeRateUSD.toString());
  const [testUSD, setTestUSD] = useState('10');
  const [testFC, setTestFC] = useState('');

  if (!isOpen) return null;

  const currentRateNum = Math.max(1, parseFloat(rateInput) || exchangeRateUSD);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(rateInput);
    if (!parsed || parsed <= 0) return;
    updateExchangeRate(parsed);
    onClose();
  };

  const calculatedFC = (parseFloat(testUSD) || 0) * currentRateNum;
  const calculatedUSD = (parseFloat(testFC) || 0) / currentRateNum;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Taux de Change du Jour</h3>
              <p className="text-[11px] text-slate-500">Parité Dollar Américain ($) & Franc Congolais (FC)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Valeur de 1 Dollar ($ USD) en Franc Congolais (FC)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                required
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                className="w-full text-xl font-bold font-mono pl-4 pr-16 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-500">
                FC / $
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Exemple standard : 2 800, 2 850 ou 2 900 FC pour 1 $
            </p>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 mr-1">Raccourcis :</span>
            {[2750, 2800, 2850, 2900, 2950].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setRateInput(preset.toString())}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg border transition-all cursor-pointer ${
                  rateInput === preset.toString()
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {preset.toLocaleString('fr-FR')} FC
              </button>
            ))}
          </div>

          {/* Real-time bidirectional converter simulator */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-slate-500" />
              <span>Simulateur en direct</span>
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-semibold">Montant en $</label>
                <input
                  type="number"
                  value={testUSD}
                  onChange={(e) => {
                    setTestUSD(e.target.value);
                    setTestFC('');
                  }}
                  className="w-full mt-0.5 px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg"
                  placeholder="10"
                />
                <span className="text-[11px] font-bold text-emerald-700 block mt-1 tabular-nums">
                  = {Math.round(calculatedFC).toLocaleString('fr-FR')} FC
                </span>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase font-semibold">Montant en FC</label>
                <input
                  type="number"
                  value={testFC}
                  onChange={(e) => {
                    setTestFC(e.target.value);
                    setTestUSD('');
                  }}
                  className="w-full mt-0.5 px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg"
                  placeholder="50000"
                />
                <span className="text-[11px] font-bold text-emerald-700 block mt-1 tabular-nums">
                  = {testFC ? `${calculatedUSD.toFixed(2)} $` : '---'}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Confirmer le taux du jour</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
