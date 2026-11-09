import { Product, Customer, Sale, Expense, BoutiqueSettings, Cashier } from '../types/boutique';
import dressImage from '../assets/images/boutique_dress_1792938090139.jpg';
import handbagImage from '../assets/images/boutique_handbag_1792938090201.jpg';
import sneakersImage from '../assets/images/boutique_sneakers_1792938090739.jpg';
import perfumeImage from '../assets/images/boutique_perfume_1792938091204.jpg';
import sunglassesImage from '../assets/images/boutique_sunglasses_1792938091195.jpg';

export const DEFAULT_SETTINGS: BoutiqueSettings = {
  boutiqueName: 'Maison Élégance Boutique',
  slogan: 'Prêt-à-Porter & Maroquinerie Fine',
  address: '38 Boulevard du 30 Juin, Gombe, Kinshasa',
  phone: '+243 81 234 5678',
  email: 'contact@maisonelegance-rdc.com',
  nifOrSiret: 'NIF A1904520K · RCCM CD/KIN/RCCM/22-B-0145',
  currencySymbol: 'FC',
  currencyPosition: 'after',
  exchangeRateUSD: 2850, // 1 USD = 2850 FC (Taux du jour)
  secondaryCurrencySymbol: '$',
  taxRate: 16, // TVA 16% RDC
  taxEnabled: false,
  receiptFooterMessage: 'Merci pour votre confiance ! Échange sous 7 jours sur présentation du ticket.',
  cashierName: 'Amina (Gérante)',
  adminPin: '1234'
};

export const DEFAULT_CASHIERS: Cashier[] = [
  {
    id: 'csh-1',
    name: 'Amina (Gérante)',
    pin: '1234',
    role: 'admin',
    active: true,
    avatarColor: 'bg-emerald-600'
  },
  {
    id: 'csh-2',
    name: 'Lucas (Vendeur Caisse)',
    pin: '0000',
    role: 'caissier',
    active: true,
    avatarColor: 'bg-sky-600'
  },
  {
    id: 'csh-3',
    name: 'Fatou (Vendeuse)',
    pin: '1111',
    role: 'caissier',
    active: true,
    avatarColor: 'bg-violet-600'
  }
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Robe Cocktail Soie Émeraude',
    sku: 'ROB-EMER-01',
    barcode: '3760001001',
    category: 'Vêtements',
    purchasePrice: 114000, // 40$ * 2850
    salePrice: 285000, // 100$ * 2850
    currencyInput: 'USD',
    stockQuantity: 14,
    minStockThreshold: 5,
    image: dressImage,
    unit: 'pièce',
    description: 'Robe midi en crêpe de soie verte émeraude, coupe cintrée et tombé fluide.',
    createdAt: '2026-03-01T10:00:00Z'
  },
  {
    id: 'prod-2',
    name: 'Sac à Main Cuir Cognac & Laiton',
    sku: 'SAC-COG-02',
    barcode: '3760001002',
    category: 'Maroquinerie',
    purchasePrice: 142500, // 50$ * 2850
    salePrice: 370500, // 130$ * 2850
    currencyInput: 'USD',
    stockQuantity: 8,
    minStockThreshold: 4,
    image: handbagImage,
    unit: 'pièce',
    description: 'Sac à main structuré en cuir grainé pleine fleur avec cadenas gravé.',
    createdAt: '2026-03-02T11:00:00Z'
  },
  {
    id: 'prod-3',
    name: 'Baskets Urbaines Cuir Blanc',
    sku: 'BSK-BLA-03',
    barcode: '3760001003',
    category: 'Chaussures',
    purchasePrice: 85500, // 30$ * 2850
    salePrice: 199500, // 70$ * 2850
    currencyInput: 'USD',
    stockQuantity: 18,
    minStockThreshold: 6,
    image: sneakersImage,
    unit: 'paire',
    description: 'Sneakers artisanales en cuir nappa blanc avec semelle cousue.',
    createdAt: '2026-03-03T09:30:00Z'
  },
  {
    id: 'prod-4',
    name: 'Eau de Parfum Ambre Nocturne 100ml',
    sku: 'PRF-AMB-04',
    barcode: '3760001004',
    category: 'Parfums',
    purchasePrice: 57000, // 20$ * 2850
    salePrice: 142500, // 50$ * 2850
    currencyInput: 'USD',
    stockQuantity: 3,
    minStockThreshold: 5,
    image: perfumeImage,
    unit: 'flacon',
    description: 'Fragrance exclusive aux notes chaudes d ambre, vanille bourbon et bois précieux.',
    createdAt: '2026-03-04T14:15:00Z'
  },
  {
    id: 'prod-5',
    name: 'Lunettes de Soleil Écaille Aurora',
    sku: 'LUN-AUR-05',
    barcode: '3760001005',
    category: 'Accessoires',
    purchasePrice: 42750, // 15$ * 2850
    salePrice: 99750, // 35$ * 2850
    currencyInput: 'USD',
    stockQuantity: 12,
    minStockThreshold: 5,
    image: sunglassesImage,
    unit: 'pièce',
    description: 'Monture en acétate motif écaille italienne avec verres polarisés UV400.',
    createdAt: '2026-03-05T16:00:00Z'
  },
  {
    id: 'prod-6',
    name: 'Foulard Carré Soie Motif Floral',
    sku: 'ACC-FOU-06',
    barcode: '3760001006',
    category: 'Accessoires',
    purchasePrice: 28500, // 10$ * 2850
    salePrice: 71250, // 25$ * 2850
    currencyInput: 'USD',
    stockQuantity: 20,
    minStockThreshold: 5,
    unit: 'pièce',
    description: 'Carré 90x90cm en twill de soie pure, roulotté main.',
    createdAt: '2026-03-06T10:00:00Z'
  },
  {
    id: 'prod-7',
    name: 'Ceinture Cuir Surpiquée Boucle Dorée',
    sku: 'ACC-CEI-07',
    barcode: '3760001007',
    category: 'Maroquinerie',
    purchasePrice: 22800, // 8$ * 2850
    salePrice: 57000, // 20$ * 2850
    currencyInput: 'USD',
    stockQuantity: 15,
    minStockThreshold: 4,
    unit: 'pièce',
    description: 'Ceinture ajustable en cuir de vachette tanné végétal.',
    createdAt: '2026-03-07T11:00:00Z'
  },
  {
    id: 'prod-8',
    name: 'Chemisier Coton Bio Coupe Droite',
    sku: 'VET-CHM-08',
    barcode: '3760001008',
    category: 'Vêtements',
    purchasePrice: 45600, // 16$ * 2850
    salePrice: 114000, // 40$ * 2850
    currencyInput: 'USD',
    stockQuantity: 2,
    minStockThreshold: 5,
    unit: 'pièce',
    description: 'Chemisier blanc col classique en popeline de coton biologique peigné.',
    createdAt: '2026-03-08T09:00:00Z'
  }
];

export const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Sophie Delacroix',
    phone: '+243 82 345 6789',
    email: 'sophie.delacroix@email.cd',
    address: 'Gombe, Kinshasa',
    totalSpent: 855000,
    ordersCount: 3,
    loyaltyPoints: 60,
    debtBalance: 0,
    notes: 'Cliente fidèle, préfère payer en USD cash ou Airtel Money.',
    createdAt: '2026-02-15T10:00:00Z'
  },
  {
    id: 'cust-2',
    name: 'Marc Lefebvre',
    phone: '+243 99 876 5432',
    email: 'm.lefebvre@pro.cd',
    address: 'Ngaliema, Kinshasa',
    totalSpent: 427500,
    ordersCount: 2,
    loyaltyPoints: 30,
    debtBalance: 114000, // 40$ crédit
    notes: 'Acompte versé lors du dernier achat. Reste 114 000 FC (40$) à régler.',
    createdAt: '2026-03-01T14:30:00Z'
  },
  {
    id: 'cust-3',
    name: 'Amina Benkacem',
    phone: '+243 85 412 8900',
    email: 'amina.b@webmail.cd',
    address: 'Limete, Kinshasa',
    totalSpent: 1140000,
    ordersCount: 4,
    loyaltyPoints: 80,
    debtBalance: 0,
    notes: 'Adore les parfums et la maroquinerie haut de gamme.',
    createdAt: '2026-01-20T11:20:00Z'
  }
];

export const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    date: '2026-10-01T09:00:00Z',
    title: 'Loyer mensuel local boutique',
    category: 'loyer',
    amount: 2850000, // 1000$ * 2850
    paymentMethod: 'virement',
    notes: 'Bail commercial octobre 2026'
  },
  {
    id: 'exp-2',
    date: '2026-10-05T14:20:00Z',
    title: 'Fourniture emballages & sacs kraft boutique',
    category: 'fournitures',
    amount: 342000, // 120$ * 2850
    paymentMethod: 'especes',
    notes: 'Lot de 500 sacs premium avec ruban doré'
  },
  {
    id: 'exp-3',
    date: '2026-10-12T16:00:00Z',
    title: 'Carburant groupe électrogène & électricité SNEL',
    category: 'electricite',
    amount: 427500, // 150$ * 2850
    paymentMethod: 'especes',
    notes: 'Alimentation boutique'
  }
];

export const DEFAULT_SALES: Sale[] = [
  {
    id: 'VTE-2026-0038',
    date: '2026-10-23T14:12:00Z',
    cashierName: 'Amina (Gérante)',
    customerId: 'cust-1',
    customerName: 'Sophie Delacroix',
    items: [
      {
        productId: 'prod-1',
        productName: 'Robe Cocktail Soie Émeraude',
        sku: 'ROB-EMER-01',
        quantity: 1,
        purchasePrice: 114000,
        unitPrice: 285000,
        discountPercentage: 0,
        total: 285000
      },
      {
        productId: 'prod-6',
        productName: 'Foulard Carré Soie Motif Floral',
        sku: 'ACC-FOU-06',
        quantity: 1,
        purchasePrice: 28500,
        unitPrice: 71250,
        discountPercentage: 0,
        total: 71250
      }
    ],
    subtotal: 356250,
    discountTotal: 0,
    taxTotal: 0,
    total: 356250,
    paymentMethod: 'especes',
    paidInCurrency: 'USD',
    exchangeRateUsed: 2850,
    amountReceived: 150, // 150$
    changeGiven: 71250, // 25$ rendu en FC
    changeCurrency: 'FC',
    status: 'complete'
  },
  {
    id: 'VTE-2026-0039',
    date: '2026-10-24T11:05:00Z',
    cashierName: 'Amina (Gérante)',
    customerId: 'cust-3',
    customerName: 'Amina Benkacem',
    items: [
      {
        productId: 'prod-2',
        productName: 'Sac à Main Cuir Cognac & Laiton',
        sku: 'SAC-COG-02',
        quantity: 1,
        purchasePrice: 142500,
        unitPrice: 370500,
        discountPercentage: 10,
        total: 333450
      }
    ],
    subtotal: 370500,
    discountTotal: 37050,
    taxTotal: 0,
    total: 333450,
    paymentMethod: 'mobile_money',
    paidInCurrency: 'FC',
    exchangeRateUsed: 2850,
    amountReceived: 333450,
    changeGiven: 0,
    changeCurrency: 'FC',
    status: 'complete'
  }
];
