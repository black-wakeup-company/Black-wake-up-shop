import React, { useState, useMemo, useRef } from 'react';
import { useBoutique } from '../../context/BoutiqueContext';
import { Product, PaymentMethod } from '../../types/boutique';
import {
  Search,
  Barcode,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  Tag,
  ArrowRight,
  Package,
  X,
  UserPlus,
  Camera,
  Coins
} from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';

export const PosView: React.FC = () => {
  const {
    products,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    setCartItemDiscount,
    cartGlobalDiscount,
    setCartGlobalDiscount,
    customers,
    selectedCustomer,
    setSelectedCustomer,
    addCustomer,
    completeSale,
    lastCompletedSale,
    setLastCompletedSale,
    formatMoney,
    exchangeRateUSD,
    convertFCToUSD,
    convertUSDToFC,
    settings,
    showToast
  } = useBoutique();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('especes');
  const [paidCurrency, setPaidCurrency] = useState<'FC' | 'USD'>('FC');
  const [changeCurrency, setChangeCurrency] = useState<'FC' | 'USD'>('FC');
  const [cashAmountGiven, setCashAmountGiven] = useState<string>('');
  const [saleNote, setSaleNote] = useState('');
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ['all', ...cats];
  }, [products]);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.barcode.includes(term);
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Cart financial totals
  const { rawSubtotal, itemsDiscountTotal, finalSubtotal, taxTotal, totalNet } = useMemo(() => {
    let raw = 0;
    let itemDisc = 0;

    cart.forEach((item) => {
      const lineRaw = item.product.salePrice * item.quantity;
      const disc = (lineRaw * (item.discountPercentage || 0)) / 100;
      raw += lineRaw;
      itemDisc += disc;
    });

    const subAfterItemDisc = raw - itemDisc;
    const globalDisc = (subAfterItemDisc * cartGlobalDiscount) / 100;
    const finalSub = subAfterItemDisc - globalDisc;

    let tax = 0;
    if (settings.taxEnabled && settings.taxRate > 0) {
      tax = (finalSub * settings.taxRate) / (100 + settings.taxRate);
    }

    return {
      rawSubtotal: raw,
      itemsDiscountTotal: itemDisc + globalDisc,
      finalSubtotal: finalSub,
      taxTotal: tax,
      totalNet: finalSub
    };
  }, [cart, cartGlobalDiscount, settings]);

  // Quick barcode simulation
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    // Look for exact barcode or SKU match first
    const matched = products.find(
      (p) =>
        p.barcode.toLowerCase() === searchTerm.toLowerCase().trim() ||
        p.sku.toLowerCase() === searchTerm.toLowerCase().trim()
    );

    if (matched) {
      addToCart(matched, 1);
      setSearchTerm('');
      showToast(`Scanné : ${matched.name}`, 'success');
    } else if (filteredProducts.length === 1) {
      addToCart(filteredProducts[0], 1);
      setSearchTerm('');
      showToast(`Ajouté : ${filteredProducts[0].name}`, 'success');
    }
  };

  const totalNetUSD = useMemo(() => {
    return Math.round((totalNet / exchangeRateUSD) * 100) / 100;
  }, [totalNet, exchangeRateUSD]);

  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      showToast('Votre panier est vide', 'warning');
      return;
    }
    setPaidCurrency('FC');
    setChangeCurrency('FC');
    setCashAmountGiven(totalNet.toString());
    setIsMobileCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const cashChange = useMemo(() => {
    const amountVal = parseFloat(cashAmountGiven) || 0;
    if (paidCurrency === 'USD') {
      const diffUSD = Math.max(0, amountVal - totalNetUSD);
      if (changeCurrency === 'USD') {
        return Math.round(diffUSD * 100) / 100;
      } else {
        return Math.round(diffUSD * exchangeRateUSD);
      }
    } else {
      const diffFC = Math.max(0, amountVal - totalNet);
      if (changeCurrency === 'FC') {
        return Math.round(diffFC);
      } else {
        return Math.round((diffFC / exchangeRateUSD) * 100) / 100;
      }
    }
  }, [cashAmountGiven, totalNet, totalNetUSD, paidCurrency, changeCurrency, exchangeRateUSD]);

  const handleConfirmSale = () => {
    const amountVal = parseFloat(cashAmountGiven) || 0;
    const requiredToPay = paidCurrency === 'USD' ? totalNetUSD : totalNet;

    if (paymentMethod === 'especes' && amountVal < requiredToPay) {
      showToast(
        `Le montant donné (${amountVal} ${paidCurrency}) est inférieur au total (${requiredToPay} ${paidCurrency})`,
        'warning'
      );
      return;
    }

    if (paymentMethod === 'credit' && !selectedCustomer) {
      showToast('Veuillez sélectionner un client pour enregistrer une vente à crédit', 'warning');
      return;
    }

    const sale = completeSale({
      paymentMethod,
      paidInCurrency: paidCurrency,
      exchangeRateUsed: exchangeRateUSD,
      amountReceived: paymentMethod === 'credit' ? 0 : amountVal,
      changeGiven: cashChange,
      changeCurrency,
      notes: saleNote
    });

    if (sale) {
      setIsCheckoutOpen(false);
      setSaleNote('');
      setCashAmountGiven('');
    }
  };

  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    const created = addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      email: newCustEmail.trim()
    });
    setSelectedCustomer(created);
    setIsNewCustomerModalOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
  };

  return (
    <div className="bp-view max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 2-Column Split: Product Catalog (Left) + Cart & Checkout (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Catalog & Fast Search */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Search bar & Category filter */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <form onSubmit={handleBarcodeSubmit} className="flex-1 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Rechercher par nom, SKU ou code-barres (Appuyez sur Entrée)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-24 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const sampleBarcodes = products.map((p) => p.barcode);
                      const randomBarcode = sampleBarcodes[Math.floor(Math.random() * sampleBarcodes.length)];
                      setSearchTerm(randomBarcode);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Simuler un scan de code-barres aléatoire"
                  >
                    <Barcode className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Exemple</span>
                  </button>
                </div>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              {/* Direct Camera Barcode Scanner Button */}
              <button
                type="button"
                onClick={() => setIsCameraScannerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
                title="Scanner avec la caméra du téléphone ou du PC"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Scanner Caméra</span>
              </button>
            </div>

            {/* Category Segmented Controls */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {cat === 'all' ? 'Toutes les catégories' : cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredProducts.map((product) => {
              const inStock = product.stockQuantity > 0;
              const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= product.minStockThreshold;

              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product, 1)}
                  className={`group relative bg-white border rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-md flex flex-col justify-between ${
                    inStock
                      ? 'border-slate-200 hover:border-slate-400'
                      : 'border-slate-200 opacity-60 bg-slate-50'
                  }`}
                >
                  {/* Image container */}
                  <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <Package className="w-8 h-8 stroke-1 text-slate-400" />
                        <span className="text-[10px] mt-1 text-slate-400 uppercase tracking-wider">{product.category}</span>
                      </div>
                    )}

                    {/* Stock alert pill */}
                    <div className="absolute top-2 right-2">
                      {!inStock ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded-md shadow-sm">
                          Épuisé
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-md shadow-sm">
                          Reste {product.stockQuantity}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-900/70 backdrop-blur-xs text-white rounded-md">
                          {product.stockQuantity} en stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                        <span>{product.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{product.sku}</span>
                      </div>
                      <h4 className="font-semibold text-xs text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                        {product.name}
                      </h4>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-slate-900 tabular-nums block leading-tight">
                          {formatMoney(product.salePrice)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ~ {(product.salePrice / exchangeRateUSD).toFixed(2)} $
                        </span>
                      </div>
                      <span className="w-6 h-6 rounded-md bg-slate-100 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center transition-colors">
                        <Plus className="w-3.5 h-3.5 text-slate-700 group-hover:text-white" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">Aucun article ne correspond à votre recherche</p>
              <p className="text-xs text-slate-400 mt-1">Modifiez vos mots-clés ou réinitialisez la catégorie.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="mt-3 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Desktop Ticket en cours */}
        <div className="hidden lg:flex lg:col-span-5 xl:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm flex-col sticky top-20 max-h-[calc(100vh-6rem)]">
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-slate-900" />
                <h3 className="font-bold text-sm text-slate-900">Ticket en cours</h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Vider</span>
                </button>
              )}
            </div>

            {/* Customer Selector */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedCustomer ? selectedCustomer.id : ''}
                  onChange={(e) => {
                    const cust = customers.find((c) => c.id === e.target.value) || null;
                    setSelectedCustomer(cust);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">Client de passage (Comptoir)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.debtBalance > 0 ? `(Dette: ${formatMoney(c.debtBalance)})` : ''} - {c.loyaltyPoints} pts
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setIsNewCustomerModalOpen(true)}
                className="p-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Ajouter un nouveau client"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>

            {selectedCustomer && (
              <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-slate-600">Points fidélité : <strong className="text-slate-900">{selectedCustomer.loyaltyPoints}</strong></span>
                {selectedCustomer.debtBalance > 0 && (
                  <span className="text-amber-700 font-semibold">Crédit dû : {formatMoney(selectedCustomer.debtBalance)}</span>
                )}
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[160px] divide-y divide-slate-100">
            {cart.map((item) => {
              const itemTotal = item.product.salePrice * item.quantity * (1 - (item.discountPercentage || 0) / 100);

              return (
                <div key={item.product.id} className="pt-3 first:pt-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-slate-900 truncate">
                        {item.product.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="tabular-nums font-mono">{formatMoney(item.product.salePrice)}</span>
                        {item.discountPercentage > 0 && (
                          <span className="text-emerald-600 font-medium">-{item.discountPercentage}%</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 tabular-nums">
                        {formatMoney(itemTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Item controls: quantity and discount */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 rounded flex items-center justify-center hover:bg-white text-slate-700 transition-colors cursor-pointer"
                        aria-label="Diminuer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="w-7 h-7 rounded flex items-center justify-center hover:bg-white text-slate-700 transition-colors cursor-pointer"
                        aria-label="Augmenter"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <select
                        value={item.discountPercentage || 0}
                        onChange={(e) => setCartItemDiscount(item.product.id, Number(e.target.value))}
                        className="text-[11px] py-1 px-1.5 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none"
                      >
                        <option value="0">0%</option>
                        <option value="5">-5%</option>
                        <option value="10">-10%</option>
                        <option value="15">-15%</option>
                        <option value="20">-20%</option>
                        <option value="50">-50%</option>
                      </select>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Retirer l'article"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {cart.length === 0 && (
              <div className="py-8 text-center text-slate-400">
                <ShoppingBag className="w-8 h-8 stroke-1 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">Le ticket est vide.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Cliquez sur un article pour l'ajouter.</p>
              </div>
            )}
          </div>

          {/* Cart Totals & Checkout Button */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Sous-total brut</span>
              <span className="tabular-nums font-mono">{formatMoney(rawSubtotal)}</span>
            </div>

            {/* Global cart discount */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                <span>Remise globale panier</span>
              </span>
              <div className="flex items-center gap-1">
                <select
                  value={cartGlobalDiscount}
                  onChange={(e) => setCartGlobalDiscount(Number(e.target.value))}
                  className="text-xs py-0.5 px-1 bg-white border border-slate-200 rounded text-slate-700"
                >
                  <option value="0">Aucune</option>
                  <option value="5">-5%</option>
                  <option value="10">-10%</option>
                  <option value="15">-15%</option>
                  <option value="20">-20%</option>
                </select>
                {itemsDiscountTotal > 0 && (
                  <span className="text-emerald-700 font-semibold tabular-nums">
                    -{formatMoney(itemsDiscountTotal)}
                  </span>
                )}
              </div>
            </div>

            {settings.taxEnabled && (
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Dont TVA ({settings.taxRate}%)</span>
                <span className="tabular-nums font-mono">{formatMoney(taxTotal)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Net à Payer</span>
                <span className="text-2xl font-bold text-slate-900 tabular-nums">
                  {formatMoney(totalNet)}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {cart.reduce((sum, it) => sum + it.quantity, 0)} articles
              </span>
            </div>

            <button
              onClick={handleOpenCheckout}
              disabled={cart.length === 0}
              className="w-full mt-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Encaisser la vente</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY FLOATING BOTTOM BAR (Visible on mobile/tablet when cart has items) */}
      {cart.length > 0 && !isMobileCartOpen && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsMobileCartOpen(true)}
            className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
          >
            <div className="relative w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {cart.reduce((sum, it) => sum + it.quantity, 0)}
              </span>
            </div>
            <div className="truncate">
              <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider block leading-tight">
                Voir le ticket ({cart.reduce((sum, it) => sum + it.quantity, 0)} art.)
              </span>
              <span className="text-base font-bold text-slate-900 tabular-nums">
                {formatMoney(totalNet)}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleOpenCheckout}
            className="py-2.5 px-5 bg-slate-900 active:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>Encaisser</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      )}

      {/* MOBILE FULL DRAWER / BOTTOM SHEET FOR CART */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full bg-white rounded-t-2xl shadow-2xl border-t border-slate-200 max-h-[85vh] flex flex-col overflow-hidden">
            {/* Mobile Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-slate-900" />
                <h3 className="font-bold text-sm text-slate-900">Ticket en cours</h3>
                <span className="text-xs text-slate-500">
                  ({cart.reduce((sum, it) => sum + it.quantity, 0)} art.)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-rose-600 font-medium px-2 py-1 rounded hover:bg-rose-50"
                  >
                    Vider
                  </button>
                )}
                <button
                  onClick={() => setIsMobileCartOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile Customer Selector */}
            <div className="p-3 border-b border-slate-100 flex items-center gap-2">
              <div className="relative flex-1">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedCustomer ? selectedCustomer.id : ''}
                  onChange={(e) => {
                    const cust = customers.find((c) => c.id === e.target.value) || null;
                    setSelectedCustomer(cust);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="">Client de passage (Comptoir)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.debtBalance > 0 ? `(Dette: ${formatMoney(c.debtBalance)})` : ''} - {c.loyaltyPoints} pts
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setIsNewCustomerModalOpen(true)}
                className="p-1.5 text-slate-700 bg-slate-100 rounded-lg"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
              {cart.map((item) => {
                const itemTotal = item.product.salePrice * item.quantity * (1 - (item.discountPercentage || 0) / 100);

                return (
                  <div key={item.product.id} className="pt-3 first:pt-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-slate-900 truncate">
                          {item.product.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="tabular-nums font-mono">{formatMoney(item.product.salePrice)}</span>
                          {item.discountPercentage > 0 && (
                            <span className="text-emerald-600 font-medium">-{item.discountPercentage}%</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-900 tabular-nums">
                        {formatMoney(itemTotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 rounded flex items-center justify-center bg-white text-slate-800 shadow-2xs font-bold"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 rounded flex items-center justify-center bg-white text-slate-800 shadow-2xs font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={item.discountPercentage || 0}
                          onChange={(e) => setCartItemDiscount(item.product.id, Number(e.target.value))}
                          className="text-[11px] py-1 px-1.5 bg-slate-50 border border-slate-200 rounded text-slate-700"
                        >
                          <option value="0">0%</option>
                          <option value="5">-5%</option>
                          <option value="10">-10%</option>
                          <option value="15">-15%</option>
                          <option value="20">-20%</option>
                        </select>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {cart.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Le panier est vide.
                </div>
              )}
            </div>

            {/* Mobile Cart Bottom Summary */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Sous-total</span>
                <span className="font-mono tabular-nums">{formatMoney(rawSubtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-900 border-t border-slate-200 pt-1.5">
                <span className="text-sm">TOTAL À PAYER</span>
                <span className="text-xl tabular-nums">{formatMoney(totalNet)}</span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsMobileCartOpen(false)}
                  className="flex-1 py-3 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl"
                >
                  Continuer les achats
                </button>
                <button
                  type="button"
                  onClick={handleOpenCheckout}
                  disabled={cart.length === 0}
                  className="flex-1 py-3 text-xs font-bold text-white bg-slate-900 rounded-xl shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <span>Encaisser</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900">Règlement & Encaissement</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Client : <span className="font-semibold text-slate-800">{selectedCustomer ? selectedCustomer.name : 'Client de passage'}</span>
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Currency Selector (Payer en FC ou en USD $) */}
              <div className="flex items-center justify-between p-3 bg-slate-100 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Devise de paiement</span>
                  <span className="text-[10px] text-slate-500">Taux : 1 $ = {exchangeRateUSD.toLocaleString('fr-FR')} FC</span>
                </div>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setPaidCurrency('FC');
                      setCashAmountGiven(totalNet.toString());
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      paidCurrency === 'FC'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Franc Congolais (FC)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaidCurrency('USD');
                      setCashAmountGiven(totalNetUSD.toString());
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      paidCurrency === 'USD'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Dollar ($ USD)
                  </button>
                </div>
              </div>

              {/* Grand Total Display */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-xs uppercase font-medium text-slate-500 tracking-wider">
                  Montant total à régler ({paidCurrency})
                </span>
                <div className="text-3xl font-extrabold text-slate-900 tabular-nums mt-1 font-mono">
                  {paidCurrency === 'USD' ? `${totalNetUSD.toFixed(2)} $` : formatMoney(totalNet)}
                </div>
                <span className="text-xs text-slate-500 mt-1 block font-mono">
                  {paidCurrency === 'USD'
                    ? `Équivalent : ${formatMoney(totalNet)}`
                    : `Équivalent : ~ ${totalNetUSD.toFixed(2)} $`}
                </span>
              </div>

              {/* Payment Methods Tabs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Mode de règlement
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('especes')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentMethod === 'especes'
                        ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span className="text-xs">Espèces</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mobile_money')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentMethod === 'mobile_money'
                        ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span className="text-xs">Mobile Money</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('carte')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentMethod === 'carte'
                        ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-xs">Carte Bancaire</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentMethod === 'credit'
                        ? 'border-amber-600 bg-amber-500 text-white font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Tag className="w-4 h-4" />
                    <span className="text-xs">À Crédit</span>
                  </button>
                </div>
              </div>

              {/* Cash specific handling: tendered amount & change returned */}
              {paymentMethod === 'especes' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Espèces reçues en {paidCurrency === 'USD' ? 'Dollars ($)' : 'Francs Congolais (FC)'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={cashAmountGiven}
                        onChange={(e) => setCashAmountGiven(e.target.value)}
                        placeholder="0.00"
                        className="w-full text-lg font-bold tabular-nums px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-500">
                        {paidCurrency}
                      </span>
                    </div>
                  </div>

                  {/* Quick cash denomination buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {paidCurrency === 'USD'
                      ? [5, 10, 20, 50, 100].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setCashAmountGiven(val.toString())}
                            className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            +{val} $
                          </button>
                        ))
                      : [5000, 10000, 20000, 50000, 100000].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setCashAmountGiven(val.toString())}
                            className="px-2 py-1 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            {val.toLocaleString('fr-FR')} FC
                          </button>
                        ))}
                    <button
                      type="button"
                      onClick={() =>
                        setCashAmountGiven(
                          paidCurrency === 'USD' ? totalNetUSD.toString() : totalNet.toString()
                        )
                      }
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors cursor-pointer"
                    >
                      Montant exact
                    </button>
                  </div>

                  {/* Change return currency selection */}
                  <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-600">Rendre la monnaie en :</span>
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setChangeCurrency('FC')}
                        className={`px-2.5 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                          changeCurrency === 'FC'
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        FC
                      </button>
                      <button
                        type="button"
                        onClick={() => setChangeCurrency('USD')}
                        className={`px-2.5 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                          changeCurrency === 'USD'
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        USD ($)
                      </button>
                    </div>
                  </div>

                  {/* Change calculated display */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Monnaie à rendre :</span>
                    <span
                      className={`text-lg font-bold tabular-nums font-mono ${
                        cashChange >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {changeCurrency === 'USD'
                        ? `${cashChange.toFixed(2)} $ (~ ${Math.round(cashChange * exchangeRateUSD).toLocaleString('fr-FR')} FC)`
                        : `${cashChange.toLocaleString('fr-FR')} FC (~ ${(cashChange / exchangeRateUSD).toFixed(2)} $)`}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === 'credit' && (
                <div className="p-3 bg-amber-50 text-amber-900 rounded-xl text-xs space-y-1 border border-amber-200">
                  <p className="font-semibold">Vente à terme / Crédit client</p>
                  <p className="text-[11px] text-amber-800">
                    Cette vente sera inscrite comme créance client dans le dossier de{' '}
                    <strong>{selectedCustomer ? selectedCustomer.name : 'N/A'}</strong>.
                  </p>
                </div>
              )}

              {/* Optional note */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Note ou référence (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Référence transaction, acompte, etc."
                  value={saleNote}
                  onChange={(e) => setSaleNote(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmSale}
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <span>Valider l'encaissement</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD CUSTOMER MODAL */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Nouveau Client</h3>
              <button
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Claire Dupont"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  placeholder="+33 6 00 00 00 00"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="client@exemple.fr"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL WHEN SALE IS COMPLETED */}
      {lastCompletedSale && (
        <ReceiptModal
          sale={lastCompletedSale}
          onClose={() => setLastCompletedSale(null)}
        />
      )}

      {/* REAL CAMERA BARCODE SCANNER MODAL */}
      <BarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
      />
    </div>
  );
};
