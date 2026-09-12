import React, { useState, useEffect, useRef } from 'react';
import {
  Timer, Play, Pause, RotateCcw, X, Minimize2, Maximize2,
  CheckCircle, Sparkles, Flame, Swords, Clock, Plus, Minus
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { sound } from '../lib/sound';
import confetti from 'canvas-confetti';

const PRESETS = [
  { label: '15m Sprint', minutes: 15 },
  { label: '25m Pomodoro', minutes: 25 },
  { label: '45m Deep Work', minutes: 45 },
  { label: '60m Marathon', minutes: 60 },
];

export function QuestFocusTimer() {
  const {
    activeTimerQuest,
    timerSeconds,
    setTimerSeconds,
    timerInitialSeconds,
    setTimerInitialSeconds,
    isTimerRunning,
    setIsTimerRunning,
    isTimerMinimized,
    setIsTimerMinimized,
    stopQuestTimer,
    completeQuest,
    markTimerComplete,
    completedTimerQuestIds,
    character,
  } = useGame();

  const [hasFinished, setHasFinished] = useState(false);
  const intervalRef = useRef(null);

  // Sync finished state if quest was previously unlocked
  useEffect(() => {
    if (activeTimerQuest && completedTimerQuestIds?.includes(activeTimerQuest.id)) {
      setHasFinished(true);
    }
  }, [activeTimerQuest, completedTimerQuestIds]);

  // Tick timer
  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsTimerRunning(false);
            setHasFinished(true);
            if (activeTimerQuest) {
              markTimerComplete(activeTimerQuest);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isTimerRunning, timerSeconds, setIsTimerRunning, setTimerSeconds, activeTimerQuest, markTimerComplete]);

  if (!activeTimerQuest) return null;

  const quest = activeTimerQuest;
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progress = timerInitialSeconds > 0
    ? Math.max(0, Math.min(100, Math.round(((timerInitialSeconds - timerSeconds) / timerInitialSeconds) * 100)))
    : 0;

  const togglePlay = () => {
    sound.playClick();
    setIsTimerRunning(!isTimerRunning);
  };

  const handleReset = () => {
    sound.playClick();
    setIsTimerRunning(false);
    setHasFinished(false);
    setTimerSeconds(timerInitialSeconds);
  };

  const setPreset = (mins) => {
    sound.playClick();
    const secs = mins * 60;
    setIsTimerRunning(false);
    setHasFinished(false);
    setTimerInitialSeconds(secs);
    setTimerSeconds(secs);
  };

  const adjustMinutes = (delta) => {
    sound.playClick();
    const currentMins = Math.max(1, Math.floor(timerSeconds / 60) + delta);
    const newSecs = currentMins * 60;
    setTimerInitialSeconds(newSecs);
    setTimerSeconds(newSecs);
  };

  const handleClaimAndClose = () => {
    completeQuest(quest.id);
    stopQuestTimer();
  };

  // ── MINIMIZED FLOATING WIDGET ──
  if (isTimerMinimized) {
    return (
      <div
        className="fixed bottom-6 right-6 z-50 animate-slide-up flex items-center gap-3 p-3 rounded-2xl glass"
        style={{
          background: 'linear-gradient(135deg, rgba(8,11,26,0.96) 0%, rgba(26,16,6,0.96) 100%)',
          border: hasFinished ? '1.5px solid #10b981' : isTimerRunning ? '1.5px solid #f59e0b' : '1.5px solid rgba(255,255,255,0.12)',
          boxShadow: hasFinished ? '0 0 30px rgba(16,185,129,0.35)' : isTimerRunning ? '0 0 25px rgba(245,158,11,0.25)' : '0 10px 30px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: hasFinished
              ? 'rgba(16,185,129,0.2)'
              : 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.08))',
            border: `1px solid ${hasFinished ? '#10b981' : '#f59e0b'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {hasFinished ? (
            <CheckCircle size={20} className="text-emerald-400 animate-bounce" />
          ) : (
            <Clock size={18} className={isTimerRunning ? 'text-amber-400 animate-pulse' : 'text-slate-400'} />
          )}
        </div>

        <div className="cursor-pointer select-none" onClick={() => setIsTimerMinimized(false)}>
          <div className="flex items-center gap-2">
            <span className="font-cinzel font-bold text-xs text-amber-300 line-clamp-1 max-w-[140px]">
              {quest.title}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold uppercase">
              {hasFinished ? 'Complete' : isTimerRunning ? 'Focusing' : 'Paused'}
            </span>
          </div>
          <div className="font-mono font-black text-base text-gold leading-none mt-0.5">
            {formattedTime}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {hasFinished ? (
            <button
              className="btn-primary"
              onClick={handleClaimAndClose}
              style={{
                padding: '5px 12px',
                fontSize: '0.68rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
              }}
            >
              Claim
            </button>
          ) : (
            <button
              className="btn-icon"
              onClick={togglePlay}
              title={isTimerRunning ? 'Pause' : 'Start'}
              style={{ width: 30, height: 30 }}
            >
              {isTimerRunning ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            </button>
          )}

          <button
            className="btn-icon"
            onClick={() => setIsTimerMinimized(false)}
            title="Expand Full Screen"
            style={{ width: 30, height: 30 }}
          >
            <Maximize2 size={13} />
          </button>
          <button
            className="btn-icon danger"
            onClick={stopQuestTimer}
            title="Close Timer"
            style={{ width: 30, height: 30 }}
          >
            <X size={13} />
          </button>
        </div>
      </div>
    );
  }

  // ── FULL FOCUS MODAL HUD ──
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade"
      style={{ background: 'rgba(3,5,14,0.88)', backdropFilter: 'blur(16px)' }}
    >
      <div
        className="relative glass rounded-3xl overflow-hidden animate-scale max-w-md w-full"
        style={{
          padding: '28px 24px',
          background: 'linear-gradient(155deg, rgba(12,15,32,0.98) 0%, rgba(28,18,6,0.98) 100%)',
          border: hasFinished ? '1.5px solid #10b98180' : '1.5px solid rgba(245,158,11,0.4)',
          boxShadow: hasFinished
            ? '0 0 60px rgba(16,185,129,0.25), 0 30px 70px rgba(0,0,0,0.9)'
            : '0 0 50px rgba(245,158,11,0.18), 0 30px 70px rgba(0,0,0,0.9)',
        }}
      >
        {/* Top Actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: 'rgba(245,158,11,0.15)',
                border: '1px solid rgba(245,158,11,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Timer size={16} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-500 tracking-widest uppercase font-cinzel">
                Focus Session
              </span>
              <h4 className="font-cinzel font-bold text-xs text-slate-300">
                Quest Chamber
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              className="btn-icon"
              onClick={() => setIsTimerMinimized(true)}
              title="Minimize to Widget"
              style={{ width: 28, height: 28 }}
            >
              <Minimize2 size={13} />
            </button>
            <button
              className="btn-icon"
              onClick={stopQuestTimer}
              title="Close"
              style={{ width: 28, height: 28 }}
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Quest Info Card */}
        <div
          className="rounded-2xl p-3.5 mb-5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <span
              className="badge font-cinzel text-[10px]"
              style={{
                background: 'rgba(245,158,11,0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245,158,11,0.3)',
              }}
            >
              {quest.attribute}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                <Sparkles size={11} /> +{quest.xpReward} XP
              </span>
              <span className="text-xs font-mono font-bold text-yellow-300">
                +{quest.goldReward} Gold
              </span>
            </div>
          </div>
          <h3 className="font-cinzel font-bold text-base text-slate-100 leading-snug line-clamp-2">
            {quest.title}
          </h3>
          {quest.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-1">
              {quest.description}
            </p>
          )}
        </div>

        {/* Big Circular / Radial Countdown HUD */}
        <div className="flex flex-col items-center justify-center my-3 relative">
          <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
            {/* Background Circle Track */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="6"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke={hasFinished ? '#10b981' : '#f59e0b'}
                strokeWidth="6"
                strokeDasharray="276.46"
                strokeDashoffset={276.46 - (276.46 * progress) / 100}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 0.8s ease',
                  filter: `drop-shadow(0 0 8px ${hasFinished ? 'rgba(16,185,129,0.6)' : 'rgba(245,158,11,0.6)'})`,
                }}
              />
            </svg>

            {/* Inner Digits */}
            <div className="absolute flex flex-col items-center justify-center">
              <span
                className="font-mono font-black text-4xl tracking-wider text-gold"
                style={{
                  textShadow: hasFinished
                    ? '0 0 20px rgba(16,185,129,0.7)'
                    : '0 0 20px rgba(245,158,11,0.6)',
                }}
              >
                {formattedTime}
              </span>
              <span className="text-[11px] font-cinzel font-bold text-slate-400 tracking-widest mt-1 uppercase">
                {hasFinished
                  ? 'Objective Met!'
                  : isTimerRunning
                  ? 'Channeling Focus...'
                  : 'Ready to Embark'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick adjustments */}
        {!isTimerRunning && !hasFinished && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <button
              className="btn-ghost"
              onClick={() => adjustMinutes(-5)}
              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
            >
              <Minus size={11} /> 5m
            </button>
            <button
              className="btn-ghost"
              onClick={() => adjustMinutes(-1)}
              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
            >
              <Minus size={11} /> 1m
            </button>
            <span className="text-xs font-bold text-slate-500 font-cinzel">DURATION</span>
            <button
              className="btn-ghost"
              onClick={() => adjustMinutes(1)}
              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
            >
              <Plus size={11} /> 1m
            </button>
            <button
              className="btn-ghost"
              onClick={() => adjustMinutes(5)}
              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
            >
              <Plus size={11} /> 5m
            </button>
          </div>
        )}

        {/* Presets */}
        {!isTimerRunning && !hasFinished && (
          <div className="grid grid-cols-4 gap-1.5 mb-5">
            {PRESETS.map((p) => {
              const isSelected = timerInitialSeconds === p.minutes * 60;
              return (
                <button
                  key={p.minutes}
                  onClick={() => setPreset(p.minutes)}
                  style={{
                    padding: '6px 4px',
                    borderRadius: 8,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    fontFamily: "'Cinzel',serif",
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.1))'
                      : 'rgba(255,255,255,0.03)',
                    border: isSelected
                      ? '1px solid rgba(245,158,11,0.45)'
                      : '1px solid rgba(255,255,255,0.06)',
                    color: isSelected ? '#fbbf24' : '#64748b',
                  }}
                >
                  {p.minutes}m
                </button>
              );
            })}
          </div>
        )}

        {/* Main Controls */}
        <div className="flex items-center gap-3">
          {hasFinished ? (
            <button
              className="btn-primary w-full py-3 text-sm font-black flex items-center justify-center gap-2"
              onClick={handleClaimAndClose}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 0 25px rgba(16,185,129,0.5)',
              }}
            >
              <CheckCircle size={18} strokeWidth={2.5} />
              CLAIM QUEST REWARD (+{quest.xpReward} XP)
            </button>
          ) : (
            <>
              <button
                className="btn-icon"
                onClick={handleReset}
                title="Reset Timer"
                style={{ width: 44, height: 44, borderRadius: 12 }}
              >
                <RotateCcw size={16} />
              </button>

              <button
                className="btn-primary flex-1 py-3 text-sm font-black flex items-center justify-center gap-2"
                onClick={togglePlay}
                style={{
                  background: isTimerRunning
                    ? 'linear-gradient(135deg, #d97706, #b45309)'
                    : 'linear-gradient(135deg, #f59e0b, #d97706)',
                  boxShadow: isTimerRunning
                    ? '0 0 20px rgba(245,158,11,0.4)'
                    : '0 0 25px rgba(245,158,11,0.3)',
                }}
              >
                {isTimerRunning ? (
                  <>
                    <Pause size={17} /> PAUSE FOCUS
                  </>
                ) : (
                  <>
                    <Play size={17} className="ml-0.5" /> BEGIN FOCUS ({Math.round(timerSeconds / 60)}m)
                  </>
                )}
              </button>

              <button
                className="btn-complete"
                onClick={handleClaimAndClose}
                title="Claim Reward Immediately"
                style={{ padding: '0 14px', height: 44, fontSize: '0.7rem' }}
              >
                <CheckCircle size={16} />
                Finish
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
