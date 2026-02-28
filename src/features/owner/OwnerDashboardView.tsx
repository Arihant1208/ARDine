import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOwnerStore } from '@/stores/useOwnerStore';

import Header from '@/shared/layout/Header';
import OrderCard from '@/features/owner/components/OrderCard';
import Toast from '@/shared/components/Toast';

const OwnerDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user)!;
  const { orders, loadOrders, updateOrderStatus } = useOwnerStore();

  // Poll every 3 seconds
  useEffect(() => {
    loadOrders(user.id);
    const interval = window.setInterval(() => loadOrders(user.id), 3000);
    return () => clearInterval(interval);
  }, [user.id, loadOrders]);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Toast />
      <Header
        title="Kitchen Feed"
        subtitle="Real-time Flow"
        dark
        onBack={() => navigate('/owner/setup')}
      />
      <main className="p-4 sm:p-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onUpdateStatus={(id, s) => updateOrderStatus(user.id, id, s)}
          />
        ))}
        {orders.length === 0 && (
          <div className="col-span-full py-40 flex flex-col items-center opacity-30 text-center">
            <ChefHat size={80} className="mb-6" />
            <p className="font-black text-2xl uppercase tracking-tighter">No Active Orders</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default OwnerDashboardView;
