import React, { useState } from 'react';
import { Flame, Coins, Shield, Zap, ShoppingBag, Scroll, Volume2, VolumeX, LogOut, User, Sparkles, HelpCircle } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { sound, setSoundEnabled, isSoundEnabled } from '../lib/sound';
import { streakBonusPercent } from '../lib/progression';

const NAV_TABS = [
  { id: 'quests',   label: 'Quest Board',   icon: Zap },
  { id: 'skills',   label: 'Skill Trees',   icon: Sparkles },
  { id: 'shop',     label: 'Armory',        icon: ShoppingBag },
  { id: 'activity', label: 'Chronicles',    icon: Scroll },
];

export function Header({ onOpenAuth, onOpenTutorial }) {
  const { character, activeTab, setActiveTab, quests } = useGame();
  const { user, logout, isBackendConnected } = useAuth();
  const [muted, setMuted] = useState(!isSoundEnabled());

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    setSoundEnabled(!next);
    if (!next) sound.playClick();
  };

  const activeCount = quests.filter(q => q.status === 'ACTIVE').length;
  const totalXpNeeded = Math.round(100 * Math.pow(character.level, 1.5));
  const xpPercent = Math.min(100, Math.round((character.totalXp / (totalXpNeeded || 1)) * 100));
  const streakBonus = streakBonusPercent(character.currentStreak);

  return (
    <header className="sticky top-0 z-40" style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', background: 'rgba(4,5,13,0.88)', borderBottom: '1px solid rgba(245,158,11,0.12)' }}>
      <div className="container">
        {/* Top Row */}
        <div className="flex items-center justify-between" style={{ height: 68 }}>
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="relative" style={{ width: 44, height: 44 }}>
              {/* Outer rotating rune ring */}
              <div className="rune-ring" style={{ inset: -4, borderColor: 'rgba(245,158,11,0.2)' }} />
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(217,119,6,0.3), rgba(245,158,11,0.15))',
                border: '1px solid rgba(245,158,11,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(245,158,11,0.25), inset 0 1px 0 rgba(251,191,36,0.2)',
              }}>
                <Flame size={22} style={{ color: '#f59e0b' }} className="animate-flame" />
              </div>
            </div>
            <div>
              <div className="font-cinzel-deco font-bold text-lg leading-none gold-shimmer" style={{ letterSpacing: '0.04em' }}>
                EMBERQUEST
              </div>
              <div className="text-xs font-medium tracking-widest uppercase" style={{ color: '#64748b', marginTop: 2 }}>
                Life RPG
              </div>
            </div>
          </div>

          {/* Center: Hero stats bar (large screens) */}
          <div id="header-hero-stats" className="max-lg:hidden flex items-center gap-5">
            {/* Level + XP bar */}
            <div className="glass rounded-xl px-4 py-2.5" style={{ minWidth: 200 }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Shield size={13} style={{ color: '#f59e0b' }} />
                  <span className="font-cinzel font-bold text-xs text-amber-400">
                    LEVEL {character.level}
                  </span>
                </div>
                <span className="text-xs font-mono" style={{ color: '#64748b' }}>
                  {character.totalXp} / {totalXpNeeded}
                </span>
              </div>
              <div className="xp-bar-track" style={{ height: 6 }}>
                <div className="xp-bar-fill" style={{ width: `${xpPercent}%`, height: '100%' }} />
              </div>
            </div>

            {/* Gold */}
            <div className="glass rounded-xl flex items-center gap-2 px-4 py-2.5">
              <Coins size={15} style={{ color: '#f59e0b' }} />
              <span className="font-mono font-bold text-sm text-amber-300">{character.gold}</span>
              <span className="text-xs font-bold tracking-wider" style={{ color: '#78350f' }}>GOLD</span>
            </div>

            {/* Flame streak */}
            {character.currentStreak > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{
                background: 'linear-gradient(135deg, rgba(194,65,12,0.25), rgba(8,10,24,0.8))',
                border: '1px solid rgba(249,115,22,0.35)',
                boxShadow: '0 0 20px rgba(249,115,22,0.15)',
              }}>
                <Flame size={16} className="animate-flame" style={{ color: '#f97316' }} />
                <div>
                  <span className="fire-text font-cinzel font-bold text-sm">
                    {character.currentStreak}
                  </span>
                  <span className="text-xs ml-1" style={{ color: '#64748b' }}>day streak</span>
                </div>
                {streakBonus > 0 && (
                  <div className="text-xs font-bold px-2 py-0.5 rounded-full" style={{
                    background: 'rgba(249,115,22,0.2)',
                    border: '1px solid rgba(249,115,22,0.4)',
                    color: '#fb923c',
                  }}>
                    +{streakBonus}% XP
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div id="header-controls" className="flex items-center gap-2">
            <button
              className="btn-icon"
              onClick={onOpenTutorial}
              title="Game Tutorial & Induction"
              id="tutorial-trigger-btn"
            >
              <HelpCircle size={16} style={{ color: '#f59e0b' }} />
            </button>

            <button className="btn-icon" onClick={toggleSound} title={muted ? 'Unmute' : 'Mute'}>
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} style={{ color: '#f59e0b' }} />}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="glass rounded-xl flex items-center gap-2 px-3 py-2">
                  <div style={{
                    width: 24, height: 24, borderRadius: 8,
                    background: 'linear-gradient(135deg, rgba(217,119,6,0.4), rgba(245,158,11,0.2))',
                    border: '1px solid rgba(245,158,11,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 900, color: '#fbbf24', fontFamily: 'Cinzel',
                  }}>
                    {user.username?.[0]?.toUpperCase() || 'H'}
                  </div>
                  <span className="text-xs font-semibold text-slate-200 max-lg:hidden">{user.username}</span>
                </div>
                <button className="btn-icon danger" onClick={logout} title="Log out">
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button className="btn-primary" onClick={onOpenAuth} style={{ padding: '9px 16px', fontSize: '0.7rem' }}>
                <User size={13} /> SIGN IN
              </button>
            )}
          </div>
        </div>

        {/* Mobile stats row */}
        <div className="lg:hidden flex items-center justify-between py-2 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex items-center gap-3">
            <span className="font-cinzel font-bold text-amber-400 flex items-center gap-1">
              <Shield size={11} /> LVL {character.level}
            </span>
            <div className="xp-bar-track" style={{ height: 4, width: 80 }}>
              <div className="xp-bar-fill" style={{ width: `${xpPercent}%`, height: '100%' }} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-amber-300 flex items-center gap-1">
              <Coins size={11} style={{ color: '#f59e0b' }} /> {character.gold}
            </span>
            {character.currentStreak > 0 && (
              <span className="fire-text font-bold flex items-center gap-1">
                <Flame size={11} /> {character.currentStreak}d
              </span>
            )}
          </div>
        </div>

        {/* Nav Tabs */}
        <div id="nav-tabs-container" className="flex items-center gap-1 py-2 overflow-x-auto no-scrollbar" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {NAV_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { sound.playClick(); setActiveTab(tab.id); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-cinzel font-bold tracking-wider transition whitespace-nowrap ${isActive ? 'tab-active' : 'btn-ghost'}`}
                style={{ fontSize: '0.7rem', letterSpacing: '0.1em' }}
              >
                <Icon size={14} style={{ color: isActive ? '#f59e0b' : 'inherit' }} />
                {tab.label}
                {tab.id === 'quests' && (
                  <span className="notif-dot">{activeCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
