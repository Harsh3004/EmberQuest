import React from 'react';
import { Dumbbell, Brain, Heart, Zap, MessageSquare, ChevronRight, TrendingUp, Star } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { xpForAttributeLevel } from '../lib/progression';
import { SkillTreesSkeleton } from './Skeleton';

const ATTRS = {
  Strength:   { icon: Dumbbell,       color: '#ef4444', glow: 'rgba(239,68,68,0.35)',   bg: 'linear-gradient(135deg,rgba(239,68,68,0.18),rgba(8,10,24,0.95))',   border: 'rgba(239,68,68,0.3)',   bar: 'linear-gradient(90deg,#dc2626,#ef4444,#fca5a5)' },
  Intellect:  { icon: Brain,          color: '#60a5fa', glow: 'rgba(59,130,246,0.35)',  bg: 'linear-gradient(135deg,rgba(59,130,246,0.18),rgba(8,10,24,0.95))',  border: 'rgba(59,130,246,0.3)',  bar: 'linear-gradient(90deg,#2563eb,#3b82f6,#93c5fd)' },
  Vitality:   { icon: Heart,          color: '#34d399', glow: 'rgba(16,185,129,0.35)',  bg: 'linear-gradient(135deg,rgba(16,185,129,0.18),rgba(8,10,24,0.95))', border: 'rgba(16,185,129,0.3)',  bar: 'linear-gradient(90deg,#059669,#10b981,#6ee7b7)' },
  Discipline: { icon: Zap,            color: '#fbbf24', glow: 'rgba(245,158,11,0.35)',  bg: 'linear-gradient(135deg,rgba(245,158,11,0.18),rgba(8,10,24,0.95))',  border: 'rgba(245,158,11,0.3)',  bar: 'linear-gradient(90deg,#b45309,#f59e0b,#fde68a)' },
  Charisma:   { icon: MessageSquare,  color: '#c084fc', glow: 'rgba(168,85,247,0.35)',  bg: 'linear-gradient(135deg,rgba(168,85,247,0.18),rgba(8,10,24,0.95))',  border: 'rgba(168,85,247,0.3)',  bar: 'linear-gradient(90deg,#7c3aed,#a855f7,#d8b4fe)' },
};

const DESCRIPTIONS = {
  Strength:   'Physical mastery, gym training, endurance, athletic performance.',
  Intellect:  'Coding, architecture, critical thinking, deep learning, and reading.',
  Vitality:   'Sleep hygiene, nutrition, mental wellness, and morning rituals.',
  Discipline: 'Deep focus, deadlines, consistent habits, and daily fortitude.',
  Charisma:   'Networking, leadership, public speaking, and social mastery.',
};

export function SkillTrees() {
  const { character, quests, setActiveTab, setSelectedAttribute, dataLoading } = useGame();
  const attributes = character.attributes || [];

  if (dataLoading && attributes.length === 0) {
    return <SkillTreesSkeleton />;
  }

  return (
    <div className="space-y-6 animate-slide">

      {/* Section header */}
      <div className="relative glass rounded-3xl overflow-hidden" style={{ padding: '32px 36px' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(217,119,6,0.15) 0%, transparent 50%, rgba(120,40,180,0.1) 100%)',
        }} />
        <div style={{
          position: 'absolute', right: -60, top: -60,
          width: 220, height: 220, borderRadius: '50%',
          border: '1px solid rgba(245,158,11,0.08)',
        }} className="animate-rune" />
        <div style={{
          position: 'absolute', right: -20, top: -20,
          width: 140, height: 140, borderRadius: '50%',
          border: '1px solid rgba(245,158,11,0.12)',
          animationDirection: 'reverse',
        }} className="animate-rune" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full" style={{
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', fontSize: '0.65rem',
            color: '#f59e0b', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            <Star size={11} /> Independent Mastery System
          </div>
          <h2 className="font-cinzel font-black text-2xl md:text-3xl text-gold mb-2">
            HERO SKILL TREES
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed" style={{ maxWidth: 560 }}>
            Every quest links to a skill tree. Earn attribute XP and level each tree independently — your path to legendary mastery.
          </p>
        </div>
      </div>

      {/* Attribute cards */}
      <div id="skill-trees-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {attributes.map((attr, i) => {
          const cfg = ATTRS[attr.name] || ATTRS.Discipline;
          const Icon = cfg.icon;
          const totalXp = attr.currentXp + (attr.xpToNextLevel || xpForAttributeLevel(attr.level) - attr.currentXp);
          const pct = Math.min(100, Math.round(attr.currentXp / (totalXp || 1) * 100));
          const activeCount = quests.filter(q => q.attribute === attr.name && q.status === 'ACTIVE').length;

          return (
            <div
              key={attr.name}
              className="glass glass-hover rounded-3xl relative overflow-hidden"
              style={{
                padding: '24px',
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                animationDelay: `${i * 0.07}s`,
              }}
            >
              {/* Background glow orb */}
              <div style={{
                position: 'absolute', top: -30, right: -30,
                width: 120, height: 120, borderRadius: '50%',
                background: cfg.color, opacity: 0.06, filter: 'blur(30px)',
                pointerEvents: 'none',
              }} />

              {/* Accent line left */}
              <div className="card-accent-left" style={{ background: cfg.color, boxShadow: `0 0 12px ${cfg.color}` }} />

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Orb icon */}
                  <div className="animate-orb" style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: `linear-gradient(135deg, ${cfg.color}30, ${cfg.color}10)`,
                    border: `1px solid ${cfg.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 20px ${cfg.glow}`,
                  }}>
                    <Icon size={24} style={{ color: cfg.color }} />
                  </div>
                  <div>
                    <h3 className="font-cinzel font-bold text-base" style={{ color: cfg.color }}>
                      {attr.name}
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">Skill Tree</span>
                  </div>
                </div>

                {/* Level badge */}
                <div className="flex flex-col items-end">
                  <div className="px-3 py-1.5 rounded-xl font-cinzel font-black text-lg leading-none" style={{
                    background: `linear-gradient(135deg, ${cfg.color}20, ${cfg.color}08)`,
                    border: `1px solid ${cfg.border}`,
                    color: cfg.color,
                    boxShadow: `0 0 12px ${cfg.glow}`,
                  }}>
                    {attr.level}
                  </div>
                  <span className="text-xs text-slate-600 mt-0.5">Level</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed mb-4" style={{ minHeight: 34 }}>
                {DESCRIPTIONS[attr.name]}
              </p>

              {/* XP Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5 text-xs">
                  <span className="text-slate-500 font-medium">Attribute XP</span>
                  <span className="font-mono font-bold" style={{ color: cfg.color }}>
                    {attr.currentXp} / {totalXp}
                  </span>
                </div>
                <div className="xp-bar-track" style={{ height: 7 }}>
                  <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: 100,
                    background: cfg.bar,
                    boxShadow: `0 0 8px ${cfg.glow}`,
                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-1.5 text-xs">
                  <TrendingUp size={12} style={{ color: cfg.color }} />
                  <span style={{ color: cfg.color, fontWeight: 600 }}>{activeCount}</span>
                  <span className="text-slate-500">active quests</span>
                </div>
                <button
                  className="flex items-center gap-1 text-xs font-semibold transition hover-glow"
                  style={{ color: cfg.color }}
                  onClick={() => { setSelectedAttribute(attr.name); setActiveTab('quests'); }}
                >
                  View quests <ChevronRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
