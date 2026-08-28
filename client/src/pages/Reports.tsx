import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, TrendingUp, ShoppingBag, ArrowRight, DollarSign, 
  Download, Printer, Search, Calendar, Users, Truck, Receipt, Eye 
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { reportApi, invoiceApi } from '../api/services';
import { formatCurrency, formatDate } from '../utils';

export const Reports: React.FC = () => {
  const { customers, suppliers, fetchCustomers, fetchSuppliers } = useInventoryStore();
  
  // States
  const [activeTab, setActiveTab] = useState<'sales' | 'purchases' | 'inventory' | 'payments' | 'customers' | 'suppliers' | 'invoices'>('sales');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('All');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedChannel, setSelectedChannel] = useState<string>('All');

  // Loaded Report Data States
  const [salesReport, setSalesReport] = useState<any>(null);
  const [purchasesReport, setPurchasesReport] = useState<any>(null);
  const [inventoryReport, setInventoryReport] = useState<any>(null);
  const [paymentsReport, setPaymentsReport] = useState<any>(null);
  const [customersReport, setCustomersReport] = useState<any[]>([]);
  const [suppliersReport, setSuppliersReport] = useState<any[]>([]);
  const [invoicesReport, setInvoicesReport] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initial dependencies loading
  useEffect(() => {
    fetchCustomers();
    fetchSuppliers();
  }, []);

  // Reload report on parameter changes
  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    const dateParams = {
      from: fromDate || undefined,
      to: toDate || undefined,
      search: searchQuery || undefined
    };

    try {
      switch (activeTab) {
        case 'sales': {
          const res = await reportApi.getSales({
            ...dateParams,
            customerId: selectedCustomerId !== 'All' ? selectedCustomerId : undefined,
            saleChannel: selectedChannel !== 'All' ? selectedChannel : undefined,
            paymentStatus: selectedStatus !== 'All' ? selectedStatus : undefined
          });
          setSalesReport(res.data);
          break;
        }
        case 'purchases': {
          const res = await reportApi.getPurchases({
            ...dateParams,
            supplierId: selectedSupplierId !== 'All' ? selectedSupplierId : undefined
          });
          setPurchasesReport(res.data);
          break;
        }
        case 'inventory': {
          const res = await reportApi.getInventory({
            search: searchQuery || undefined,
            status: selectedStatus || undefined
          });
          setInventoryReport(res.data);
          break;
        }
        case 'payments': {
          const res = await reportApi.getPayments({
            ...dateParams,
            customerId: selectedCustomerId !== 'All' ? selectedCustomerId : undefined
          });
          setPaymentsReport(res.data);
          break;
        }
        case 'customers': {
          const res = await reportApi.getCustomers();
          setCustomersReport(res.data);
          break;
        }
        case 'suppliers': {
          const res = await reportApi.getSuppliers();
          setSuppliersReport(res.data);
          break;
        }
        case 'invoices': {
          const res = await invoiceApi.getAll({
            ...dateParams,
            customerId: selectedCustomerId !== 'All' ? selectedCustomerId : undefined,
            paymentStatus: selectedStatus !== 'All' ? selectedStatus : undefined
          });
          setInvoicesReport(res.data);
          break;
        }
        default:
          break;
      }
    } catch (err: any) {
      setError('Unable to load report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [activeTab, fromDate, toDate, searchQuery, selectedCustomerId, selectedSupplierId, selectedStatus, selectedChannel]);

  const handlePrint = () => {
    window.print();
  };

  // CSV Exporter
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    let filename = `report-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;

    switch (activeTab) {
      case 'sales': {
        if (!salesReport) return;
        csvContent += "Metric,Value\n";
        csvContent += `Total Sales,${salesReport.summary.totalSales}\n`;
        csvContent += `Number of Sales,${salesReport.summary.count}\n`;
        csvContent += `Average Sale Value,${salesReport.summary.averageSaleValue}\n`;
        csvContent += `Total Discount,${salesReport.summary.totalDiscount}\n`;
        csvContent += `Total Tax,${salesReport.summary.totalTax}\n`;
        csvContent += `Gross Sales Value,${salesReport.summary.grossSalesValue}\n`;
        csvContent += `Net Sales Value,${salesReport.summary.netSalesValue}\n\n`;
        
        csvContent += "Top Selling Products\nProduct,Variant,SKU,Quantity Sold,Sales Amount\n";
        salesReport.topSellingProducts.forEach((p: any) => {
          csvContent += `"${p.productName}","${p.variantName}",${p.sku},${p.quantitySold},${p.salesAmount}\n`;
        });
        break;
      }
      case 'purchases': {
        if (!purchasesReport) return;
        csvContent += "Metric,Value\n";
        csvContent += `Total Purchases Cost,${purchasesReport.summary.totalPurchases}\n`;
        csvContent += `Number of Purchases,${purchasesReport.summary.count}\n`;
        csvContent += `Amount Paid,${purchasesReport.summary.amountPaid}\n`;
        csvContent += `Amount Pending,${purchasesReport.summary.amountPending}\n`;
        break;
      }
      case 'inventory': {
        if (!inventoryReport) return;
        csvContent += "Product,Variant,SKU,Opening Stock,Current Stock,Units Sold,Cost Basis,Stock Value,Status\n";
        inventoryReport.rows.forEach((r: any) => {
          csvContent += `"${r.productName}","${r.variantName}",${r.sku},${r.openingStock},${r.currentStock},${r.unitsSold},${r.costBasis},${r.stockValue},${r.status}\n`;
        });
        break;
      }
      case 'payments': {
        if (!paymentsReport) return;
        csvContent += "Payment Method,Total Amount,Transaction Count\n";
        paymentsReport.paymentMethodBreakdown.forEach((p: any) => {
          csvContent += `"${p.method}",${p.amount},${p.count}\n`;
        });
        break;
      }
      case 'customers': {
        csvContent += "Customer Name,Orders Count,Total Purchased,Amount Paid,Amount Pending\n";
        customersReport.forEach((c: any) => {
          csvContent += `"${c.customerName}",${c.ordersCount},${c.totalPurchased},${c.amountPaid},${c.amountPending}\n`;
        });
        break;
      }
      case 'suppliers': {
        csvContent += "Supplier Name,Purchases Count,Total Purchased,Amount Paid,Amount Pending\n";
        suppliersReport.forEach((s: any) => {
          csvContent += `"${s.supplierName}",${s.purchasesCount},${s.totalPurchased},${s.amountPaid},${s.amountPending}\n`;
        });
        break;
      }
      case 'invoices': {
        csvContent += "Invoice No,Sale No,Customer Name,Invoice Date,Grand Total,Amount Paid,Amount Pending,Status\n";
        invoicesReport.forEach((inv: any) => {
          csvContent += `"${inv.invoiceNumber}","${inv.saleNumber}","${inv.customerNameSnapshot}","${inv.invoiceDate}",${inv.grandTotal},${inv.amountPaid},${inv.amountPending},"${inv.paymentStatus}"\n`;
        });
        break;
      }
      default:
        break;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Analytics & Reports</h2>
          <p className="text-xs text-gray-500">Review commercial turns, supplier purchases cost margins, and customer ledgers.</p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-200 transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold bg-brand-500 hover:bg-brand-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs list selector (Hidden in Print) */}
      <div className="flex overflow-x-auto bg-white border border-gray-200 rounded-xl p-1 gap-1 print:hidden shadow-sm">
        {[
          { id: 'sales', label: 'Sales Report', icon: TrendingUp },
          { id: 'purchases', label: 'Purchases Report', icon: ShoppingBag },
          { id: 'inventory', label: 'Inventory Stock', icon: BarChart3 },
          { id: 'payments', label: 'Payments Report', icon: DollarSign },
          { id: 'customers', label: 'Customer Receivables', icon: Users },
          { id: 'suppliers', label: 'Supplier Payables', icon: Truck },
          { id: 'invoices', label: 'Invoices Audit', icon: Receipt }
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id as any);
                setSearchQuery('');
                setSelectedCustomerId('All');
                setSelectedSupplierId('All');
                setSelectedStatus('All');
                setSelectedChannel('All');
              }}
              className={`flex items-center space-x-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-gray-50 text-brand-600 border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter toolbar (Hidden in Print) */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center print:hidden shadow-sm">
        {/* Search */}
        {['sales', 'purchases', 'inventory', 'payments', 'invoices'].includes(activeTab) && (
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search in this report..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        )}

        {/* Date Ranges */}
        {['sales', 'purchases', 'payments', 'invoices'].includes(activeTab) && (
          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <span className="text-gray-400 text-xs">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        )}

        {/* Customer Select dropdown */}
        {['sales', 'payments', 'invoices'].includes(activeTab) && (
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="All">All Customers</option>
            <option value="Walk-in">Walk-in Customers</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}

        {/* Supplier Select dropdown */}
        {activeTab === 'purchases' && (
          <select
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="All">All Suppliers</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}

        {/* Status Dropdowns */}
        {['sales', 'invoices'].includes(activeTab) && (
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Pending">Pending</option>
          </select>
        )}

        {/* Channel dropdown */}
        {activeTab === 'sales' && (
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="All">All Channels</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center text-sm font-semibold shadow-sm">
          {error}
        </div>
      )}

      {/* Loader */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
        </div>
      ) : (
        /* Report Tables and Views Container */
        <div className="space-y-6 print:space-y-4">
          
          {/* Printable Report Title Header (Hidden in app, shown in print) */}
          <div className="hidden print:block border-b border-gray-300 pb-3 mb-6">
            <h1 className="text-xl font-bold text-black uppercase tracking-wider">Business Audit Report: {activeTab.toUpperCase()}</h1>
            <p className="text-xs text-gray-500 font-mono">Date Generated: {new Date().toLocaleDateString()}</p>
          </div>

          {/* 1. SALES REPORT TAB */}
          {activeTab === 'sales' && salesReport && (
            <div className="space-y-6">
              {/* Sales KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <span className="text-xs text-gray-500 font-semibold block uppercase tracking-wider">Net Sales (Revenue)</span>
                  <span className="text-xl font-bold text-gray-900 font-mono mt-1 block">{formatCurrency(salesReport.summary.totalSales)}</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <span className="text-xs text-gray-500 font-semibold block uppercase tracking-wider">Sales Count</span>
                  <span className="text-xl font-bold text-gray-900 font-mono mt-1 block">{salesReport.summary.count} sales</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <span className="text-xs text-gray-500 font-semibold block uppercase tracking-wider">Avg Sale Value</span>
                  <span className="text-xl font-bold text-gray-900 font-mono mt-1 block">{formatCurrency(salesReport.summary.averageSaleValue)}</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <span className="text-xs text-gray-500 font-semibold block uppercase tracking-wider">Discounts Given</span>
                  <span className="text-xl font-bold text-red-600 font-mono mt-1 block">-{formatCurrency(salesReport.summary.totalDiscount)}</span>
                </div>
              </div>

              {/* Profit Warning Limitations Banner (Requirement 19 & 55) */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 leading-relaxed shadow-sm">
                <strong>IMPORTANT Profit & Loss Notice:</strong> Profit calculation requires cost-basis/COGS data. Since the application currently retrieves variant cost-basis only from recorded Purchase orders, a comprehensive profit audit is limited. Indicative gross values: Subtotal Gross: {formatCurrency(salesReport.summary.grossSalesValue)}, Taxes Collected: {formatCurrency(salesReport.summary.totalTax)}.
              </div>

              {/* Top Selling Products Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm space-y-0">
                <div className="p-5 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Top Selling Items in Period</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                        <th className="px-5 py-3">Product Name</th>
                        <th className="px-5 py-3">Variant</th>
                        <th className="px-5 py-3">SKU</th>
                        <th className="px-5 py-3 text-right">Quantity Sold</th>
                        <th className="px-5 py-3 text-right">Sales Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {salesReport.topSellingProducts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-500">No sales transactions found.</td>
                        </tr>
                      ) : (
                        salesReport.topSellingProducts.map((p: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4 font-semibold text-gray-900">{p.productName}</td>
                            <td className="px-5 py-4">{p.variantName}</td>
                            <td className="px-5 py-4 font-mono text-gray-500 text-xs">{p.sku}</td>
                            <td className="px-5 py-4 text-right font-bold font-mono text-gray-800">{p.quantitySold}</td>
                            <td className="px-5 py-4 text-right font-mono text-emerald-700 font-bold">{formatCurrency(p.salesAmount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. PURCHASES REPORT TAB */}
          {activeTab === 'purchases' && purchasesReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <span className="text-xs text-gray-500 font-semibold block uppercase tracking-wider">Total Purchases</span>
                  <span className="text-xl font-bold text-gray-900 font-mono mt-1 block">{formatCurrency(purchasesReport.summary.totalPurchases)}</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <span className="text-xs text-gray-500 font-semibold block uppercase tracking-wider">Purchases Count</span>
                  <span className="text-xl font-bold text-gray-900 font-mono mt-1 block">{purchasesReport.summary.count} bills</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <span className="text-xs text-gray-500 font-semibold block uppercase tracking-wider">Amount Paid</span>
                  <span className="text-xl font-bold text-emerald-700 font-mono mt-1 block">{formatCurrency(purchasesReport.summary.amountPaid)}</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <span className="text-xs text-gray-500 font-semibold block uppercase tracking-wider">Outstanding Debt</span>
                  <span className="text-xl font-bold text-amber-600 font-mono mt-1 block">{formatCurrency(purchasesReport.summary.amountPending)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. INVENTORY REPORT TAB */}
          {activeTab === 'inventory' && inventoryReport && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row justify-between md:items-center shadow-sm">
                <div>
                  <span className="text-xs text-gray-500 font-semibold block uppercase tracking-wider">Estimated Inventory Valuation</span>
                  <h3 className="text-2xl font-bold text-gray-900 font-mono mt-1">{formatCurrency(inventoryReport.summary.totalStockValue)}</h3>
                </div>
                <div className="text-left md:text-right text-xs text-gray-400 italic mt-3 md:mt-0">
                  * Based on purchase prices of latest vendor orders.
                </div>
              </div>

              {/* Inventory details grid */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm space-y-0">
                <div className="p-5 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Inventory Stock Ledger Valuation</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                        <th className="px-5 py-3">Product Name</th>
                        <th className="px-5 py-3">Variant Name</th>
                        <th className="px-5 py-3">SKU</th>
                        <th className="px-5 py-3 text-right">Opening Stock</th>
                        <th className="px-5 py-3 text-right">Current Stock</th>
                        <th className="px-5 py-3 text-right">Units Sold</th>
                        <th className="px-5 py-3 text-right">Cost Price (Est)</th>
                        <th className="px-5 py-3 text-right">Stock Value</th>
                        <th className="px-5 py-3 text-center">Status</th>
                        <th className="px-5 py-3 text-right print:hidden">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {inventoryReport.rows.map((row: any, idx: number) => {
                        const isLow = row.currentStock <= row.minAlertLevel;
                        return (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4 font-semibold text-gray-900">{row.productName}</td>
                            <td className="px-5 py-4">{row.variantName}</td>
                            <td className="px-5 py-4 font-mono text-gray-500 text-xs">{row.sku}</td>
                            <td className="px-5 py-4 text-right font-mono">{row.openingStock}</td>
                            <td className="px-5 py-4 text-right font-mono">
                              <span className={isLow ? "text-red-600 font-bold" : "text-gray-900"}>{row.currentStock}</span>
                            </td>
                            <td className="px-5 py-4 text-right font-mono">{row.unitsSold}</td>
                            <td className="px-5 py-4 text-right font-mono">{formatCurrency(row.costBasis)}</td>
                            <td className="px-5 py-4 text-right font-mono font-bold text-gray-900">{formatCurrency(row.stockValue)}</td>
                            <td className="px-5 py-4 text-center">
                              <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                isLow ? "bg-red-50 text-red-600 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}>
                                {isLow ? 'LOW STOCK' : 'OK'}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right print:hidden">
                              <Link
                                to={`/inventory/products/${row.productId}`}
                                className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-gray-100 inline-block transition-colors"
                                title="View product stock movements"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. PAYMENTS REPORT TAB */}
          {activeTab === 'payments' && paymentsReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <span className="text-xs text-gray-500 font-semibold block uppercase tracking-wider">Total Payments Collected</span>
                  <span className="text-xl font-bold text-gray-900 font-mono mt-1 block">{formatCurrency(paymentsReport.summary.totalAmount)}</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <span className="text-xs text-gray-500 font-semibold block uppercase tracking-wider">Collected Transactions</span>
                  <span className="text-xl font-bold text-gray-900 font-mono mt-1 block">{paymentsReport.summary.count} entries</span>
                </div>
              </div>

              {/* Payment Methods breakdown */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Breakdown by Payment Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {paymentsReport.paymentMethodBreakdown.map((pm: any) => (
                    <div key={pm.method} className="bg-gray-50 border border-gray-200 p-5 rounded-xl shadow-sm">
                      <span className="text-xs text-gray-500 font-semibold block uppercase tracking-wider">{pm.method}</span>
                      <div className="flex justify-between items-baseline mt-2">
                        <span className="text-xl font-bold text-gray-900 font-mono">{formatCurrency(pm.amount)}</span>
                        <span className="text-sm text-gray-500">({pm.count} collections)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. CUSTOMER RECEIVABLES TAB */}
          {activeTab === 'customers' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm space-y-0">
              <div className="p-5 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Customer Outstanding Receivables</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3 text-center">Orders Count</th>
                      <th className="px-5 py-3 text-right">Total Purchased</th>
                      <th className="px-5 py-3 text-right">Amount Paid</th>
                      <th className="px-5 py-3 text-right">Pending Balance</th>
                      <th className="px-5 py-3 text-right print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {customersReport.map((row: any) => (
                      <tr key={row.customerId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 font-semibold text-gray-900">{row.customerName}</td>
                        <td className="px-5 py-4 text-center font-mono">{row.ordersCount}</td>
                        <td className="px-5 py-4 text-right font-mono">{formatCurrency(row.totalPurchased)}</td>
                        <td className="px-5 py-4 text-right font-mono text-emerald-700">{formatCurrency(row.amountPaid)}</td>
                        <td className={`px-5 py-4 text-right font-mono font-bold ${row.amountPending > 0 ? "text-amber-600" : "text-gray-900"}`}>
                          {formatCurrency(row.amountPending)}
                        </td>
                        <td className="px-5 py-4 text-right print:hidden">
                          <Link
                            to={`/customers/${row.customerId}`}
                            className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-gray-100 inline-block transition-colors"
                            title="View Customer ledger profile"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. SUPPLIER PAYABLES TAB */}
          {activeTab === 'suppliers' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm space-y-0">
              <div className="p-5 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Supplier Outstanding Payables</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                      <th className="px-5 py-3">Supplier</th>
                      <th className="px-5 py-3 text-center">Purchases Count</th>
                      <th className="px-5 py-3 text-right">Total Purchased</th>
                      <th className="px-5 py-3 text-right">Amount Paid</th>
                      <th className="px-5 py-3 text-right">Pending Balance</th>
                      <th className="px-5 py-3 text-right print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {suppliersReport.map((row: any) => (
                      <tr key={row.supplierId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 font-semibold text-gray-900">{row.supplierName}</td>
                        <td className="px-5 py-4 text-center font-mono">{row.purchasesCount}</td>
                        <td className="px-5 py-4 text-right font-mono">{formatCurrency(row.totalPurchased)}</td>
                        <td className="px-5 py-4 text-right font-mono text-emerald-700">{formatCurrency(row.amountPaid)}</td>
                        <td className={`px-5 py-4 text-right font-mono font-bold ${row.amountPending > 0 ? "text-amber-600" : "text-gray-900"}`}>
                          {formatCurrency(row.amountPending)}
                        </td>
                        <td className="px-5 py-4 text-right print:hidden">
                          <Link
                            to={`/suppliers/${row.supplierId}`}
                            className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-gray-100 inline-block transition-colors"
                            title="View Supplier ledger profile"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. INVOICES AUDIT TAB */}
          {activeTab === 'invoices' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm space-y-0">
              <div className="p-5 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Issued Invoices Reconciliation</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                      <th className="px-5 py-3">Invoice No</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Sale No</th>
                      <th className="px-5 py-3 text-right">Grand Total</th>
                      <th className="px-5 py-3 text-right">Amount Paid</th>
                      <th className="px-5 py-3 text-right">Amount Pending</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-right print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {invoicesReport.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-gray-900">{inv.invoiceNumber}</td>
                        <td className="px-5 py-4 font-mono text-gray-500 text-xs">{formatDate(inv.invoiceDate)}</td>
                        <td className="px-5 py-4 font-semibold text-gray-800">{inv.customerNameSnapshot}</td>
                        <td className="px-5 py-4 font-mono text-gray-500 text-xs">{inv.saleNumber}</td>
                        <td className="px-5 py-4 text-right font-mono font-bold text-gray-900">{formatCurrency(inv.grandTotal)}</td>
                        <td className="px-5 py-4 text-right font-mono text-emerald-700">{formatCurrency(inv.amountPaid)}</td>
                        <td className="px-5 py-4 text-right font-mono text-gray-700">{formatCurrency(inv.amountPending)}</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            inv.paymentStatus === 'Paid' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {inv.paymentStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right print:hidden">
                          <Link
                            to={`/invoices/${inv.id}`}
                            className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-gray-100 inline-block transition-colors"
                            title="View Invoice Document details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
