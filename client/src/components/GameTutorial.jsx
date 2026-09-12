import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Flame, Swords, Shield, Sparkles, ShoppingBag, Scroll,
  ChevronRight, ChevronLeft, X, Check, Zap, Plus,
  HelpCircle, Star
} from 'lucide-react';
import { sound } from '../lib/sound';
import confetti from 'canvas-confetti';

/* ─────────────────────────────────────────────────────────
   TUTORIAL STEPS
   - targetId   → DOM element to spotlight (null = center card)
   - placement  → 'above' | 'below' | 'center'
   - title      → short punchy title
   - icon       → Lucide icon component
   - color      → accent colour
   - lines      → mentor speech lines (concise & punchy)
   - tip        → gameplay pro-tip
   ───────────────────────────────────────────────────────── */
const STEPS = [
  {
    id: 'welcome',
    tab: 'quests',
    targetId: null,
    placement: 'center',
    title: 'WELCOME, CHAMPION',
    icon: Flame,
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.5)',
    lines: [
      'I am Master Valen — your guide in EmberQuest.',
      'This is your real life, gamified. Every habit, workout, or project you complete in the real world earns XP and Gold for your hero.',
      'Take this quick tour to master every feature before embarking on your first quest.',
    ],
    tip: 'Press → or click "Next" to advance. Press Esc anytime to exit.',
  },
  {
    id: 'hero-crest',
    tab: 'quests',
    targetId: 'hero-profile-card',
    placement: 'below',
    title: 'YOUR HERO CREST',
    icon: Shield,
    color: '#38bdf8',
    glow: 'rgba(56,189,248,0.5)',
    lines: [
      'This is your Hero Crest — your character\'s headquarters and live progress tracker.',
      'Monitor your Level & XP bar, Gold treasury, and active Flame Streak here.',
    ],
    tip: 'Keep your daily streak alive to earn up to +50% bonus XP on all quest completions.',
  },
  {
    id: 'nav-tabs',
    tab: 'quests',
    targetId: 'nav-tabs-container',
    placement: 'below',
    title: 'THE 4 REALM GATES',
    icon: Zap,
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.5)',
    lines: [
      'Use these gates to quickly navigate between EmberQuest\'s four core realms:',
      '⚔️ Quest Board, ✨ Skill Trees, 🛡️ Armory, and 📜 Chronicles.',
    ],
    tip: 'The amber badge on Quest Board shows how many active tasks are waiting for you.',
  },
  {
    id: 'forge-btn',
    tab: 'quests',
    targetId: 'forge-quest-btn',
    placement: 'below',
    title: 'FORGE A QUEST',
    icon: Plus,
    color: '#ef4444',
    glow: 'rgba(239,68,68,0.5)',
    lines: [
      'Your primary action button. Transform any real-world task into an epic quest.',
      'Set difficulty from Trivial to Epic — greater challenges yield larger XP and Gold bounties.',
    ],
    tip: 'Break large goals into multiple Medium quests to level up regularly and maintain momentum.',
  },
  {
    id: 'quest-toolbar',
    tab: 'quests',
    targetId: 'quest-toolbar',
    placement: 'below',
    title: 'QUEST FILTERS',
    icon: Swords,
    color: '#10b981',
    glow: 'rgba(168,85,249,0.5)',
    lines: [
      'Filter your board by status (Active vs. Completed) or by specific attribute disciplines.',
      'Click CLAIM REWARD the moment you complete a real task to instantly claim XP and Gold.',
    ],
    tip: 'Claiming quest rewards immediately reinforces your real-world habit loops.',
  },
  {
    id: 'skill-trees',
    tab: 'skills',
    targetId: 'skill-trees-grid',
    placement: 'above',
    title: '5 SKILL TREES',
    icon: Sparkles,
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.5)',
    lines: [
      'Every quest trains one of 5 independent attributes: Strength, Intellect, Vitality, Discipline, or Charisma.',
      'Level each skill tree individually to increase your character\'s prowess and unlock mastery ranks.',
    ],
    tip: 'Select the attribute matching your real-world activity when forging quests.',
  },
  {
    id: 'armory',
    tab: 'shop',
    targetId: 'armory-items-grid',
    placement: 'above',
    title: 'THE ARMORY',
    icon: ShoppingBag,
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.5)',
    lines: [
      'Turn your earned Gold into glory. Unlock exclusive hall themes, hero titles, badges, and portraits.',
      'Tap BUY to acquire any item, then hit EQUIP to showcase it on your Hero Crest.',
    ],
    tip: 'Tackle Hard & Epic quests to stockpile Gold for legendary Armory gear.',
  },
  {
    id: 'help-btn',
    tab: 'quests',
    targetId: 'tutorial-trigger-btn',
    placement: 'below',
    title: 'REPLAY GUIDE',
    icon: HelpCircle,
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.5)',
    lines: [
      'Press the (?) rune at the top of your screen anytime to reopen this walkthrough.',
      'You are ready, Champion. Forge your first quest and begin your journey!',
    ],
    tip: 'Your hero\'s strength reflects your real-world effort. Go claim your glory!',
  },
];

/* ─────────────────────────────────────────────────────────
   Calculate exact non-overlapping dialogue card position
   ───────────────────────────────────────────────────────── */
const CARD_W = 400;
const GAP = 16;
const EDGE = 14;
const HEADER_OFFSET = 76; // clearance below sticky nav

function calcPosition(rect, cardH = 210, cardW = CARD_W, preferred = 'below') {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const actualW = Math.min(cardW, vw - EDGE * 2);
  const clampLeft = (l) => Math.min(Math.max(EDGE, l), Math.max(EDGE, vw - actualW - EDGE));

  if (!rect) {
    return {
      style: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: actualW,
      },
      arrow: null,
      cardLeft: (vw - actualW) / 2,
      cardWidth: actualW,
    };
  }

  const centerLeft = clampLeft(rect.left + rect.width / 2 - actualW / 2);

  if (preferred === 'above') {
    // Place strictly above rect
    const desiredTop = rect.top - GAP - cardH;
    const top = Math.max(HEADER_OFFSET + 4, desiredTop);
    return {
      style: {
        position: 'fixed',
        top,
        left: centerLeft,
        width: actualW,
      },
      arrow: 'bottom',
      cardLeft: centerLeft,
      cardWidth: actualW,
    };
  }

  // Preferred: 'below'
  const desiredTop = rect.bottom + GAP;
  return {
    style: {
      position: 'fixed',
      top: desiredTop,
      left: centerLeft,
      width: actualW,
    },
    arrow: 'top',
    cardLeft: centerLeft,
    cardWidth: actualW,
  };
}

/* Dynamic Directional Arrow pointing at target center */
function Arrow({ direction, color, targetRect, cardLeft, cardWidth }) {
  if (!direction) return null;

  const SIZE = 12;
  const OFF = -SIZE;

  let arrowLeft = '50%';
  let transform = 'translateX(-50%)';

  if (targetRect && typeof cardLeft === 'number' && cardWidth) {
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const relX = targetCenterX - cardLeft;
    const clampedRelX = Math.min(Math.max(24, relX), cardWidth - 24);
    arrowLeft = `${clampedRelX}px`;
  }

  if (direction === 'top') {
    return (
      <svg
        style={{
          position: 'absolute',
          top: OFF,
          left: arrowLeft,
          transform,
          pointerEvents: 'none',
          zIndex: 65,
          filter: `drop-shadow(0 -2px 6px ${color}80)`,
        }}
        width={SIZE * 2}
        height={SIZE}
        viewBox="0 0 24 12"
      >
        <polygon points="12,0 24,12 0,12" fill={color} />
      </svg>
    );
  }

  if (direction === 'bottom') {
    return (
      <svg
        style={{
          position: 'absolute',
          bottom: OFF,
          left: arrowLeft,
          transform,
          pointerEvents: 'none',
          zIndex: 65,
          filter: `drop-shadow(0 2px 6px ${color}80)`,
        }}
        width={SIZE * 2}
        height={SIZE}
        viewBox="0 0 24 12"
      >
        <polygon points="12,12 24,0 0,0" fill={color} />
      </svg>
    );
  }

  return null;
}

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────── */
export function GameTutorial({ isOpen, onClose, onSwitchTab }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [spotRect, setSpotRect] = useState(null);
  const [pos, setPos] = useState({ style: {}, arrow: null, cardLeft: 0, cardWidth: CARD_W });
  const [mounted, setMounted] = useState(false);
  const cardRef = useRef(null);

  const step = STEPS[stepIdx];
  const Icon = step.icon;
  const isLast = stepIdx === STEPS.length - 1;
  const isFirst = stepIdx === 0;

  /* Entrance animation */
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setMounted(true), 20);
      return () => clearTimeout(t);
    } else {
      setMounted(false);
      setStepIdx(0);
    }
  }, [isOpen]);

  /* Measure & position callback */
  const measure = useCallback(() => {
    const el = step.targetId ? document.getElementById(step.targetId) : null;
    const cardH = cardRef.current?.offsetHeight || 210;
    const cardW = cardRef.current?.offsetWidth || Math.min(CARD_W, window.innerWidth - EDGE * 2);

    if (!el) {
      setSpotRect(null);
      setPos(calcPosition(null, cardH, cardW, 'center'));
      return;
    }

    const raw = el.getBoundingClientRect();
    const pad = 8;
    const r = {
      top: raw.top - pad,
      left: raw.left - pad,
      width: raw.width + pad * 2,
      height: raw.height + pad * 2,
      right: raw.right + pad,
      bottom: raw.bottom + pad,
    };
    setSpotRect(r);
    setPos(calcPosition(r, cardH, cardW, step.placement || 'below'));
  }, [step.targetId, step.placement]);

  /* Step change: switch tab, wait for element mount, scroll into ideal view, measure */
  useEffect(() => {
    if (!isOpen) return;

    // 1. Switch tab if needed
    if (onSwitchTab && step.tab) {
      onSwitchTab(step.tab);
    }

    let isCancelled = false;
    let pollTimer = null;
    let scrollTimer = null;

    let attempts = 0;
    const findAndScroll = () => {
      if (isCancelled) return;

      if (!step.targetId) {
        measure();
        return;
      }

      const el = document.getElementById(step.targetId);
      if (!el && attempts < 25) {
        attempts++;
        pollTimer = setTimeout(findAndScroll, 25);
        return;
      }

      if (el) {
        const rect = el.getBoundingClientRect();
        const absTop = rect.top + window.scrollY;
        const cardH = cardRef.current?.offsetHeight || 210;

        let scrollTarget = 0;
        if (step.placement === 'above') {
          // Leave room above element for header, modal, and gap
          const clearanceNeeded = HEADER_OFFSET + cardH + GAP + 12;
          scrollTarget = Math.max(0, absTop - clearanceNeeded);
        } else {
          // Leave room above element for header
          scrollTarget = Math.max(0, absTop - (HEADER_OFFSET + 20));
        }

        window.scrollTo({ top: scrollTarget, behavior: 'smooth' });

        // Immediate measure + measure after smooth scroll settles
        measure();
        scrollTimer = setTimeout(measure, 320);
      } else {
        measure();
      }
    };

    findAndScroll();

    const onScroll = () => measure();
    const onResize = () => measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      isCancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
      if (scrollTimer) clearTimeout(scrollTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [isOpen, stepIdx, step.tab, step.targetId, step.placement, onSwitchTab, measure]);

  /* Keyboard shortcuts */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        advance();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        retreat();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, stepIdx, isLast]);

  if (!isOpen) return null;

  function goTo(i) {
    sound.playClick();
    setStepIdx(i);
  }

  function advance() {
    if (isLast) {
      sound.playLevelUp();
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#f59e0b', '#fbbf24', '#ef4444', '#10b981', '#3b82f6'],
      });
      localStorage.setItem('eq_tutorial_completed', 'true');
      if (onSwitchTab) onSwitchTab('quests');
      onClose();
    } else {
      goTo(stepIdx + 1);
    }
  }

  function retreat() {
    if (!isFirst) goTo(stepIdx - 1);
  }

  function skip() {
    sound.playClick();
    localStorage.setItem('eq_tutorial_completed', 'true');
    if (onSwitchTab) onSwitchTab('quests');
    onClose();
  }

  /* ── Spotlight overlay (4 rects cutout, pointer-events none) ── */
  const Overlay = () => {
    if (!spotRect) {
      return (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ background: 'rgba(3,5,14,0.80)', zIndex: 48 }}
        />
      );
    }
    const { top, left, height, bottom, right } = spotRect;
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const baseStyle = {
      position: 'fixed',
      background: 'rgba(3,5,14,0.82)',
      zIndex: 48,
      pointerEvents: 'none',
    };

    return (
      <>
        {/* Above target */}
        <div style={{ ...baseStyle, top: 0, left: 0, right: 0, height: Math.max(0, top) }} />
        {/* Below target */}
        <div style={{ ...baseStyle, top: Math.min(vh, bottom), left: 0, right: 0, bottom: 0 }} />
        {/* Left of target */}
        <div style={{ ...baseStyle, top: Math.max(0, top), left: 0, width: Math.max(0, left), height }} />
        {/* Right of target */}
        <div style={{ ...baseStyle, top: Math.max(0, top), left: Math.min(vw, right), right: 0, height }} />
      </>
    );
  };

  return (
    <>
      {/* ── Overlay cutout ── */}
      <Overlay />

      {/* ── Target spotlight border ── */}
      {spotRect && (
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: 49,
            top: spotRect.top,
            left: spotRect.left,
            width: spotRect.width,
            height: spotRect.height,
            borderRadius: 16,
            border: `2px solid ${step.color}`,
            boxShadow: `0 0 26px ${step.glow}, inset 0 0 14px ${step.glow}`,
            transition: 'all 0.2s ease-out',
          }}
        >
          {/* Corner brackets */}
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((c) => {
            const [v, h] = c.split('-');
            return (
              <div
                key={c}
                style={{
                  position: 'absolute',
                  [v]: -4,
                  [h]: -4,
                  width: 14,
                  height: 14,
                  borderTop: v === 'top' ? `3px solid ${step.color}` : 'none',
                  borderBottom: v === 'bottom' ? `3px solid ${step.color}` : 'none',
                  borderLeft: h === 'left' ? `3px solid ${step.color}` : 'none',
                  borderRight: h === 'right' ? `3px solid ${step.color}` : 'none',
                  borderRadius:
                    c === 'top-left'
                      ? '4px 0 0 0'
                      : c === 'top-right'
                      ? '0 4px 0 0'
                      : c === 'bottom-left'
                      ? '0 0 0 4px'
                      : '0 0 4px 0',
                }}
              />
            );
          })}

          {/* Beacon chip */}
          <div
            className="tutorial-beacon"
            style={{
              position: 'absolute',
              top: -13,
              left: 16,
              background: '#04050d',
              border: `1px solid ${step.color}`,
              color: step.color,
              padding: '1px 10px',
              borderRadius: 20,
              fontSize: '0.6rem',
              fontWeight: 900,
              fontFamily: "'Cinzel', serif",
              letterSpacing: '0.1em',
              whiteSpace: 'nowrap',
            }}
          >
            ✦ {step.title} ✦
          </div>
        </div>
      )}

      {/* ── Dialogue Card ── */}
      <div
        ref={cardRef}
        style={{
          ...pos.style,
          zIndex: 60,
          borderRadius: 20,
          background: 'linear-gradient(150deg, rgba(8,11,26,0.98) 0%, rgba(20,13,4,0.98) 100%)',
          border: `1.5px solid ${step.color}80`,
          boxShadow: `0 0 35px ${step.glow}, 0 20px 60px rgba(0,0,0,0.9)`,
          overflow: 'hidden',
          opacity: mounted ? 1 : 0,
          transform: (pos.style.transform || '') + (mounted ? ' scale(1)' : ' scale(0.95)'),
          transition: 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Dynamic Arrow pointing toward target */}
        <Arrow
          direction={pos.arrow}
          color={step.color}
          targetRect={spotRect}
          cardLeft={pos.cardLeft}
          cardWidth={pos.cardWidth}
        />

        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 15px 9px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(4,6,18,0.9)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                flexShrink: 0,
                background: `linear-gradient(135deg, ${step.color}50, ${step.color}18)`,
                border: `1.5px solid ${step.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 12px ${step.glow}`,
              }}
            >
              <Icon size={16} style={{ color: step.color }} />
            </div>
            <div>
              <div
                className="font-cinzel font-black text-amber-300"
                style={{ fontSize: '0.7rem', letterSpacing: '0.08em' }}
              >
                MASTER VALEN
              </div>
              <div
                className="font-cinzel"
                style={{
                  fontSize: '0.58rem',
                  color: step.color,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                }}
              >
                {step.title}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {/* Step dots */}
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  style={{
                    width: i === stepIdx ? 14 : 5,
                    height: 5,
                    borderRadius: 3,
                    background:
                      i === stepIdx
                        ? step.color
                        : i < stepIdx
                        ? 'rgba(255,255,255,0.4)'
                        : 'rgba(255,255,255,0.12)',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.25s',
                  }}
                />
              ))}
            </div>

            <span
              style={{
                fontFamily: "'Cinzel',serif",
                fontSize: '0.6rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.07)',
                color: '#64748b',
                border: '1px solid rgba(255,255,255,0.09)',
              }}
            >
              {stepIdx + 1}/{STEPS.length}
            </span>

            <button
              className="btn-icon"
              onClick={skip}
              title="Exit"
              style={{ width: 24, height: 24 }}
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div
          style={{ padding: '11px 14px', overflowY: 'auto', maxHeight: 210 }}
          className="tutorial-scrollbar"
        >
          <div key={stepIdx} className="animate-step-fade">
            {step.lines.map((line, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 6,
                  padding: '6px 10px',
                  borderRadius: 8,
                  background:
                    i === 0
                      ? `linear-gradient(135deg, ${step.color}18, rgba(4,5,13,0.85))`
                      : 'rgba(255,255,255,0.03)',
                  border:
                    i === 0
                      ? `1px solid ${step.color}40`
                      : '1px solid rgba(255,255,255,0.05)',
                  borderLeft: i !== 0 ? `3px solid ${step.color}50` : undefined,
                }}
              >
                <span
                  style={{
                    color: step.color,
                    fontWeight: 900,
                    fontSize: '0.7rem',
                    lineHeight: '1.4',
                    flexShrink: 0,
                  }}
                >
                  ✦
                </span>
                <span
                  style={{
                    fontSize: '0.78rem',
                    lineHeight: 1.45,
                    color: i === 0 ? '#f1f5f9' : '#cbd5e1',
                    fontWeight: i === 0 ? 600 : 400,
                  }}
                >
                  {line}
                </span>
              </div>
            ))}

            {/* Pro tip */}
            {step.tip && (
              <div
                style={{
                  display: 'flex',
                  gap: 7,
                  alignItems: 'flex-start',
                  padding: '5px 10px',
                  borderRadius: 8,
                  marginTop: 2,
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.22)',
                }}
              >
                <Flame size={13} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: '0.7rem', color: '#fde68a', lineHeight: 1.4 }}>
                  <strong
                    style={{
                      color: '#fbbf24',
                      fontFamily: "'Cinzel',serif",
                      fontSize: '0.62rem',
                    }}
                  >
                    TIP{' '}
                  </strong>
                  {step.tip}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(4,6,18,0.9)',
          }}
        >
          <button
            onClick={retreat}
            className="btn-ghost"
            style={{
              padding: '5px 12px',
              fontSize: '0.7rem',
              visibility: isFirst ? 'hidden' : 'visible',
            }}
          >
            <ChevronLeft size={13} /> Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={skip}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#475569',
                fontSize: '0.68rem',
                textDecoration: 'underline',
                textDecorationColor: '#334155',
              }}
            >
              Skip
            </button>

            <button
              onClick={advance}
              className="btn-primary"
              style={{
                padding: '6px 18px',
                fontSize: '0.73rem',
                background: isLast ? 'linear-gradient(135deg,#10b981,#059669)' : undefined,
                boxShadow: isLast ? '0 0 16px rgba(16,185,129,0.5)' : undefined,
              }}
            >
              {isLast ? (
                <>
                  <Check size={13} /> Begin Journey
                </>
              ) : (
                <>
                  Next <ChevronRight size={13} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
