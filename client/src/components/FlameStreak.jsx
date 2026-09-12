import React from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { streakBonusPercent } from '../lib/progression';

export function FlameStreak({ streak = 0 }) {
  const bonus = streakBonusPercent(streak);

  return (
    <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-950/60 via-amber-950/40 to-slate-900/80 border border-orange-500/30 shadow-lg shadow-orange-950/40 group hover:border-orange-500/60 transition-all cursor-pointer">
      <div className="relative flex items-center justify-center">
        <Flame className="w-5 h-5 text-amber-500 fill-amber-500 animate-flame-pulse" />
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-400 animate-ping opacity-75" />
      </div>
      
      <div className="flex items-center gap-1.5">
        <span className="font-cinzel font-bold text-amber-300 text-sm tracking-wide">
          {streak} <span className="text-xs text-amber-400/80 font-sans font-medium">DAY STREAK</span>
        </span>

        {bonus > 0 && (
          <span className="flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
            <Sparkles className="w-3 h-3 text-amber-400" />
            +{bonus}% XP
          </span>
        )}
      </div>
    </div>
  );
}
