import React, { useState, useMemo } from 'react';
import { useBoutique } from '../../context/BoutiqueContext';
import { Customer, Sale } from '../../types/boutique';
import {
  Search,
  UserPlus,
  Phone,
  Mail,
  Edit2,
  Receipt,
  DollarSign,
  Award,
  AlertCircle,
  X,
  History,
  CheckCircle2
} from 'lucide-react';
import { ReceiptModal } from '../pos/ReceiptModal';

export const CustomersView: React.FC = () => {
  const { customers, addCustomer, updateCustomer, settleCustomerDebt, sales, formatMoney, showToast } = useBoutique();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDebtOnly, setFilterDebtOnly] = useState(false);

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [isSettleDebtOpen, setIsSettleDebtOpen] = useState(false);
  const [settlingCustomer, setSettlingCustomer] = useState<Customer | null>(null);
  const [settleAmount, setSettleAmount] = useState<string>('');

  const [customerHistory, setCustomerHistory] = useState<Customer | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Sale | null>(null);

  // Form
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Overview metrics
  const stats = useMemo(() => {
    let totalDebt = 0;
    let totalSpentAll = 0;
    let totalPoints = 0;
    let debtorsCount = 0;

    customers.forEach((c) => {
      totalDebt += c.debtBalance;
      totalSpentAll += c.totalSpent;
      totalPoints += c.loyaltyPoints;
      if (c.debtBalance > 0) debtorsCount++;
    });

    return {
      totalCustomers: customers.length,
      totalDebt,
      totalSpentAll,
      totalPoints,
      debtorsCount
    };
  }, [customers]);

  // Filtered
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        c.name.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term) ||
        (c.email && c.email.toLowerCase().includes(term));

      const matchDebt = !filterDebtOnly || c.debtBalance > 0;
      return matchSearch && matchDebt;
    });
  }, [customers, searchTerm, filterDebtOnly]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormNotes('');
    setIsAddEditModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormPhone(c.phone);
    setFormEmail(c.email || '');
    setFormAddress(c.address || '');
    setFormNotes(c.notes || '');
    setIsAddEditModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Le nom du client est requis', 'warning');
      return;
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        address: formAddress.trim() || undefined,
        notes: formNotes.trim() || undefined
      });
    } else {
      addCustomer({
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        address: formAddress.trim() || undefined,
        notes: formNotes.trim() || undefined
      });
    }

    setIsAddEditModalOpen(false);
  };

  const openSettleDebt = (c: Customer) => {
    setSettlingCustomer(c);
    setSettleAmount(c.debtBalance.toString());
    setIsSettleDebtOpen(true);
  };

  const handleConfirmSettleDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingCustomer) return;
    const amountVal = parseFloat(settleAmount) || 0;
    if (amountVal <= 0) {
      showToast('Veuillez entrer un montant valide supérieur à 0', 'warning');
      return;
    }
    settleCustomerDebt(settlingCustomer.id, amountVal);
    setIsSettleDebtOpen(false);
  };

  const customerSales = useMemo(() => {
    if (!customerHistory) return [];
    return sales.filter((s) => s.customerId === customerHistory.id);
  }, [customerHistory, sales]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 4-KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">Clients Enregistrés</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {stats.totalCustomers}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Fichier clientèle actif</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">Total Dettes / Créances</span>
          <div className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">
            {formatMoney(stats.totalDebt)}
          </div>
          <span className="text-[11px] text-amber-700 font-medium mt-1 block">
            {stats.debtorsCount} client{stats.debtorsCount > 1 ? 's' : ''} avec arriérés
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">Volume Achats Cumulés</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
            {formatMoney(stats.totalSpentAll)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Tous clients confondus</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">Points Fidélité Actifs</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {stats.totalPoints} <span className="text-xs font-normal text-slate-400">pts</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Programme récompenses</span>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher nom, téléphone, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          <button
            onClick={() => setFilterDebtOnly(!filterDebtOnly)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterDebtOnly
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            {filterDebtOnly ? 'Filtré : Dettes uniquement' : 'Voir uniquement les crédits'}
          </button>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-sm"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Nouveau Client</span>
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Coordonnées</th>
                <th className="py-3 px-4 text-right">Achats Totaux</th>
                <th className="py-3 px-4 text-center">Commandes</th>
                <th className="py-3 px-4 text-center">Fidélité</th>
                <th className="py-3 px-4 text-right">Crédit / Dette</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((cust) => {
                const hasDebt = cust.debtBalance > 0;

                return (
                  <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 hover:underline cursor-pointer" onClick={() => openEditModal(cust)}>
                        {cust.name}
                      </div>
                      {cust.notes && (
                        <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{cust.notes}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{cust.phone || '-'}</span>
                      </div>
                      {cust.email && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{cust.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatMoney(cust.totalSpent)}
                    </td>

                    <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700">
                      {cust.ordersCount}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        <Award className="w-3 h-3 text-amber-500" />
                        <span>{cust.loyaltyPoints} pts</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums">
                      {hasDebt ? (
                        <div className="font-mono font-bold text-rose-600">
                          {formatMoney(cust.debtBalance)}
                          <span className="text-[10px] block text-rose-500 font-sans font-normal">À régler</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">0,00</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {hasDebt && (
                          <button
                            onClick={() => openSettleDebt(cust)}
                            className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors whitespace-nowrap"
                            title="Régler l'arriéré / dette"
                          >
                            Régler dette
                          </button>
                        )}
                        <button
                          onClick={() => setCustomerHistory(cust)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Historique des achats"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(cust)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Modifier coordonnées"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-medium text-slate-700">Aucun client trouvé</p>
                    <p className="text-xs text-slate-400 mt-1">Créez votre première fiche client ci-dessus.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT CUSTOMER MODAL */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingCustomer ? 'Modifier le Client' : 'Nouveau Client'}
              </h3>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Élodie Laurent"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="client@mail.fr"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse postale</label>
                <input
                  type="text"
                  placeholder="Rue, Ville, Code Postal"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Préférences</label>
                <textarea
                  rows={2}
                  placeholder="Tailles préférées, style, historique particulier..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  {editingCustomer ? 'Mettre à jour' : 'Enregistrer le client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTLE DEBT MODAL */}
      {isSettleDebtOpen && settlingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Règlement de Créance</h3>
              <button
                onClick={() => setIsSettleDebtOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSettleDebt} className="space-y-3">
              <div className="p-3 bg-amber-50 text-amber-900 rounded-xl border border-amber-200 text-xs">
                <div className="flex justify-between">
                  <span>Client :</span>
                  <strong className="text-slate-900">{settlingCustomer.name}</strong>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Dette restante :</span>
                  <strong className="text-rose-700 font-mono">{formatMoney(settlingCustomer.debtBalance)}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Montant réglé par le client
                </label>
                <input
                  type="number"
                  step="any"
                  max={settlingCustomer.debtBalance}
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full text-base font-bold font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettleDebtOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg"
                >
                  Confirmer l'encaissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER PURCHASES HISTORY DRAWER */}
      {customerHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Historique : {customerHistory.name}</h3>
                <p className="text-xs text-slate-500">
                  {customerHistory.ordersCount} commandes · {formatMoney(customerHistory.totalSpent)} dépensés · {customerHistory.loyaltyPoints} points
                </p>
              </div>
              <button
                onClick={() => setCustomerHistory(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {customerSales.map((sale) => (
                <div
                  key={sale.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="font-mono text-slate-900">{sale.id}</strong>
                      <span className="text-[10px] text-slate-400">
                        {new Date(sale.date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {sale.items.map((it) => `${it.productName} (x${it.quantity})`).join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900 tabular-nums">
                        {formatMoney(sale.total)}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase">{sale.paymentMethod}</span>
                    </div>
                    <button
                      onClick={() => setSelectedReceipt(sale)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
                      title="Voir ticket"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {customerSales.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-6">
                  Aucun historique de vente rattaché à ce client.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedReceipt && (
        <ReceiptModal
          sale={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};
