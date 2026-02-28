import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, Box, Loader2 } from 'lucide-react';
import { Dish, UserId } from '@/shared/types';
import { ApiService } from '@/shared/services/api';
import { useCartStore } from '@/stores/useCartStore';
import { useToastStore } from '@/stores/useToastStore';

import ARViewer from '@/features/customer/components/ARViewer';
import Header from '@/shared/layout/Header';
import Button from '@/shared/components/ui/Button';
import Toast from '@/shared/components/Toast';

const CustomerMenuView: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const { items, addItem, itemCount, total, setTable } = useCartStore();
  const [menu, setMenu] = useState<Dish[]>([]);
  const [restaurantName, setRestaurantName] = useState('AR-DINE');
  const [arDish, setArDish] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(true);

  const tableFromUrl = searchParams.get('table');

  // Load menu on mount
  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      try {
        const [dishes, config] = await Promise.all([
          ApiService.getMenu(userId as UserId),
          ApiService.getConfig(userId as UserId),
        ]);
        setMenu(dishes);
        if (config?.name) setRestaurantName(config.name);
        if (tableFromUrl) setTable(parseInt(tableFromUrl));
      } catch {
        addToast('Failed to load menu.', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId, tableFromUrl, addToast, setTable]);

  // Poll for 3D generation
  useEffect(() => {
    if (!userId) return;
    const hasGenerating = menu.some((d) => d.modelGenerationStatus === 'generating');
    if (!hasGenerating) return;
    const interval = setInterval(async () => {
      const dishes = await ApiService.getMenu(userId as UserId);
      setMenu(dishes);
    }, 5000);
    return () => clearInterval(interval);
  }, [menu, userId]);

  const tableNum = useCartStore((s) => s.selectedTable) ?? 1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      <Toast />
      <Header
        title={restaurantName}
        subtitle={`Table T${tableNum}`}
        onBack={() => navigate('/')}
        actions={
          <Button
            variant="dark"
            size="sm"
            icon={<ShoppingBag size={14} />}
            onClick={() => navigate(`/menu/${userId}/cart`)}
            className="relative"
          >
            {itemCount() > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-white text-[9px] font-black">
                {itemCount()}
              </span>
            )}
            Cart
          </Button>
        }
      />
      <main className="p-4 sm:p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10 max-w-7xl mx-auto">
        {menu.map((dish) => (
          <div
            key={dish.id}
            className="group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 flex flex-col shadow-sm hover:shadow-2xl transition-all duration-500"
          >
            <div className="aspect-[4/5] relative bg-gray-50 overflow-hidden">
              <img
                src={dish.images[0]}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                alt={dish.name}
              />
              {dish.modelGenerationStatus === 'ready' ? (
                <button
                  onClick={() => setArDish(dish)}
                  className="absolute bottom-6 right-6 w-14 h-14 bg-white rounded-3xl flex items-center justify-center text-orange-500 shadow-xl border border-white active:scale-90 transition-transform"
                >
                  <Box size={30} />
                </button>
              ) : (
                <div className="absolute bottom-6 right-6 p-3 bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 text-white/80 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Generating 3D</span>
                </div>
              )}
            </div>
            <div className="p-8 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-3 gap-2">
                <h3 className="text-xl font-black tracking-tighter leading-tight text-gray-900 uppercase truncate">
                  {dish.name}
                </h3>
                <p className="text-lg font-black text-orange-500 shrink-0">${dish.price.toFixed(2)}</p>
              </div>
              <p className="text-gray-400 text-[10px] font-bold uppercase leading-relaxed line-clamp-2 mb-8 flex-1">
                {dish.description}
              </p>
              <Button variant="dark" className="w-full h-12" onClick={() => addItem(dish)}>
                Add to Table
              </Button>
            </div>
          </div>
        ))}
      </main>

      {/* Floating cart bar */}
      {items.length > 0 && (
        <div className="fixed bottom-6 inset-x-6 z-40">
          <div className="max-w-2xl mx-auto">
            <Button
              variant="primary"
              size="xl"
              className="w-full flex justify-between items-center shadow-2xl px-8"
              onClick={() => navigate(`/menu/${userId}/cart`)}
            >
              <span className="text-sm font-black">View Order Details</span>
              <span className="text-base font-black">${total().toFixed(2)}</span>
            </Button>
          </div>
        </div>
      )}

      {arDish && <ARViewer dish={arDish} onClose={() => setArDish(null)} />}
    </div>
  );
};

export default CustomerMenuView;
