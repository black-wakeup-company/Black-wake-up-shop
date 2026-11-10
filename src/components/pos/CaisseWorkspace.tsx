import React, { useState } from 'react';
import { useBoutique } from '../../context/BoutiqueContext';
import { PosView } from './PosView';
import { CashierSwitchModal } from '../auth/CashierSwitchModal';
import { ReceiptModal } from './ReceiptModal';
import { Sale } from '../../types/boutique';
import {
  User,
  Wallet,
  Receipt,
  Lock,
  RotateCcw,
  Printer,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface CaisseWorkspaceProps {
  onOpenAdmin: () => void;
}

export const CaisseWorkspace: React.FC<CaisseWorkspaceProps> = ({ onOpenAdmin }) => {
  const {
    activeCashier,
    cashSession,
    openCashSession,
    closeCashSession,
    sales,
    formatMoney,
    showToast
  } = useBoutique();

  const [isCashierSwitchOpen, setIsCashierSwitchOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isDailySalesOpen, setIsDailySalesOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Sale | null>(null);

  // Cash count input
  const [cashActual, setCashActual] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  // Today's sales for the cashier view
  const todaySales = sales.filter((s) => {
    const today = new Date().toISOString().slice(0, 10);
    return s.date.startsWith(today);
  });

  const todayTotal = todaySales
    .filter((s) => s.status === 'complete')
    .reduce((sum, s) => sum + s.total, 0);

  // Expected cash in register
  const sessionStart = new Date(cashSession.openedAt).getTime();
  const cashSalesSession = sales
    .filter((s) => s.status === 'complete' && s.paymentMethod === 'especes' && new Date(s.date).getTime() >= sessionStart)
    .reduce((sum, s) => sum + s.total, 0);
  const expectedCash = cashSession.openingAmount + cashSalesSession;

  const handleCloseSession = (e: React.FormEvent) => {
    e.preventDefault();
    const actual = parseFloat(cashActual) || 0;
    closeCashSession(actual, sessionNotes);
    setIsSessionModalOpen(false);
    setCashActual('');
    setSessionNotes('');
  };

  return (
    <div className="space-y-4">
      {/* Cashier Bar / Top Context Ribbon */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Active Cashier Badge with Switch */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsCashierSwitchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Cliquer pour changer de caissier"
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-white font-bold text-[10px] ${
                    activeCashier?.avatarColor || 'bg-slate-800'
                  }`}
                >
                  {activeCashier?.name?.slice(0, 2).toUpperCase() || 'CA'}
                </div>
                <span className="font-semibold text-slate-900">{activeCashier?.name || 'Caissier'}</span>
                <span className="text-[10px] text-slate-400">(Changer)</span>
              </button>

              {/* Cash Register State */}
              <button
                onClick={() => setIsSessionModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  cashSession.status === 'open'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {cashSession.status === 'open' ? 'Caisse Ouverte' : 'Caisse Fermée'} :{' '}
                  <strong className="font-mono">{formatMoney(expectedCash)}</strong>
                </span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsDailySalesOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <Receipt className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Tickets du Jour ({todaySales.length})</span>
                <span className="sm:hidden">Tickets ({todaySales.length})</span>
                <span className="font-mono font-bold text-slate-900">· {formatMoney(todayTotal)}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Touch POS View */}
      <PosView />

      {/* Cashier Switch Modal */}
      <CashierSwitchModal
        isOpen={isCashierSwitchOpen}
        onClose={() => setIsCashierSwitchOpen(false)}
      />

      {/* Cash Session Modal (Tiroir de caisse) */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-slate-900" />
                <h3 className="font-bold text-sm text-slate-900">Tiroir-Caisse & Session</h3>
              </div>
              <button
                onClick={() => setIsSessionModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cashSession.status === 'open' ? (
              <form onSubmit={handleCloseSession} className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Fond de caisse initial :</span>
                    <span className="font-mono tabular-nums">{formatMoney(cashSession.openingAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Ventes espèces encaissées :</span>
                    <span className="font-mono tabular-nums text-emerald-700">+{formatMoney(cashSalesSession)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                    <span>Total espèces attendu :</span>
                    <span className="font-mono tabular-nums">{formatMoney(expectedCash)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Comptage physique des espèces dans le tiroir
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={cashActual}
                    onChange={(e) => setCashActual(e.target.value)}
                    className="w-full text-base font-bold font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSessionModalOpen(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                  >
                    Clôturer la Caisse
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  La caisse est actuellement clôturée. Ouvrez une nouvelle session pour commencer les encaissements.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const fond = prompt('Montant du fond de caisse initial :', '150');
                    if (fond) {
                      openCashSession(parseFloat(fond) || 150);
                      setIsSessionModalOpen(false);
                    }
                  }}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                >
                  Ouvrir une nouvelle session de caisse
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Today's Sales Quick List (for re-printing ticket) */}
      {isDailySalesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Tickets de Caisse du Jour</h3>
                <p className="text-xs text-slate-500">
                  {todaySales.length} ventes · Total : {formatMoney(todayTotal)}
                </p>
              </div>
              <button
                onClick={() => setIsDailySalesOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {todaySales.map((sale) => (
                <div
                  key={sale.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="font-mono text-slate-900">{sale.id}</strong>
                      <span className="text-[11px] text-slate-400">
                        {new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      {sale.customerName} · {sale.items.length} art. ({sale.paymentMethod})
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {formatMoney(sale.total)}
                    </span>
                    <button
                      onClick={() => setSelectedReceipt(sale)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
                      title="Réimprimer le ticket"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {todaySales.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-6">
                  Aucune vente effectuée aujourd'hui.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REPRINT RECEIPT MODAL */}
      {selectedReceipt && (
        <ReceiptModal
          sale={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};
