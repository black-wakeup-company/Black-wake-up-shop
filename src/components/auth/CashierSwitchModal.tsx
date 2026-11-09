import React from 'react';
import { useBoutique } from '../../context/BoutiqueContext';
import { Cashier } from '../../types/boutique';
import { UserCheck, X, Shield, User } from 'lucide-react';

interface CashierSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashierSwitchModal: React.FC<CashierSwitchModalProps> = ({ isOpen, onClose }) => {
  const { cashiers, activeCashier, setActiveCashier } = useBoutique();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-slate-800" />
            <h3 className="font-bold text-sm text-slate-900">Changer de Caissier</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Sélectionnez la personne actuellement au poste de caisse pour l'impression des tickets.
        </p>

        <div className="space-y-2">
          {cashiers.map((c) => {
            const isSelected = activeCashier?.id === c.id;

            return (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCashier(c);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${
                      c.avatarColor || 'bg-slate-700'
                    }`}
                  >
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-xs">{c.name}</div>
                    <div
                      className={`text-[10px] ${
                        isSelected ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      {c.role === 'admin' ? 'Administrateur / Gérant' : 'Vendeur / Caissier'}
                    </div>
                  </div>
                </div>

                {c.role === 'admin' ? (
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <User className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
