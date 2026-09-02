import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Boxes, 
  ShoppingBag, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  ArrowRight,
  DollarSign,
  FileText,
  Truck,
  Receipt,
  Calendar,
  Layers
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { reportApi } from '../api/services';
import { formatCurrency, formatDate } from '../utils';

// ─── Polished Bar Chart ────────────────────────────────────────────────────────
interface BarChartProps {
  data: { date: string; amount: number; count?: number }[];
  color: string;       // e.g. '#10b981'
  hoverColor: string;  // e.g. '#34d399'
  labelSuffix?: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, color, hoverColor, labelSuffix = '' }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-52 flex items-center justify-center text-xs text-gray-400">
        No data available for this period.
      </div>
    );
  }

  // SVG dimensions
  const svgW = 100; // viewBox percentage units — responsive
  const chartH = 160; // px height of chart area
  const paddingLeft = 52;
  const paddingRight = 8;
  const paddingTop = 12;
  const paddingBottom = 36; // room for x-axis labels

  const maxVal = Math.max(...data.map(d => d.amount), 1);
  // Nice round Y-axis max
  const yMax = Math.ceil(maxVal / 10000) * 10000 || 1000;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => yMax * f);

  const plotW = 100 - paddingLeft - paddingRight; // percent
  const plotH = chartH - paddingTop - paddingBottom; // px

  const barGap = 0.25; // fraction of bar slot used for gap
  const n = data.length;
  const slotW = plotW / n;
  const barW = slotW * (1 - barGap);

  return (
    <div className="relative w-full" style={{ height: chartH + 'px' }}>
      <svg
        viewBox={`0 0 100 ${chartH}`}
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        style={{ overflow: 'visible' }}
      >
        {/* Y-axis gridlines */}
        {yTicks.map((tick, i) => {
          const yPx = paddingTop + plotH * (1 - tick / yMax);
          const yPct = (yPx / chartH) * 100;
          return (
            <line
              key={i}
              x1={paddingLeft}
              y1={`${yPct}%`}
              x2={100 - paddingRight}
              y2={`${yPct}%`}
              stroke="#EEF0F2"
              strokeWidth="0.4"
            />
          );
        })}

        {/* Bars */}
        {data.map((d, idx) => {
          const barH = (d.amount / yMax) * plotH;
          const x = paddingLeft + slotW * idx + (slotW - barW) / 2;
          const y = paddingTop + (plotH - barH);
          const isHovered = hoveredIdx === idx;
          return (
            <g key={idx}>
              <rect
                x={`${x}%`}
                y={`${(y / chartH) * 100}%`}
                width={`${barW}%`}
                height={`${(barH / chartH) * 100}%`}
                fill={isHovered ? hoverColor : color}
                rx="1"
                style={{ transition: 'fill 0.15s' }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            </g>
          );
        })}

        {/* X-axis baseline */}
        <line
          x1={paddingLeft}
          y1={`${((paddingTop + plotH) / chartH) * 100}%`}
          x2={100 - paddingRight}
          y2={`${((paddingTop + plotH) / chartH) * 100}%`}
          stroke="#E2E8F0"
          strokeWidth="0.5"
        />
      </svg>

      {/* Y-axis labels — positioned absolutely on left */}
      <div
        className="absolute top-0 left-0 flex flex-col justify-between pointer-events-none"
        style={{ width: paddingLeft + 'px', height: chartH - paddingBottom + 'px', paddingTop: paddingTop + 'px' }}
      >
        {[...yTicks].reverse().map((tick, i) => (
          <span key={i} className="text-[9px] text-gray-400 font-mono text-right pr-2 leading-none">
            {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick}
          </span>
        ))}
      </div>

      {/* X-axis date labels */}
      <div
        className="absolute bottom-0 left-0 right-0 flex"
        style={{ paddingLeft: paddingLeft + 'px', paddingRight: paddingRight + 'px', height: paddingBottom + 'px' }}
      >
        {data.map((d, idx) => (
          <div
            key={idx}
            className="flex-1 flex items-start justify-center"
            style={{ paddingTop: '6px' }}
          >
            <span
              className="text-[8.5px] text-gray-400 font-mono"
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {d.date.substring(5)}
            </span>
          </div>
        ))}
      </div>

      {/* Hover tooltip */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div
          className="absolute z-20 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 shadow-lg pointer-events-none whitespace-nowrap"
          style={{
            left: `calc(${paddingLeft}% + ${(hoveredIdx + 0.5) * (100 / data.length)}% * ${(100 - paddingLeft - paddingRight) / 100})`,
            top: '4px',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-bold">{formatCurrency(data[hoveredIdx].amount)}</div>
          {data[hoveredIdx].count !== undefined && (
            <div className="text-gray-500">{data[hoveredIdx].count} {labelSuffix}</div>
          )}
          <div className="text-gray-400">{data[hoveredIdx].date}</div>
        </div>
      )}
    </div>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accentColor: string;  // Tailwind bg class e.g. 'bg-emerald-500'
  iconBg: string;       // e.g. 'bg-emerald-500/10'
  borderAccent: string; // e.g. 'border-t-emerald-500'
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, icon, accentColor, iconBg, borderAccent }) => (
  <div className={`bg-white border border-gray-200 shadow-sm rounded-xl p-4 flex flex-col gap-3`}>
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
    </div>
    <div>
      <div className="text-xl font-bold text-gray-900 font-mono leading-tight">{value}</div>
      <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>
    </div>
  </div>
);

// ─── Dashboard Page ────────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const { dashboardStats, fetchDashboardStats, isLoading } = useInventoryStore();
  const [dateRange, setDateRange] = useState<string>('All Time');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');

  // Additional dynamic data for charts
  const [salesReportData, setSalesReportData] = useState<any>(null);
  const [purchasesReportData, setPurchasesReportData] = useState<any>(null);
  const [paymentsReportData, setPaymentsReportData] = useState<any>(null);

  const formatDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDateRangeParams = (range: string, fromVal?: string, toVal?: string) => {
    const now = new Date();
    let from = '';
    let to = '';

    switch (range) {
      case 'All Time': {
        from = '';
        to = '';
        break;
      }
      case 'Today': {
        from = formatDateString(now);
        to = formatDateString(now);
        break;
      }
      case 'Yesterday': {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        from = formatDateString(yesterday);
        to = formatDateString(yesterday);
        break;
      }
      case 'This Week': {
        const startOfWeek = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        from = formatDateString(startOfWeek);
        to = formatDateString(now);
        break;
      }
      case 'This Month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        from = formatDateString(startOfMonth);
        to = formatDateString(now);
        break;
      }
      case 'Last Month': {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        from = formatDateString(startOfLastMonth);
        to = formatDateString(endOfLastMonth);
        break;
      }
      case 'This Year': {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        from = formatDateString(startOfYear);
        to = formatDateString(now);
        break;
      }
      case 'Custom Range': {
        from = fromVal || '';
        to = toVal || '';
        break;
      }
      default:
        break;
    }
    return { from, to };
  };

  const loadAllStats = async () => {
    const params = getDateRangeParams(dateRange, customFrom, customTo);
    if (dateRange === 'Custom Range' && (!customFrom || !customTo)) {
      return; // Wait for both values
    }

    try {
      await fetchDashboardStats(params);

      // Load sales chart data
      const salesRes = await reportApi.getSales(params);
      setSalesReportData(salesRes.data);

      // Load purchases chart data
      const purchasesRes = await reportApi.getPurchases(params);
      setPurchasesReportData(purchasesRes.data);

      // Load payments chart data
      const paymentsRes = await reportApi.getPayments(params);
      setPaymentsReportData(paymentsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard charts:', err);
    }
  };

  useEffect(() => {
    loadAllStats();
  }, [dateRange, customFrom, customTo]);

  // Calculations for display
  const stats = dashboardStats || {
    totalSales: 0,
    totalPurchases: 0,
    amountReceived: 0,
    amountPending: 0,
    currentStockValue: 0,
    activeProductsCount: 0,
    customersCount: 0,
    suppliersCount: 0,
    invoicesCount: 0,
    lowStockItems: [],
    lowStockCount: 0
  };

  const renderChannelBreakdown = () => {
    if (!salesReportData || !salesReportData.salesByChannel || salesReportData.salesByChannel.length === 0) {
      return (
        <div className="h-28 flex items-center justify-center text-xs text-gray-400">
          No sales channels data.
        </div>
      );
    }

    return (
      <div className="space-y-3 pt-2">
        {salesReportData.salesByChannel.map((c: any) => (
          <div key={c.channel} className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span className="font-semibold">{c.channel.toUpperCase()}</span>
              <span className="font-mono">{c.percentage}% ({formatCurrency(c.amount)})</span>
            </div>
            <div className="w-full bg-gray-50 rounded-full h-1.5 border border-gray-200">
              <div 
                className={`h-full rounded-full ${c.channel.toLowerCase() === 'online' ? 'bg-indigo-500' : 'bg-orange-500'}`} 
                style={{ width: `${c.percentage}%` }} 
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPaymentMethods = () => {
    if (!paymentsReportData || !paymentsReportData.paymentMethodBreakdown || paymentsReportData.paymentMethodBreakdown.length === 0) {
      return (
        <div className="h-28 flex items-center justify-center text-xs text-gray-400">
          No payments data.
        </div>
      );
    }

    const data = paymentsReportData.paymentMethodBreakdown;
    const total = data.reduce((sum: number, item: any) => sum + item.amount, 0);

    return (
      <div className="space-y-2.5 pt-1.5">
        {data.map((p: any) => {
          const pct = total > 0 ? ((p.amount / total) * 100).toFixed(0) : '0';
          return (
            <div key={p.method} className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-teal-400" />
                <span className="font-semibold text-gray-700">{p.method}</span>
              </div>
              <span className="font-mono text-gray-700 font-bold">{pct}% ({formatCurrency(p.amount)})</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Executive Dashboard</h2>
          <p className="text-xs text-gray-500">Real-time commercial KPIs, sales revenues, supplier orders, and outstanding payment monitoring.</p>
        </div>

        {/* Date Selector Row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            {['All Time', 'Today', 'Yesterday', 'This Week', 'This Month', 'Last Month', 'This Year', 'Custom Range'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                  dateRange === range
                    ? 'bg-gray-100 text-brand-600 border border-gray-200'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {dateRange === 'Custom Range' && (
            <div className="flex items-center space-x-1.5">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700 focus:outline-none focus:border-gray-200"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700 focus:outline-none focus:border-gray-200"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Sales Volume"
          value={formatCurrency(stats.totalSales)}
          sub="Gross revenue in period"
          icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-600" />}
          accentColor="bg-emerald-500"
          iconBg="bg-emerald-50"
          borderAccent="border-t-emerald-500"
        />
        <KpiCard
          label="Purchase Cost"
          value={formatCurrency(stats.totalPurchases)}
          sub="Supplier acquisitions"
          icon={<ShoppingBag className="h-3.5 w-3.5 text-amber-600" />}
          accentColor="bg-amber-500"
          iconBg="bg-amber-50"
          borderAccent="border-t-amber-500"
        />
        <KpiCard
          label="Amount Received"
          value={formatCurrency(stats.amountReceived)}
          sub="Total payments collected"
          icon={<DollarSign className="h-3.5 w-3.5 text-teal-600" />}
          accentColor="bg-teal-500"
          iconBg="bg-teal-50"
          borderAccent="border-t-teal-500"
        />
        <KpiCard
          label="Amount Pending"
          value={formatCurrency(stats.amountPending)}
          sub="Outstanding receivables"
          icon={<AlertTriangle className="h-3.5 w-3.5 text-red-600" />}
          accentColor="bg-red-500"
          iconBg="bg-red-50"
          borderAccent="border-t-red-500"
        />
        <KpiCard
          label="Stock Value"
          value={formatCurrency(stats.currentStockValue)}
          sub="At latest cost-basis price"
          icon={<Boxes className="h-3.5 w-3.5 text-indigo-600" />}
          accentColor="bg-indigo-500"
          iconBg="bg-indigo-50"
          borderAccent="border-t-indigo-500"
        />
      </div>

      {/* ── Secondary counts ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Products', value: stats.activeProductsCount, icon: <Layers className="h-4 w-4 text-gray-400" /> },
          { label: 'Active Customers', value: stats.customersCount, icon: <Users className="h-4 w-4 text-gray-400" /> },
          { label: 'Active Suppliers', value: stats.suppliersCount, icon: <Truck className="h-4 w-4 text-gray-400" /> },
          { label: 'Tax Invoices', value: stats.invoicesCount, icon: <Receipt className="h-4 w-4 text-gray-400" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-gray-500 font-medium">{label}</div>
              <div className="text-lg font-bold text-gray-900 mt-0.5">{value}</div>
            </div>
            {icon}
          </div>
        ))}
      </div>

      {/* ── Charts ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Sales Revenue</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Daily revenue — filtered over period</p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-100 text-brand-700 border-brand-200">
              {formatCurrency(stats.totalSales)}
            </span>
          </div>
          <BarChart
            data={salesReportData?.salesOverTime?.slice(-20) ?? []}
            color="#0FA3B1"
            hoverColor="#0C8A97"
            labelSuffix="sales"
          />
        </div>

        {/* Purchases Chart */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Purchase Costs</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Daily purchases — filtered over period</p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
              {formatCurrency(stats.totalPurchases)}
            </span>
          </div>
          <BarChart
            data={purchasesReportData?.purchasesOverTime?.slice(-20) ?? []}
            color="#f59e0b"
            hoverColor="#fbbf24"
          />
        </div>
      </div>

      {/* ── Detail widgets ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sales Channels */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Sales Channels</h3>
          {renderChannelBreakdown()}
        </div>

        {/* Payment Methods */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Payment Methods</h3>
          {renderPaymentMethods()}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Low Stock Alerts</h3>
            {stats.lowStockCount > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                {stats.lowStockCount} ALERT{stats.lowStockCount > 1 ? 'S' : ''}
              </span>
            )}
          </div>
          
          {stats.lowStockCount === 0 ? (
            <div className="h-28 flex items-center justify-center text-xs text-gray-400">
              All variant stocks are above alert level thresholds.
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-40 divide-y divide-gray-100">
              {stats.lowStockItems.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs text-gray-500 pt-2 first:pt-0">
                  <div>
                    <p className="font-semibold text-gray-700">{item.productName}</p>
                    <p className="text-[10px] text-gray-400">{item.variantName} ({item.sku})</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-red-600">{item.stock}</span>
                    <span className="text-[10px] text-gray-400 ml-1">/ min {item.min}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
