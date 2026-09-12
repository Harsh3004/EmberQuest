import React from 'react';
import { Flame, Sparkles, Shield, Swords, Coins } from 'lucide-react';

export function QuestCardSkeleton() {
  return (
    <div
      className="glass rounded-3xl p-5 border border-amber-500/15 flex flex-col gap-4 gaming-shimmer"
      style={{
        background: 'linear-gradient(135deg, rgba(8,10,24,0.75) 0%, rgba(20,13,5,0.7) 100%)',
        boxShadow: '0 0 25px rgba(0,0,0,0.5)',
      }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 bg-amber-500/10 rounded-full border border-amber-500/20" />
        <div className="h-5 w-16 bg-slate-800/80 rounded-full border border-white/5" />
      </div>

      {/* Title */}
      <div className="h-6 w-3/4 bg-slate-700/50 rounded-lg" />

      {/* Description lines */}
      <div className="space-y-2">
        <div className="h-3.5 w-full bg-slate-800/50 rounded" />
        <div className="h-3.5 w-2/3 bg-slate-800/40 rounded" />
      </div>

      <div className="flex-1" />

      {/* Rewards bar */}
      <div className="flex items-center justify-between py-2 border-t border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-4 w-16 bg-amber-500/15 rounded" />
          <div className="h-4 w-16 bg-yellow-500/15 rounded" />
        </div>
        <div className="h-4 w-12 bg-slate-800/40 rounded" />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        <div className="h-9 w-9 bg-slate-800/60 rounded-xl border border-white/5" />
        <div className="h-9 w-9 bg-slate-800/60 rounded-xl border border-white/5" />
        <div className="h-9 flex-1 bg-amber-500/15 rounded-xl border border-amber-500/25" />
      </div>
    </div>
  );
}

export function HeroProfileSkeleton() {
  return (
    <div
      className="glass rounded-3xl p-7 mb-8 border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-6 gaming-shimmer"
      style={{
        background: 'linear-gradient(135deg, rgba(8,10,24,0.85) 0%, rgba(28,18,5,0.8) 100%)',
        boxShadow: '0 0 40px rgba(245,158,11,0.06)',
      }}
    >
      <div className="flex items-center gap-5 w-full md:w-auto">
        {/* Avatar orb skeleton with rune border */}
        <div
          className="relative rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0"
          style={{ width: 72, height: 72, boxShadow: '0 0 20px rgba(245,158,11,0.15)' }}
        >
          <Flame size={28} className="text-amber-500/40 animate-pulse" />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="h-6 w-44 bg-amber-400/20 rounded-lg" />
          <div className="h-4 w-28 bg-slate-700/50 rounded-lg" />
          <div className="h-3 w-56 bg-slate-800/80 rounded-full mt-1 border border-white/5 overflow-hidden">
            <div className="h-full w-2/5 bg-amber-500/30 rounded-full" />
          </div>
        </div>
      </div>

      {/* Quick stats pills */}
      <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
        <div className="h-12 w-28 bg-amber-500/10 border border-amber-500/20 rounded-xl" />
        <div className="h-12 w-28 bg-orange-500/10 border border-orange-500/20 rounded-xl" />
        <div className="h-12 w-24 bg-slate-800/60 border border-white/5 rounded-xl" />
      </div>
    </div>
  );
}

export function SkillTreesSkeleton() {
  return (
    <div className="space-y-6 animate-fade">
      {/* Header banner skeleton */}
      <div
        className="glass rounded-3xl p-8 border border-amber-500/20 gaming-shimmer"
        style={{ background: 'linear-gradient(135deg, rgba(8,10,24,0.7) 0%, rgba(20,13,5,0.7) 100%)' }}
      >
        <div className="h-5 w-32 bg-amber-500/20 rounded-full mb-3" />
        <div className="h-8 w-60 bg-slate-700/60 rounded-xl mb-3" />
        <div className="h-4 w-96 bg-slate-800/50 rounded-lg max-w-full" />
      </div>

      {/* 5 Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="glass rounded-3xl p-6 border border-white/5 flex flex-col gap-4 gaming-shimmer"
            style={{ background: 'linear-gradient(135deg, rgba(8,10,24,0.75) 0%, rgba(20,13,5,0.7) 100%)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30" />
                <div className="space-y-1.5">
                  <div className="h-5 w-24 bg-slate-700/60 rounded-lg" />
                  <div className="h-3 w-16 bg-slate-800/50 rounded" />
                </div>
              </div>
              <div className="h-8 w-12 bg-purple-500/15 rounded-xl border border-purple-500/30" />
            </div>

            <div className="h-3.5 w-full bg-slate-800/40 rounded mt-1" />

            <div className="space-y-1.5 mt-2">
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-slate-800/50 rounded" />
                <div className="h-3 w-12 bg-slate-800/50 rounded" />
              </div>
              <div className="h-2.5 w-full bg-slate-800/70 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-purple-500/40 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ShopArmorySkeleton() {
  return (
    <div className="space-y-6 animate-fade">
      {/* Treasury Header */}
      <div
        className="glass rounded-3xl p-7 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 gaming-shimmer"
        style={{ background: 'linear-gradient(135deg, rgba(8,10,24,0.85) 0%, rgba(28,18,5,0.8) 100%)' }}
      >
        <div className="space-y-2">
          <div className="h-5 w-36 bg-amber-500/20 rounded-full" />
          <div className="h-7 w-48 bg-slate-700/60 rounded-lg" />
          <div className="h-4 w-72 bg-slate-800/50 rounded-lg" />
        </div>
        <div className="h-16 w-36 bg-amber-500/15 rounded-2xl border border-amber-500/30" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 pb-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-20 bg-slate-800/60 rounded-xl border border-white/5" />
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="glass rounded-3xl p-5 border border-white/5 flex flex-col gap-3 gaming-shimmer"
            style={{ background: 'linear-gradient(135deg, rgba(8,10,24,0.75) 0%, rgba(20,13,5,0.7) 100%)' }}
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-20 bg-amber-500/15 rounded-full" />
              <div className="h-5 w-16 bg-yellow-500/15 rounded-full" />
            </div>
            <div className="h-6 w-3/4 bg-slate-700/60 rounded-lg" />
            <div className="h-3.5 w-full bg-slate-800/50 rounded" />
            <div className="h-9 w-full bg-amber-500/15 rounded-xl border border-amber-500/25 mt-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivityLogsSkeleton() {
  return (
    <div className="space-y-6 animate-fade">
      {/* Header */}
      <div
        className="glass rounded-3xl p-7 border border-amber-500/20 gaming-shimmer"
        style={{ background: 'linear-gradient(135deg, rgba(8,10,24,0.75) 0%, rgba(20,13,5,0.7) 100%)' }}
      >
        <div className="h-5 w-32 bg-amber-500/20 rounded-full mb-2" />
        <div className="h-7 w-48 bg-slate-700/60 rounded-lg mb-2" />
        <div className="h-4 w-72 bg-slate-800/50 rounded-lg" />
      </div>

      {/* Timeline items */}
      <div className="glass rounded-3xl p-6 border border-white/5 space-y-4 gaming-shimmer">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15" />
              <div className="space-y-1.5">
                <div className="h-4 w-48 bg-slate-700/60 rounded" />
                <div className="h-3 w-28 bg-slate-800/50 rounded" />
              </div>
            </div>
            <div className="h-5 w-16 bg-amber-500/10 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
