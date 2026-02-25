import { useState } from 'react';
import { motion } from 'motion/react';
import { Terminal, Lock, User } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('jarvis_token', data.token);
        onLogin();
      } else {
        setError(data.error || 'Erro de autenticação');
      }
    } catch (err) {
      setError('Falha na conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#020813] text-[#00f0ff] font-mono flex items-center justify-center crt select-none p-4">
      <div className="scanlines"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md border border-[#00f0ff]/30 bg-[#00f0ff]/[0.02] p-8 relative backdrop-blur-sm"
      >
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00f0ff]"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00f0ff]"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00f0ff]"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00f0ff]"></div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#00f0ff]/10 flex items-center justify-center border border-[#00f0ff]/50 shadow-[0_0_20px_rgba(0,240,255,0.3)] mb-4">
            <Terminal className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-[0.2em]">JARVIS PT</h1>
          <p className="text-xs opacity-50 tracking-widest mt-2">SISTEMA DE AUTENTICAÇÃO</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 border border-red-500/50 bg-red-500/10 text-red-400 text-xs tracking-widest text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="UTILIZADOR"
                className="w-full bg-transparent border border-[#00f0ff]/30 p-3 pl-10 outline-none focus:border-[#00f0ff] focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all tracking-widest text-sm"
                required
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="CÓDIGO DE ACESSO"
                className="w-full bg-transparent border border-[#00f0ff]/30 p-3 pl-10 outline-none focus:border-[#00f0ff] focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all tracking-widest text-sm"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 border border-[#00f0ff]/50 p-3 tracking-[0.2em] font-bold transition-all hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] disabled:opacity-50"
          >
            {loading ? 'AUTENTICANDO...' : 'ACESSAR SISTEMA'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
