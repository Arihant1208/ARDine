
import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  sticky?: boolean;
  dark?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onBack, actions, sticky = true, dark = false }) => {
  return (
    <header className={`
      px-4 sm:px-10 py-6 sm:py-8 flex justify-between items-center z-50 
      ${sticky ? 'sticky top-0' : ''} 
      ${dark ? 'bg-black/80 text-white border-b border-white/5' : 'bg-white/90 border-b border-gray-100'} 
      backdrop-blur-2xl
    `}>
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        {onBack && (
          <button 
            onClick={onBack} 
            className={`p-3 sm:p-4 rounded-2xl transition-all active:scale-95 shrink-0 ${dark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-black tracking-tight uppercase leading-tight truncate">{title}</h1>
          {subtitle && (
            <p className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest mt-0.5 sm:mt-1 truncate ${dark ? 'text-orange-500' : 'text-orange-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {actions}
      </div>
    </header>
  );
};

export default Header;
