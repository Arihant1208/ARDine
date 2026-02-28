import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, RefreshCw, Minus, Plus, Trash2 } from 'lucide-react';
import { UserId } from '@/shared/types';
import { ApiService } from '@/shared/services/api';
import { useCartStore } from '@/stores/useCartStore';
import { useToastStore } from '@/stores/useToastStore';

import Header from '@/shared/layout/Header';
import Button from '@/shared/components/ui/Button';
import Card from '@/shared/components/ui/Card';
import PaymentSelector from '@/features/customer/components/PaymentSelector';
import Toast from '@/shared/components/Toast';

const CustomerCartView: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const {
    items,
    total,
    updateQuantity,
    removeItem,
    selectedTable,
    selectedPayment,
    setPaymentMethod,
    customerName,
    customerPhone,
    setCustomerName,
    setCustomerPhone,
    paymentStep,
    setPaymentStep,
    resetCheckout,
  } = useCartStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const subtotal = total();
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + tax;
  const tableNum = selectedTable ?? 1;

  const validateCustomerInfo = (): boolean => {
    let valid = true;
    if (!customerName.trim() || customerName.trim().length < 2) {
      setNameError('Name is required (min 2 characters)');
      valid = false;
    } else {
      setNameError('');
    }

    // Simple phone validation: digits, optional +, spaces, dashes, min 7 digits
    const digits = customerPhone.replace(/[^0-9]/g, '');
    if (digits.length < 7) {
      setPhoneError('Valid phone number required');
      valid = false;
    } else {
      setPhoneError('');
    }

    return valid;
  };

  const handlePlaceOrder = async () => {
    if (!validateCustomerInfo()) return;
    if (!userId) return;

    setIsProcessing(true);

    try {
      if (selectedPayment === 'Cash') {
        // Cash order — simple POST
        await ApiService.placeOrder(
          userId as UserId,
          tableNum,
          items,
          selectedPayment,
          customerName.trim(),
          customerPhone.trim(),
        );
        setPaymentStep('done');
        addToast('Order placed successfully!', 'success');
        setTimeout(() => {
          resetCheckout();
          navigate(`/menu/${userId}`);
        }, 2000);
      } else {
        // Card / UPI — create Stripe PaymentIntent
        setPaymentStep('paying');
        const { order, clientSecret } = await ApiService.createPaymentIntent(
          userId as UserId,
          tableNum,
          items,
          selectedPayment,
          customerName.trim(),
          customerPhone.trim(),
        );

        // In a full Stripe Elements integration, you'd confirm the payment here
        // using stripe.confirmCardPayment(clientSecret).
        // For now, we simulate confirmation via the server-side confirmation endpoint.
        // TODO: Replace with @stripe/react-stripe-js Elements for real card collection.
        await ApiService.confirmPayment(userId as UserId, order.id, order.stripePaymentIntentId!);

        setPaymentStep('done');
        addToast('Payment confirmed! Your order is being prepared.', 'success');
        setTimeout(() => {
          resetCheckout();
          navigate(`/menu/${userId}`);
        }, 2000);
      }
    } catch (err) {
      setPaymentStep('idle');
      const msg = err instanceof Error ? err.message : 'Order failed';
      addToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Done state
  if (paymentStep === 'done') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toast />
        <div className="text-center animate-in zoom-in-95">
          <div className="w-20 h-20 bg-green-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-100">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight">Order Confirmed</h3>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-3 max-w-[200px] mx-auto">
            Your dishes are being prepared now.
          </p>
        </div>
      </div>
    );
  }

  // Processing state
  if (paymentStep === 'paying') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toast />
        <div className="text-center py-40">
          <RefreshCw className="animate-spin w-12 h-12 mx-auto mb-6 text-orange-500" />
          <h3 className="text-xl font-black uppercase tracking-tight">Processing Payment</h3>
          <p className="text-gray-400 text-[10px] font-bold uppercase mt-2 tracking-widest">
            Securely connecting to Stripe...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Toast />
      <Header title="Checkout" onBack={() => navigate(`/menu/${userId}`)} />
      <main className="max-w-xl mx-auto p-4 sm:p-10 space-y-6">
        {/* Cart items (editable) */}
        <Card className="p-6 sm:p-10">
          <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-4">
            Your Order
          </h3>
          <div className="space-y-4 mb-10">
            {items.map((item) => (
              <div key={item.dish.id} className="flex justify-between items-center">
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-black text-xs text-gray-900 uppercase truncate">{item.dish.name}</span>
                  <span className="text-[9px] text-gray-400 font-bold tracking-widest uppercase">
                    ${item.dish.price.toFixed(2)} ea
                  </span>
                </div>
                <div className="flex items-center gap-2 mx-4">
                  <button
                    onClick={() => updateQuantity(item.dish.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-black text-sm w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.dish.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-xs tracking-tight w-16 text-right">
                    ${(item.dish.price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeItem(item.dish.id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-6 border-t space-y-2">
            <div className="flex justify-between text-xs text-gray-400 font-bold uppercase">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 font-bold uppercase">
              <span>Tax (5%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="font-black text-lg uppercase tracking-tighter">Total Amount</span>
              <span className="text-2xl font-black text-orange-500">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Customer info */}
        <Card className="p-6 sm:p-10">
          <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-6">Your Details</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block px-1">Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-orange-500/20"
                placeholder="Your name"
              />
              {nameError && <p className="text-red-500 text-[10px] font-black mt-1 px-1">{nameError}</p>}
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block px-1">Phone</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-orange-500/20"
                placeholder="+91 98765 43210"
              />
              {phoneError && <p className="text-red-500 text-[10px] font-black mt-1 px-1">{phoneError}</p>}
            </div>
          </div>
        </Card>

        {/* Payment method */}
        <div className="space-y-4 pt-4">
          <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] px-2 text-center">
            Payment Method
          </h3>
          <PaymentSelector selected={selectedPayment} onSelect={setPaymentMethod} />
        </div>

        <Button
          size="xl"
          className="w-full h-20 shadow-2xl mt-8"
          onClick={handlePlaceOrder}
          isLoading={isProcessing}
          disabled={items.length === 0}
        >
          {selectedPayment === 'Cash' ? 'Confirm Order' : 'Place Secure Order'}
        </Button>
      </main>
    </div>
  );
};

export default CustomerCartView;
