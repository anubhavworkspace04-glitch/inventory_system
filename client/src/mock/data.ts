import { Product, Customer, Purchase, Sale, Quotation, StockMovement, Payment } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Glass',
    category: 'Glass',
    description: 'High-quality architectural float and toughened glass products.',
    unit: 'sqft',
    minStockLevel: 50,
    isActive: true,
    createdAt: '2026-08-15T10:00:00Z',
    updatedAt: '2026-08-15T10:00:00Z',
    variants: [
      {
        id: 'var-1-1',
        sku: 'GLS-5CLR',
        name: '5mm Clear',
        image: 'https://images.unsplash.com/photo-1595429035839-c99c298ffdec?q=80&w=300&auto=format&fit=crop',
        openingStock: 100,
        cachedStock: 80,
        isActive: true
      },
      {
        id: 'var-1-2',
        sku: 'GLS-6CLR',
        name: '6mm Clear',
        image: 'https://images.unsplash.com/photo-1595429035839-c99c298ffdec?q=80&w=300&auto=format&fit=crop',
        openingStock: 100,
        cachedStock: 150,
        isActive: true
      },
      {
        id: 'var-1-3',
        sku: 'GLS-8TGH',
        name: '8mm Toughened',
        image: 'https://images.unsplash.com/photo-1595429035839-c99c298ffdec?q=80&w=300&auto=format&fit=crop',
        openingStock: 50,
        cachedStock: 32,
        isActive: true
      },
      {
        id: 'var-1-4',
        sku: 'GLS-10TGH',
        name: '10mm Toughened',
        image: 'https://images.unsplash.com/photo-1595429035839-c99c298ffdec?q=80&w=300&auto=format&fit=crop',
        openingStock: 40,
        cachedStock: 40,
        isActive: true
      }
    ]
  },
  {
    id: 'prod-2',
    name: 'Plywood',
    category: 'Wood',
    description: 'Marine grade and commercial plywood sheets.',
    unit: 'pcs',
    minStockLevel: 20,
    isActive: true,
    createdAt: '2026-08-16T11:00:00Z',
    updatedAt: '2026-08-16T11:00:00Z',
    variants: [
      {
        id: 'var-2-1',
        sku: 'WD-12MRN',
        name: '12mm Marine Plywood',
        openingStock: 30,
        cachedStock: 30,
        isActive: true
      },
      {
        id: 'var-2-2',
        sku: 'WD-18MRN',
        name: '18mm Marine Plywood',
        openingStock: 25,
        cachedStock: 15,
        isActive: true
      }
    ]
  },
  {
    id: 'prod-3',
    name: 'Steel Rebar',
    category: 'Steel',
    description: 'TMT reinforcement bars for construction.',
    unit: 'kg',
    minStockLevel: 500,
    isActive: true,
    createdAt: '2026-08-17T09:00:00Z',
    updatedAt: '2026-08-17T09:00:00Z',
    variants: [
      {
        id: 'var-3-1',
        sku: 'STL-10TMT',
        name: '10mm TMT Bar',
        openingStock: 1000,
        cachedStock: 1400,
        isActive: true
      },
      {
        id: 'var-3-2',
        sku: 'STL-12TMT',
        name: '12mm TMT Bar',
        openingStock: 800,
        cachedStock: 800,
        isActive: true
      }
    ]
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul.sharma@gmail.com',
    address: '102, Shanti Nagar, Jaipur, Rajasthan - 302012',
    gstNumber: '08AAAAA1111A1Z1',
    notes: 'Premium regular builder client.',
    isActive: true,
    deletedAt: null,
    createdAt: '2026-08-18T10:00:00Z'
  },
  {
    id: 'cust-2',
    name: 'Amit Patel',
    phone: '9823456789',
    email: 'amit.patel@yahoo.com',
    address: 'G-4, Corporate Plaza, SG Highway, Ahmedabad - 380054',
    gstNumber: '24BBBBB2222B2Z2',
    notes: 'Requires delivery tracking info promptly.',
    isActive: true,
    deletedAt: null,
    createdAt: '2026-08-19T14:30:00Z'
  },
  {
    id: 'cust-3',
    name: 'Priya Singh',
    phone: '7012345678',
    email: 'priya.singh@outlook.com',
    address: 'Sector 15, Dwarka, New Delhi - 110075',
    isActive: true,
    deletedAt: null,
    createdAt: '2026-08-20T11:20:00Z'
  }
];

export const INITIAL_PURCHASES: Purchase[] = [
  {
    id: 'pur-1',
    purchaseNumber: 'PUR-2026-0001',
    supplierId: 'sup-1',
    supplierNameSnapshot: 'ABC Glass Supplier Ltd.',
    purchaseDate: '2026-08-21',
    items: [
      {
        productId: 'prod-1',
        variantId: 'var-1-2',
        productNameSnapshot: 'Glass',
        variantNameSnapshot: '6mm Clear',
        skuSnapshot: 'GLS-6CLR',
        quantity: 100,
        unitPurchasePrice: 500,
        baseAmount: 50000
      }
    ],
    additionalCosts: [
      { name: 'Shipping', amount: 2000 },
      { name: 'GST (18%)', amount: 9360 },
      { name: 'Loading', amount: 500 },
      { name: 'Handling', amount: 300 }
    ],
    baseAmount: 50000,
    totalAdditionalCosts: 12160,
    totalPurchaseCost: 62160,
    paymentMode: 'UPI',
    paymentStatus: 'Paid',
    amountPaid: 62160,
    pendingAmount: 0,
    status: 'Active',
    notes: 'Bulk stock arrival.'
  },
  {
    id: 'pur-2',
    purchaseNumber: 'PUR-2026-0002',
    supplierId: 'sup-2',
    supplierNameSnapshot: 'Tata Steel Authorized Vendor',
    purchaseDate: '2026-08-22',
    items: [
      {
        productId: 'prod-3',
        variantId: 'var-3-1',
        productNameSnapshot: 'Steel Rebar',
        variantNameSnapshot: '10mm TMT Bar',
        skuSnapshot: 'STL-10TMT',
        quantity: 500,
        unitPurchasePrice: 60,
        baseAmount: 30000
      }
    ],
    additionalCosts: [
      { name: 'Freight', amount: 3000 },
      { name: 'CGST & SGST', amount: 5400 }
    ],
    baseAmount: 30000,
    totalAdditionalCosts: 8400,
    totalPurchaseCost: 38400,
    paymentMode: 'Bank Transfer',
    paymentStatus: 'Partially Paid',
    amountPaid: 20000,
    pendingAmount: 18400,
    status: 'Active',
    notes: 'Delivered at site yard.'
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-1',
    saleNumber: 'SAL-2026-0001',
    saleDate: '2026-08-20',
    customerId: 'cust-1',
    customerNameSnapshot: 'Rahul Sharma',
    customerPhoneSnapshot: '9876543210',
    items: [
      {
        productId: 'prod-1',
        variantId: 'var-1-1',
        productNameSnapshot: 'Glass',
        variantNameSnapshot: '5mm Clear',
        skuSnapshot: 'GLS-5CLR',
        quantity: 20,
        sellingPrice: 700,
        discount: 1000,
        tax: 2340,
        lineTotal: 15340
      }
    ],
    subtotal: 14000,
    totalDiscount: 1000,
    totalTax: 2340,
    total: 15340,
    saleChannel: 'Offline',
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    amountReceived: 15340,
    pendingAmount: 0,
    status: 'Active',
    notes: 'Self pickup.'
  },
  {
    id: 'sale-2',
    saleNumber: 'SAL-2026-0002',
    saleDate: '2026-08-22',
    customerId: 'cust-2',
    customerNameSnapshot: 'Amit Patel',
    customerPhoneSnapshot: '9823456789',
    items: [
      {
        productId: 'prod-1',
        variantId: 'var-1-2',
        productNameSnapshot: 'Glass',
        variantNameSnapshot: '6mm Clear',
        skuSnapshot: 'GLS-6CLR',
        quantity: 50,
        sellingPrice: 750,
        discount: 2000,
        tax: 6390,
        lineTotal: 41890
      }
    ],
    subtotal: 37500,
    totalDiscount: 2000,
    totalTax: 6390,
    total: 41890,
    saleChannel: 'Online',
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Partially Paid',
    amountReceived: 30000,
    pendingAmount: 11890,
    status: 'Active',
    notes: 'To be dispatched via transport.'
  },
  {
    id: 'sale-3',
    saleNumber: 'SAL-2026-0003',
    saleDate: '2026-08-22',
    customerId: 'cust-1',
    customerNameSnapshot: 'Rahul Sharma',
    customerPhoneSnapshot: '9876543210',
    items: [
      {
        productId: 'prod-1',
        variantId: 'var-1-3',
        productNameSnapshot: 'Glass',
        variantNameSnapshot: '8mm Toughened',
        skuSnapshot: 'GLS-8TGH',
        quantity: 18,
        sellingPrice: 900,
        discount: 500,
        tax: 2826,
        lineTotal: 18526
      }
    ],
    subtotal: 16200,
    totalDiscount: 500,
    totalTax: 2826,
    total: 18526,
    saleChannel: 'Offline',
    paymentMethod: 'Cash',
    paymentStatus: 'Pending',
    amountReceived: 0,
    pendingAmount: 18526,
    status: 'Active',
    notes: 'Urgent partition installation.'
  },
  {
    id: 'sale-4',
    saleNumber: 'SAL-2026-0004',
    saleDate: '2026-08-23',
    customerId: 'cust-3',
    customerNameSnapshot: 'Priya Singh',
    customerPhoneSnapshot: '7012345678',
    items: [
      {
        productId: 'prod-2',
        variantId: 'var-2-2',
        productNameSnapshot: 'Plywood',
        variantNameSnapshot: '18mm Marine Plywood',
        skuSnapshot: 'PLY-18MRN',
        quantity: 10,
        sellingPrice: 1200,
        discount: 500,
        tax: 2070,
        lineTotal: 13570
      }
    ],
    subtotal: 12000,
    totalDiscount: 500,
    totalTax: 2070,
    total: 13570,
    saleChannel: 'Online',
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    amountReceived: 13570,
    pendingAmount: 0,
    status: 'Active'
  }
];

export const INITIAL_QUOTATIONS: any[] = [
  {
    id: 'qtn-1',
    quotationNumber: 'QTN-2026-0001',
    date: '2026-08-21',
    validUntil: '2026-09-05',
    customerId: 'cust-1',
    customerName: 'Rahul Sharma',
    productId: 'prod-1',
    variantId: 'var-1-4',
    productName: 'Glass',
    variantName: '10mm Toughened',
    quantity: 30,
    rate: 1100,
    discount: 1000,
    tax: 5760,
    total: 37760,
    status: 'SENT',
    terms: '1. Delivery within 7 days of confirmation.\n2. 50% advance along with order.',
    notes: 'Rates quoted for Site A facade.'
  },
  {
    id: 'qtn-2',
    quotationNumber: 'QTN-2026-0002',
    date: '2026-08-22',
    validUntil: '2026-08-29',
    customerId: 'cust-2',
    customerName: 'Amit Patel',
    productId: 'prod-2',
    variantId: 'var-2-2',
    productName: 'Plywood',
    variantName: '18mm Marine Plywood',
    quantity: 10,
    rate: 1200,
    discount: 500,
    tax: 2070,
    total: 13570,
    status: 'CONVERTED',
    convertedSaleId: 'sale-4',
    terms: 'Valid for 7 days only due to market rate fluctuations.',
    notes: 'Converted to Sale SAL-2026-0004'
  }
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  // GLS-5CLR movements
  {
    id: 'mov-1',
    productId: 'prod-1',
    productName: 'Glass',
    variantId: 'var-1-1',
    variantName: '5mm Clear',
    quantityChange: 100,
    transactionType: 'OPENING_STOCK',
    referenceId: 'prod-1',
    referenceNumber: 'OPN-GLS-5CLR',
    balanceAfter: 100,
    createdAt: '2026-08-15T10:00:00Z'
  },
  {
    id: 'mov-2',
    productId: 'prod-1',
    productName: 'Glass',
    variantId: 'var-1-1',
    variantName: '5mm Clear',
    quantityChange: -20,
    transactionType: 'SALE',
    referenceId: 'sale-1',
    referenceNumber: 'SAL-2026-0001',
    balanceAfter: 80,
    createdAt: '2026-08-20T10:00:00Z'
  },

  // GLS-6CLR movements
  {
    id: 'mov-3',
    productId: 'prod-1',
    productName: 'Glass',
    variantId: 'var-1-2',
    variantName: '6mm Clear',
    quantityChange: 100,
    transactionType: 'OPENING_STOCK',
    referenceId: 'prod-1',
    referenceNumber: 'OPN-GLS-6CLR',
    balanceAfter: 100,
    createdAt: '2026-08-15T10:00:00Z'
  },
  {
    id: 'mov-4',
    productId: 'prod-1',
    productName: 'Glass',
    variantId: 'var-1-2',
    variantName: '6mm Clear',
    quantityChange: 100,
    transactionType: 'PURCHASE',
    referenceId: 'pur-1',
    referenceNumber: 'PUR-2026-0001',
    balanceAfter: 200,
    createdAt: '2026-08-21T11:30:00Z'
  },
  {
    id: 'mov-5',
    productId: 'prod-1',
    productName: 'Glass',
    variantId: 'var-1-2',
    variantName: '6mm Clear',
    quantityChange: -50,
    transactionType: 'SALE',
    referenceId: 'sale-2',
    referenceNumber: 'SAL-2026-0002',
    balanceAfter: 150,
    createdAt: '2026-08-22T14:15:00Z'
  },

  // GLS-8TGH movements
  {
    id: 'mov-6',
    productId: 'prod-1',
    productName: 'Glass',
    variantId: 'var-1-3',
    variantName: '8mm Toughened',
    quantityChange: 50,
    transactionType: 'OPENING_STOCK',
    referenceId: 'prod-1',
    referenceNumber: 'OPN-GLS-8TGH',
    balanceAfter: 50,
    createdAt: '2026-08-15T10:00:00Z'
  },
  {
    id: 'mov-7',
    productId: 'prod-1',
    productName: 'Glass',
    variantId: 'var-1-3',
    variantName: '8mm Toughened',
    quantityChange: -18,
    transactionType: 'SALE',
    referenceId: 'sale-3',
    referenceNumber: 'SAL-2026-0003',
    balanceAfter: 32,
    createdAt: '2026-08-22T16:00:00Z'
  },

  // GLS-10TGH movements
  {
    id: 'mov-8',
    productId: 'prod-1',
    productName: 'Glass',
    variantId: 'var-1-4',
    variantName: '10mm Toughened',
    quantityChange: 40,
    transactionType: 'OPENING_STOCK',
    referenceId: 'prod-1',
    referenceNumber: 'OPN-GLS-10TGH',
    balanceAfter: 40,
    createdAt: '2026-08-15T10:00:00Z'
  },

  // Wood movements
  {
    id: 'mov-9',
    productId: 'prod-2',
    productName: 'Plywood',
    variantId: 'var-2-1',
    variantName: '12mm Marine Plywood',
    quantityChange: 30,
    transactionType: 'OPENING_STOCK',
    referenceId: 'prod-2',
    referenceNumber: 'OPN-WD-12MRN',
    balanceAfter: 30,
    createdAt: '2026-08-16T11:00:00Z'
  },
  {
    id: 'mov-10',
    productId: 'prod-2',
    productName: 'Plywood',
    variantId: 'var-2-2',
    variantName: '18mm Marine Plywood',
    quantityChange: 25,
    transactionType: 'OPENING_STOCK',
    referenceId: 'prod-2',
    referenceNumber: 'OPN-WD-18MRN',
    balanceAfter: 25,
    createdAt: '2026-08-16T11:00:00Z'
  },
  {
    id: 'mov-11',
    productId: 'prod-2',
    productName: 'Plywood',
    variantId: 'var-2-2',
    variantName: '18mm Marine Plywood',
    quantityChange: -10,
    transactionType: 'SALE',
    referenceId: 'sale-4',
    referenceNumber: 'SAL-2026-0004',
    balanceAfter: 15,
    createdAt: '2026-08-23T11:00:00Z'
  },

  // Steel movements
  {
    id: 'mov-12',
    productId: 'prod-3',
    productName: 'Steel Rebar',
    variantId: 'var-3-1',
    variantName: '10mm TMT Bar',
    quantityChange: 1000,
    transactionType: 'OPENING_STOCK',
    referenceId: 'prod-3',
    referenceNumber: 'OPN-STL-10TMT',
    balanceAfter: 1000,
    createdAt: '2026-08-17T09:00:00Z'
  },
  {
    id: 'mov-13',
    productId: 'prod-3',
    productName: 'Steel Rebar',
    variantId: 'var-3-1',
    variantName: '10mm TMT Bar',
    quantityChange: 500,
    transactionType: 'PURCHASE',
    referenceId: 'pur-2',
    referenceNumber: 'PUR-2026-0002',
    balanceAfter: 1500,
    createdAt: '2026-08-22T10:15:00Z'
  },
  {
    id: 'mov-14',
    productId: 'prod-3',
    productName: 'Steel Rebar',
    variantId: 'var-3-2',
    variantName: '12mm TMT Bar',
    quantityChange: 800,
    transactionType: 'OPENING_STOCK',
    referenceId: 'prod-3',
    referenceNumber: 'OPN-STL-12TMT',
    balanceAfter: 800,
    createdAt: '2026-08-17T09:00:00Z'
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    paymentNumber: 'PAY-2026-0001',
    saleId: 'sale-1',
    amount: 15340,
    paymentDate: '2026-08-20',
    paymentMethod: 'UPI',
    paymentType: 'SALE_RECEIPT',
    status: 'Active',
    notes: 'Paid fully at counter'
  },
  {
    id: 'pay-2',
    paymentNumber: 'PAY-2026-0002',
    saleId: 'sale-2',
    amount: 30000,
    paymentDate: '2026-08-22',
    paymentMethod: 'Bank Transfer',
    paymentType: 'SALE_RECEIPT',
    status: 'Active',
    notes: 'Part payment'
  },
  {
    id: 'pay-3',
    paymentNumber: 'PAY-2026-0003',
    saleId: 'sale-4',
    amount: 13570,
    paymentDate: '2026-08-23',
    paymentMethod: 'Card',
    paymentType: 'SALE_RECEIPT',
    status: 'Active',
    notes: 'Payment via online POS gateway'
  }
];
