'use client';

import { useState } from 'react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '@/lib/auth-actions';
import { Loader2, Chrome, Mail, Lock, User as UserIcon, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function AuthModal({ isOpen, onClose, next }: { isOpen: boolean; onClose: () => void; next?: string }) {
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'options' | 'login' | 'signup'>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle(next);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (authMode === 'login') {
        await signInWithEmail(email, password);
        onClose();
        if (next) router.push(next);
      } else {
        await signUpWithEmail(email, password);
        alert('Check your email to confirm your account!');
        setAuthMode('login');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-[#050505]/90 backdrop-blur-xl" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-sm bg-[#0A0A0F] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl p-8 flex flex-col items-center animate-in zoom-in-95 duration-300">
        
        {authMode !== 'options' && (
          <button 
            onClick={() => { setAuthMode('options'); setError(null); }}
            className="absolute top-8 left-8 text-zinc-500 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-600/20 p-px mb-6">
          <div className="w-full h-full bg-[#0A0A0F] rounded-2xl flex items-center justify-center p-3">
             <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          {authMode === 'signup' ? 'Create Account' : authMode === 'login' ? 'Welcome Back' : 'Get Started'}
        </h2>
        
        <p className="text-zinc-500 text-xs mb-8">
          Professional design workspace for visionaries.
        </p>

        {error && (
          <div className="w-full p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider mb-6">
            {error}
          </div>
        )}

        {authMode === 'options' ? (
          <div className="w-full space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all active:scale-95 shadow-lg disabled:opacity-50"
            >
              <Chrome size={18} />
              Continue with Google
            </button>
            
            <button
              onClick={() => setAuthMode('login')}
              className="w-full h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-white font-bold flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all active:scale-95"
            >
              <Mail size={18} />
              Email & Password
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailAuth} className="w-full space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 bg-black border border-zinc-800 rounded-2xl pl-12 pr-4 text-xs text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 bg-black border border-zinc-800 rounded-2xl pl-12 pr-4 text-xs text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-cyan-600 text-white font-bold flex items-center justify-center gap-3 hover:bg-cyan-500 transition-all active:scale-95 shadow-lg shadow-cyan-500/10 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : (authMode === 'login' ? 'Login' : 'Create Account')}
            </button>

            <button
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="w-full text-[10px] text-zinc-500 hover:text-cyan-400 font-bold uppercase tracking-widest transition-colors"
            >
              {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </button>
          </form>
        )}

        <p className="text-[10px] text-zinc-600 mt-8 max-w-[200px] text-center">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
