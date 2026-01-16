
import React, { useRef, useState, useEffect } from 'react';
import { Dish } from '../types';
import { X, Box, ZoomIn, ZoomOut, RotateCcw, MousePointer2, Sparkles, AlertTriangle, RefreshCw, Smartphone, HelpCircle } from 'lucide-react';

interface ARViewerProps {
  dish: Dish;
  onClose: () => void;
}

const ModelViewer = 'model-viewer' as any;

const ARViewer: React.FC<ARViewerProps> = ({ dish, onClose }) => {
  const viewerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [arStatus, setArStatus] = useState<string>('initializing');
  const [showCompatibilityInfo, setShowCompatibilityInfo] = useState(false);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const handleLoad = () => {
      setIsLoaded(true);
      setLoadError(null);
    };

    const handleError = () => {
      setLoadError('Failed to load the 3D model. Please try again.');
    };

    const handleArStatus = (event: any) => {
      setArStatus(event.detail.status);
    };

    viewer.addEventListener('load', handleLoad);
    viewer.addEventListener('error', handleError);
    viewer.addEventListener('ar-status', handleArStatus);

    return () => {
      viewer.removeEventListener('load', handleLoad);
      viewer.removeEventListener('error', handleError);
      viewer.removeEventListener('ar-status', handleArStatus);
    };
  }, [dish.arModelUrl]);

  const adjustZoom = (amount: number) => {
    if (!viewerRef.current) return;
    const currentFov = parseFloat(viewerRef.current.getFieldOfView());
    const newFov = Math.max(10, Math.min(80, currentFov - amount));
    viewerRef.current.fieldOfView = `${newFov}deg`;
  };

  const resetView = () => {
    if (!viewerRef.current) return;
    viewerRef.current.cameraOrbit = "0deg 75deg 105%";
    viewerRef.current.fieldOfView = "auto";
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden touch-none">
      {/* Top Header */}
      <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex justify-between items-center z-[110] bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl py-2 px-4 rounded-full border border-white/10 max-w-[70%]">
          <Box size={16} className="text-orange-500 shrink-0" />
          <h2 className="text-white font-black text-[10px] sm:text-xs truncate uppercase tracking-widest">{dish.name}</h2>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center text-black shadow-xl active:scale-90 transition-transform"
        >
          <X size={24} />
        </button>
      </div>

      {/* 3D Content */}
      <div className="relative flex-1 bg-black">
        {!isLoaded && !loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-50">
            <RefreshCw className="w-10 h-10 text-orange-500 animate-spin mb-4" />
            <p className="text-orange-500 font-black text-[10px] uppercase tracking-[0.2em]">Preparing Scene...</p>
          </div>
        )}

        <ModelViewer
          ref={viewerRef}
          src={dish.arModelUrl}
          poster={dish.images[0]}
          alt={`3D Model of ${dish.name}`}
          shadow-intensity="1"
          camera-controls
          auto-rotate
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="auto"
          ar-placement="floor"
          touch-action="pan-y"
          className="w-full h-full"
        >
          {/* THE TRIGGER BUTTON */}
          <button slot="ar-button" id="ar-button">
            PLACE ON TABLE
          </button>
        </ModelViewer>

        {/* Side Controls */}
        {isLoaded && arStatus !== 'presenting' && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-[105]">
            <button onClick={() => adjustZoom(15)} className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center text-white border border-white/10"><ZoomIn size={18}/></button>
            <button onClick={() => adjustZoom(-15)} className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center text-white border border-white/10"><ZoomOut size={18}/></button>
            <button onClick={resetView} className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center text-white border border-white/10"><RotateCcw size={18}/></button>
            <button onClick={() => setShowCompatibilityInfo(true)} className="w-10 h-10 bg-orange-500/20 backdrop-blur-xl rounded-xl flex items-center justify-center text-orange-400 border border-orange-500/20"><HelpCircle size={18}/></button>
          </div>
        )}

        {/* Bottom Instructional Panel */}
        {isLoaded && arStatus !== 'presenting' && (
          <div className="absolute bottom-6 inset-x-4 sm:inset-x-10 z-[105] pointer-events-none">
            <div className="max-w-md mx-auto bg-white/10 backdrop-blur-3xl p-5 rounded-[2rem] border border-white/10 shadow-2xl pointer-events-auto">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center shrink-0">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-[10px] sm:text-xs font-bold leading-tight uppercase tracking-tight">
                    {arStatus === 'failed' 
                      ? "AR Not Supported - View 3D Mode"
                      : "Tap 'PLACE ON TABLE' to start AR"}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1">
                      <MousePointer2 size={8} /> Rotate Model
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compatibility Help */}
      {showCompatibilityInfo && (
        <div className="absolute inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-black mb-6 uppercase tracking-tight">AR Guide</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0 font-black text-[10px]">01</div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">Use Chrome (Android) or Safari (iOS).</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center shrink-0 font-black text-[10px]">02</div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">Move camera over a flat table surface.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowCompatibilityInfo(false)}
              className="w-full mt-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ARViewer;
