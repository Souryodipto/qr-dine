import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ExternalLink, Copy, CreditCard } from 'lucide-react';
import { useState } from 'react';

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { order, restaurantName, paymentInfo, tableId } = location.state || {};
  const [copied, setCopied] = useState(false);

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-muted text-sm mb-4">No order data found.</p>
          <button onClick={() => navigate('/')} className="btn-primary">Go Home</button>
        </div>
      </div>
    );
  }

  const handleCopyUPI = () => {
    if (paymentInfo?.upiId) {
      navigator.clipboard.writeText(paymentInfo.upiId).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-5 animate-fade-in-up">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Order Placed</h1>
          <p className="text-muted text-xs">{restaurantName} • Table {tableId}</p>
        </div>

        {/* Order Summary */}
        <div className="border border-border p-4 mb-4">
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-border">
            <div>
              <p className="text-[9px] font-bold tracking-widest uppercase text-muted">Order</p>
              <p className="font-bold font-mono text-xs">#{order.id.slice(-8).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold tracking-widest uppercase text-muted">Type</p>
              <p className="font-bold text-xs">{order.orderType === 'dine-in' ? 'Dine-In' : 'Takeaway'}</p>
            </div>
          </div>

          <div className="space-y-1.5 mb-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span><span className="text-muted mr-1.5">{item.qty}×</span>{item.name}</span>
                <span className="font-bold">₹{item.price * item.qty}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between font-bold pt-2.5 border-t border-border">
            <span className="text-xs">Total</span>
            <span className="text-lg">₹{order.total}</span>
          </div>
        </div>

        {/* Payment Section — CRITICAL: shows restaurant-specific payment info */}
        {paymentInfo && (
          <div className="border-2 border-black p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4" />
              <h3 className="text-xs font-bold tracking-widest uppercase">Complete Payment</h3>
            </div>

            {paymentInfo.type === 'upi' && (
              <div className="space-y-3">
                {/* UPI Deep Link Button */}
                <a
                  href={paymentInfo.link}
                  className="btn-primary w-full flex items-center justify-center gap-2 !py-4 text-center no-underline"
                >
                  Pay ₹{order.total} via UPI <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {/* UPI ID for manual entry */}
                <div className="bg-surface-alt p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold tracking-widest uppercase text-muted">UPI ID</p>
                    <p className="font-bold font-mono text-sm">{paymentInfo.upiId}</p>
                  </div>
                  <button onClick={handleCopyUPI} className="text-[9px] font-bold tracking-wider uppercase px-3 py-1.5 border border-border hover:bg-black hover:text-white transition-colors">
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>

                <p className="text-[9px] text-muted text-center">
                  Payment goes directly to <span className="font-bold text-primary">{restaurantName}</span>'s account
                </p>
              </div>
            )}

            {paymentInfo.type === 'bank' && (
              <div className="space-y-2">
                <div className="bg-surface-alt p-3">
                  <p className="text-[9px] font-bold tracking-widest uppercase text-muted mb-1">Bank</p>
                  <p className="font-bold text-sm">{paymentInfo.bankName}</p>
                </div>
                <div className="bg-surface-alt p-3">
                  <p className="text-[9px] font-bold tracking-widest uppercase text-muted mb-1">Account</p>
                  <p className="font-bold font-mono text-sm">{paymentInfo.accountNumber}</p>
                </div>
                <div className="bg-surface-alt p-3">
                  <p className="text-[9px] font-bold tracking-widest uppercase text-muted mb-1">IFSC</p>
                  <p className="font-bold font-mono text-sm">{paymentInfo.ifscCode}</p>
                </div>
                <p className="text-[9px] text-muted text-center mt-2">
                  Transfer ₹{order.total} to <span className="font-bold text-primary">{restaurantName}</span>'s account above
                </p>
              </div>
            )}
          </div>
        )}

        {/* Status */}
        <div className="bg-surface-alt border border-border p-3 text-center">
          <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-0.5">Order Status</p>
          <p className="text-xs font-bold">Sent to Kitchen • Payment Pending</p>
          <p className="text-[9px] text-muted mt-1">Confirmation will be sent to {order.customerEmail}</p>
        </div>
      </div>
    </div>
  );
}
