export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  purchasePrice: number; // Stored in FC
  salePrice: number; // Stored in FC
  currencyInput?: 'FC' | 'USD';
  stockQuantity: number;
  minStockThreshold: number;
  image?: string;
  unit: string;
  description?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercentage: number;
  customPrice?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalSpent: number;
  ordersCount: number;
  loyaltyPoints: number;
  debtBalance: number; // positive means customer owes money to boutique
  notes?: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  purchasePrice: number;
  unitPrice: number;
  discountPercentage: number;
  total: number;
}

export type PaymentMethod = 'especes' | 'carte' | 'mobile_money' | 'virement' | 'credit';

export interface Sale {
  id: string; // Human-readable receipt number, e.g. VTE-2026-0042
  syncId?: string; // Stable technical identity for future multi-device synchronization
  date: string;
  cashierName: string;
  customerId?: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number; // in FC
  paymentMethod: PaymentMethod;
  paidInCurrency: 'FC' | 'USD';
  exchangeRateUsed: number;
  amountReceived: number; // in paid currency
  changeGiven: number; // in change currency
  changeCurrency: 'FC' | 'USD';
  status: 'complete' | 'refunded';
  notes?: string;
}

export type ExpenseCategory = 'loyer' | 'electricite' | 'salaires' | 'fournitures' | 'transport' | 'autre';

export interface Expense {
  id: string;
  date: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency?: 'FC' | 'USD';
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface CashSession {
  id: string;
  openedAt: string;
  closedAt?: string;
  openingAmount: number;
  closingAmountExpected?: number;
  closingAmountActual?: number;
  cashierName: string;
  status: 'open' | 'closed';
  notes?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantityDelta: number;
  reason: 'sale' | 'refund' | 'restock' | 'adjustment';
  referenceId?: string;
  createdAt: string;
  createdBy: string;
}

export interface Cashier {
  id: string;
  name: string;
  pin: string;
  role: 'admin' | 'caissier';
  active: boolean;
  avatarColor?: string;
}

export type WorkspaceMode = 'caisse' | 'admin';

export interface BoutiqueSettings {
  boutiqueName: string;
  slogan: string;
  address: string;
  phone: string;
  email: string;
  nifOrSiret: string;
  currencySymbol: string; // 'FC' by default
  currencyPosition: 'before' | 'after';
  exchangeRateUSD: number; // Taux du jour: e.g. 2850 FC pour 1 $ USD
  secondaryCurrencySymbol: string; // '$'
  taxRate: number; // e.g. 16 for 16% TVA in DRC or 0
  taxEnabled: boolean;
  receiptFooterMessage: string;
  cashierName: string;
  adminPin: string; // PIN to enter Admin mode (default 1234)
  logo?: string; // base64 data URL or image path
}
