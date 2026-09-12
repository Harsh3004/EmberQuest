import React from 'react';

export function QuestCardSkeleton() {
  return (
    <div
      className="glass rounded-3xl p-5 border border-white/5 flex flex-col gap-4 animate-pulse"
      style={{ background: 'rgba(8,10,24,0.6)' }}
    >
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 bg-slate-800/80 rounded-lg" />
        <div className="h-5 w-16 bg-slate-800/80 rounded-lg" />
      </div>
      <div className="h-6 w-3/4 bg-slate-800/80 rounded-lg" />
      <div className="h-4 w-full bg-slate-800/50 rounded-lg" />
      <div className="h-4 w-2/3 bg-slate-800/50 rounded-lg" />
      <div className="h-10 w-full bg-slate-800/60 rounded-xl mt-2" />
    </div>
  );
}

export function HeroProfileSkeleton() {
  return (
    <div
      className="glass rounded-3xl p-7 mb-8 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse"
      style={{ background: 'rgba(8,10,24,0.7)' }}
    >
      <div className="flex items-center gap-5 w-full md:w-auto">
        <div className="w-18 h-18 rounded-2xl bg-slate-800/80 shrink-0" style={{ width: 72, height: 72 }} />
        <div className="flex flex-col gap-2 w-full">
          <div className="h-6 w-40 bg-slate-800/80 rounded-lg" />
          <div className="h-4 w-28 bg-slate-800/50 rounded-lg" />
          <div className="h-3 w-56 bg-slate-800/40 rounded-full mt-1" />
        </div>
      </div>
      <div className="flex gap-3 w-full md:w-auto justify-end">
        <div className="h-12 w-28 bg-slate-800/70 rounded-xl" />
        <div className="h-12 w-28 bg-slate-800/70 rounded-xl" />
      </div>
    </div>
  );
}
