import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Camera, RefreshCw, Box, Settings, Loader2, Trash2
} from 'lucide-react';
import { Dish } from '@/shared/types';
import { ApiService } from '@/shared/services/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOwnerStore } from '@/stores/useOwnerStore';
import { useToastStore } from '@/stores/useToastStore';

import ARViewer from '@/features/customer/components/ARViewer';
import Header from '@/shared/layout/Header';
import Button from '@/shared/components/ui/Button';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import QRGenerator from '@/shared/components/QRGenerator';
import Toast from '@/shared/components/Toast';

const OwnerSetupView: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const user = useAuthStore((s) => s.user)!;
  const logout = useAuthStore((s) => s.logout);

  const { menu, config, isLoading, loadMenu, loadConfig, updateConfig, addDish, removeDish } = useOwnerStore();

  const [localName, setLocalName] = useState('');
  const [localTables, setLocalTables] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [arDish, setArDish] = useState<Dish | null>(null);

  // Load data on mount
  useEffect(() => {
    loadMenu(user.id);
    loadConfig(user.id);
  }, [user.id, loadMenu, loadConfig]);

  // Sync config into local state
  useEffect(() => {
    if (config) {
      setLocalName(config.name);
      setLocalTables(config.tables);
    }
  }, [config]);

  // Poll for generating 3D models
  useEffect(() => {
    const hasGenerating = menu.some(d => d.modelGenerationStatus === 'generating');
    if (!hasGenerating) return;
    const interval = setInterval(() => loadMenu(user.id), 5000);
    return () => clearInterval(interval);
  }, [menu, user.id, loadMenu]);

  const handleMenuUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setStatusMessage('Neural Scene Mapping...');
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const dish = await ApiService.analyzeMenuImage(user.id, ev.target?.result as string);
        addDish(dish);
        addToast(`${dish.name} added to menu!`, 'success');
      } catch {
        addToast('Failed to analyze image.', 'error');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveConfig = async () => {
    try {
      await updateConfig({ userId: user.id, name: localName, tables: localTables });
      addToast('Configuration saved!', 'success');
    } catch {
      addToast('Failed to save configuration', 'error');
    }
  };

  const handleDeleteDish = async (dishId: string) => {
    try {
      await removeDish(user.id, dishId);
      addToast('Dish removed from menu.', 'success');
    } catch {
      addToast('Failed to delete dish.', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    addToast('Logged out successfully', 'info');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Toast />
      <Header
        title="Owner Setup"
        subtitle={user.name}
        onBack={handleLogout}
        actions={
          <div className="flex gap-2">
            <Button variant="dark" size="sm" icon={<LayoutDashboard size={14} />} onClick={() => navigate('/owner/dashboard')}>Live Feed</Button>
          </div>
        }
      />
      <main className="p-4 sm:p-10 max-w-7xl mx-auto space-y-6 sm:space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
          {/* Store info */}
          <Card className="p-6 sm:p-10">
            <h3 className="text-lg font-black mb-6 uppercase tracking-tight flex items-center gap-3">
              <Settings className="text-orange-500" size={20} /> Store Info
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block px-1">Venue Name</label>
                <input
                  type="text"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block px-1">Total Tables</label>
                <input
                  type="number"
                  value={localTables}
                  onChange={(e) => setLocalTables(parseInt(e.target.value) || 0)}
                  className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <Button variant="primary" className="w-full h-14" onClick={handleSaveConfig}>Update Store</Button>
            </div>
          </Card>

          {/* Upload */}
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

        {/* Menu grid */}
        <div className="space-y-6">
          <h3 className="text-xl font-black tracking-tighter uppercase px-2">Active Menu</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
            {menu.map((dish) => (
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
                    <div className="flex items-center gap-2">
                      {dish.modelGenerationStatus === 'ready' && (
                        <button onClick={() => setArDish(dish)} className="p-2.5 bg-gray-100 rounded-xl text-orange-500 hover:bg-orange-500 hover:text-white transition-all shadow-sm">
                          <Box size={18} />
                        </button>
                      )}
                      <button onClick={() => handleDeleteDish(dish.id)} className="p-2.5 bg-gray-100 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* QR codes */}
        <Card className="p-6 sm:p-10">
          <h3 className="text-lg font-black mb-4 uppercase tracking-tight">QR Distribution</h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-10">Print these for your tables to unlock the AR experience.</p>
          <QRGenerator restaurantName={localName || 'AR-DINE'} tableCount={localTables} userId={user.id} />
        </Card>
      </main>

      {arDish && <ARViewer dish={arDish} onClose={() => setArDish(null)} />}
    </div>
  );
};

export default OwnerSetupView;
