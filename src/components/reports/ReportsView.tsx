import React, { useState, useMemo } from 'react';
import { useBoutique } from '../../context/BoutiqueContext';
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  CreditCard,
  Banknote,
  Archive,
  ArrowRight,
  Download,
  Calendar,
  Wallet
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    sales,
    products,
    expenses,
    cashSession,
    openCashSession,
    closeCashSession,
    formatMoney,
    showToast
  } = useBoutique();

  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [isCashSessionModalOpen, setIsCashSessionModalOpen] = useState(false);
  const [actualCashAmount, setActualCashAmount] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  // Filtered by timeframe
  const currentSales = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return sales.filter((s) => {
      if (s.status !== 'complete') return false;
      const t = new Date(s.date).getTime();
      if (timeframe === 'today') return t >= todayStart;
      if (timeframe === 'week') return t >= weekStart;
      if (timeframe === 'month') return t >= monthStart;
      return true;
    });
  }, [sales, timeframe]);

  const currentExpenses = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return expenses.filter((e) => {
      const t = new Date(e.date).getTime();
      if (timeframe === 'today') return t >= todayStart;
      if (timeframe === 'week') return t >= weekStart;
      if (timeframe === 'month') return t >= monthStart;
      return true;
    });
  }, [expenses, timeframe]);

  // Financial summary
  const financial = useMemo(() => {
    let totalRevenue = 0;
    let totalCostOfGoods = 0;
    let totalDiscount = 0;
    let itemsCount = 0;

    currentSales.forEach((s) => {
      totalRevenue += s.total;
      totalDiscount += s.discountTotal;
      s.items.forEach((it) => {
        totalCostOfGoods += it.purchasePrice * it.quantity;
        itemsCount += it.quantity;
      });
    });

    const grossMargin = totalRevenue - totalCostOfGoods;
    const totalExpensesAmount = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossMargin - totalExpensesAmount;
    const netMarginRate = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const avgBasket = currentSales.length > 0 ? totalRevenue / currentSales.length : 0;

    return {
      totalRevenue,
      totalCostOfGoods,
      grossMargin,
      totalExpensesAmount,
      netProfit,
      netMarginRate,
      avgBasket,
      salesCount: currentSales.length,
      itemsCount
    };
  }, [currentSales, currentExpenses]);

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {
      carte: 0,
      especes: 0,
      mobile_money: 0,
      credit: 0,
      virement: 0
    };

    currentSales.forEach((s) => {
      map[s.paymentMethod] = (map[s.paymentMethod] || 0) + s.total;
    });

    return map;
  }, [currentSales]);

  // Top Selling Products
  const topProducts = useMemo(() => {
    const productStats: Record<string, { name: string; sku: string; qty: number; revenue: number }> = {};

    currentSales.forEach((s) => {
      s.items.forEach((it) => {
        if (!productStats[it.productId]) {
          productStats[it.productId] = {
            name: it.productName,
            sku: it.sku,
            qty: 0,
            revenue: 0
          };
        }
        productStats[it.productId].qty += it.quantity;
        productStats[it.productId].revenue += it.total;
      });
    });

    return Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [currentSales]);

  // Category distribution
  const categoryRevenue = useMemo(() => {
    const catMap: Record<string, number> = {};

    currentSales.forEach((s) => {
      s.items.forEach((it) => {
        const prod = products.find((p) => p.id === it.productId);
        const cat = prod?.category || 'Divers';
        catMap[cat] = (catMap[cat] || 0) + it.total;
      });
    });

    return Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  }, [currentSales, products]);

  // Daily Trend (Last 7 days)
  const dailyTrend = useMemo(() => {
    const days: { label: string; dateStr: string; total: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });

      const dayTotal = sales
        .filter((s) => s.status === 'complete' && s.date.startsWith(dateStr))
        .reduce((sum, s) => sum + s.total, 0);

      days.push({ label: dayLabel, dateStr, total: dayTotal });
    }

    const maxVal = Math.max(...days.map((d) => d.total), 100);

    return { days, maxVal };
  }, [sales]);

  // Current session calculation
  const sessionCashExpected = useMemo(() => {
    if (!cashSession) return 0;
    const sessionStart = new Date(cashSession.openedAt).getTime();

    const cashSales = sales
      .filter((s) => s.status === 'complete' && s.paymentMethod === 'especes' && new Date(s.date).getTime() >= sessionStart)
      .reduce((sum, s) => sum + s.total, 0);

    const cashExp = expenses
      .filter((e) => e.paymentMethod === 'especes' && new Date(e.date).getTime() >= sessionStart)
      .reduce((sum, e) => sum + e.amount, 0);

    return cashSession.openingAmount + cashSales - cashExp;
  }, [cashSession, sales, expenses]);

  const handleCloseSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const actual = parseFloat(actualCashAmount) || 0;
    closeCashSession(actual, sessionNotes);
    setIsCashSessionModalOpen(false);
    setActualCashAmount('');
    setSessionNotes('');
  };

  const handleExportFullReport = () => {
    const reportText = `
BILAN FINANCIER & COMPTABILITÉ - ${new Date().toLocaleDateString('fr-FR')}
Période : ${timeframe.toUpperCase()}
--------------------------------------------------
Chiffre d'Affaires Net : ${formatMoney(financial.totalRevenue)}
Coût d'Achat Marchandises : ${formatMoney(financial.totalCostOfGoods)}
Marge Brute Commerciale : ${formatMoney(financial.grossMargin)}
Charges & Dépenses Magasin : ${formatMoney(financial.totalExpensesAmount)}
BÉNÉFICE NET BOUTIQUE : ${formatMoney(financial.netProfit)}
Taux de marge nette : ${financial.netMarginRate.toFixed(1)}%
Nombre de Ventes : ${financial.salesCount}
Articles Vendus : ${financial.itemsCount}
Panier Moyen : ${formatMoney(financial.avgBasket)}
--------------------------------------------------
RÉPARTITION PAR MODE DE RÈGLEMENT :
- Carte Bancaire : ${formatMoney(paymentBreakdown.carte || 0)}
- Espèces : ${formatMoney(paymentBreakdown.especes || 0)}
- Mobile Money : ${formatMoney(paymentBreakdown.mobile_money || 0)}
- Crédits Accordés : ${formatMoney(paymentBreakdown.credit || 0)}
--------------------------------------------------
    `.trim();

    const element = document.createElement('a');
    const file = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `rapport_financier_${timeframe}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    element.remove();
    showToast('Rapport financier exporté', 'success');
  };

  return (
    <div className="bp-view max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Timeframe Selector & Export */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-700">Période du bilan :</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['today', 'week', 'month', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  timeframe === period ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {period === 'today'
                  ? "Aujourd'hui"
                  : period === 'week'
                  ? '7 jours'
                  : period === 'month'
                  ? 'Ce mois'
                  : 'Année / Tout'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleExportFullReport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exporter le Bilan</span>
        </button>
      </div>

      {/* 5-Metric Financial Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">Chiffre d'Affaires</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
            {formatMoney(financial.totalRevenue)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {financial.salesCount} encaissement{financial.salesCount > 1 ? 's' : ''}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">Achats Marchandises</span>
          <div className="text-2xl font-bold text-slate-600 mt-1 tabular-nums font-mono">
            {formatMoney(financial.totalCostOfGoods)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Coût d'achat (COGS)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">Marge Brute</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums font-mono">
            {formatMoney(financial.grossMargin)}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
            CA - Prix d'achat
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">Charges & Dépenses</span>
          <div className="text-2xl font-bold text-rose-600 mt-1 tabular-nums font-mono">
            -{formatMoney(financial.totalExpensesAmount)}
          </div>
          <span className="text-[11px] text-rose-500 mt-1 block">
            Loyer, charges, etc.
          </span>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 col-span-2 md:col-span-1 shadow-sm">
          <span className="text-xs font-medium text-slate-300">Bénéfice Net Réel</span>
          <div className={`text-2xl font-bold mt-1 tabular-nums font-mono ${
            financial.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {formatMoney(financial.netProfit)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Marge nette : {financial.netMarginRate.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Cash Register Box & Session Monitoring */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900">Session de Caisse Active</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                cashSession.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {cashSession.status === 'open' ? 'Caisse Ouverte' : 'Clôturée'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ouverture avec {formatMoney(cashSession.openingAmount)} · Solde théorique espèces en tiroir :{' '}
              <strong className="text-slate-900 font-mono">{formatMoney(sessionCashExpected)}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cashSession.status === 'open' ? (
            <button
              onClick={() => {
                setActualCashAmount(sessionCashExpected.toString());
                setIsCashSessionModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
            >
              Clôturer la caisse du jour
            </button>
          ) : (
            <button
              onClick={() => {
                const amount = prompt('Montant du fond de caisse initial :', '150');
                if (amount) openCashSession(parseFloat(amount) || 150);
              }}
              className="px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors whitespace-nowrap"
            >
              Ouvrir une nouvelle session
            </button>
          )}
        </div>
      </div>

      {/* Grid: 7-Day Chart + Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Clean SVG Bar Chart: Ventes des 7 derniers jours */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Évolution Quotidienne du CA (7 Derniers Jours)</h3>
              <p className="text-xs text-slate-500">Chiffre d'affaires journalier encaissé</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700">
              Moyenne : {formatMoney(dailyTrend.days.reduce((s, d) => s + d.total, 0) / 7)} / jour
            </span>
          </div>

          {/* SVG Histogram */}
          <div className="pt-4">
            <div className="h-44 flex items-end justify-between gap-3 px-2 border-b border-slate-200 pb-2">
              {dailyTrend.days.map((day, idx) => {
                const heightPercent = Math.max(8, (day.total / dailyTrend.maxVal) * 100);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-mono font-medium text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {formatMoney(day.total)}
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[48px] rounded-t-md transition-all ${
                        day.total > 0
                          ? 'bg-slate-900 group-hover:bg-emerald-600'
                          : 'bg-slate-100'
                      }`}
                    />
                    <span className="text-[11px] font-medium text-slate-600 capitalize">
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Modes d'Encaissement</h3>
            <p className="text-xs text-slate-500">Répartition des encaissements sur la période</p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { key: 'carte', label: 'Carte Bancaire', color: 'bg-sky-500', icon: CreditCard },
              { key: 'especes', label: 'Espèces', color: 'bg-emerald-500', icon: Banknote },
              { key: 'mobile_money', label: 'Mobile Pay', color: 'bg-violet-500', icon: DollarSign },
              { key: 'credit', label: 'Crédit accordé', color: 'bg-amber-500', icon: Archive }
            ].map((m) => {
              const amount = paymentBreakdown[m.key] || 0;
              const percent = financial.totalRevenue > 0 ? ((amount / financial.totalRevenue) * 100).toFixed(1) : '0';

              return (
                <div key={m.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{m.label}</span>
                    <span className="font-mono font-semibold tabular-nums text-slate-900">
                      {formatMoney(amount)} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${m.color}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid: Top 5 Articles + Category Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 5 Best Sellers */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
          <h3 className="font-bold text-sm text-slate-900">Articles les Plus Vendus</h3>
          <div className="divide-y divide-slate-100">
            {topProducts.map((prod, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs first:pt-1">
                <div>
                  <div className="font-semibold text-slate-900">{prod.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {prod.qty} vendus · Réf: {prod.sku}
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-slate-900 tabular-nums">
                  {formatMoney(prod.revenue)}
                </div>
              </div>
            ))}

            {topProducts.length === 0 && (
              <p className="text-xs text-slate-400 py-4 text-center">Aucune vente enregistrée sur cette période.</p>
            )}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
          <h3 className="font-bold text-sm text-slate-900">Chiffre d'Affaires par Rayon</h3>
          <div className="divide-y divide-slate-100">
            {categoryRevenue.map(([cat, val], idx) => {
              const perc = financial.totalRevenue > 0 ? ((val / financial.totalRevenue) * 100).toFixed(1) : '0';

              return (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs first:pt-1">
                  <div>
                    <span className="font-semibold text-slate-900">{cat}</span>
                    <span className="text-[11px] text-slate-400 ml-2">({perc}%)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {formatMoney(val)}
                  </span>
                </div>
              );
            })}

            {categoryRevenue.length === 0 && (
              <p className="text-xs text-slate-400 py-4 text-center">Aucune donnée par rayon.</p>
            )}
          </div>
        </div>
      </div>

      {/* CLOSE CASH SESSION MODAL */}
      {isCashSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Clôture de Caisse Journalière</h3>
              <p className="text-xs text-slate-500">Comptage physique des espèces dans le tiroir</p>
            </div>

            <form onSubmit={handleCloseSessionSubmit} className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Solde théorique attendu :</span>
                  <strong className="text-slate-900 font-mono">{formatMoney(sessionCashExpected)}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Montant physique compté dans la caisse
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={actualCashAmount}
                  onChange={(e) => setActualCashAmount(e.target.value)}
                  className="w-full text-lg font-bold font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {actualCashAmount && (
                <div className="p-2.5 rounded-lg text-xs flex justify-between items-center bg-slate-100">
                  <span className="text-slate-600">Écart constaté :</span>
                  <span className={`font-bold font-mono ${
                    parseFloat(actualCashAmount) - sessionCashExpected === 0
                      ? 'text-emerald-700'
                      : 'text-rose-600'
                  }`}>
                    {formatMoney(parseFloat(actualCashAmount) - sessionCashExpected)}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Commentaire / Justification d'écart (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Prélèvement bancaire, pourboire..."
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCashSessionModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Confirmer la clôture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
