import React from 'react';
import { Trophy, Sparkles, Coins, Star, Zap } from 'lucide-react';

export function LevelUpModal({ data, onClose }) {
  if (!data) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade"
      style={{ background: 'rgba(4,5,13,0.92)', backdropFilter: 'blur(28px)' }}
    >
      <div
        className="relative overflow-hidden text-center animate-bounce"
        style={{
          width: '100%', maxWidth: 420,
          borderRadius: 28,
          padding: '44px 36px',
          background: 'linear-gradient(160deg, rgba(10,8,0,0.98) 0%, rgba(40,20,4,0.98) 100%)',
          border: '1px solid rgba(245,158,11,0.45)',
          boxShadow: '0 0 80px rgba(245,158,11,0.2), 0 0 200px rgba(217,119,6,0.1), 0 40px 80px rgba(0,0,0,0.8)',
        }}
      >
        {/* Background radial glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Rune rings */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
          <div className="animate-rune" style={{
            position:'absolute', top:'50%', left:'50%',
            transform:'translate(-50%,-50%)',
            width:340, height:340, borderRadius:'50%',
            border:'1px solid rgba(245,158,11,0.08)',
          }} />
          <div className="animate-rune" style={{
            position:'absolute', top:'50%', left:'50%',
            transform:'translate(-50%,-50%)',
            width:260, height:260, borderRadius:'50%',
            border:'1px solid rgba(245,158,11,0.12)',
            animationDirection:'reverse', animationDuration:'6s',
          }} />
        </div>

        {/* Trophy Icon */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div style={{
            width: 88, height: 88, borderRadius: 22,
            background: 'linear-gradient(135deg, rgba(217,119,6,0.4), rgba(245,158,11,0.2))',
            border: '1px solid rgba(245,158,11,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(245,158,11,0.4), inset 0 1px 0 rgba(251,191,36,0.3)',
          }}>
            <Trophy size={44} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{
            position: 'absolute', top: -6, right: -6,
            width: 24, height: 24, borderRadius: 8,
            background: '#f59e0b', border: '2px solid rgba(4,5,13,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Star size={12} style={{ color: '#1c1400' }} fill="#1c1400" />
          </div>
        </div>

        {/* Title */}
        <div className="mb-1 text-xs font-bold tracking-widest uppercase text-amber-500">
          ✦ Victory Achieved ✦
        </div>
        <h2 className="font-cinzel-deco font-bold text-3xl text-gold leading-tight mb-2">
          LEVEL UP!
        </h2>
        <div className="font-cinzel font-black text-4xl leading-none mb-4" style={{
          background: 'linear-gradient(135deg, #fef08a, #f59e0b, #d97706)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {data.newLevel}
        </div>

        {data.attributeName && (
          <div className="text-sm text-slate-400 mb-6">
            <span className="text-amber-300 font-semibold">{data.attributeName}</span> reached Level{' '}
            <span className="text-amber-300 font-semibold">{data.attributeLevel}</span>!
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div style={{
            padding: '14px', borderRadius: 14,
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
          }}>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Sparkles size={14} style={{ color: '#f59e0b' }} />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">XP Earned</span>
            </div>
            <div className="font-mono font-black text-xl text-amber-400">+{data.xpGained}</div>
          </div>
          <div style={{
            padding: '14px', borderRadius: 14,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          }}>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Coins size={14} style={{ color: '#fbbf24' }} />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gold Claimed</span>
            </div>
            <div className="font-mono font-black text-xl text-yellow-300">+{data.goldGained}</div>
          </div>
        </div>

        {/* CTA */}
        <button
          className="btn-primary w-full"
          onClick={onClose}
          style={{ padding: '14px 24px', fontSize: '0.78rem', letterSpacing: '0.15em' }}
        >
          <Zap size={16} />
          CLAIM GLORY & CONTINUE
        </button>
      </div>
    </div>
  );
}
