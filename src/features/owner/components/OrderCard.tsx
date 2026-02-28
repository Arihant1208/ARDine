
import React from 'react';
import { Order, OrderStatus, ORDER_STATUS_TRANSITIONS } from '@/shared/types';
import { Clock, CheckCircle, Smartphone, CreditCard, ReceiptText, User, Phone } from 'lucide-react';
import Badge from '@/shared/components/ui/Badge';

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  'received': 'Received',
  'preparing': 'Preparing',
  'ready': 'Ready',
  'served': 'Served',
  'cancelled': 'Cancelled',
};

const OrderCard: React.FC<OrderCardProps> = ({ order, onUpdateStatus }) => {
  const isTerminal = order.status === 'served' || order.status === 'cancelled';
  const nextStatuses = ORDER_STATUS_TRANSITIONS[order.status] ?? [];

  const PaymentIcon = {
    UPI: Smartphone,
    Card: CreditCard,
    Cash: ReceiptText,
  }[order.paymentMethod] ?? ReceiptText;

  return (
    <div className={`bg-white/5 border ${isTerminal ? 'border-green-500/20 opacity-60' : 'border-white/10'} rounded-[2.5rem] p-8 transition-all flex flex-col justify-between h-full group`}>
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col">
            <Badge variant="dark" className="mb-2">Table {order.tableNumber}</Badge>
            <div className="text-4xl font-black text-orange-500">#{order.tableNumber}</div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{order.id.slice(0, 12)}</p>
            <p className="text-sm font-bold text-gray-400 flex items-center gap-2 justify-end">
              <Clock className="w-3 h-3" /> {new Date(order.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Customer info */}
        <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
          <div className="flex items-center gap-2 text-gray-300">
            <User className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">{order.customerName}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Phone className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">{order.customerPhone}</span>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="flex flex-col">
                <span className="font-bold text-sm">{item.quantity}x {item.dish.name}</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">${item.dish.price.toFixed(2)} ea</span>
              </div>
              <span className="font-black text-sm text-gray-300">${(item.quantity * item.dish.price).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-8 border-t border-white/5 space-y-6">
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-400">
              <PaymentIcon className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase">{order.paymentMethod}</span>
            </div>
            <Badge variant={order.paymentStatus === 'Paid' ? 'success' : order.paymentStatus === 'Failed' ? 'error' : 'warning'}>
              {order.paymentStatus}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 font-bold uppercase">Total Bill</p>
            <p className="text-3xl font-black text-white">${order.total.toFixed(2)}</p>
          </div>
        </div>

        {/* Current status badge */}
        <div className="flex items-center justify-center">
          <Badge variant={isTerminal ? 'success' : 'info'} className="text-xs px-4 py-1">
            {STATUS_LABEL[order.status]}
          </Badge>
        </div>

        {/* Multi-step status buttons */}
        {nextStatuses.length > 0 && (
          <div className="flex gap-2">
            {nextStatuses.map((next) => (
              <button
                key={next}
                onClick={() => onUpdateStatus(order.id, next)}
                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 shadow-xl ${
                  next === 'cancelled'
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white shadow-red-500/10'
                    : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20'
                }`}
              >
                <CheckCircle className="w-4 h-4" /> {STATUS_LABEL[next]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
