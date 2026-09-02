import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, Calendar, FileText, User, CreditCard, Clock, ShieldAlert } from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { formatCurrency, formatDate } from '../utils';
import { paymentApi } from '../api/services';

export const PaymentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { reversePayment, customers, sales, fetchCustomers, fetchSales, serverError } = useInventoryStore();

  const [payment, setPayment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [reversing, setReversing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchSales();
    loadPayment();
  }, [id]);

  const loadPayment = async () => {
    if (!id || id === 'undefined') return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await paymentApi.getById(id);
      const paymentData = (res as any).data?.data || res.data || res;
      if (!paymentData) {
        setErrorMsg('Payment voucher details not found.');
        return;
      }
      setPayment({
        ...paymentData,
        id: paymentData.id || paymentData._id
      });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load payment detail.');
    } finally {
      setLoading(false);
    }
  };

  const handleReverse = async () => {
    if (!id) return;
    setReversing(true);
    setErrorMsg(null);
    try {
      await reversePayment(id);
      await loadPayment(); // reload
      setConfirmModal(false);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to reverse payment.');
    } finally {
      setReversing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-xs text-gray-500 shadow-sm">
        Loading payment voucher detailed records...
      </div>
    );
  }

  if (errorMsg && !payment) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-4 max-w-lg mx-auto shadow-sm">
        <h3 className="text-base font-bold text-red-600">Error Loading Payment</h3>
        <p className="text-xs text-gray-700">{errorMsg}</p>
        <Link to="/payments" className="inline-block px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors">
          Back to Payments
        </Link>
      </div>
    );
  }

  const matchedCustomer = customers.find(c => c.id === payment.customerId);
  const matchedSale = sales.find(s => s.id === payment.saleId);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back link */}
      <div className="flex items-center justify-between">
        <Link to="/payments" className="flex items-center text-xs text-gray-500 hover:text-gray-900 transition-colors font-medium">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Payment History
        </Link>
      </div>

      {/* Voucher detail layout */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                {payment.paymentNumber}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                payment.status === 'Active' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-red-50 text-red-600 border-red-200'
              }`}>
                {payment.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">Registered Receipt voucher details.</p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-gray-500 block uppercase tracking-wider">Amount Received</span>
            <span className={`text-2xl font-bold font-mono ${payment.status === 'Reversed' ? 'text-red-600 line-through' : 'text-emerald-700'}`}>
              {formatCurrency(payment.amount)}
            </span>
          </div>
        </div>

        {/* Detailed Fields */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-medium tracking-wide">Payment Date</span>
                <span className="text-gray-900 font-semibold font-mono text-xs">{formatDate(payment.paymentDate)}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-medium tracking-wide">Customer</span>
                {payment.customerId ? (
                  <Link to={`/customers/${payment.customerId}`} className="text-brand-600 hover:underline font-semibold">
                    {matchedCustomer ? matchedCustomer.name : 'View Profile'}
                  </Link>
                ) : (
                  <span className="text-gray-400 italic">Walk-in Customer</span>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-medium tracking-wide">Linked Sale Invoice</span>
                {payment.saleId ? (
                  <Link to={`/sales/${payment.saleId}`} className="text-brand-600 hover:underline font-mono font-bold text-xs">
                    {matchedSale ? matchedSale.saleNumber : 'View Invoice'}
                  </Link>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-medium tracking-wide">Payment Method</span>
                <span className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-[10px] text-gray-700 font-semibold mt-0.5 inline-block">
                  {payment.paymentMethod}
                </span>
              </div>
            </div>

            {payment.referenceNumber && (
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase font-medium tracking-wide">Reference Transaction ID</span>
                  <span className="text-gray-900 font-mono text-xs font-medium">{payment.referenceNumber}</span>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3">
              <ShieldAlert className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-medium tracking-wide">Payment Type</span>
                <span className="text-gray-700 font-medium text-xs">
                  {payment.paymentType === 'SALE_RECEIPT' ? 'Customer Sale Receipt' : payment.paymentType}
                </span>
              </div>
            </div>
          </div>
        </div>

        {payment.notes && (
          <div className="mx-6 mb-6 p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs">
            <span className="text-[10px] text-gray-500 block uppercase font-medium tracking-wide mb-1">Notes</span>
            <p className="text-gray-700 leading-relaxed">{payment.notes}</p>
          </div>
        )}

        {/* Action Panel for reversing active payments */}
        {payment.status === 'Active' && (
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => setConfirmModal(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-sm font-semibold transition-colors"
            >
              <RefreshCcw className="h-4 w-4" />
              <span>Reverse Receipt Voucher</span>
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm p-6 space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-base font-bold text-gray-900">Confirm Payment Reversal</h3>
            </div>
            <p className="text-sm text-gray-700">
              Are you sure you want to reverse the receipt voucher <strong className="text-gray-900 font-mono">{payment.paymentNumber}</strong>?
            </p>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Amount:</span><span className="font-semibold text-gray-900 font-mono">{formatCurrency(payment.amount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Method:</span><span className="font-semibold text-gray-900">{payment.paymentMethod}</span></div>
            </div>
            <p className="text-xs text-amber-600 italic">
              * This reversal will immediately increase the customer's outstanding balance and mark the invoice payment cache back to unpaid/partially-paid status.
            </p>
            {errorMsg && <p className="text-sm text-red-600 font-semibold">{errorMsg}</p>}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setConfirmModal(false)}
                disabled={reversing}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReverse}
                disabled={reversing}
                className="flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                {reversing ? 'Reversing...' : 'Yes, Reverse'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
