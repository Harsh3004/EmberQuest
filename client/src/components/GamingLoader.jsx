import React, { useEffect, useState } from 'react';
import { Flame, Sparkles, Shield, Swords } from 'lucide-react';

const GAMING_MESSAGES = [
  'COMMUNING WITH REALM ARCHIVES...',
  'AWAKENING HERO ESSENCE...',
  'CHANNELING ANCIENT RUNES...',
  'SUMMONING ACTIVE QUEST SCROLLS...',
  'CALIBRATING SKILL MASTERY TREES...',
];

export function GamingLoader({ message = null, isFullScreen = false, size = 'default' }) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % GAMING_MESSAGES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const displayMessage = message || GAMING_MESSAGES[msgIdx];

  const content = (
    <div className="flex flex-col items-center justify-center p-8 select-none">
      {/* Arcane Rotating Portal */}
      <div className="relative flex items-center justify-center mb-6" style={{ width: 140, height: 140 }}>
        {/* Outer Rune Ring */}
        <div
          className="absolute inset-0 rounded-full border border-dashed border-amber-500/30 animate-rune"
          style={{ boxShadow: '0 0 30px rgba(245,158,11,0.15)' }}
        />

        {/* Middle Counter-rotating Rune Ring */}
        <div
          className="absolute rounded-full border border-amber-400/25 animate-rune-reverse"
          style={{ inset: 12, borderStyle: 'dotted', borderWidth: 2 }}
        />

        {/* Inner Glowing Hex / Circle */}
        <div
          className="absolute rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-400/40"
          style={{ inset: 26, boxShadow: '0 0 25px rgba(245,158,11,0.25), inset 0 0 15px rgba(245,158,11,0.2)' }}
        />

        {/* Center Flame Icon */}
        <div className="relative z-10 animate-flame flex items-center justify-center">
          <Flame size={38} className="text-amber-400 drop-shadow-[0_0_16px_rgba(245,158,11,0.9)]" />
        </div>

        {/* Corner Arcane Sparks */}
        <Sparkles size={14} className="absolute -top-1 -right-1 text-amber-300 animate-pulse" />
        <Sparkles size={12} className="absolute -bottom-1 -left-1 text-orange-400 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Cinematic Text */}
      <div className="text-center max-w-xs">
        <div
          className="font-cinzel font-black tracking-widest text-gold text-sm md:text-base leading-snug animate-pulse"
          style={{ letterSpacing: '0.14em', textShadow: '0 0 16px rgba(245,158,11,0.5)' }}
        >
          {displayMessage}
        </div>
        <p className="text-xs text-slate-500 mt-2 font-medium tracking-wider">
          Retrieving live game state from database...
        </p>
      </div>

      {/* Pulsing Energy Progress Dots */}
      <div className="flex items-center gap-2 mt-5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-amber-400"
            style={{
              animation: 'bounceIn 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.25}s`,
              boxShadow: '0 0 8px rgba(245,158,11,0.7)',
            }}
          />
        ))}
      </div>
    </div>
  );

  if (isFullScreen) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(14,18,36,0.98) 0%, rgba(4,5,13,0.99) 100%)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className="glass rounded-3xl w-full flex items-center justify-center min-h-[300px] border border-white/5"
      style={{
        background: 'linear-gradient(135deg, rgba(8,10,24,0.7) 0%, rgba(20,14,6,0.65) 100%)',
        boxShadow: '0 0 40px rgba(0,0,0,0.5)',
      }}
    >
      {content}
    </div>
  );
}
