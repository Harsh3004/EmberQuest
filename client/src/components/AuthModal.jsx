import React, { useState } from 'react';
import { X, Flame, Lock, Mail, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sound } from '../lib/sound';

export function AuthModal({ initialMode = 'login', onClose }) {
  const { login, signup, isBackendConnected } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    sound.playClick();
    try {
      if (mode === 'login') await login(username || email, password);
      else await signup(username, email, password);
      onClose();
    } catch (err) {
      if (err.details && typeof err.details === 'object' && Object.keys(err.details).length > 0) {
        const msgs = Object.values(err.details).join('. ');
        setError(msgs);
      } else {
        setError(err.message || 'Authentication failed. Check your credentials.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade"
      style={{ background: 'rgba(4,5,13,0.9)', backdropFilter: 'blur(20px)' }}
    >
      <div
        className="relative glass animate-scale overflow-hidden"
        style={{
          width:'100%', maxWidth:440, borderRadius:24,
          padding:'32px',
          background:'linear-gradient(160deg, rgba(8,10,24,0.97) 0%, rgba(30,20,4,0.95) 100%)',
          border:'1px solid rgba(245,158,11,0.3)',
          boxShadow:'0 0 50px rgba(245,158,11,0.12), 0 40px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* Decoration */}
        <div style={{ position:'absolute', top:-50, right:-50, width:160, height:160, borderRadius:'50%', border:'1px solid rgba(245,158,11,0.07)', pointerEvents:'none' }} className="animate-rune" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div style={{
              width:44, height:44, borderRadius:12,
              background:'linear-gradient(135deg,rgba(217,119,6,0.3),rgba(245,158,11,0.15))',
              border:'1px solid rgba(245,158,11,0.4)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 20px rgba(245,158,11,0.25)',
            }}>
              <Flame size={22} style={{ color:'#f59e0b' }} className="animate-flame" />
            </div>
            <div>
              <h2 className="font-cinzel font-black text-xl text-gold leading-none">
                {mode === 'login' ? 'ENTER REALM' : 'FORGE HERO'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isBackendConnected ? 'Connected to realm — progress synced' : 'Connecting to realm...'}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-xl mb-5" style={{ background:'rgba(4,5,13,0.8)', border:'1px solid rgba(255,255,255,0.06)' }}>
          {['login','signup'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); }}
              className="py-2.5 rounded-xl font-cinzel font-bold text-xs tracking-wider uppercase transition"
              style={{
                background: mode === m ? 'linear-gradient(135deg,rgba(217,119,6,0.25),rgba(245,158,11,0.1))' : 'transparent',
                border: `1px solid ${mode === m ? 'rgba(245,158,11,0.35)' : 'transparent'}`,
                color: mode === m ? '#fbbf24' : '#64748b',
                boxShadow: mode === m ? '0 0 16px rgba(245,158,11,0.1)' : 'none',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-xs font-medium" style={{
            background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.3)', color:'#f87171',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label flex items-center gap-1">
              <User size={11} style={{ color:'#f59e0b' }} />
              {mode === 'login' ? 'Username or Email' : 'Hero Username'}
            </label>
            <input
              className="form-input" required
              value={username} onChange={e => setUsername(e.target.value)}
              placeholder={mode === 'login' ? 'username or email' : 'Choose your hero name'}
            />
            {mode === 'signup' && (
              <p className="text-[10px] text-slate-500 mt-1">3–20 chars, letters, numbers & underscores only</p>
            )}
          </div>

          {mode === 'signup' && (
            <div>
              <label className="form-label flex items-center gap-1">
                <Mail size={11} style={{ color:'#f59e0b' }} /> Email
              </label>
              <input
                type="email" className="form-input" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="hero@emberquest.io"
              />
            </div>
          )}

          <div>
            <label className="form-label flex items-center gap-1">
              <Lock size={11} style={{ color:'#f59e0b' }} /> Password
            </label>
            <input
              type="password" className="form-input" required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {mode === 'signup' && (
              <p className="text-[10px] text-slate-500 mt-1">Must be at least 8 characters</p>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full" style={{ padding:'13px 24px', marginTop:8 }}>
            <ArrowRight size={15} />
            {loading ? 'Entering Realm...' : mode === 'login' ? 'ENTER REALM' : 'CREATE HERO'}
          </button>
        </form>
      </div>
    </div>
  );
}
