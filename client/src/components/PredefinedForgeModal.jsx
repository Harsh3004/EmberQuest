import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  Search,
  Swords,
  Clock,
  Coins,
  Award,
  Zap,
  Check,
  Flame,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import {
  PREDEFINED_QUESTS,
  PREDEFINED_CATEGORIES,
  STARTER_PACKS,
} from '../lib/predefinedQuests';
import { rewardsFor } from '../lib/progression';
import { sound } from '../lib/sound';

const ATTR_COLORS = {
  Strength: '#ef4444',
  Intellect: '#60a5fa',
  Vitality: '#34d399',
  Discipline: '#fbbf24',
  Charisma: '#c084fc',
};

const DIFF_COLORS = {
  TRIVIAL: '#64748b',
  EASY: '#10b981',
  MEDIUM: '#3b82f6',
  HARD: '#a855f7',
  EPIC: '#ef4444',
};

export function PredefinedForgeModal({ isOpen, onClose, onCustomize }) {
  const { quests, createQuest, addToast } = useGame();

  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [forgedIds, setForgedIds] = useState(new Set());
  const [isForgingPack, setIsForgingPack] = useState(false);

  // Set of existing quest titles (case-insensitive) to indicate already active
  const activeTitles = useMemo(() => {
    return new Set((quests || []).map((q) => (q.title || '').trim().toLowerCase()));
  }, [quests]);

  // Filtered predefined quests
  const filteredQuests = useMemo(() => {
    return PREDEFINED_QUESTS.filter((item) => {
      const matchesCategory =
        activeCategory === 'ALL' ||
        item.category === activeCategory ||
        (activeCategory === 'EPIC BOSS' && item.category === 'EPIC BOSS');

      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.attribute.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.badge && item.badge.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  if (!isOpen) return null;

  const handleInstantForge = async (template) => {
    sound.playClick();
    const finalDesc =
      template.timer > 0
        ? `[⏱️ ${template.timer}m] ${template.description}`
        : template.description;

    const questData = {
      title: template.title,
      description: finalDesc,
      attribute: template.attribute,
      difficulty: template.difficulty,
      recurrence: template.recurrence || 'NONE',
      dueDate: null,
    };

    setForgedIds((prev) => new Set(prev).add(template.id));
    await createQuest(questData);

    setTimeout(() => {
      setForgedIds((prev) => {
        const next = new Set(prev);
        next.delete(template.id);
        return next;
      });
    }, 2500);
  };

  const handleForgePack = async (pack) => {
    if (isForgingPack) return;
    setIsForgingPack(true);
    sound.playLevelUp();

    const selectedTemplates = PREDEFINED_QUESTS.filter((q) =>
      pack.questIds.includes(q.id)
    );

    for (const tmpl of selectedTemplates) {
      const finalDesc =
        tmpl.timer > 0 ? `[⏱️ ${tmpl.timer}m] ${tmpl.description}` : tmpl.description;

      await createQuest({
        title: tmpl.title,
        description: finalDesc,
        attribute: tmpl.attribute,
        difficulty: tmpl.difficulty,
        recurrence: tmpl.recurrence || 'NONE',
        dueDate: null,
      });
    }

    addToast(
      'Pack Forged! ⚔️',
      `Forged ${selectedTemplates.length} quests from the ${pack.title}!`,
      'success'
    );
    setIsForgingPack(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-fade"
      style={{ background: 'rgba(3,4,12,0.92)', backdropFilter: 'blur(24px)' }}
    >
      <div
        className="relative glass rounded-3xl overflow-hidden animate-scale flex flex-col"
        style={{
          width: '100%',
          maxWidth: 960,
          maxHeight: '92vh',
          background: 'linear-gradient(160deg, rgba(12,14,28,0.98) 0%, rgba(26,18,8,0.96) 100%)',
          border: '1px solid rgba(245,158,11,0.35)',
          boxShadow: '0 0 80px rgba(245,158,11,0.18), 0 40px 100px rgba(0,0,0,0.85)',
        }}
      >
        {/* Decorative corner runes */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 180,
            height: 180,
            borderRadius: '50%',
            border: '1px solid rgba(245,158,11,0.1)',
            pointerEvents: 'none',
          }}
          className="animate-rune"
        />

        {/* ── HEADER ── */}
        <div
          className="p-6 border-b border-white/5 flex items-center justify-between shrink-0"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="flex items-center gap-3.5">
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(217,119,6,0.35), rgba(245,158,11,0.15))',
                border: '1px solid rgba(245,158,11,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 25px rgba(245,158,11,0.3)',
              }}
            >
              <Sparkles size={24} className="text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cinzel font-black text-xl sm:text-2xl text-gold leading-none">
                  PREDEFINED FORGE
                </h2>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-cinzel font-bold text-amber-300"
                  style={{
                    background: 'rgba(245,158,11,0.15)',
                    border: '1px solid rgba(245,158,11,0.3)',
                  }}
                >
                  {PREDEFINED_QUESTS.length} Scrolls
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Select ancient disciplines, habits, or boss battles to instantly forge onto your scroll
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-icon text-slate-400 hover:text-white"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── TOOLBAR (SEARCH & CATEGORIES) ── */}
        <div className="p-4 sm:p-5 border-b border-white/5 space-y-3 shrink-0" style={{ background: 'rgba(5, 7, 18, 0.7)' }}>
          {/* Search bar */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400/70"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scrolls by title, attribute, habit, or badge..."
              className="w-full pl-10 pr-16 py-2.5 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400/60"
              style={{
                background: 'rgba(15, 20, 38, 0.95)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-amber-400 hover:text-amber-200 font-cinzel font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-1">
            {PREDEFINED_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    sound.playClick();
                    setActiveCategory(cat);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-cinzel font-bold whitespace-nowrap transition-all flex items-center gap-1.5"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(217,119,6,0.35), rgba(245,158,11,0.2))'
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${
                      isActive ? 'rgba(245,158,11,0.55)' : 'rgba(255,255,255,0.08)'
                    }`,
                    color: isActive ? '#fbbf24' : '#94a3b8',
                    boxShadow: isActive ? '0 0 15px rgba(245,158,11,0.25)' : 'none',
                  }}
                >
                  {cat === 'EPIC BOSS' && <Flame size={13} className="text-red-400 animate-pulse" />}
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Starter Packs Section (Visible on ALL or when search is empty) */}
          {activeCategory === 'ALL' && !searchQuery && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers size={15} className="text-amber-400" />
                  <span className="font-cinzel font-bold text-xs sm:text-sm text-amber-300 tracking-wider">
                    STARTER PACK BUNDLES
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-cinzel">
                  Forge 3 foundational habits with 1-click
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {STARTER_PACKS.map((pack) => (
                  <div
                    key={pack.id}
                    className="p-4 rounded-2xl glass flex flex-col justify-between border border-amber-500/20 hover:border-amber-500/45 transition-all"
                    style={{
                      background:
                        'linear-gradient(145deg, rgba(245,158,11,0.05) 0%, rgba(15,20,35,0.6) 100%)',
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-2xl shrink-0">{pack.icon}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-cinzel font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 text-right leading-tight">
                          {pack.tag}
                        </span>
                      </div>
                      <h4 className="text-sm font-cinzel font-black text-slate-100 mb-1">
                        {pack.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                        {pack.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handleForgePack(pack)}
                      disabled={isForgingPack}
                      className="w-full py-2 px-3 rounded-xl font-cinzel font-bold text-xs flex items-center justify-center gap-2 transition-all"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(217,119,6,0.35), rgba(245,158,11,0.2))',
                        border: '1px solid rgba(245,158,11,0.4)',
                        color: '#fbbf24',
                      }}
                    >
                      <Zap size={13} />
                      {isForgingPack ? 'Forging Pack...' : 'Forge Pack (3 Quests)'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Predefined Quests Grid */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="font-cinzel font-bold text-xs sm:text-sm text-slate-300 tracking-wider flex items-center gap-2">
                <Swords size={14} className="text-slate-400" />
                AVAILABLE PREDEFINED QUESTS ({filteredQuests.length})
              </span>
            </div>

            {filteredQuests.length === 0 ? (
              <div className="text-center py-12 glass rounded-2xl border border-white/5">
                <p className="text-sm text-slate-400 font-cinzel">
                  No predefined scrolls match your filter.
                </p>
                <button
                  onClick={() => {
                    setActiveCategory('ALL');
                    setSearchQuery('');
                  }}
                  className="mt-3 text-xs text-amber-400 hover:underline font-cinzel"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredQuests.map((tmpl) => {
                  const rewards = rewardsFor(tmpl.difficulty);
                  const isForgedJustNow = forgedIds.has(tmpl.id);
                  const isAlreadyActive = activeTitles.has(tmpl.title.trim().toLowerCase());
                  const attrColor = ATTR_COLORS[tmpl.attribute] || '#fbbf24';
                  const diffColor = DIFF_COLORS[tmpl.difficulty] || '#3b82f6';

                  return (
                    <div
                      key={tmpl.id}
                      className="p-4 rounded-2xl glass flex flex-col justify-between border border-white/5 hover:border-amber-500/35 transition-all relative group"
                      style={{
                        background:
                          'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(10,12,24,0.7) 100%)',
                      }}
                    >
                      <div>
                        {/* Top row: Icon + Title + Attribute Badge */}
                        <div className="flex items-start justify-between gap-2.5 mb-2">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl shrink-0 mt-0.5">{tmpl.icon}</span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-200 transition-colors">
                                  {tmpl.title}
                                </h3>
                                {tmpl.badge && (
                                  <span
                                    className="text-[9px] px-1.5 py-0.5 rounded font-cinzel font-bold"
                                    style={{
                                      background: `${attrColor}15`,
                                      color: attrColor,
                                      border: `1px solid ${attrColor}30`,
                                    }}
                                  >
                                    {tmpl.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                                {tmpl.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Badges: Attribute, Difficulty, XP, Gold, Timer */}
                        <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-white/5 text-[11px] font-cinzel">
                          {/* Attribute */}
                          <span
                            className="font-bold flex items-center gap-1"
                            style={{ color: attrColor }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: attrColor }}
                            />
                            {tmpl.attribute}
                          </span>

                          <span className="text-slate-600">•</span>

                          {/* Difficulty */}
                          <span className="font-semibold" style={{ color: diffColor }}>
                            {tmpl.difficulty}
                          </span>

                          <span className="text-slate-600">•</span>

                          {/* XP */}
                          <span className="text-amber-300 font-mono font-bold flex items-center gap-0.5">
                            +{rewards.xp} XP
                          </span>

                          {/* Gold */}
                          <span className="text-amber-400 font-mono font-bold flex items-center gap-0.5">
                            <Coins size={11} />+{rewards.gold}
                          </span>

                          {/* Timer */}
                          {tmpl.timer > 0 && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-amber-400 font-mono flex items-center gap-1">
                                <Clock size={11} />
                                {tmpl.timer}m Lock
                              </span>
                            </>
                          )}

                          {/* Recurrence */}
                          {tmpl.recurrence === 'DAILY' && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-emerald-400 text-[10px]">Daily Habit</span>
                            </>
                          )}

                          {isAlreadyActive && (
                            <span className="ml-auto text-[10px] text-emerald-400/80 font-mono flex items-center gap-1">
                              <Check size={11} /> Active
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 mt-4 pt-2">
                        {onCustomize && (
                          <button
                            type="button"
                            onClick={() => {
                              onCustomize(tmpl);
                              onClose();
                            }}
                            className="btn-ghost py-1.5 px-3 text-[11px] text-slate-400 hover:text-white"
                          >
                            Customize
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleInstantForge(tmpl)}
                          disabled={isForgedJustNow}
                          className="py-1.5 px-3.5 rounded-xl font-cinzel font-bold text-xs flex items-center gap-1.5 transition-all"
                          style={{
                            background: isForgedJustNow
                              ? 'rgba(16,185,129,0.25)'
                              : 'linear-gradient(135deg, rgba(217,119,6,0.3), rgba(245,158,11,0.15))',
                            border: `1px solid ${
                              isForgedJustNow ? 'rgba(16,185,129,0.5)' : 'rgba(245,158,11,0.4)'
                            }`,
                            color: isForgedJustNow ? '#34d399' : '#fbbf24',
                            boxShadow: isForgedJustNow
                              ? '0 0 15px rgba(16,185,129,0.2)'
                              : '0 0 10px rgba(245,158,11,0.1)',
                          }}
                        >
                          {isForgedJustNow ? (
                            <>
                              <Check size={13} className="text-emerald-400" />
                              <span>Forged!</span>
                            </>
                          ) : (
                            <>
                              <Zap size={13} />
                              <span>Instant Forge</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div
          className="p-4 border-t border-white/5 flex items-center justify-between shrink-0 text-xs text-slate-500 font-cinzel"
          style={{ background: 'rgba(0,0,0,0.3)' }}
        >
          <span>EmberForge Ancient Codex</span>
          <button
            onClick={onClose}
            className="btn-secondary py-1 px-4 text-xs font-cinzel"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
