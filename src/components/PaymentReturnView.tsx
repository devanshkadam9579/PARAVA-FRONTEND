import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, ArrowRight, RefreshCw, Receipt, Calendar, MapPin, ShieldCheck, Home } from 'lucide-react';

interface PaymentReturnViewProps {
  onGoHome: () => void;
  onViewBookings: () => void;
  apiUrl?: string;
}

export function PaymentReturnView({ onGoHome, onViewBookings, apiUrl }: PaymentReturnViewProps) {
  const [status, setStatus] = useState<'CHECKING' | 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED' | 'EXPIRED' | 'UNKNOWN'>('CHECKING');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [booking, setBooking] = useState<any>(null);
  const [transaction, setTransaction] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Verifying your payment with Cashfree...');
  const [pollAttempts, setPollAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const backendBaseUrl = apiUrl || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://parava-backend.onrender.com');

  const verifyPaymentStatus = async (id: string, attemptCount = 0) => {
    try {
      setIsRetrying(true);
      const res = await fetch(`${backendBaseUrl}/api/payments/cashfree/status?orderId=${encodeURIComponent(id)}`, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();

      if (!res.ok && !data?.status) {
        throw new Error(data?.error || `Server responded with HTTP ${res.status}`);
      }

      if (data.status === 'SUCCESS') {
        setStatus('SUCCESS');
        setBooking(data.booking || null);
        setTransaction(data.transaction || null);
        setStatusMessage('Payment verified successfully! Your booking is confirmed.');
        return;
      }

      if (data.status === 'PENDING') {
        setStatus('PENDING');
        setStatusMessage(data.message || 'Payment is awaiting final bank/UPI confirmation. Checking again in a few moments...');
        
        // Auto retry up to 4 times with staged delay
        if (attemptCount < 4) {
          const delay = (attemptCount + 1) * 3000;
          pollTimerRef.current = setTimeout(() => {
            setPollAttempts(attemptCount + 1);
            verifyPaymentStatus(id, attemptCount + 1);
          }, delay);
        } else {
          setStatusMessage('Payment verification is taking longer than usual. Please check your bookings page shortly.');
        }
        return;
      }

      if (data.status === 'EXPIRED') {
        setStatus('EXPIRED');
        setStatusMessage('Your payment session has expired. Please initiate a new checkout.');
        return;
      }

      if (data.status === 'CANCELLED') {
        setStatus('CANCELLED');
        setStatusMessage('The payment was cancelled. No charges were processed.');
        return;
      }

      if (data.status === 'FAILED') {
        setStatus('FAILED');
        setStatusMessage(data.message || 'Payment failed or was declined by the bank. Please try again.');
        return;
      }

      setStatus('UNKNOWN');
      setStatusMessage(data.message || 'Payment status could not be confirmed immediately. Please check your bookings tab.');
    } catch (err: any) {
      console.error('[PaymentReturnView] Verification check error:', err);
      if (attemptCount < 3) {
        pollTimerRef.current = setTimeout(() => {
          setPollAttempts(attemptCount + 1);
          verifyPaymentStatus(id, attemptCount + 1);
        }, 3000);
      } else {
        setStatus('UNKNOWN');
        setStatusMessage('Network timeout while checking payment status. If your account was debited, your booking will be confirmed shortly.');
      }
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const parsedOrderId = urlParams.get('order_id') || urlParams.get('orderId');

    if (!parsedOrderId) {
      setStatus('UNKNOWN');
      setStatusMessage('No order ID was found in the return URL.');
      return;
    }

    setOrderId(parsedOrderId);
    verifyPaymentStatus(parsedOrderId, 0);

    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-[85vh] bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl bg-white border border-gray-100 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
        
        {/* State 1: Checking / Verifying */}
        {status === 'CHECKING' && (
          <div className="text-center py-8 space-y-5">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-20 h-20 border-4 border-rose-100 border-t-[#EC003F] rounded-full animate-spin" />
              <ShieldCheck className="w-8 h-8 text-[#EC003F] absolute" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Verifying Secure Payment</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
                Contacting Cashfree payment gateway to confirm your transaction details. Please do not close or reload this window.
              </p>
            </div>
            {orderId && (
              <div className="inline-block bg-gray-50 border border-gray-200 px-4 py-1.5 rounded-xl text-xs font-mono font-bold text-gray-600">
                Order Reference: {orderId}
              </div>
            )}
          </div>
        )}

        {/* State 2: SUCCESS */}
        {status === 'SUCCESS' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Booking Confirmed!</h2>
              <p className="text-sm text-gray-600 font-medium">
                Your payment was verified with Cashfree and your vendor has been notified.
              </p>
            </div>

            {/* Authoritative Receipt Card */}
            <div className="bg-gray-50/80 rounded-2xl border border-gray-200/80 p-5 space-y-3.5 text-sm">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200/70">
                <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Payment Status</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
                  <CheckCircle2 size={13} /> Paid via Cashfree
                </span>
              </div>

              {orderId && (
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-gray-500">Order ID:</span>
                  <span className="font-mono font-bold text-gray-800">{orderId}</span>
                </div>
              )}

              {(transaction?.paymentId || transaction?.cfPaymentId || transaction?.cf_payment_id) && (
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-gray-500">Cashfree Payment ID:</span>
                  <span className="font-mono font-bold text-gray-800">
                    {transaction?.paymentId || transaction?.cfPaymentId || transaction?.cf_payment_id}
                  </span>
                </div>
              )}

              {transaction?.amount && (
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-gray-500">Amount Paid:</span>
                  <span className="font-bold text-[#EC003F] text-base">₹{Number(transaction.amount).toLocaleString('en-IN')}</span>
                </div>
              )}

              {booking?.vendor?.name && (
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-gray-500">Vendor:</span>
                  <span className="font-bold text-gray-800">{booking.vendor.name}</span>
                </div>
              )}

              {booking?.eventDate && (
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-gray-500 flex items-center gap-1"><Calendar size={13} /> Event Date:</span>
                  <span className="font-bold text-gray-800">{booking.eventDate}</span>
                </div>
              )}

              {booking?.eventAddress && (
                <div className="flex justify-between items-center text-xs sm:text-sm pt-1">
                  <span className="text-gray-500 flex items-center gap-1"><MapPin size={13} /> Venue:</span>
                  <span className="font-medium text-gray-700 truncate max-w-[240px] text-right">{booking.eventAddress}</span>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={onViewBookings}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#EC003F] hover:bg-[#D40038] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-rose-600/20 transition active:scale-95 cursor-pointer text-sm sm:text-base"
              >
                <span>View in My Bookings</span>
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={onGoHome}
                className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3.5 px-5 rounded-2xl transition cursor-pointer text-sm sm:text-base"
              >
                <Home size={16} />
                <span>Home</span>
              </button>
            </div>
          </div>
        )}

        {/* State 3: PENDING */}
        {status === 'PENDING' && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
              <Clock size={36} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Payment Confirmation In Progress</h2>
              <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto leading-relaxed">
                {statusMessage}
              </p>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs sm:text-sm text-amber-900 text-left space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck size={16} /> Important Note
              </div>
              <p className="text-amber-800 leading-relaxed">
                If your UPI app or bank deducted funds, please do not pay again. Cashfree will settle this transaction shortly, and your booking confirmation will update automatically in your dashboard.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => orderId && verifyPaymentStatus(orderId, pollAttempts + 1)}
                disabled={isRetrying}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 px-5 rounded-2xl transition cursor-pointer text-sm disabled:opacity-50"
              >
                <RefreshCw size={15} className={isRetrying ? 'animate-spin' : ''} />
                <span>{isRetrying ? 'Re-checking...' : 'Refresh Status'}</span>
              </button>
              <button
                type="button"
                onClick={onViewBookings}
                className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3.5 px-5 rounded-2xl transition cursor-pointer text-sm"
              >
                <span>Check My Bookings</span>
              </button>
            </div>
          </div>
        )}

        {/* State 4: FAILED / CANCELLED / EXPIRED */}
        {(status === 'FAILED' || status === 'CANCELLED' || status === 'EXPIRED') && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-rose-50 text-[#EC003F] rounded-full flex items-center justify-center mx-auto border border-rose-200">
              <XCircle size={36} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {status === 'CANCELLED' ? 'Payment Cancelled' : status === 'EXPIRED' ? 'Session Expired' : 'Payment Not Completed'}
              </h2>
              <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto leading-relaxed">
                {statusMessage}
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 text-xs sm:text-sm text-gray-600 text-left space-y-1">
              <p className="font-semibold text-gray-800">Peace of mind guarantee:</p>
              <p>No funds were permanently captured. If any amount was deducted, your bank or UPI provider will automatically reverse it within 5-7 business days.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={onGoHome}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#EC003F] hover:bg-[#D40038] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-rose-600/20 transition active:scale-95 cursor-pointer text-sm sm:text-base"
              >
                <span>Try Again / Explore Vendors</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* State 5: UNKNOWN */}
        {status === 'UNKNOWN' && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mx-auto border border-gray-200">
              <AlertTriangle size={36} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Payment Verification Status</h2>
              <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto leading-relaxed">
                {statusMessage}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => orderId && verifyPaymentStatus(orderId, 0)}
                disabled={isRetrying}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#EC003F] hover:bg-[#D40038] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition active:scale-95 cursor-pointer text-sm disabled:opacity-50"
              >
                <RefreshCw size={15} className={isRetrying ? 'animate-spin' : ''} />
                <span>{isRetrying ? 'Checking...' : 'Check Status Again'}</span>
              </button>
              <button
                type="button"
                onClick={onGoHome}
                className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3.5 px-5 rounded-2xl transition cursor-pointer text-sm"
              >
                <Home size={16} />
                <span>Return Home</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default PaymentReturnView;
