'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/lib/store';
import { BrainCircuit } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [goals, setGoals] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const router = useRouter();
  const setSession = useSessionStore(state => state.setSession);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      const endpoint = isLogin ? '/api/login' : '/api/onboarding';
      const body = isLogin 
        ? { username, password }
        : { username, password, age: Number(age), goals };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      
      setSession(data.studentId, '');
      router.push('/explore');
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white/10 border border-white/20 text-cyan-400 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <BrainCircuit size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 text-center uppercase">CogniTrace AI</h1>
          <p className="text-slate-400 mt-2 text-center text-sm tracking-widest uppercase">Universal Knowledge Web</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex mb-6 bg-black/30 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => { setIsLogin(true); setErrorMsg(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isLogin ? 'bg-white/20 shadow text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Login
          </button>
          <button 
            onClick={() => { setIsLogin(false); setErrorMsg(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isLogin ? 'bg-white/20 shadow text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Register
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-900/30 text-red-300 text-sm rounded-lg border border-red-500/30 backdrop-blur-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="glass-input w-full"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input w-full"
              required
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="glass-input w-full"
                  required={!isLogin}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Learning Goal</label>
                <input
                  type="text"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  className="glass-input w-full"
                  placeholder="e.g. Master Science"
                  required={!isLogin}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="glass-btn-primary w-full mt-8 uppercase tracking-widest"
          >
            {isLoading ? 'Authenticating...' : (isLogin ? 'Initialize Session' : 'Create Profile')}
          </button>
        </form>
      </div>
    </main>
  );
}
