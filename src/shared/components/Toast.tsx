import React from 'react';
import { useToastStore, ToastType } from '@/stores/useToastStore';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast: React.FC = () => {
    const { toasts, removeToast } = useToastStore();

    if (toasts.length === 0) return null;

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
            case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getBgColor = (type: ToastType) => {
        switch (type) {
            case 'success': return 'bg-green-50 border-green-100';
            case 'error': return 'bg-red-50 border-red-100';
            case 'warning': return 'bg-yellow-50 border-yellow-100';
            default: return 'bg-blue-50 border-blue-100';
        }
    };

    return (
        <div className="fixed bottom-10 right-10 z-[200] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
            pointer-events-auto
            flex items-center gap-4 p-4 pr-6 rounded-2xl border shadow-xl 
            animate-in slide-in-from-right-10 fade-in duration-300
            ${getBgColor(toast.type)}
          `}
                >
                    <div className="shrink-0">{getIcon(toast.type)}</div>
                    <div className="flex-1 min-w-[200px]">
                        <p className="text-sm font-bold text-gray-900">{toast.message}</p>
                    </div>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="p-1 hover:bg-black/5 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default Toast;
