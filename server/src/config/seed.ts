import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { Supplier } from '../models/Supplier.js';
import { Purchase } from '../models/Purchase.js';
import { Sale } from '../models/Sale.js';
import { Payment } from '../models/Payment.js';
import { Quotation } from '../models/Quotation.js';
import { StockMovement } from '../models/StockMovement.js';
import { Invoice } from '../models/Invoice.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_app';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected. Clearing collections...');

    // Clear existing collections
    await Product.deleteMany({});
    await Customer.deleteMany({});
    await Supplier.deleteMany({});
    await Purchase.deleteMany({});
    await Sale.deleteMany({});
    await Payment.deleteMany({});
    await Quotation.deleteMany({});
    await StockMovement.deleteMany({});
    await Invoice.deleteMany({});

    console.log('Collections cleared. Inserting master products...');

    // 1. Seed Products and Variants
    const p1Id = new mongoose.Types.ObjectId();
    const p2Id = new mongoose.Types.ObjectId();
    const p3Id = new mongoose.Types.ObjectId();

    const var11Id = new mongoose.Types.ObjectId();
    const var12Id = new mongoose.Types.ObjectId();
    const var13Id = new mongoose.Types.ObjectId();
    const var14Id = new mongoose.Types.ObjectId();

    const var21Id = new mongoose.Types.ObjectId();
    const var22Id = new mongoose.Types.ObjectId();

    const var31Id = new mongoose.Types.ObjectId();
    const var32Id = new mongoose.Types.ObjectId();

    const productsData = [
      {
        _id: p1Id,
        name: 'Glass',
        category: 'Glass',
        description: 'High-quality architectural float and toughened glass products.',
        unit: 'sqft',
        minStockLevel: 50,
        isActive: true,
        variants: [
          {
            _id: var11Id,
            sku: 'GLS-5CLR',
            name: '5mm Clear',
            image: 'https://images.unsplash.com/photo-1595429035839-c99c298ffdec?q=80&w=300&auto=format&fit=crop',
            openingStock: 100,
            cachedStock: 80,
            isActive: true
          },
          {
            _id: var12Id,
            sku: 'GLS-6CLR',
            name: '6mm Clear',
            image: 'https://images.unsplash.com/photo-1595429035839-c99c298ffdec?q=80&w=300&auto=format&fit=crop',
            openingStock: 100,
            cachedStock: 150,
            isActive: true
          },
          {
            _id: var13Id,
            sku: 'GLS-8TGH',
            name: '8mm Toughened',
            image: 'https://images.unsplash.com/photo-1595429035839-c99c298ffdec?q=80&w=300&auto=format&fit=crop',
            openingStock: 50,
            cachedStock: 32,
            isActive: true
          },
          {
            _id: var14Id,
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
        _id: p2Id,
        name: 'Plywood',
        category: 'Wood',
        description: 'Marine grade and commercial plywood sheets.',
        unit: 'pcs',
        minStockLevel: 20,
        isActive: true,
        variants: [
          {
            _id: var21Id,
            sku: 'WD-12MRN',
            name: '12mm Marine Plywood',
            openingStock: 30,
            cachedStock: 30,
            isActive: true
          },
          {
            _id: var22Id,
            sku: 'WD-18MRN',
            name: '18mm Marine Plywood',
            openingStock: 25,
            cachedStock: 15,
            isActive: true
          }
        ]
      },
      {
        _id: p3Id,
        name: 'Steel Rebar',
        category: 'Steel',
        description: 'TMT reinforcement bars for construction.',
        unit: 'kg',
        minStockLevel: 500,
        isActive: true,
        variants: [
          {
            _id: var31Id,
            sku: 'STL-10TMT',
            name: '10mm TMT Bar',
            openingStock: 1000,
            cachedStock: 1500,
            isActive: true
          },
          {
            _id: var32Id,
            sku: 'STL-12TMT',
            name: '12mm TMT Bar',
            openingStock: 800,
            cachedStock: 800,
            isActive: true
          }
        ]
      }
    ];

    await Product.insertMany(productsData);
    console.log('Products inserted. Seeding Customers...');

    // 2. Seed Customers
    const c1Id = new mongoose.Types.ObjectId();
    const c2Id = new mongoose.Types.ObjectId();
    const c3Id = new mongoose.Types.ObjectId();

    const customersData = [
      {
        _id: c1Id,
        name: 'Rahul Sharma',
        phone: '9876543210',
        email: 'rahul.sharma@gmail.com',
        address: '102, Shanti Nagar, Jaipur, Rajasthan - 302012',
        gstNumber: '08AAAAA1111A1Z1',
        notes: 'Premium regular builder client.',
        isActive: true,
        deletedAt: null
      },
      {
        _id: c2Id,
        name: 'Amit Patel',
        phone: '9823456789',
        email: 'amit.patel@yahoo.com',
        address: 'G-4, Corporate Plaza, SG Highway, Ahmedabad - 380054',
        gstNumber: '24BBBBB2222B2Z2',
        notes: 'Requires delivery tracking info promptly.',
        isActive: true,
        deletedAt: null
      },
      {
        _id: c3Id,
        name: 'Priya Singh',
        phone: '7012345678',
        email: 'priya.singh@outlook.com',
        address: 'Sector 15, Dwarka, New Delhi - 110075',
        isActive: true,
        deletedAt: null
      }
    ];

    await Customer.insertMany(customersData);
    // 3. Seed Suppliers
    const sup1Id = new mongoose.Types.ObjectId();
    const sup2Id = new mongoose.Types.ObjectId();

    const suppliersData = [
      {
        _id: sup1Id,
        name: 'ABC Glass Supplier Ltd.',
        phone: '9876500001',
        email: 'sales@abcglass.com',
        address: 'Plot 45, GIDC Industrial Estate, Vadodara, Gujarat - 390010',
        gstNumber: '24ABCDE1234A1Z1',
        notes: 'Primary supplier for clear and float glass panels.'
      },
      {
        _id: sup2Id,
        name: 'Tata Steel Authorized Vendor',
        phone: '9876500002',
        email: 'info@tatasteelvendor.com',
        address: '12, Steel Yard Road, Kalamboli, Navi Mumbai, Maharashtra - 410218',
        gstNumber: '27TATAS5678B2Z2',
        notes: 'Main vendor for structural reinforcing bars.'
      }
    ];

    await Supplier.insertMany(suppliersData);
    console.log('Suppliers seeded. Seeding Purchases...');

    // 4. Seed Purchases
    const pur1Id = new mongoose.Types.ObjectId();
    const pur2Id = new mongoose.Types.ObjectId();

    const purchasesData = [
      {
        _id: pur1Id,
        purchaseNumber: 'PUR-2026-0001',
        supplierId: sup1Id,
        supplierNameSnapshot: 'ABC Glass Supplier Ltd.',
        purchaseDate: new Date('2026-08-21T11:30:00Z'),
        items: [
          {
            productId: p1Id,
            variantId: var12Id,
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
        _id: pur2Id,
        purchaseNumber: 'PUR-2026-0002',
        supplierId: sup2Id,
        supplierNameSnapshot: 'Tata Steel Authorized Vendor',
        purchaseDate: new Date('2026-08-22T10:15:00Z'),
        items: [
          {
            productId: p3Id,
            variantId: var31Id,
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

    await Purchase.insertMany(purchasesData);
    console.log('Purchases seeded. Seeding Sales...');

    // 4. Seed Sales
    const sale1Id = new mongoose.Types.ObjectId();
    const sale2Id = new mongoose.Types.ObjectId();
    const sale3Id = new mongoose.Types.ObjectId();
    const sale4Id = new mongoose.Types.ObjectId();

    const salesData = [
      {
        _id: sale1Id,
        saleNumber: 'SAL-2026-0001',
        saleDate: new Date('2026-08-20'),
        customerId: c1Id,
        customerNameSnapshot: 'Rahul Sharma',
        customerPhoneSnapshot: '9876543210',
        items: [
          {
            productId: p1Id,
            variantId: var11Id,
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
        _id: sale2Id,
        saleNumber: 'SAL-2026-0002',
        saleDate: new Date('2026-08-22'),
        customerId: c2Id,
        customerNameSnapshot: 'Amit Patel',
        customerPhoneSnapshot: '9823456789',
        items: [
          {
            productId: p1Id,
            variantId: var12Id,
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
        _id: sale3Id,
        saleNumber: 'SAL-2026-0003',
        saleDate: new Date('2026-08-22'),
        customerId: c1Id,
        customerNameSnapshot: 'Rahul Sharma',
        customerPhoneSnapshot: '9876543210',
        items: [
          {
            productId: p1Id,
            variantId: var13Id,
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
        _id: sale4Id,
        saleNumber: 'SAL-2026-0004',
        saleDate: new Date('2026-08-23'),
        customerId: c3Id,
        customerNameSnapshot: 'Priya Singh',
        customerPhoneSnapshot: '7012345678',
        items: [
          {
            productId: p2Id,
            variantId: var22Id,
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

    await Sale.insertMany(salesData);
    console.log('Sales seeded. Seeding Invoices & Payments...');

    // 5. Seed Invoices
    const invoicesData = [
      {
        invoiceNumber: 'INV-2026-0001',
        invoiceDate: new Date('2026-08-20'),
        saleId: sale1Id
      },
      {
        invoiceNumber: 'INV-2026-0002',
        invoiceDate: new Date('2026-08-22'),
        saleId: sale2Id
      },
      {
        invoiceNumber: 'INV-2026-0004',
        invoiceDate: new Date('2026-08-23'),
        saleId: sale4Id
      }
    ];

    await Invoice.insertMany(invoicesData);

    // 6. Seed Payments
    const paymentsData = [
      {
        paymentNumber: 'PAY-2026-0001',
        saleId: sale1Id,
        customerId: c1Id,
        amount: 15340,
        paymentDate: new Date('2026-08-20'),
        paymentMethod: 'UPI',
        paymentType: 'SALE_RECEIPT',
        status: 'Active',
        notes: 'Paid fully at counter'
      },
      {
        paymentNumber: 'PAY-2026-0002',
        saleId: sale2Id,
        customerId: c2Id,
        amount: 30000,
        paymentDate: new Date('2026-08-22'),
        paymentMethod: 'Bank Transfer',
        paymentType: 'SALE_RECEIPT',
        status: 'Active',
        notes: 'Part payment'
      },
      {
        paymentNumber: 'PAY-2026-0003',
        saleId: sale4Id,
        customerId: c3Id,
        amount: 13570,
        paymentDate: new Date('2026-08-23'),
        paymentMethod: 'Card',
        paymentType: 'SALE_RECEIPT',
        status: 'Active',
        notes: 'Payment via online POS gateway'
      }
    ];

    await Payment.insertMany(paymentsData);
    console.log('Payments & Invoices seeded. Seeding Quotations...');

    // 7. Seed Quotations
    const quotationsData = [
      {
        quotationNumber: 'QUO-2026-0001',
        quotationDate: new Date('2026-08-21'),
        expiryDate: new Date('2026-09-05'),
        customerId: c1Id,
        customerNameSnapshot: 'Rahul Sharma',
        customerPhoneSnapshot: '9876543210',
        items: [
          {
            productId: p1Id,
            variantId: var14Id,
            productNameSnapshot: 'Glass',
            variantNameSnapshot: '10mm Toughened',
            skuSnapshot: 'GLS-10TGH',
            quantity: 30,
            sellingPrice: 1100,
            discount: 1000,
            tax: 5760,
            lineTotal: 37760
          }
        ],
        subtotal: 33000,
        totalDiscount: 1000,
        totalTax: 5760,
        total: 37760,
        status: 'SENT',
        terms: '1. Delivery within 7 days of confirmation.\n2. 50% advance along with order.',
        notes: 'Rates quoted for Site A facade.'
      },
      {
        quotationNumber: 'QUO-2026-0002',
        quotationDate: new Date('2026-08-22'),
        expiryDate: new Date('2026-08-29'),
        customerId: c2Id,
        customerNameSnapshot: 'Amit Patel',
        customerPhoneSnapshot: '8765432109',
        items: [
          {
            productId: p2Id,
            variantId: var22Id,
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
        status: 'CONVERTED',
        convertedSaleId: sale4Id,
        convertedAt: new Date('2026-08-23'),
        terms: 'Valid for 7 days only due to market rate fluctuations.',
        notes: 'Converted to Sale SAL-2026-0004'
      }
    ];

    await Quotation.insertMany(quotationsData);
    console.log('Quotations seeded. Seeding Stock Movements...');

    // 8. Seed Stock Movements
    const movementsData = [
      // GLS-5CLR movements
      {
        productId: p1Id,
        variantId: var11Id,
        quantityChange: 100,
        transactionType: 'OPENING_STOCK',
        referenceId: p1Id,
        referenceNumber: 'OPN-GLS-5CLR',
        balanceAfter: 100,
        createdAt: new Date('2026-08-15T10:00:00Z')
      },
      {
        productId: p1Id,
        variantId: var11Id,
        quantityChange: -20,
        transactionType: 'SALE',
        referenceId: sale1Id,
        referenceNumber: 'SAL-2026-0001',
        balanceAfter: 80,
        createdAt: new Date('2026-08-20T10:00:00Z')
      },
      // GLS-6CLR movements
      {
        productId: p1Id,
        variantId: var12Id,
        quantityChange: 100,
        transactionType: 'OPENING_STOCK',
        referenceId: p1Id,
        referenceNumber: 'OPN-GLS-6CLR',
        balanceAfter: 100,
        createdAt: new Date('2026-08-15T10:00:00Z')
      },
      {
        productId: p1Id,
        variantId: var12Id,
        quantityChange: 100,
        transactionType: 'PURCHASE',
        referenceId: pur1Id,
        referenceNumber: 'PUR-2026-0001',
        balanceAfter: 200,
        createdAt: new Date('2026-08-21T11:30:00Z')
      },
      {
        productId: p1Id,
        variantId: var12Id,
        quantityChange: -50,
        transactionType: 'SALE',
        referenceId: sale2Id,
        referenceNumber: 'SAL-2026-0002',
        balanceAfter: 150,
        createdAt: new Date('2026-08-22T14:15:00Z')
      },
      // GLS-8TGH movements
      {
        productId: p1Id,
        variantId: var13Id,
        quantityChange: 50,
        transactionType: 'OPENING_STOCK',
        referenceId: p1Id,
        referenceNumber: 'OPN-GLS-8TGH',
        balanceAfter: 50,
        createdAt: new Date('2026-08-15T10:00:00Z')
      },
      {
        productId: p1Id,
        variantId: var13Id,
        quantityChange: -18,
        transactionType: 'SALE',
        referenceId: sale3Id,
        referenceNumber: 'SAL-2026-0003',
        balanceAfter: 32,
        createdAt: new Date('2026-08-22T16:00:00Z')
      },
      // GLS-10TGH movements
      {
        productId: p1Id,
        variantId: var14Id,
        quantityChange: 40,
        transactionType: 'OPENING_STOCK',
        referenceId: p1Id,
        referenceNumber: 'OPN-GLS-10TGH',
        balanceAfter: 40,
        createdAt: new Date('2026-08-15T10:00:00Z')
      },
      // Plywood 12mm
      {
        productId: p2Id,
        variantId: var21Id,
        quantityChange: 30,
        transactionType: 'OPENING_STOCK',
        referenceId: p2Id,
        referenceNumber: 'OPN-WD-12MRN',
        balanceAfter: 30,
        createdAt: new Date('2026-08-16T11:00:00Z')
      },
      // Plywood 18mm
      {
        productId: p2Id,
        variantId: var22Id,
        quantityChange: 25,
        transactionType: 'OPENING_STOCK',
        referenceId: p2Id,
        referenceNumber: 'OPN-WD-18MRN',
        balanceAfter: 25,
        createdAt: new Date('2026-08-16T11:00:00Z')
      },
      {
        productId: p2Id,
        variantId: var22Id,
        quantityChange: -10,
        transactionType: 'SALE',
        referenceId: sale4Id,
        referenceNumber: 'SAL-2026-0004',
        balanceAfter: 15,
        createdAt: new Date('2026-08-23T11:00:00Z')
      },
      // Steel 10mm
      {
        productId: p3Id,
        variantId: var31Id,
        quantityChange: 1000,
        transactionType: 'OPENING_STOCK',
        referenceId: p3Id,
        referenceNumber: 'OPN-STL-10TMT',
        balanceAfter: 1000,
        createdAt: new Date('2026-08-17T09:00:00Z')
      },
      {
        productId: p3Id,
        variantId: var31Id,
        quantityChange: 500,
        transactionType: 'PURCHASE',
        referenceId: pur2Id,
        referenceNumber: 'PUR-2026-0002',
        balanceAfter: 1500,
        createdAt: new Date('2026-08-22T10:15:00Z')
      },
      // Steel 12mm
      {
        productId: p3Id,
        variantId: var32Id,
        quantityChange: 800,
        transactionType: 'OPENING_STOCK',
        referenceId: p3Id,
        referenceNumber: 'OPN-STL-12TMT',
        balanceAfter: 800,
        createdAt: new Date('2026-08-17T09:00:00Z')
      }
    ];

    await StockMovement.insertMany(movementsData);

    console.log('Database seeded successfully! 🎉');
    await mongoose.connection.close();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
