
import React from 'react';
import { PaymentMethod } from '@/shared/types';
import { Smartphone, CreditCard, ReceiptText } from 'lucide-react';

interface PaymentSelectorProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

const PaymentSelector: React.FC<PaymentSelectorProps> = ({ selected, onSelect }) => {
  const methods: { id: PaymentMethod; label: string; sub: string; icon: any }[] = [
    { id: 'UPI', label: 'UPI Payment', sub: 'Instant Pay via Apps', icon: Smartphone },
    { id: 'Card', label: 'Card Payment', sub: 'Credit / Debit Card', icon: CreditCard },
    { id: 'Cash', label: 'Pay at Counter', sub: 'Order now, pay later', icon: ReceiptText }
  ];

  return (
    <div className="grid grid-cols-1 gap-4">
      {methods.map((m) => {
        const Icon = m.icon;
        return (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={`p-6 rounded-3xl border-4 text-left transition-all flex items-center justify-between group ${selected === m.id ? 'border-orange-500 bg-orange-50' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}
          >
            <div>
              <p className="font-black text-lg">{m.label}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{m.sub}</p>
            </div>
            <Icon className={`w-8 h-8 transition-colors ${selected === m.id ? 'text-orange-500' : 'text-gray-300'}`} />
          </button>
        );
      })}
    </div>
  );
};

export default PaymentSelector;
