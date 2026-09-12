import React, { useState } from 'react';
import { EmberCanvas } from './components/EmberCanvas';
import { Header } from './components/Header';
import { SkillTrees } from './components/SkillTrees';
import { QuestCard } from './components/QuestCard';
import { QuestModal } from './components/QuestModal';
import { LevelUpModal } from './components/LevelUpModal';
import { ShopArmory } from './components/ShopArmory';
import { ActivityFeed } from './components/ActivityFeed';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './components/LandingPage';
import { ToastContainer } from './components/Toast';
import { QuestCardSkeleton, HeroProfileSkeleton } from './components/Skeleton';
import { useGame } from './context/GameContext';
import { useAuth } from './context/AuthContext';
import { sound } from './lib/sound';
import {
  Plus, Zap, Crown, Award, Coins, Sparkles, Shield,
  Swords, TrendingUp, Flame
} from 'lucide-react';

const ATTRIBUTES = ['ALL', 'Strength', 'Intellect', 'Vitality', 'Discipline', 'Charisma'];
const ATTR_COLORS = {
  ALL: '#94a3b8',
  Strength:'#ef4444', Intellect:'#60a5fa', Vitality:'#34d399', Discipline:'#fbbf24', Charisma:'#c084fc',
};

export function App() {
  const { user } = useAuth();
  const {
    character, quests, activeTab,
    questFilter, setQuestFilter,
    selectedAttribute, setSelectedAttribute,
    levelUpData, setLevelUpData,
    toasts, removeToast, dataLoading,
  } = useGame();

  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [questToEdit, setQuestToEdit] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState('login');

  if (!user) {
    return (
      <>
        <LandingPage onOpenAuth={(mode = 'login') => {
          setAuthInitialMode(mode);
          setIsAuthModalOpen(true);
        }} />
        {isAuthModalOpen && (
          <AuthModal initialMode={authInitialMode} onClose={() => setIsAuthModalOpen(false)} />
        )}
      </>
    );
  }

  const filteredQuests = quests.filter(q => {
    if (questFilter === 'active' && q.status !== 'ACTIVE') return false;
    if (questFilter === 'completed' && q.status !== 'COMPLETED') return false;
    if (selectedAttribute !== 'ALL' && q.attribute !== selectedAttribute) return false;
    return true;
  });

  const activeCount = quests.filter(q => q.status === 'ACTIVE').length;
  const completedCount = quests.filter(q => q.status === 'COMPLETED').length;

  const openCreate = () => { sound.playClick(); setQuestToEdit(null); setIsQuestModalOpen(true); };
  const openEdit = (q) => { setQuestToEdit(q); setIsQuestModalOpen(true); };

  const totalXpNeeded = Math.round(100 * Math.pow(character.level, 1.5));
  const xpPercent = Math.min(100, Math.round((character.totalXp / (totalXpNeeded || 1)) * 100));

  return (
    <div style={{ minHeight:'100vh', position:'relative' }}>
      {/* Ember Particle Canvas */}
      <EmberCanvas />

      {/* Header */}
      <Header onOpenAuth={() => setIsAuthModalOpen(true)} />

      {/* Main */}
      <main className="container" style={{ paddingTop:32, paddingBottom:64 }}>

        {/* ── HERO PROFILE CARD ── */}
        <div
          className="relative glass overflow-hidden rounded-3xl mb-8 animate-slide"
          style={{
            padding:'28px 32px',
            background:'linear-gradient(135deg, rgba(8,10,24,0.9) 0%, rgba(30,20,4,0.85) 100%)',
            border:'1px solid rgba(245,158,11,0.2)',
            boxShadow:'0 0 50px rgba(245,158,11,0.08)',
          }}
        >
          {/* Rune decoration */}
          <div style={{ position:'absolute', right:-80, top:-80, width:240, height:240, borderRadius:'50%', border:'1px solid rgba(245,158,11,0.07)', pointerEvents:'none' }} className="animate-rune" />
          <div style={{ position:'absolute', right:-30, top:-30, width:150, height:150, borderRadius:'50%', border:'1px solid rgba(245,158,11,0.1)', pointerEvents:'none', animationDirection:'reverse', animationDuration:'7s' }} className="animate-rune" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Left: Avatar + name */}
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative">
                <div style={{
                  width:72, height:72, borderRadius:18,
                  background:'linear-gradient(135deg, rgba(217,119,6,0.4), rgba(245,158,11,0.2))',
                  border:'1px solid rgba(245,158,11,0.45)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 0 30px rgba(245,158,11,0.25), inset 0 1px 0 rgba(251,191,36,0.2)',
                }}>
                  <span className="font-cinzel font-black text-2xl text-amber-400">
                    {character.username?.[0]?.toUpperCase() || 'H'}
                  </span>
                </div>
                {/* Level badge */}
                <div style={{
                  position:'absolute', bottom:-8, right:-8,
                  background:'linear-gradient(135deg, #d97706, #f59e0b)',
                  border:'2px solid rgba(4,5,13,0.9)',
                  borderRadius:8, padding:'2px 7px',
                  fontSize:'0.65rem', fontWeight:900, color:'#1c1400', fontFamily:"'Cinzel',serif",
                  boxShadow:'0 0 10px rgba(245,158,11,0.5)',
                }}>
                  LVL {character.level}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="font-cinzel font-black text-xl text-slate-100">
                    {character.username}
                  </h2>
                  {character.equippedTitle && (
                    <span style={{
                      display:'inline-flex', alignItems:'center', gap:4,
                      padding:'3px 10px', borderRadius:100, fontSize:'0.65rem', fontWeight:700,
                      background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)', color:'#fbbf24',
                    }}>
                      <Crown size={10} style={{ color:'#f59e0b' }} />
                      {character.equippedTitle}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Award size={12} style={{ color:'#a855f7' }} />
                  <span>{character.equippedBadge || 'First Flame Badge'}</span>
                </div>

                {/* XP bar under name */}
                <div className="mt-3" style={{ maxWidth:260 }}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color:'#64748b', fontWeight:600 }}>Hero XP</span>
                    <span className="font-mono" style={{ color:'#f59e0b' }}>{character.totalXp} / {totalXpNeeded}</span>
                  </div>
                  <div className="xp-bar-track" style={{ height:6 }}>
                    <div className="xp-bar-fill" style={{ width:`${xpPercent}%`, height:'100%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick stats */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Gold */}
              <div style={{
                padding:'10px 18px', borderRadius:12,
                background:'linear-gradient(135deg,rgba(217,119,6,0.2),rgba(8,10,24,0.9))',
                border:'1px solid rgba(245,158,11,0.3)',
              }}>
                <div className="flex items-center gap-2">
                  <Coins size={16} style={{ color:'#f59e0b' }} />
                  <span className="font-mono font-black text-lg text-amber-300">{character.gold}</span>
                  <span className="text-xs font-bold text-amber-700">GOLD</span>
                </div>
              </div>

              {/* Streak */}
              {character.currentStreak > 0 && (
                <div style={{
                  padding:'10px 18px', borderRadius:12,
                  background:'linear-gradient(135deg,rgba(194,65,12,0.2),rgba(8,10,24,0.9))',
                  border:'1px solid rgba(249,115,22,0.35)',
                  boxShadow:'0 0 20px rgba(249,115,22,0.1)',
                }}>
                  <div className="flex items-center gap-2">
                    <Flame size={16} style={{ color:'#f97316' }} className="animate-flame" />
                    <span className="fire-text font-cinzel font-black text-lg">{character.currentStreak}</span>
                    <span className="text-xs text-slate-500">days</span>
                  </div>
                </div>
              )}

              {/* Longest streak */}
              <div style={{ padding:'10px 18px', borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} style={{ color:'#64748b' }} />
                  <span className="font-mono font-bold text-sm text-slate-300">{character.longestStreak}</span>
                  <span className="text-xs text-slate-600">best streak</span>
                </div>
              </div>

              {/* Attribute pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(character.attributes || []).map(attr => (
                  <div key={attr.name} style={{
                    padding:'6px 10px', borderRadius:8,
                    background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
                    textAlign:'center', minWidth:52,
                  }}>
                    <div style={{ fontSize:'0.6rem', color:'#475569', fontWeight:700, letterSpacing:'0.08em' }}>
                      {attr.name.slice(0,3).toUpperCase()}
                    </div>
                    <div className="font-mono font-black text-xs text-amber-300">L{attr.level}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── DIVIDER ── */}
        <div className="divider mb-8" />

        {/* ── TAB CONTENT ── */}
        {activeTab === 'quests' && (
          <div className="space-y-6">

            {/* Toolbar */}
            <div className="glass rounded-2xl" style={{ padding:'16px 20px' }}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">

                {/* Status filter */}
                <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background:'rgba(4,5,13,0.8)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  {['active','completed','all'].map(f => (
                    <button
                      key={f}
                      onClick={() => { sound.playClick(); setQuestFilter(f); }}
                      style={{
                        padding:'7px 16px', borderRadius:9, fontSize:'0.7rem', fontWeight:800,
                        fontFamily:"'Cinzel',serif", letterSpacing:'0.08em', textTransform:'uppercase',
                        transition:'all 0.2s', whiteSpace:'nowrap',
                        background: questFilter === f ? 'linear-gradient(135deg,rgba(217,119,6,0.25),rgba(245,158,11,0.1))' : 'transparent',
                        border:`1px solid ${questFilter === f ? 'rgba(245,158,11,0.35)' : 'transparent'}`,
                        color: questFilter === f ? '#fbbf24' : '#64748b',
                      }}
                    >
                      {f === 'active' ? `Active (${activeCount})` : f === 'completed' ? `Done (${completedCount})` : 'All'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  {/* Attribute filter scroll */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {ATTRIBUTES.map(attr => {
                      const c = ATTR_COLORS[attr];
                      const isActive = selectedAttribute === attr;
                      return (
                        <button
                          key={attr}
                          onClick={() => setSelectedAttribute(attr)}
                          style={{
                            padding:'5px 12px', borderRadius:8, fontSize:'0.68rem', fontWeight:700,
                            whiteSpace:'nowrap', transition:'all 0.2s',
                            background: isActive ? `${c}18` : 'rgba(255,255,255,0.03)',
                            border:`1px solid ${isActive ? `${c}45` : 'rgba(255,255,255,0.07)'}`,
                            color: isActive ? c : '#475569',
                          }}
                        >
                          {attr}
                        </button>
                      );
                    })}
                  </div>

                  {/* New quest CTA */}
                  <button className="btn-primary" onClick={openCreate} style={{ whiteSpace:'nowrap' }}>
                    <Plus size={15} strokeWidth={3} />
                    FORGE QUEST
                  </button>
                </div>
              </div>
            </div>

            {/* Quest grid */}
            {dataLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <QuestCardSkeleton />
                <QuestCardSkeleton />
                <QuestCardSkeleton />
              </div>
            ) : filteredQuests.length === 0 ? (
              <div className="glass rounded-3xl text-center" style={{ padding:'60px 32px' }}>
                <Swords size={48} style={{ color:'#1e293b', margin:'0 auto 16px' }} />
                <h3 className="font-cinzel font-bold text-lg text-slate-500 mb-2">
                  {questFilter === 'completed' ? 'No completed history yet' : 'No quests match this filter'}
                </h3>
                <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto">
                  {questFilter === 'completed' ? 'Complete your first quest to build your chronicle.' : 'Your scroll is clear — forge a new quest to begin your journey.'}
                </p>
                {questFilter !== 'completed' && (
                  <button className="btn-primary" onClick={openCreate} style={{ margin:'0 auto' }}>
                    <Plus size={15} /> Forge First Quest
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredQuests.map((q, i) => (
                  <div key={q.id} style={{ animationDelay:`${i * 0.05}s` }} className="animate-slide">
                    <QuestCard quest={q} onEdit={openEdit} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'skills' && <SkillTrees />}
        {activeTab === 'shop' && <ShopArmory />}
        {activeTab === 'activity' && <ActivityFeed />}
      </main>

      {/* Footer */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.04)', padding:'24px 0', textAlign:'center' }}>
        <div className="font-cinzel font-bold text-sm" style={{ color:'rgba(245,158,11,0.5)' }}>EmberQuest — Gamified Life RPG</div>
        <div className="text-xs text-slate-700 mt-1">Turn tasks into quests • Earn XP & Gold • Forge your legacy</div>
      </footer>

      {/* ── TOASTS & MODALS ── */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
      {isQuestModalOpen && (
        <QuestModal questToEdit={questToEdit} onClose={() => setIsQuestModalOpen(false)} />
      )}
      {levelUpData && (
        <LevelUpModal data={levelUpData} onClose={() => setLevelUpData(null)} />
      )}
      {isAuthModalOpen && (
        <AuthModal onClose={() => setIsAuthModalOpen(false)} />
      )}
    </div>
  );
}
