import React, { useState, useMemo } from 'react';
import { useBoutique } from '../../context/BoutiqueContext';
import { Product } from '../../types/boutique';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  Download,
  PackagePlus,
  Package,
  X,
  Check
} from 'lucide-react';
import { ImageUploader } from '../common/ImageUploader';

export const InventoryView: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    formatMoney,
    exchangeRateUSD,
    convertFCToUSD,
    convertUSDToFC,
    showToast
  } = useBoutique();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out' | 'ok'>('all');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(5);
  const [adjustType, setAdjustType] = useState<'add' | 'sub'>('add');
  const [adjustReason, setAdjustReason] = useState('Arrivage fournisseur');

  // Form state for Add/Edit
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Vêtements');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCurrency, setFormCurrency] = useState<'FC' | 'USD'>('FC');
  const [formPurchasePrice, setFormPurchasePrice] = useState('25000');
  const [formSalePrice, setFormSalePrice] = useState('50000');
  const [formStock, setFormStock] = useState('10');
  const [formMinStock, setFormMinStock] = useState('5');
  const [formUnit, setFormUnit] = useState('pièce');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('');

  // Extract categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ['all', ...cats];
  }, [products]);

  // Statistics calculation
  const stats = useMemo(() => {
    let totalItems = 0;
    let totalPurchaseVal = 0;
    let totalSaleVal = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      totalItems += p.stockQuantity;
      totalPurchaseVal += p.purchasePrice * p.stockQuantity;
      totalSaleVal += p.salePrice * p.stockQuantity;
      if (p.stockQuantity === 0) {
        outOfStockCount++;
      } else if (p.stockQuantity <= p.minStockThreshold) {
        lowStockCount++;
      }
    });

    return {
      referencesCount: products.length,
      totalItems,
      totalPurchaseVal,
      totalSaleVal,
      potentialProfit: totalSaleVal - totalPurchaseVal,
      lowStockCount,
      outOfStockCount
    };
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.barcode.includes(term);

      let matchStock = true;
      if (stockStatusFilter === 'out') matchStock = p.stockQuantity === 0;
      if (stockStatusFilter === 'low') matchStock = p.stockQuantity > 0 && p.stockQuantity <= p.minStockThreshold;
      if (stockStatusFilter === 'ok') matchStock = p.stockQuantity > p.minStockThreshold;

      return matchCat && matchSearch && matchStock;
    });
  }, [products, categoryFilter, searchTerm, stockStatusFilter]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('Vêtements');
    const autoSku = 'ART-' + (products.length + 1).toString().padStart(3, '0');
    setFormSku(autoSku);
    setFormBarcode('376000' + Math.floor(1000 + Math.random() * 9000));
    setFormCurrency('FC');
    setFormPurchasePrice('25000');
    setFormSalePrice('50000');
    setFormStock('10');
    setFormMinStock('4');
    setFormUnit('pièce');
    setFormDescription('');
    setFormImage('');
    setIsEditModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormSku(p.sku);
    setFormBarcode(p.barcode);
    const preferUSD = p.currencyInput === 'USD';
    setFormCurrency(preferUSD ? 'USD' : 'FC');
    if (preferUSD) {
      setFormPurchasePrice((p.purchasePrice / exchangeRateUSD).toFixed(2));
      setFormSalePrice((p.salePrice / exchangeRateUSD).toFixed(2));
    } else {
      setFormPurchasePrice(Math.round(p.purchasePrice).toString());
      setFormSalePrice(Math.round(p.salePrice).toString());
    }
    setFormStock(p.stockQuantity.toString());
    setFormMinStock(p.minStockThreshold.toString());
    setFormUnit(p.unit);
    setFormDescription(p.description || '');
    setFormImage(p.image || '');
    setIsEditModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Veuillez renseigner le nom du produit', 'warning');
      return;
    }

    const rawPurchase = parseFloat(formPurchasePrice) || 0;
    const rawSale = parseFloat(formSalePrice) || 0;

    // Convert to FC base storage if input was in USD
    const finalPurchasePrice = formCurrency === 'USD' ? Math.round(rawPurchase * exchangeRateUSD) : Math.round(rawPurchase);
    const finalSalePrice = formCurrency === 'USD' ? Math.round(rawSale * exchangeRateUSD) : Math.round(rawSale);

    const payload = {
      name: formName.trim(),
      category: formCategory.trim() || 'Divers',
      sku: formSku.trim() || 'SKU-' + Date.now(),
      barcode: formBarcode.trim() || '3760000000',
      purchasePrice: finalPurchasePrice,
      salePrice: finalSalePrice,
      currencyInput: formCurrency,
      stockQuantity: parseInt(formStock, 10) || 0,
      minStockThreshold: parseInt(formMinStock, 10) || 0,
      unit: formUnit.trim() || 'pièce',
      description: formDescription.trim(),
      image: formImage.trim() || undefined
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
    } else {
      addProduct(payload);
    }

    setIsEditModalOpen(false);
  };

  const openAdjustModal = (p: Product) => {
    setAdjustingProduct(p);
    setAdjustDelta(5);
    setAdjustType('add');
    setAdjustReason('Arrivage fournisseur');
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjust = () => {
    if (!adjustingProduct) return;
    const finalDelta = adjustType === 'add' ? adjustDelta : -adjustDelta;
    adjustStock(adjustingProduct.id, finalDelta, adjustReason);
    setIsAdjustModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Nom', 'Catégorie', 'SKU', 'Code_Barres', 'Prix_Achat', 'Prix_Vente', 'Marge_Perc', 'Stock', 'Seuil_Min'];
    const rows = products.map((p) => {
      const margin = p.salePrice > 0 ? (((p.salePrice - p.purchasePrice) / p.salePrice) * 100).toFixed(1) : '0';
      return [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        `"${p.sku}"`,
        `"${p.barcode}"`,
        p.purchasePrice,
        p.salePrice,
        margin + '%',
        p.stockQuantity,
        p.minStockThreshold
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `inventaire_boutique_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Inventaire exporté au format CSV', 'success');
  };

  return (
    <div className="bp-view max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 4-Metric KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">Références Catalogue</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {stats.referencesCount} <span className="text-xs font-normal text-slate-400">articles</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {stats.totalItems} unités en stock
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">Valeur Stock (Achat)</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {formatMoney(stats.totalPurchaseVal)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Coût d'acquisition
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">Valeur Stock (Vente)</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
            {formatMoney(stats.totalSaleVal)}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
            +{formatMoney(stats.potentialProfit)} marge pot.
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-medium text-slate-500">Alertes Réappro</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-600 tabular-nums">
              {stats.lowStockCount}
            </span>
            <span className="text-xs text-slate-400 font-normal">faibles</span>
            {stats.outOfStockCount > 0 && (
              <span className="text-sm font-bold text-rose-600 tabular-nums">
                / {stats.outOfStockCount} rupture
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            À réapprovisionner
          </span>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search & Category Filter */}
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, SKU ou code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'Toutes les catégories' : c}
                </option>
              ))}
            </select>

            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value as any)}
              className="w-full sm:w-auto text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="all">Tous les états de stock</option>
              <option value="low">Stock faible (alerte)</option>
              <option value="out">Rupture de stock (0)</option>
              <option value="ok">Stock suffisant</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouvel Article</span>
          </button>
        </div>
      </div>

      {/* High Density Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Article</th>
                <th className="py-3 px-4">Catégorie / Réf</th>
                <th className="py-3 px-4 text-right">Prix Achat</th>
                <th className="py-3 px-4 text-right">Prix Vente</th>
                <th className="py-3 px-4 text-right">Marge %</th>
                <th className="py-3 px-4 text-center">Stock Actuel</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const marginAmount = p.salePrice - p.purchasePrice;
                const marginPercent = p.salePrice > 0 ? (marginAmount / p.salePrice) * 100 : 0;
                const isOut = p.stockQuantity === 0;
                const isLow = p.stockQuantity > 0 && p.stockQuantity <= p.minStockThreshold;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Article Name & thumbnail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 hover:underline cursor-pointer" onClick={() => openEditModal(p)}>
                            {p.name}
                          </div>
                          {p.description && (
                            <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                              {p.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category & SKU */}
                    <td className="py-3 px-4">
                      <div className="text-slate-700 font-medium">{p.category}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {p.sku} · {p.barcode}
                      </div>
                    </td>

                    {/* Prix d'Achat */}
                    <td className="py-3 px-4 text-right tabular-nums font-mono">
                      <div className="text-slate-600 font-medium">{formatMoney(p.purchasePrice)}</div>
                      <div className="text-[10px] text-slate-400">~ {(p.purchasePrice / exchangeRateUSD).toFixed(2)} $</div>
                    </td>

                    {/* Prix de Vente */}
                    <td className="py-3 px-4 text-right tabular-nums font-mono">
                      <div className="font-bold text-slate-900">{formatMoney(p.salePrice)}</div>
                      <div className="text-[10px] text-emerald-700 font-semibold">~ {(p.salePrice / exchangeRateUSD).toFixed(2)} $</div>
                    </td>

                    {/* Marge */}
                    <td className="py-3 px-4 text-right tabular-nums">
                      <div className="font-semibold text-emerald-700 font-mono">
                        +{marginPercent.toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        +{formatMoney(marginAmount)}
                      </div>
                    </td>

                    {/* Stock & Seuil */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span
                          className={`font-mono font-bold text-sm tabular-nums ${
                            isOut
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {p.stockQuantity}
                        </span>
                        <span className="text-[11px] text-slate-400">/ min {p.minStockThreshold}</span>
                      </div>
                      {isOut ? (
                        <div className="text-[10px] text-rose-600 font-semibold flex items-center justify-center gap-0.5 mt-0.5">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Rupture</span>
                        </div>
                      ) : isLow ? (
                        <div className="text-[10px] text-amber-600 font-semibold flex items-center justify-center gap-0.5 mt-0.5">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Alerte stock</span>
                        </div>
                      ) : null}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openAdjustModal(p)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Ajuster le stock (Arrivage / Retrait)"
                        >
                          <PackagePlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Modifier la fiche"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Confirmez-vous la suppression de l'article "${p.name}" ?`)) {
                              deleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 stroke-1 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-700">Aucun produit trouvé</p>
                    <p className="text-xs text-slate-400 mt-1">Essayez un autre mot-clé ou ajoutez un nouvel article.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingProduct ? 'Modifier l’Article' : 'Ajouter un Nouvel Article'}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Désignation du produit *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Sac Cabas Toile et Cuir"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Catégorie</label>
                  <input
                    type="text"
                    placeholder="Ex: Vêtements, Maroquinerie..."
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unité</label>
                  <input
                    type="text"
                    placeholder="Ex: pièce, paire, mètre, kg"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Référence SKU</label>
                  <input
                    type="text"
                    placeholder="Ex: ART-001"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Code-barres / EAN</label>
                  <input
                    type="text"
                    placeholder="Ex: 3760001009"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                {/* Currency selector for adding article */}
                <div className="sm:col-span-2 flex items-center justify-between p-2.5 bg-slate-100 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Devise de saisie des prix</span>
                    <span className="text-[10px] text-slate-500">Taux du jour : 1 $ = {exchangeRateUSD.toLocaleString('fr-FR')} FC</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        if (formCurrency === 'USD') {
                          const curP = parseFloat(formPurchasePrice) || 0;
                          const curS = parseFloat(formSalePrice) || 0;
                          setFormPurchasePrice(Math.round(curP * exchangeRateUSD).toString());
                          setFormSalePrice(Math.round(curS * exchangeRateUSD).toString());
                          setFormCurrency('FC');
                        }
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        formCurrency === 'FC'
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Franc Congolais (FC)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (formCurrency === 'FC') {
                          const curP = parseFloat(formPurchasePrice) || 0;
                          const curS = parseFloat(formSalePrice) || 0;
                          setFormPurchasePrice((curP / exchangeRateUSD).toFixed(2));
                          setFormSalePrice((curS / exchangeRateUSD).toFixed(2));
                          setFormCurrency('USD');
                        }
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        formCurrency === 'USD'
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Dollar ($ USD)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prix d'Achat ({formCurrency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    {formCurrency === 'USD'
                      ? `= ${Math.round((parseFloat(formPurchasePrice) || 0) * exchangeRateUSD).toLocaleString('fr-FR')} FC`
                      : `~ ${((parseFloat(formPurchasePrice) || 0) / exchangeRateUSD).toFixed(2)} $`}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prix de Vente ({formCurrency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <span className="text-[10px] text-emerald-700 font-mono font-medium mt-0.5 block">
                    {formCurrency === 'USD'
                      ? `= ${Math.round((parseFloat(formSalePrice) || 0) * exchangeRateUSD).toLocaleString('fr-FR')} FC`
                      : `~ ${((parseFloat(formSalePrice) || 0) / exchangeRateUSD).toFixed(2)} $`}
                  </span>
                </div>

                {/* Live Margin calculation */}
                <div className="sm:col-span-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Marge calculée par article :</span>
                  <div className="text-right">
                    <strong className="text-emerald-700 font-mono">
                      +
                      {formCurrency === 'USD'
                        ? `${Math.max(0, (parseFloat(formSalePrice) || 0) - (parseFloat(formPurchasePrice) || 0)).toFixed(2)} $ (${Math.round(Math.max(0, (parseFloat(formSalePrice) || 0) - (parseFloat(formPurchasePrice) || 0)) * exchangeRateUSD).toLocaleString('fr-FR')} FC)`
                        : formatMoney(Math.max(0, (parseFloat(formSalePrice) || 0) - (parseFloat(formPurchasePrice) || 0)))}
                    </strong>
                    <span className="text-slate-500 ml-2 font-mono">
                      {`(${(((Math.max(0, (parseFloat(formSalePrice) || 0) - (parseFloat(formPurchasePrice) || 0)) / ((parseFloat(formSalePrice) || 1))) * 100)).toFixed(1)}%)`}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantité en stock</label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Seuil Alerte Stock Faible</label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <ImageUploader
                    currentImage={formImage}
                    onImageSelected={(dataUrl) => setFormImage(dataUrl)}
                    onImageRemoved={() => setFormImage('')}
                    label="Photo de l'article (choisir depuis votre appareil)"
                    shape="square"
                    maxDimension={640}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Caractéristiques</label>
                  <textarea
                    rows={2}
                    placeholder="Matière, coupe, conseils d'entretien..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  {editingProduct ? 'Enregistrer les modifications' : 'Créer l’article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK STOCK ADJUST MODAL */}
      {isAdjustModalOpen && adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Mouvement de Stock</h3>
                <p className="text-xs text-slate-500 truncate max-w-[240px]">{adjustingProduct.name}</p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    adjustType === 'add' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  + Entrée / Arrivage
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('sub')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    adjustType === 'sub' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  - Retrait / Perte
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Quantité d'unités</label>
                <input
                  type="number"
                  min="1"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full text-base font-bold font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Motif de l'ajustement</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="Arrivage fournisseur">Arrivage fournisseur / Réception</option>
                  <option value="Correction inventaire physique">Correction d'inventaire physique</option>
                  <option value="Retour client">Retour client en magasin</option>
                  <option value="Perte ou démarque inconnue">Perte / Vol / Démarque</option>
                  <option value="Article défectueux ou abîmé">Article défectueux / Avarie</option>
                  <option value="Cadeau client / Échantillon">Échantillon / Dotation</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Stock résultant :</span>
                <span className="font-bold text-slate-900 font-mono">
                  {adjustingProduct.stockQuantity} {'->'}{' '}
                  {Math.max(0, adjustingProduct.stockQuantity + (adjustType === 'add' ? adjustDelta : -adjustDelta))}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveAdjust}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Appliquer le mouvement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
