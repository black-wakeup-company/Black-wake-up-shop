import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  CartItem,
  Customer,
  Sale,
  Expense,
  CashSession,
  BoutiqueSettings,
  PaymentMethod,
  Cashier,
  WorkspaceMode
} from '../types/boutique';
import {
  DEFAULT_PRODUCTS,
  DEFAULT_CUSTOMERS,
  DEFAULT_EXPENSES,
  DEFAULT_SALES,
  DEFAULT_SETTINGS,
  DEFAULT_CASHIERS
} from '../data/defaultData';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface BoutiqueContextType {
  // Workspace Mode (Caisse vs Admin)
  workspaceMode: WorkspaceMode;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  isAdminUnlocked: boolean;
  unlockAdmin: (pin: string) => boolean;
  lockAdmin: () => void;

  // Screen Lock (Code de verrouillage)
  isScreenLocked: boolean;
  lockScreen: () => void;
  unlockScreen: (pin: string) => boolean;

  // Currency & Taux du jour
  exchangeRateUSD: number;
  updateExchangeRate: (rate: number) => void;
  convertFCToUSD: (amountFC: number) => number;
  convertUSDToFC: (amountUSD: number) => number;
  formatMoneyFC: (amountFC: number) => string;
  formatMoneyUSD: (amountUSD: number) => string;

  // Cashiers / Staff
  cashiers: Cashier[];
  activeCashier: Cashier;
  setActiveCashier: (c: Cashier) => void;
  addCashier: (c: Omit<Cashier, 'id'>) => void;
  updateCashier: (id: string, c: Partial<Cashier>) => void;
  deleteCashier: (id: string) => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, delta: number, reason?: string) => void;

  // Cart / POS
  cart: CartItem[];
  selectedCustomer: Customer | null;
  setSelectedCustomer: (cust: Customer | null) => void;
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setCartItemDiscount: (productId: string, discountPercentage: number) => void;
  cartGlobalDiscount: number;
  setCartGlobalDiscount: (discount: number) => void;

  // Customers
  customers: Customer[];
  addCustomer: (cust: Omit<Customer, 'id' | 'totalSpent' | 'ordersCount' | 'loyaltyPoints' | 'debtBalance' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, cust: Partial<Customer>) => void;
  settleCustomerDebt: (customerId: string, amount: number) => void;

  // Sales
  sales: Sale[];
  completeSale: (params: {
    paymentMethod: PaymentMethod;
    paidInCurrency?: 'FC' | 'USD';
    exchangeRateUsed?: number;
    amountReceived: number;
    changeGiven?: number;
    changeCurrency?: 'FC' | 'USD';
    notes?: string;
  }) => Sale | null;
  refundSale: (saleId: string) => void;
  lastCompletedSale: Sale | null;
  setLastCompletedSale: (sale: Sale | null) => void;

  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;

  // Cash Register Session
  cashSession: CashSession;
  openCashSession: (openingAmount: number) => void;
  closeCashSession: (actualAmount: number, notes?: string) => void;

  // Settings & Utilities
  settings: BoutiqueSettings;
  updateSettings: (newSettings: Partial<BoutiqueSettings>) => void;
  formatMoney: (amount: number, currencyOverride?: 'FC' | 'USD') => string;
  exportDatabaseJSON: () => void;
  getDatabaseSnapshotJSON: () => string;
  importDatabaseJSON: (jsonData: string) => boolean;
  resetAllData: () => void;

  // Feedback Notifications
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
}

const BoutiqueContext = createContext<BoutiqueContextType | undefined>(undefined);

const STORAGE_KEYS = {
  WORKSPACE_MODE: 'boutiquepro_workspace_mode_v2',
  CASHIERS: 'boutiquepro_cashiers_v2',
  ACTIVE_CASHIER: 'boutiquepro_active_cashier_v2',
  PRODUCTS: 'boutiquepro_products_v2',
  CUSTOMERS: 'boutiquepro_customers_v2',
  SALES: 'boutiquepro_sales_v2',
  EXPENSES: 'boutiquepro_expenses_v2',
  SETTINGS: 'boutiquepro_settings_v2',
  CASH_SESSION: 'boutiquepro_cash_session_v2'
};

const getScopedStorageKey = (key: keyof typeof STORAGE_KEYS, storeId?: string) =>
  storeId ? `boutiquepro:store:${storeId}:${key.toLowerCase()}:v1` : STORAGE_KEYS[key];

const createEmptySettings = (): BoutiqueSettings => ({
  ...DEFAULT_SETTINGS,
  boutiqueName: 'Ma boutique',
  slogan: '',
  address: '',
  phone: '',
  email: '',
  nifOrSiret: '',
  receiptFooterMessage: 'Merci pour votre confiance !',
  cashierName: 'Propriétaire',
  adminPin: ''
});

const createOwnerCashier = (storeId: string): Cashier => ({
  id: `owner-${storeId}`,
  name: 'Propriétaire',
  pin: '',
  role: 'admin',
  active: true,
  avatarColor: 'bg-emerald-600'
});

const createEmptyCashSession = (): CashSession => ({
  id: `sess-${Date.now()}`,
  openedAt: new Date().toISOString(),
  openingAmount: 0,
  cashierName: 'Propriétaire',
  status: 'closed'
});

export const BoutiqueProvider: React.FC<{ children: React.ReactNode; storeId?: string }> = ({ children, storeId }) => {
  const isTenant = Boolean(storeId);
  const storageKey = (key: keyof typeof STORAGE_KEYS) => getScopedStorageKey(key, storeId);
  // Workspace Mode (caisse vs admin)
  const [workspaceMode, setWorkspaceModeState] = useState<WorkspaceMode>(() => {
    try {
      const saved = localStorage.getItem(storageKey('WORKSPACE_MODE'));
      return (saved as WorkspaceMode) || 'caisse';
    } catch {
      return 'caisse';
    }
  });

  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isScreenLocked, setIsScreenLocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey('WORKSPACE_MODE') + ':locked') === 'true';
    } catch {
      return false;
    }
  });

  const lockScreen = () => {
    setIsScreenLocked(true);
    try {
      localStorage.setItem(storageKey('WORKSPACE_MODE') + ':locked', 'true');
    } catch (e) {
      console.warn(e);
    }
    showToast('Écran de caisse verrouillé', 'info');
  };

  const unlockScreen = (pin: string): boolean => {
    const cleanPin = pin.trim();
    const cashierPin = activeCashier?.pin || (isTenant ? '' : '0000');
    const adminPin = settings.adminPin || (isTenant ? '' : '1234');

    if ((cashierPin && cleanPin === cashierPin) || (adminPin && cleanPin === adminPin) || (!isTenant && (cleanPin === '1234' || cleanPin === '0000'))) {
      setIsScreenLocked(false);
      try {
        localStorage.setItem(storageKey('WORKSPACE_MODE') + ':locked', 'false');
      } catch (e) {
        console.warn(e);
      }
      showToast(`Déverrouillé (${cleanPin === adminPin ? 'Mode Administrateur' : activeCashier.name})`, 'success');
      return true;
    } else {
      showToast('Code PIN incorrect. Veuillez réessayer.', 'error');
      return false;
    }
  };

  // Cashiers
  const [cashiers, setCashiers] = useState<Cashier[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey('CASHIERS'));
      return saved ? JSON.parse(saved) : (isTenant && storeId ? [createOwnerCashier(storeId)] : DEFAULT_CASHIERS);
    } catch {
      return isTenant && storeId ? [createOwnerCashier(storeId)] : DEFAULT_CASHIERS;
    }
  });

  const [activeCashier, setActiveCashierState] = useState<Cashier>(() => {
    try {
      const saved = localStorage.getItem(storageKey('ACTIVE_CASHIER'));
      if (saved) {
        const parsed = JSON.parse(saved);
        const match = isTenant && storeId
          ? (parsed.id === `owner-${storeId}` ? createOwnerCashier(storeId) : undefined)
          : DEFAULT_CASHIERS.find((c) => c.id === parsed.id);
        if (match) return match;
      }
      return isTenant && storeId ? createOwnerCashier(storeId) : DEFAULT_CASHIERS[0];
    } catch {
      return isTenant && storeId ? createOwnerCashier(storeId) : DEFAULT_CASHIERS[0];
    }
  });

  // Products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey('PRODUCTS'));
      return saved ? JSON.parse(saved) : (isTenant ? [] : DEFAULT_PRODUCTS);
    } catch {
      return isTenant ? [] : DEFAULT_PRODUCTS;
    }
  });

  // Customers
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey('CUSTOMERS'));
      return saved ? JSON.parse(saved) : (isTenant ? [] : DEFAULT_CUSTOMERS);
    } catch {
      return isTenant ? [] : DEFAULT_CUSTOMERS;
    }
  });

  // Sales
  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey('SALES'));
      return saved ? JSON.parse(saved) : (isTenant ? [] : DEFAULT_SALES);
    } catch {
      return isTenant ? [] : DEFAULT_SALES;
    }
  });

  // Expenses
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey('EXPENSES'));
      return saved ? JSON.parse(saved) : (isTenant ? [] : DEFAULT_EXPENSES);
    } catch {
      return isTenant ? [] : DEFAULT_EXPENSES;
    }
  });

  // Settings
  const [settings, setSettings] = useState<BoutiqueSettings>(() => {
    try {
      const saved = localStorage.getItem(storageKey('SETTINGS'));
      return saved ? { ...(isTenant ? createEmptySettings() : DEFAULT_SETTINGS), ...JSON.parse(saved) } : (isTenant ? createEmptySettings() : DEFAULT_SETTINGS);
    } catch {
      return isTenant ? createEmptySettings() : DEFAULT_SETTINGS;
    }
  });

  // Cash Session
  const [cashSession, setCashSession] = useState<CashSession>(() => {
    try {
      const saved = localStorage.getItem(storageKey('CASH_SESSION'));
      return saved ? JSON.parse(saved) : (isTenant ? createEmptyCashSession() : {
        id: 'sess-today', openedAt: new Date().toISOString(), openingAmount: 150.0,
        cashierName: DEFAULT_SETTINGS.cashierName, status: 'open'
      });
    } catch {
      return isTenant ? createEmptyCashSession() : {
        id: 'sess-today', openedAt: new Date().toISOString(), openingAmount: 150.0,
        cashierName: DEFAULT_SETTINGS.cashierName, status: 'open'
      };
    }
  });

  // Cart & POS transient state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cartGlobalDiscount, setCartGlobalDiscount] = useState<number>(0);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);

  // Toast feedback
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync state to local storage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey('WORKSPACE_MODE'), workspaceMode);
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [workspaceMode]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey('CASHIERS'), JSON.stringify(cashiers));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [cashiers]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey('ACTIVE_CASHIER'), JSON.stringify(activeCashier));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [activeCashier]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey('PRODUCTS'), JSON.stringify(products));
    } catch (e) {
      console.warn('LocalStorage error saving products', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey('CUSTOMERS'), JSON.stringify(customers));
    } catch (e) {
      console.warn('LocalStorage error saving customers', e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey('SALES'), JSON.stringify(sales));
    } catch (e) {
      console.warn('LocalStorage error saving sales', e);
    }
  }, [sales]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey('EXPENSES'), JSON.stringify(expenses));
    } catch (e) {
      console.warn('LocalStorage error saving expenses', e);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey('SETTINGS'), JSON.stringify(settings));
    } catch (e) {
      console.warn('LocalStorage error saving settings', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey('CASH_SESSION'), JSON.stringify(cashSession));
    } catch (e) {
      console.warn('LocalStorage error saving cash session', e);
    }
  }, [cashSession]);

  // Mode and Security
  const setWorkspaceMode = (mode: WorkspaceMode) => {
    if (mode === 'admin' && !isAdminUnlocked) {
      // requires unlocking first
      return;
    }
    setWorkspaceModeState(mode);
  };

  const unlockAdmin = (pin: string): boolean => {
    const validPin = settings.adminPin || (isTenant ? '' : '1234');
    if (validPin && pin.trim() === validPin) {
      setIsAdminUnlocked(true);
      setWorkspaceModeState('admin');
      showToast('Espace Administration déverrouillé avec succès', 'success');
      return true;
    } else {
      showToast('Code PIN administrateur incorrect', 'error');
      return false;
    }
  };

  const lockAdmin = () => {
    setIsAdminUnlocked(false);
    setWorkspaceModeState('caisse');
    showToast('Session Administrateur verrouillée. Retour à la Caisse.', 'info');
  };

  // Cashiers / Staff
  const setActiveCashier = (c: Cashier) => {
    setActiveCashierState(c);
    showToast(`Caissier actif : ${c.name}`, 'info');
  };

  const addCashier = (cData: Omit<Cashier, 'id'>) => {
    const newCashier: Cashier = {
      ...cData,
      id: 'csh-' + Date.now()
    };
    setCashiers((prev) => [...prev, newCashier]);
    showToast(`Compte caissier "${newCashier.name}" créé`, 'success');
  };

  const updateCashier = (id: string, cData: Partial<Cashier>) => {
    setCashiers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...cData } : c))
    );
    if (activeCashier.id === id) {
      setActiveCashierState((prev) => ({ ...prev, ...cData }));
    }
    showToast('Fiche caissier mise à jour', 'info');
  };

  const deleteCashier = (id: string) => {
    if (cashiers.length <= 1) {
      showToast('Impossible de supprimer le dernier utilisateur', 'warning');
      return;
    }
    setCashiers((prev) => prev.filter((c) => c.id !== id));
    if (activeCashier.id === id) {
      const remaining = cashiers.filter((c) => c.id !== id);
      setActiveCashierState(remaining[0]);
    }
    showToast('Caissier supprimé', 'info');
  };

  // Product Actions
  const addProduct = (prodData: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...prodData,
      id: 'prod-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    setProducts((prev) => [newProduct, ...prev]);
    showToast(`Article "${newProduct.name}" ajouté avec succès`, 'success');
  };

  const updateProduct = (id: string, updatedFields: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p))
    );
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === id
          ? { ...item, product: { ...item.product, ...updatedFields } }
          : item
      )
    );
    showToast('Fiche article mise à jour', 'info');
  };

  const deleteProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    removeFromCart(id);
    showToast(`Article "${prod?.name || id}" supprimé`, 'info');
  };

  const adjustStock = (id: string, delta: number, reason?: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newQty = Math.max(0, p.stockQuantity + delta);
          return { ...p, stockQuantity: newQty };
        }
        return p;
      })
    );
    const prod = products.find((p) => p.id === id);
    showToast(
      `Stock ajusté pour ${prod?.name}: ${delta > 0 ? '+' : ''}${delta} ${reason ? `(${reason})` : ''}`,
      'success'
    );
  };

  // Cart Actions
  const addToCart = (product: Product, quantity = 1) => {
    if (product.stockQuantity <= 0) {
      showToast(`Attention : "${product.name}" est en rupture de stock !`, 'warning');
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, discountPercentage: 0 }];
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCartGlobalDiscount(0);
    setSelectedCustomer(null);
  };

  const setCartItemDiscount = (productId: string, discountPercentage: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, discountPercentage: Math.max(0, Math.min(100, discountPercentage)) }
          : item
      )
    );
  };

  // Customers
  const addCustomer = (custData: Omit<Customer, 'id' | 'totalSpent' | 'ordersCount' | 'loyaltyPoints' | 'debtBalance' | 'createdAt'>) => {
    const newCust: Customer = {
      ...custData,
      id: 'cust-' + Date.now(),
      totalSpent: 0,
      ordersCount: 0,
      loyaltyPoints: 0,
      debtBalance: 0,
      createdAt: new Date().toISOString()
    };
    setCustomers((prev) => [newCust, ...prev]);
    showToast(`Client "${newCust.name}" enregistré`, 'success');
    return newCust;
  };

  const updateCustomer = (id: string, updatedFields: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c))
    );
    if (selectedCustomer?.id === id) {
      setSelectedCustomer((prev) => (prev ? { ...prev, ...updatedFields } : null));
    }
    showToast('Fiche client mise à jour', 'info');
  };

  const settleCustomerDebt = (customerId: string, amount: number) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const newDebt = Math.max(0, c.debtBalance - amount);
          return { ...c, debtBalance: newDebt };
        }
        return c;
      })
    );
    showToast(`Règlement de dette de ${formatMoney(amount)} enregistré avec succès`, 'success');
  };

  // Currency & Exchange Rate Helpers
  const exchangeRateUSD = settings.exchangeRateUSD || 2850;

  const updateExchangeRate = (rate: number) => {
    const validRate = Math.max(1, Math.round(rate));
    updateSettings({ exchangeRateUSD: validRate });
    showToast(`Taux du jour actualisé : 1 $ = ${validRate.toLocaleString('fr-FR')} FC`, 'success');
  };

  const convertFCToUSD = (amountFC: number): number => {
    const rate = settings.exchangeRateUSD || 2850;
    return Math.round((amountFC / rate) * 100) / 100;
  };

  const convertUSDToFC = (amountUSD: number): number => {
    const rate = settings.exchangeRateUSD || 2850;
    return Math.round(amountUSD * rate);
  };

  const formatMoneyFC = (amountFC: number): string => {
    const formatted = new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0
    }).format(Math.round(amountFC));
    return `${formatted} FC`;
  };

  const formatMoneyUSD = (amountUSD: number): string => {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amountUSD);
    return `${formatted} $`;
  };

  // Sales
  const completeSale = ({
    paymentMethod,
    paidInCurrency = 'FC',
    exchangeRateUsed = settings.exchangeRateUSD || 2850,
    amountReceived,
    changeGiven: manualChangeGiven,
    changeCurrency = 'FC',
    notes
  }: {
    paymentMethod: PaymentMethod;
    paidInCurrency?: 'FC' | 'USD';
    exchangeRateUsed?: number;
    amountReceived: number;
    changeGiven?: number;
    changeCurrency?: 'FC' | 'USD';
    notes?: string;
  }): Sale | null => {
    if (cart.length === 0) {
      showToast('Le panier est vide', 'warning');
      return null;
    }

    let rawSubtotal = 0;
    const saleItems = cart.map((item) => {
      const unitPrice = item.customPrice ?? item.product.salePrice;
      const itemSubtotal = unitPrice * item.quantity;
      const discount = (itemSubtotal * (item.discountPercentage || 0)) / 100;
      const lineTotal = itemSubtotal - discount;
      rawSubtotal += lineTotal;

      return {
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        purchasePrice: item.product.purchasePrice,
        unitPrice,
        discountPercentage: item.discountPercentage || 0,
        total: lineTotal
      };
    });

    const globalDiscountAmount = (rawSubtotal * cartGlobalDiscount) / 100;
    const finalSubtotal = rawSubtotal - globalDiscountAmount;
    
    let taxTotal = 0;
    if (settings.taxEnabled && settings.taxRate > 0) {
      taxTotal = (finalSubtotal * settings.taxRate) / (100 + settings.taxRate);
    }

    const totalToPayFC = finalSubtotal;
    let finalChangeGiven = 0;

    if (paymentMethod === 'especes') {
      if (manualChangeGiven !== undefined) {
        finalChangeGiven = manualChangeGiven;
      } else {
        // Calculate based on currency
        if (paidInCurrency === 'USD') {
          const totalUSD = totalToPayFC / exchangeRateUsed;
          const changeUSD = Math.max(0, amountReceived - totalUSD);
          finalChangeGiven = changeCurrency === 'USD' ? Math.round(changeUSD * 100) / 100 : Math.round(changeUSD * exchangeRateUsed);
        } else {
          const changeFC = Math.max(0, amountReceived - totalToPayFC);
          finalChangeGiven = changeCurrency === 'USD' ? Math.round((changeFC / exchangeRateUsed) * 100) / 100 : changeFC;
        }
      }
    }

    const nextSeq = sales.length + 42;
    const padded = String(nextSeq).padStart(4, '0');
    const saleId = `VTE-${new Date().getFullYear()}-${padded}`;
    // Keep the receipt number unchanged; this separate ID is for future sync deduplication.
    const syncId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `sale-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

    const newSale: Sale = {
      id: saleId,
      syncId,
      date: new Date().toISOString(),
      cashierName: activeCashier?.name || settings.cashierName,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name || 'Client Comptoir',
      items: saleItems,
      subtotal: rawSubtotal,
      discountTotal: globalDiscountAmount + cart.reduce((acc, it) => acc + (it.product.salePrice * it.quantity * (it.discountPercentage || 0)) / 100, 0),
      taxTotal: Math.round(taxTotal * 100) / 100,
      total: Math.round(totalToPayFC),
      paymentMethod,
      paidInCurrency,
      exchangeRateUsed,
      amountReceived: paymentMethod === 'credit' ? 0 : amountReceived,
      changeGiven: finalChangeGiven,
      changeCurrency,
      status: 'complete',
      notes
    };

    setProducts((prev) =>
      prev.map((p) => {
        const itemSold = cart.find((it) => it.product.id === p.id);
        if (itemSold) {
          return {
            ...p,
            stockQuantity: Math.max(0, p.stockQuantity - itemSold.quantity)
          };
        }
        return p;
      })
    );

    if (selectedCustomer) {
      const pointsEarned = Math.floor(newSale.total / 5);
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === selectedCustomer.id) {
            const addedDebt = paymentMethod === 'credit' ? newSale.total : 0;
            return {
              ...c,
              totalSpent: c.totalSpent + newSale.total,
              ordersCount: c.ordersCount + 1,
              loyaltyPoints: c.loyaltyPoints + pointsEarned,
              debtBalance: c.debtBalance + addedDebt
            };
          }
          return c;
        })
      );
    }

    setSales((prev) => [newSale, ...prev]);
    setLastCompletedSale(newSale);
    clearCart();

    showToast(`Vente ${saleId} enregistrée (${formatMoney(newSale.total)})`, 'success');
    return newSale;
  };

  const refundSale = (saleId: string) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return;

    if (sale.status === 'refunded') {
      showToast('Cette vente a déjà été remboursée', 'warning');
      return;
    }

    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, status: 'refunded' } : s))
    );

    setProducts((prev) =>
      prev.map((p) => {
        const returnedItem = sale.items.find((it) => it.productId === p.id);
        if (returnedItem) {
          return {
            ...p,
            stockQuantity: p.stockQuantity + returnedItem.quantity
          };
        }
        return p;
      })
    );

    if (sale.customerId) {
      const pointsDeducted = Math.floor(sale.total / 5);
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === sale.customerId) {
            return {
              ...c,
              totalSpent: Math.max(0, c.totalSpent - sale.total),
              ordersCount: Math.max(0, c.ordersCount - 1),
              loyaltyPoints: Math.max(0, c.loyaltyPoints - pointsDeducted),
              debtBalance: sale.paymentMethod === 'credit' ? Math.max(0, c.debtBalance - sale.total) : c.debtBalance
            };
          }
          return c;
        })
      );
    }

    showToast(`Vente ${saleId} remboursée et stock réintégré`, 'info');
  };

  // Expenses
  const addExpense = (expData: Omit<Expense, 'id'>) => {
    const newExp: Expense = {
      ...expData,
      id: 'exp-' + Date.now()
    };
    setExpenses((prev) => [newExp, ...prev]);
    showToast(`Dépense de ${formatMoney(newExp.amount)} enregistrée`, 'success');
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    showToast('Dépense supprimée', 'info');
  };

  // Cash Session
  const openCashSession = (openingAmount: number) => {
    setCashSession({
      id: 'sess-' + Date.now(),
      openedAt: new Date().toISOString(),
      openingAmount,
      cashierName: activeCashier?.name || settings.cashierName,
      status: 'open'
    });
    showToast(`Session de caisse ouverte avec ${formatMoney(openingAmount)}`, 'success');
  };

  const closeCashSession = (actualAmount: number, notes?: string) => {
    const cashSalesTotal = sales
      .filter((s) => s.status === 'complete' && s.paymentMethod === 'especes' && new Date(s.date) >= new Date(cashSession.openedAt))
      .reduce((sum, s) => sum + s.total, 0);

    const cashExpensesTotal = expenses
      .filter((e) => e.paymentMethod === 'especes' && new Date(e.date) >= new Date(cashSession.openedAt))
      .reduce((sum, e) => sum + e.amount, 0);

    const expected = cashSession.openingAmount + cashSalesTotal - cashExpensesTotal;

    setCashSession((prev) => ({
      ...prev,
      closedAt: new Date().toISOString(),
      closingAmountExpected: expected,
      closingAmountActual: actualAmount,
      status: 'closed',
      notes
    }));

    const diff = actualAmount - expected;
    if (Math.abs(diff) < 0.01) {
      showToast('Caisse clôturée avec un solde parfait !', 'success');
    } else if (diff > 0) {
      showToast(`Caisse clôturée : Excédent de ${formatMoney(diff)}`, 'warning');
    } else {
      showToast(`Caisse clôturée : Écart de caisse de ${formatMoney(diff)}`, 'warning');
    }
  };

  // Settings
  const updateSettings = (newSettings: Partial<BoutiqueSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('Paramètres de la boutique enregistrés', 'success');
  };

  const formatMoney = (amount: number, currencyOverride?: 'FC' | 'USD'): string => {
    if (currencyOverride === 'USD') {
      return formatMoneyUSD(amount);
    }
    const formattedNum = new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0
    }).format(Math.round(amount));

    if (settings.currencyPosition === 'before') {
      return `${settings.currencySymbol || 'FC'} ${formattedNum}`;
    }
    return `${formattedNum} ${settings.currencySymbol || 'FC'}`;
  };

  // Data Export & Import
  const getDatabaseSnapshotJSON = (): string => {
    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      settings,
      cashiers,
      products,
      customers,
      sales,
      expenses,
      cashSession
    };
    return JSON.stringify(backupData, null, 2);
  };

  const exportDatabaseJSON = () => {
    const jsonStr = getDatabaseSnapshotJSON();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonStr);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sauvegarde_boutique_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Sauvegarde complète exportée en fichier JSON', 'success');
  };

  const importDatabaseJSON = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.products && Array.isArray(parsed.products)) {
        setProducts(parsed.products);
      }
      if (parsed.customers && Array.isArray(parsed.customers)) {
        setCustomers(parsed.customers);
      }
      if (parsed.sales && Array.isArray(parsed.sales)) {
        setSales(parsed.sales);
      }
      if (parsed.expenses && Array.isArray(parsed.expenses)) {
        setExpenses(parsed.expenses);
      }
      if (parsed.cashiers && Array.isArray(parsed.cashiers)) {
        setCashiers(parsed.cashiers);
      }
      if (parsed.settings) {
        setSettings(parsed.settings);
      }
      if (parsed.cashSession) {
        setCashSession(parsed.cashSession);
      }
      showToast('Base de données restaurée avec succès !', 'success');
      return true;
    } catch {
      showToast('Fichier JSON invalide ou corrompu', 'error');
      return false;
    }
  };

  const resetAllData = () => {
    setProducts(isTenant ? [] : DEFAULT_PRODUCTS);
    setCustomers(isTenant ? [] : DEFAULT_CUSTOMERS);
    setSales(isTenant ? [] : DEFAULT_SALES);
    setExpenses(isTenant ? [] : DEFAULT_EXPENSES);
    setCashiers(isTenant && storeId ? [createOwnerCashier(storeId)] : DEFAULT_CASHIERS);
    setActiveCashierState(isTenant && storeId ? createOwnerCashier(storeId) : DEFAULT_CASHIERS[0]);
    setSettings(isTenant ? createEmptySettings() : DEFAULT_SETTINGS);
    setCashSession(isTenant ? createEmptyCashSession() : {
      id: 'sess-reset', openedAt: new Date().toISOString(), openingAmount: 150.0,
      cashierName: DEFAULT_SETTINGS.cashierName, status: 'open'
    });
    clearCart();
    showToast('Données réinitialisées au modèle par défaut', 'info');
  };

  return (
    <BoutiqueContext.Provider
      value={{
        workspaceMode,
        setWorkspaceMode,
        isAdminUnlocked,
        unlockAdmin,
        lockAdmin,
        isScreenLocked,
        lockScreen,
        unlockScreen,
        exchangeRateUSD,
        updateExchangeRate,
        convertFCToUSD,
        convertUSDToFC,
        formatMoneyFC,
        formatMoneyUSD,
        cashiers,
        activeCashier,
        setActiveCashier,
        addCashier,
        updateCashier,
        deleteCashier,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        cart,
        selectedCustomer,
        setSelectedCustomer,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        setCartItemDiscount,
        cartGlobalDiscount,
        setCartGlobalDiscount,
        customers,
        addCustomer,
        updateCustomer,
        settleCustomerDebt,
        sales,
        completeSale,
        refundSale,
        lastCompletedSale,
        setLastCompletedSale,
        expenses,
        addExpense,
        deleteExpense,
        cashSession,
        openCashSession,
        closeCashSession,
        settings,
        updateSettings,
        formatMoney,
        exportDatabaseJSON,
        getDatabaseSnapshotJSON,
        importDatabaseJSON,
        resetAllData,
        toasts,
        showToast,
        removeToast
      }}
    >
      {children}
    </BoutiqueContext.Provider>
  );
};

export const useBoutique = () => {
  const context = useContext(BoutiqueContext);
  if (!context) {
    throw new Error('useBoutique must be used within a BoutiqueProvider');
  }
  return context;
};
