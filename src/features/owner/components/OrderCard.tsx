
import React from 'react';
import { Order, OrderStatus } from '@/shared/types';
import { Clock, CheckCircle, Smartphone, CreditCard, ReceiptText, Wallet as WalletIcon } from 'lucide-react';
import Badge from '@/shared/components/ui/Badge';

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onUpdateStatus }) => {
  const isServed = order.status === 'served';

  const PaymentIcon = {
    UPI: Smartphone,
    Card: CreditCard,
    Cash: ReceiptText,
    Wallet: WalletIcon
  }[order.paymentMethod];

  return (
    <div className={`bg-white/5 border ${isServed ? 'border-green-500/20 opacity-60' : 'border-white/10'} rounded-[2.5rem] p-8 transition-all flex flex-col justify-between h-full group`}>
      <div>
        <div className="flex justify-between items-start mb-8">
          <div className="flex flex-col">
            <Badge variant="dark" className="mb-2">Table {order.tableNumber}</Badge>
            <div className="text-4xl font-black text-orange-500">#{order.tableNumber}</div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{order.id}</p>
            <p className="text-sm font-bold text-gray-400 flex items-center gap-2 justify-end">
              <Clock className="w-3 h-3" /> {new Date(order.timestamp).toLocaleTimeString()}
            </p>
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
            <Badge variant={order.paymentStatus === 'Paid' ? 'success' : 'warning'}>
              {order.paymentStatus}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 font-bold uppercase">Total Bill</p>
            <p className="text-3xl font-black text-white">${order.total.toFixed(2)}</p>
          </div>
        </div>

        {!isServed && (
          <button
            onClick={() => onUpdateStatus(order.id, 'served')}
            className="w-full py-5 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" /> Mark as Served
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
