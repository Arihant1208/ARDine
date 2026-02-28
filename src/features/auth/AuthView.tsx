
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Sparkles, PlayCircle } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToastStore } from '@/stores/useToastStore';
import Button from '@/shared/components/ui/Button';
import Card from '@/shared/components/ui/Card';
import Toast from '@/shared/components/Toast';

const AuthView: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const { loginWithGoogle, demoLogin, isLoading, error, clearError } = useAuthStore();
  const [localLoading, setLocalLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      addToast('Google sign-in failed — no credential returned.', 'error');
      return;
    }
    try {
      await loginWithGoogle(credentialResponse.credential);
      addToast('Welcome back!', 'success');
      navigate('/owner/setup');
    } catch {
      addToast('Google sign-in failed.', 'error');
    }
  };

  const handleDemoLogin = async () => {
    setLocalLoading(true);
    try {
      await demoLogin();
      addToast('Welcome to the demo!', 'success');
      navigate('/owner/setup');
    } catch {
      addToast('Demo login failed.', 'error');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-10 animate-in fade-in duration-500">
      <Toast />
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-orange-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-orange-200">
            <ChefHat className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Owner Portal</h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2">Manage your AR-Dine Experience</p>
        </div>

        <Card className="p-10">
          <p className="text-center text-xs text-gray-500 font-bold uppercase tracking-widest mb-8">
            Sign in with your Google account to manage your restaurant
          </p>

          {error && (
            <p className="text-red-500 text-[10px] font-black uppercase text-center mb-4">{error}</p>
          )}

          <div className="flex justify-center mb-8">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => addToast('Google sign-in failed.', 'error')}
              theme="outline"
              size="large"
              shape="pill"
              width="100%"
            />
          </div>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">OR</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <Button
            variant="ghost"
            className="w-full text-orange-600 hover:bg-orange-50"
            size="md"
            onClick={handleDemoLogin}
            icon={<PlayCircle size={18} />}
            disabled={isLoading || localLoading}
            isLoading={localLoading}
          >
            Try Demo Account
          </Button>
        </Card>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-6 text-xs font-black text-gray-300 uppercase tracking-widest hover:text-gray-500 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3 h-3" /> Back to Main
        </button>
      </div>
    </div>
  );
};

export default AuthView;
