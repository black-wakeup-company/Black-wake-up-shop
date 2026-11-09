import React, { useState, useMemo } from 'react';
import { useBoutique } from '../../context/BoutiqueContext';
import { Expense, ExpenseCategory, PaymentMethod } from '../../types/boutique';
import {
  Plus,
  Trash2,
  DollarSign,
  Calendar,
  Tag,
  Receipt,
  X,
  CreditCard
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { expenses, addExpense, deleteExpense, formatMoney, showToast } = useBoutique();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('fournitures');
  const [formAmount, setFormAmount] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>('carte');
  const [formNotes, setFormNotes] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      return categoryFilter === 'all' || e.category === categoryFilter;
    });
  }, [expenses, categoryFilter]);

  const stats = useMemo(() => {
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Group by category
    const catMap: Record<string, number> = {};
    expenses.forEach((e) => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });

    let topCat = 'Aucune';
    let topCatAmount = 0;
    Object.entries(catMap).forEach(([cat, val]) => {
      if (val > topCatAmount) {
        topCatAmount = val;
        topCat = cat;
      }
    });

    return {
      totalAmount,
      count: expenses.length,
      topCat,
      topCatAmount
    };
  }, [expenses]);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(formAmount) || 0;
    if (!formTitle.trim() || amountVal <= 0) {
      showToast('Veuillez renseigner un intitulé et un montant valide', 'warning');
      return;
    }

    addExpense({
      date: new Date(formDate).toISOString(),
      title: formTitle.trim(),
      category: formCategory,
      amount: amountVal,
      paymentMethod: formPaymentMethod,
      notes: formNotes.trim() || undefined
    });

    setIsAddModalOpen(false);
    setFormTitle('');
    setFormAmount('');
    setFormNotes('');
  };

  const categoryLabel = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'loyer':
        return 'Loyer commercial';
      case 'electricite':
        return 'Énergie & Eau';
      case 'salaires':
        return 'Salaires & Primes';
      case 'fournitures':
        return 'Emballages & Fournitures';
      case 'transport':
        return 'Livraison & Transport';
      case 'autre':
        return 'Autres charges';
      default:
        return cat;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 3-KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">Total Dépenses Enregistrées</span>
          <div className="text-2xl font-bold text-rose-600 mt-1 tabular-nums">
            {formatMoney(stats.totalAmount)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">{stats.count} lignes de frais</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">Poste Principal de Charge</span>
          <div className="text-xl font-bold text-slate-900 mt-1 capitalize truncate">
            {categoryLabel(stats.topCat as ExpenseCategory)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {formatMoney(stats.topCatAmount)} engagés
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">Impact Résultat Net</span>
          <div className="text-xl font-bold text-slate-700 mt-1">
            Déductible du bénéfice
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Intégré au bilan automatique
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-medium text-slate-600">Catégorie :</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">Toutes les charges</option>
            <option value="loyer">Loyer commercial</option>
            <option value="fournitures">Emballages & Fournitures</option>
            <option value="electricite">Énergie & Eau</option>
            <option value="salaires">Salaires & Primes</option>
            <option value="transport">Livraison & Transport</option>
            <option value="autre">Autres charges</option>
          </select>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajouter une Dépense</span>
        </button>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Désignation / Motif</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Règlement</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
            {filteredExpenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-mono">
                  {new Date(exp.date).toLocaleDateString('fr-FR')}
                </td>

                <td className="py-3 px-4 font-semibold text-slate-900">
                  {exp.title}
                  {exp.notes && (
                    <div className="text-[11px] font-normal text-slate-400 mt-0.5">{exp.notes}</div>
                  )}
                </td>

                <td className="py-3 px-4">
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                    {categoryLabel(exp.category)}
                  </span>
                </td>

                <td className="py-3 px-4 uppercase text-slate-500 text-[11px]">
                  {exp.paymentMethod}
                </td>

                <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 tabular-nums">
                  -{formatMoney(exp.amount)}
                </td>

                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => {
                      if (window.confirm(`Supprimer cette dépense "${exp.title}" ?`)) {
                        deleteExpense(exp.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <Receipt className="w-8 h-8 stroke-1 mx-auto mb-2 text-slate-300" />
                  <p className="font-medium text-slate-700">Aucune dépense enregistrée</p>
                  <p className="text-xs text-slate-400 mt-1">Enregistrez vos frais boutique pour un calcul précis du bénéfice net.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Enregistrer une Charge / Dépense</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Désignation *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Facture électricité magasin"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Montant *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="fournitures">Emballages & Fournitures</option>
                    <option value="loyer">Loyer commercial</option>
                    <option value="electricite">Énergie & Eau</option>
                    <option value="salaires">Salaires & Primes</option>
                    <option value="transport">Livraison & Transport</option>
                    <option value="autre">Autres charges</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mode de règlement</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="carte">Carte Bancaire</option>
                    <option value="especes">Espèces (Caisse)</option>
                    <option value="virement">Virement bancaire</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Détails ou Référence</label>
                <input
                  type="text"
                  placeholder="N° de facture fournisseur, prestataire, etc."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
