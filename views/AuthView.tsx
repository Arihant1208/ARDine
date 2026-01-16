
import React, { useState } from 'react';
import { ChefHat, Mail, Lock, User as UserIcon, LogIn, Sparkles, Chrome, PlayCircle } from 'lucide-react';
import { ApiService } from '../services/api';
import { User } from '../types';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

interface AuthViewProps {
  onSuccess: (user: User) => void;
  onBack: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onSuccess, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        const user = await ApiService.login(email, password);
        onSuccess(user);
      } else {
        const user = await ApiService.signUp(email, name, password);
        onSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setTimeout(() => {
      onSuccess({ id: 'g_123', email: 'google@user.com', name: 'Demo Gourmet' });
      setLoading(false);
    }, 1200);
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setTimeout(() => {
      onSuccess({ id: 'u_demo', email: 'demo@ardine.com', name: 'Gourmet Garden' });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-10 animate-in fade-in duration-500">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-orange-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-orange-200">
            <ChefHat className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Owner Portal</h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2">Manage your AR-Dine Experience</p>
        </div>

        <Card className="p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block ml-2">Restaurant Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full p-4 pl-12 bg-gray-50 rounded-2xl font-bold border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-orange-500 outline-none" 
                    placeholder="Enter restaurant name" 
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block ml-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  className="w-full p-4 pl-12 bg-gray-50 rounded-2xl font-bold border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-orange-500 outline-none" 
                  placeholder="name@example.com" 
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block ml-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-4 pl-12 bg-gray-50 rounded-2xl font-bold border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-orange-500 outline-none" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-[10px] font-black uppercase text-center">{error}</p>}

            <Button type="submit" className="w-full" size="lg" isLoading={loading} icon={<LogIn size={18}/>}>
              {isLogin ? "Sign In" : "Register Store"}
            </Button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-100"></div>
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">OR</span>
            <div className="flex-1 h-px bg-gray-100"></div>
          </div>

          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full" 
              size="lg" 
              onClick={handleGoogleLogin} 
              icon={<Chrome size={18}/>}
              disabled={loading}
            >
              Sign in with Google
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full text-orange-600 hover:bg-orange-50" 
              size="md" 
              onClick={handleDemoLogin} 
              icon={<PlayCircle size={18}/>}
              disabled={loading}
            >
              Try Demo Account
            </Button>
          </div>

          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="w-full mt-8 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-orange-500 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </Card>

        <button 
          onClick={onBack} 
          className="w-full mt-6 text-xs font-black text-gray-300 uppercase tracking-widest hover:text-gray-500 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3 h-3" /> Back to Main
        </button>
      </div>
    </div>
  );
};

export default AuthView;
