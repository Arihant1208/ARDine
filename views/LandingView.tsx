
import React from 'react';
import { ChefHat, Settings, ShoppingBag, ChevronRight } from 'lucide-react';
import Button from '../components/common/Button';

interface LandingViewProps {
  onOwnerClick: () => void;
  onCustomerClick: () => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onOwnerClick, onCustomerClick }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-10 animate-in fade-in duration-700">
      <div className="w-24 h-24 bg-orange-500 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl shadow-orange-200">
        <ChefHat className="text-white w-12 h-12" />
      </div>
      <h1 className="text-5xl font-black tracking-tighter mb-4">AR-DINE</h1>
      <p className="text-gray-400 font-medium mb-12 text-center max-w-xs text-sm uppercase tracking-widest">
        AI-Powered 3D Menu Experience
      </p>
      <div className="flex flex-col gap-5 w-full max-w-sm">
        <button 
          onClick={onOwnerClick} 
          className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between hover:border-orange-500 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm"><Settings className="w-6 h-6 text-orange-500"/></div>
            <div className="text-left">
              <p className="font-black text-lg">Owner Hub</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Setup & Dashboard</p>
            </div>
          </div>
          <ChevronRight className="text-gray-300 group-hover:text-orange-500 transition-colors" />
        </button>

        <button 
          onClick={onCustomerClick} 
          className="p-6 bg-gray-900 text-white rounded-3xl flex items-center justify-between shadow-2xl group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl"><ShoppingBag className="w-6 h-6 text-white"/></div>
            <div className="text-left">
              <p className="font-black text-lg">Customer View</p>
              <p className="text-[10px] font-bold text-white/40 uppercase">3D Visualization</p>
            </div>
          </div>
          <ChevronRight className="text-white/40 group-hover:text-white transition-colors" />
        </button>
      </div>
    </div>
  );
};

export default LandingView;
