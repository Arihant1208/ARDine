
import React, { useState, useEffect, useCallback } from 'react';
import {
  ChefHat, LayoutDashboard, ShoppingBag, Settings, LogOut, Camera, RefreshCw, Box, CheckCircle2, User as UserIcon, Loader2
} from 'lucide-react';
import { Dish, Order, RestaurantConfig, ViewState, OrderItem, PaymentMethod, User, UserId } from '@/shared/types';
import { ApiService } from '@/shared/services/api';

// Components
import ARViewer from '@/features/customer/components/ARViewer';
import Header from '@/shared/layout/Header';
import Button from '@/shared/components/ui/Button';
import Card from '@/shared/components/ui/Card';
import QRGenerator from '@/shared/components/QRGenerator';
import Badge from '@/shared/components/ui/Badge';

// Views
import LandingView from '@/features/landing/LandingView';
import AuthView from '@/features/auth/AuthView';
import OrderCard from '@/features/owner/components/OrderCard';
import PaymentSelector from '@/features/customer/components/PaymentSelector';

const DEFAULT_DEMO_USER = 'u_demo';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeOwnerId, setActiveOwnerId] = useState<UserId>(DEFAULT_DEMO_USER);
  const [config, setConfig] = useState<RestaurantConfig>({
    userId: '',
    name: "AR-DINE Experience",
    tables: 5,
  });
  const [menu, setMenu] = useState<Dish[]>([]);
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [arDish, setArDish] = useState<Dish | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('UPI');
  const [paymentStep, setPaymentStep] = useState<'selection' | 'processing' | 'success'>('selection');

  const loadOwnerData = useCallback(async (uId: UserId) => {
    try {
      const [fetchedMenu, fetchedConfig] = await Promise.all([
        ApiService.getMenu(uId),
        ApiService.getConfig(uId)
      ]);
      setMenu(fetchedMenu);
      if (fetchedConfig) setConfig(fetchedConfig);
      setActiveOwnerId(uId);
    } catch (e) { }
  }, []);

  useEffect(() => {
    const hasGenerating = menu.some(d => d.modelGenerationStatus === 'generating');
    if (hasGenerating) {
      const interval = setInterval(() => {
        loadOwnerData(activeOwnerId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [menu, activeOwnerId, loadOwnerData]);

  useEffect(() => {
    const hash = window.location.hash;
    const queryFragment = hash.includes('?') ? hash.split('?')[1] : window.location.search.slice(1);
    const params = new URLSearchParams(queryFragment || '');
    const table = params.get('table');
    const uId = params.get('u');
    if (uId) {
      loadOwnerData(uId);
      if (table) {
        setSelectedTable(parseInt(table));
        setView('customer-menu');
      }
    } else {
      loadOwnerData(DEFAULT_DEMO_USER);
    }
  }, [loadOwnerData]);

  useEffect(() => {
    if (currentUser) loadOwnerData(currentUser.id);
  }, [currentUser, loadOwnerData]);

  useEffect(() => {
    let interval: number;
    if (view === 'owner-dashboard' && currentUser) {
      const poll = async () => setLiveOrders(await ApiService.fetchDashboardOrders(currentUser.id));
      poll();
      interval = window.setInterval(poll, 3000);
    }
    return () => clearInterval(interval);
  }, [view, currentUser]);

  const handleMenuUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsProcessing(true);
    setStatusMessage("Neural Scene Mapping...");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const dish = await ApiService.analyzeMenuImage(currentUser.id, ev.target?.result as string);
        setMenu(p => [...p, dish]);
      } catch (err) { alert("Failed to analyze image."); }
      finally { setIsProcessing(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveConfig = async () => {
    if (!currentUser) return;
    await ApiService.saveConfig(config);
    alert("Configuration saved!");
  };

  const handlePlaceOrder = async () => {
    if (selectedPayment === 'Cash') {
      executeOrder(activeOwnerId);
    } else {
      setPaymentStep('processing');
      setTimeout(() => {
        setPaymentStep('success');
        setTimeout(() => executeOrder(activeOwnerId), 1500);
      }, 2000);
    }
  };

  const executeOrder = async (targetUserId: string) => {
    setIsProcessing(true);
    try {
      await ApiService.placeOrder(targetUserId, selectedTable || 1, cart, selectedPayment);
      setCart([]);
      setPaymentStep('selection');
      setView('customer-menu');
    } finally { setIsProcessing(false); }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    loadOwnerData(DEFAULT_DEMO_USER);
    setView('landing');
  };

  if (view === 'landing') {
    return <LandingView onOwnerClick={() => setView('auth')} onCustomerClick={() => { setSelectedTable(1); setView('customer-menu'); }} />;
  }

  if (view === 'auth') {
    return <AuthView onSuccess={(user) => { setCurrentUser(user); setView('owner-setup'); }} onBack={() => setView('landing')} />;
  }

  if (view === 'owner-setup' && currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header
          title="Owner Setup"
          subtitle={currentUser.name}
          onBack={handleLogout}
          actions={
            <div className="flex gap-2">
              <Button variant="dark" size="sm" icon={<LayoutDashboard size={14} />} onClick={() => setView('owner-dashboard')}>Live Feed</Button>
            </div>
          }
        />
        <main className="p-4 sm:p-10 max-w-7xl mx-auto space-y-6 sm:space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
            <Card className="p-6 sm:p-10">
              <h3 className="text-lg font-black mb-6 uppercase tracking-tight flex items-center gap-3">
                <Settings className="text-orange-500" size={20} /> Store Info
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block px-1">Venue Name</label>
                  <input type="text" value={config.name} onChange={e => setConfig({ ...config, name: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block px-1">Total Tables</label>
                  <input type="number" value={config.tables} onChange={e => setConfig({ ...config, tables: parseInt(e.target.value) || 0 })} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <Button variant="primary" className="w-full h-14" onClick={handleSaveConfig}>Update Store</Button>
              </div>
            </Card>

            <Card className="p-6 sm:p-10 flex flex-col items-center justify-center min-h-[300px] bg-orange-50 border-orange-100 border-dashed border-2">
              {isProcessing ? (
                <div className="text-center">
                  <RefreshCw className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
                  <p className="font-black text-[10px] uppercase tracking-widest text-orange-600">{statusMessage}</p>
                </div>
              ) : (
                <label className="cursor-pointer text-center group w-full flex flex-col items-center">
                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-orange-500 mb-6 shadow-xl group-hover:scale-105 transition-transform">
                    <Camera size={32} />
                  </div>
                  <p className="font-black text-lg tracking-tight">Upload Menu Photo</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mt-2">AI will auto-generate 3D dish data</p>
                  <input type="file" className="hidden" accept="image/*" onChange={handleMenuUpload} />
                </label>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-black tracking-tighter uppercase px-2">Active Menu</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
              {menu.map(dish => (
                <Card key={dish.id} className="p-0 overflow-hidden group hover:border-orange-500/30 transition-all">
                  <div className="aspect-video relative overflow-hidden bg-gray-100">
                    <img src={dish.images[0]} className="w-full h-full object-cover" alt={dish.name} />
                    {dish.modelGenerationStatus === 'generating' && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500 mb-4" />
                        <p className="text-[9px] font-black uppercase tracking-widest">3D Synthesis: {dish.generationProgress}%</p>
                        <div className="w-full bg-white/20 h-1 rounded-full mt-3 overflow-hidden max-w-[120px]">
                          <div className="bg-orange-500 h-full transition-all" style={{ width: `${dish.generationProgress}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <Badge variant={dish.modelGenerationStatus === 'ready' ? 'success' : 'warning'}>
                        {dish.modelGenerationStatus === 'ready' ? '3D Active' : 'Processing'}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h4 className="font-black text-base truncate text-gray-900 uppercase tracking-tight">{dish.name}</h4>
                      <span className="font-black text-orange-500 shrink-0">${dish.price.toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed line-clamp-2 mb-6">{dish.description}</p>
                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                      <Badge variant="info">{dish.category}</Badge>
                      {dish.modelGenerationStatus === 'ready' && (
                        <button onClick={() => setArDish(dish)} className="p-2.5 bg-gray-100 rounded-xl text-orange-500 hover:bg-orange-500 hover:text-white transition-all shadow-sm">
                          <Box size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Card className="p-6 sm:p-10">
            <h3 className="text-lg font-black mb-4 uppercase tracking-tight">QR Distribution</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-10">Print these for your tables to unlock the AR experience.</p>
            <QRGenerator restaurantName={config.name} tableCount={config.tables} userId={currentUser.id} />
          </Card>
        </main>
      </div>
    );
  }

  if (view === 'owner-dashboard' && currentUser) {
    return (
      <div className="min-h-screen bg-[#050505] text-white">
        <Header
          title="Kitchen Feed"
          subtitle="Real-time Flow"
          dark
          onBack={() => setView('owner-setup')}
        />
        <main className="p-4 sm:p-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
          {liveOrders.map(order => (
            <OrderCard key={order.id} order={order} onUpdateStatus={async (id, s) => { await ApiService.updateOrderStatus(currentUser.id, id, s); setLiveOrders(await ApiService.fetchDashboardOrders(currentUser.id)); }} />
          ))}
          {liveOrders.length === 0 && (
            <div className="col-span-full py-40 flex flex-col items-center opacity-30 text-center">
              <ChefHat size={80} className="mb-6" />
              <p className="font-black text-2xl uppercase tracking-tighter">No Active Orders</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (view === 'customer-menu') {
    return (
      <div className="min-h-screen bg-white pb-32">
        <Header
          title={config.name}
          subtitle={`Table T${selectedTable}`}
          onBack={() => setView('landing')}
          actions={
            <Button variant="dark" size="sm" icon={<ShoppingBag size={14} />} onClick={() => setView('customer-cart')} className="relative">
              {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-white text-[9px] font-black">{cart.reduce((a, b) => a + b.quantity, 0)}</span>}
              Cart
            </Button>
          }
        />
        <main className="p-4 sm:p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10 max-w-7xl mx-auto">
          {menu.map(dish => (
            <div key={dish.id} className="group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 flex flex-col shadow-sm hover:shadow-2xl transition-all duration-500">
              <div className="aspect-[4/5] relative bg-gray-50 overflow-hidden">
                <img src={dish.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={dish.name} />
                {dish.modelGenerationStatus === 'ready' ? (
                  <button onClick={() => setArDish(dish)} className="absolute bottom-6 right-6 w-14 h-14 bg-white rounded-3xl flex items-center justify-center text-orange-500 shadow-xl border border-white active:scale-90 transition-transform">
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
                  <h3 className="text-xl font-black tracking-tighter leading-tight text-gray-900 uppercase truncate">{dish.name}</h3>
                  <p className="text-lg font-black text-orange-500 shrink-0">${dish.price.toFixed(2)}</p>
                </div>
                <p className="text-gray-400 text-[10px] font-bold uppercase leading-relaxed line-clamp-2 mb-8 flex-1">{dish.description}</p>
                <Button variant="dark" className="w-full h-12" onClick={() => setCart(p => { const ex = p.find(i => i.dish.id === dish.id); return ex ? p.map(i => i.dish.id === dish.id ? { ...i, quantity: i.quantity + 1 } : i) : [...p, { dish, quantity: 1 }]; })}>
                  Add to Table
                </Button>
              </div>
            </div>
          ))}
        </main>
        {cart.length > 0 && (
          <div className="fixed bottom-6 inset-x-6 z-40">
            <div className="max-w-2xl mx-auto">
              <Button
                variant="primary"
                size="xl"
                className="w-full flex justify-between items-center shadow-2xl px-8"
                onClick={() => setView('customer-cart')}
              >
                <span className="text-sm font-black">View Order Details</span>
                <span className="text-base font-black">${cart.reduce((a, b) => a + (b.dish.price * b.quantity), 0).toFixed(2)}</span>
              </Button>
            </div>
          </div>
        )}
        {arDish && <ARViewer dish={arDish} onClose={() => setArDish(null)} />}
      </div>
    );
  }

  if (view === 'customer-cart') {
    const subtotal = cart.reduce((a, b) => a + (b.dish.price * b.quantity), 0);
    const tax = subtotal * 0.05;
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header title="Checkout" onBack={() => setView('customer-menu')} />
        <main className="max-w-xl mx-auto p-4 sm:p-10 space-y-6">
          {paymentStep === 'selection' && (
            <>
              <Card className="p-6 sm:p-10">
                <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-4">Bill Summary</h3>
                <div className="space-y-4 mb-10">
                  {cart.map(item => (
                    <div key={item.dish.id} className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-black text-xs text-gray-900 uppercase">{item.dish.name}</span>
                        <span className="text-[9px] text-gray-400 font-bold tracking-widest uppercase">{item.quantity} units</span>
                      </div>
                      <span className="font-black text-xs tracking-tight">${(item.dish.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-lg uppercase tracking-tighter">Total Amount</span>
                    <span className="text-2xl font-black text-orange-500">${(subtotal + tax).toFixed(2)}</span>
                  </div>
                </div>
              </Card>
              <div className="space-y-4 pt-4">
                <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] px-2 text-center">Payment Method</h3>
                <PaymentSelector selected={selectedPayment} onSelect={setSelectedPayment} />
              </div>
              <Button size="xl" className="w-full h-20 shadow-2xl mt-8" onClick={handlePlaceOrder} isLoading={isProcessing}>
                {selectedPayment === 'Cash' ? "Confirm Order" : "Place Secure Order"}
              </Button>
            </>
          )}
          {paymentStep === 'processing' && (
            <div className="text-center py-40">
              <RefreshCw className="animate-spin w-12 h-12 mx-auto mb-6 text-orange-500" />
              <h3 className="text-xl font-black uppercase tracking-tight">Processing Payment</h3>
              <p className="text-gray-400 text-[10px] font-bold uppercase mt-2 tracking-widest">Securely connecting to bank...</p>
            </div>
          )}
          {paymentStep === 'success' && (
            <div className="text-center py-40 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-green-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-100">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Order Confirmed</h3>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-3 max-w-[200px] mx-auto">Your dishes are being prepared now.</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  return null;
};

export default App;
