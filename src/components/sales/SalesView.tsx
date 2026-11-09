import React, { useState, useMemo } from 'react';
import { useBoutique } from '../../context/BoutiqueContext';
import { Sale, PaymentMethod } from '../../types/boutique';
import {
  Search,
  Printer,
  RotateCcw,
  Receipt,
  Download,
  CheckCircle2,
  XCircle,
  Eye,
  X
} from 'lucide-react';
import { ReceiptModal } from '../pos/ReceiptModal';

export const SalesView: React.FC = () => {
  const { sales, refundSale, formatMoney, showToast } = useBoutique();

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [inspectSale, setInspectSale] = useState<Sale | null>(null);

  // Filter sales
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return sales.filter((sale) => {
      const saleTime = new Date(sale.date).getTime();

      let matchDate = true;
      if (dateFilter === 'today') matchDate = saleTime >= todayStart;
      else if (dateFilter === 'week') matchDate = saleTime >= weekStart;
      else if (dateFilter === 'month') matchDate = saleTime >= monthStart;

      let matchMethod = methodFilter === 'all' || sale.paymentMethod === methodFilter;

      const term = searchTerm.toLowerCase().trim();
      let matchSearch =
        !term ||
        sale.id.toLowerCase().includes(term) ||
        sale.customerName.toLowerCase().includes(term) ||
        sale.cashierName.toLowerCase().includes(term) ||
        sale.items.some((it) => it.productName.toLowerCase().includes(term));

      return matchDate && matchMethod && matchSearch;
    });
  }, [sales, dateFilter, methodFilter, searchTerm]);

  // Aggregate statistics
  const metrics = useMemo(() => {
    const completed = filteredSales.filter((s) => s.status === 'complete');
    const totalAmount = completed.reduce((sum, s) => sum + s.total, 0);
    const averageCart = completed.length > 0 ? totalAmount / completed.length : 0;
    const totalItemsCount = completed.reduce(
      (sum, s) => sum + s.items.reduce((acc, it) => acc + it.quantity, 0),
      0
    );
    const refundedCount = filteredSales.filter((s) => s.status === 'refunded').length;

    return {
      salesCount: completed.length,
      totalAmount,
      averageCart,
      totalItemsCount,
      refundedCount
    };
  }, [filteredSales]);

  const handleRefund = (sale: Sale) => {
    if (sale.status === 'refunded') {
      showToast('Cette vente est déjà remboursée', 'warning');
      return;
    }

    if (
      window.confirm(
        `Confirmez-vous le remboursement de la vente ${sale.id} (${formatMoney(sale.total)}) ? Les articles seront automatiquement réintégrés en stock.`
      )
    ) {
      refundSale(sale.id);
      if (inspectSale?.id === sale.id) {
        setInspectSale((prev) => (prev ? { ...prev, status: 'refunded' } : null));
      }
    }
  };

  const handleExportSalesCSV = () => {
    const headers = ['Numero_Ticket', 'Date', 'Client', 'Caissier', 'Mode_Paiement', 'Total_TTC', 'Articles', 'Statut'];
    const rows = filteredSales.map((s) => {
      const itemsStr = s.items.map((it) => `${it.productName} (x${it.quantity})`).join(' ; ');
      return [
        `"${s.id}"`,
        `"${new Date(s.date).toLocaleString('fr-FR')}"`,
        `"${s.customerName.replace(/"/g, '""')}"`,
        `"${s.cashierName}"`,
        `"${s.paymentMethod}"`,
        s.total,
        `"${itemsStr.replace(/"/g, '""')}"`,
        `"${s.status}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `journal_ventes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Journal des ventes exporté au format CSV', 'success');
  };

  const paymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'especes':
        return 'Espèces';
      case 'carte':
        return 'Carte CB';
      case 'mobile_money':
        return 'Mobile Pay';
      case 'credit':
        return 'Crédit client';
      case 'virement':
        return 'Virement';
      default:
        return method;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">Chiffre d'Affaires</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {formatMoney(metrics.totalAmount)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {metrics.salesCount} ventes encaissées
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">Panier Moyen</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {formatMoney(metrics.averageCart)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Moyenne par client
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">Volume d'Articles</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {metrics.totalItemsCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Articles vendus
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">Remboursements</span>
          <div className="text-2xl font-bold text-slate-600 mt-1 tabular-nums">
            {metrics.refundedCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Retours / annulations
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher ticket N°, client, caissier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          {/* Date tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                dateFilter === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                dateFilter === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 jours
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                dateFilter === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ce mois
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                dateFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tout
            </button>
          </div>

          {/* Payment Method filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">Tous règlements</option>
            <option value="especes">Espèces</option>
            <option value="carte">Carte CB</option>
            <option value="mobile_money">Mobile Pay</option>
            <option value="credit">Crédit client</option>
          </select>
        </div>

        <button
          onClick={handleExportSalesCSV}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exporter Journal</span>
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Date & Heure</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Articles</th>
                <th className="py-3 px-4">Règlement</th>
                <th className="py-3 px-4 text-right">Montant TTC</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((sale) => {
                const totalItems = sale.items.reduce((sum, it) => sum + it.quantity, 0);
                const isRefunded = sale.status === 'refunded';

                return (
                  <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900">{sale.id}</span>
                      <div className="text-[10px] text-slate-400">Par {sale.cashierName}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {new Date(sale.date).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-900">
                      {sale.customerName}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <span className="font-semibold text-slate-900">{totalItems} article{totalItems > 1 ? 's' : ''}</span>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">
                        {sale.items.map((it) => it.productName).join(', ')}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {paymentMethodLabel(sale.paymentMethod)}
                      </span>
                    </td>

                    <td className={`py-3 px-4 text-right font-mono font-bold text-sm tabular-nums ${
                      isRefunded ? 'line-through text-slate-400' : 'text-slate-900'
                    }`}>
                      {formatMoney(sale.total)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {isRefunded ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded">
                          <XCircle className="w-3 h-3" />
                          <span>Remboursé</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Payé</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setInspectSale(sale)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Détails du ticket"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedSaleForReceipt(sale)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Imprimer le ticket"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {!isRefunded && (
                          <button
                            onClick={() => handleRefund(sale)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Rembourser / Retour article"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 stroke-1 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-700">Aucune vente enregistrée sur cette période</p>
                    <p className="text-xs text-slate-400 mt-1">Les encaissements apparaîtront ici en temps réel.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TICKET INSPECTION MODAL */}
      {inspectSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Détails de la Vente {inspectSale.id}</h3>
                <p className="text-xs text-slate-500">
                  {new Date(inspectSale.date).toLocaleString('fr-FR')} · Par {inspectSale.cashierName}
                </p>
              </div>
              <button
                onClick={() => setInspectSale(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-500 block">Client</span>
                  <strong className="text-slate-900">{inspectSale.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Moyen de paiement</span>
                  <strong className="text-slate-900 uppercase">{paymentMethodLabel(inspectSale.paymentMethod)}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Statut</span>
                  <strong className={inspectSale.status === 'refunded' ? 'text-rose-600' : 'text-emerald-600'}>
                    {inspectSale.status === 'refunded' ? 'Remboursé' : 'Complété'}
                  </strong>
                </div>
              </div>

              {/* Items detail list */}
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                <div className="bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase flex justify-between">
                  <span>Article & Réf</span>
                  <span>Total</span>
                </div>
                {inspectSale.items.map((item, idx) => (
                  <div key={idx} className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{item.productName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {item.quantity} x {formatMoney(item.unitPrice)}
                        {item.discountPercentage > 0 && ` (-${item.discountPercentage}%)`}
                        {' · '}SKU: {item.sku}
                      </div>
                    </div>
                    <div className="font-bold font-mono text-slate-900 tabular-nums">
                      {formatMoney(item.total)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Recap */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Sous-total HT</span>
                  <span className="font-mono tabular-nums">{formatMoney(inspectSale.subtotal)}</span>
                </div>
                {inspectSale.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Remises déduites</span>
                    <span className="font-mono tabular-nums">-{formatMoney(inspectSale.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-200">
                  <span>Total TTC</span>
                  <span className="font-mono tabular-nums">{formatMoney(inspectSale.total)}</span>
                </div>
              </div>

              {inspectSale.notes && (
                <div className="text-xs text-slate-600 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                  <strong>Note :</strong> {inspectSale.notes}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              {inspectSale.status !== 'refunded' ? (
                <button
                  onClick={() => handleRefund(inspectSale)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Rembourser la vente</span>
                </button>
              ) : (
                <div className="text-xs text-rose-600 italic">Vente remboursée</div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedSaleForReceipt(inspectSale);
                    setInspectSale(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer Ticket</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPRINT RECEIPT MODAL */}
      {selectedSaleForReceipt && (
        <ReceiptModal
          sale={selectedSaleForReceipt}
          onClose={() => setSelectedSaleForReceipt(null)}
        />
      )}
    </div>
  );
};
