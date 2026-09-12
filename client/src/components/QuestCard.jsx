import React from 'react';
import { CheckCircle, Edit2, Trash2, Sparkles, Coins, Calendar, RefreshCw, Lock, ChevronRight } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { sound } from '../lib/sound';

const ATTR_COLORS = {
  Strength:   { color: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
  Intellect:  { color: '#60a5fa', glow: 'rgba(59,130,246,0.3)' },
  Vitality:   { color: '#34d399', glow: 'rgba(16,185,129,0.3)' },
  Discipline: { color: '#fbbf24', glow: 'rgba(245,158,11,0.3)' },
  Charisma:   { color: '#c084fc', glow: 'rgba(168,85,247,0.3)' },
};

const DIFFICULTY_CONFIG = {
  TRIVIAL: { label: 'Trivial', accent: '#64748b', glow: 'transparent' },
  EASY:    { label: 'Easy',    accent: '#10b981', glow: 'rgba(16,185,129,0.25)' },
  MEDIUM:  { label: 'Medium',  accent: '#3b82f6', glow: 'rgba(59,130,246,0.25)' },
  HARD:    { label: 'Hard',    accent: '#a855f7', glow: 'rgba(168,85,247,0.3)' },
  EPIC:    { label: 'EPIC',    accent: '#ef4444', glow: 'rgba(239,68,68,0.4)' },
};

export function QuestCard({ quest, onEdit }) {
  const { completeQuest, deleteQuest } = useGame();
  const isCompleted = quest.status === 'COMPLETED';
  const attrCfg = ATTR_COLORS[quest.attribute] || { color: '#94a3b8', glow: 'transparent' };
  const diffCfg = DIFFICULTY_CONFIG[quest.difficulty] || DIFFICULTY_CONFIG.EASY;

  const handleComplete = () => {
    if (!isCompleted) completeQuest(quest.id);
  };

  const handleDelete = () => {
    if (isCompleted) return;
    if (confirm(`Delete "${quest.title}"?`)) deleteQuest(quest.id);
  };

  return (
    <div
      className={`relative glass glass-hover rounded-3xl overflow-hidden flex flex-col quest-card-${quest.difficulty}`}
      style={{
        padding: '22px',
        opacity: isCompleted ? 0.65 : 1,
        transition: 'all 0.3s ease',
        border: `1px solid ${isCompleted ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      {/* Top accent bar (difficulty color) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: isCompleted
          ? 'rgba(255,255,255,0.06)'
          : `linear-gradient(90deg, ${diffCfg.accent}00, ${diffCfg.accent}, ${diffCfg.accent}00)`,
        boxShadow: isCompleted ? 'none' : `0 0 12px ${diffCfg.glow}`,
      }} />

      {/* Attribute glow orb */}
      {!isCompleted && (
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 120, height: 120, borderRadius: '50%',
          background: attrCfg.color, opacity: 0.05, filter: 'blur(25px)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Header row */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Attribute chip */}
          <span
            className="badge font-cinzel"
            style={{
              background: `${attrCfg.color}20`,
              color: attrCfg.color,
              border: `1px solid ${attrCfg.color}45`,
              letterSpacing: '0.08em',
            }}
          >
            {quest.attribute}
          </span>

          {/* Recurrence */}
          {quest.recurrence && quest.recurrence !== 'NONE' && (
            <div className="flex items-center gap-1 text-slate-500" style={{ fontSize: '0.65rem' }}>
              <RefreshCw size={9} style={{ color: '#f59e0b' }} />
              <span className="font-semibold uppercase tracking-wider">{quest.recurrence}</span>
            </div>
          )}
        </div>

        <span className={`badge badge-${quest.difficulty}`}>{diffCfg.label}</span>
      </div>

      {/* Title */}
      <h3
        className={`font-cinzel font-bold text-base leading-snug mb-2 ${isCompleted ? 'line-through' : ''}`}
        style={{ color: isCompleted ? '#475569' : '#e2e8f0' }}
      >
        {quest.title}
      </h3>

      {/* Description */}
      {quest.description && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">
          {quest.description}
        </p>
      )}

      <div className="flex-1" />

      {/* Rewards row */}
      <div
        className="flex items-center justify-between py-3 mb-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} style={{ color: '#f59e0b' }} />
            <span className="font-mono font-bold text-xs text-amber-400">+{quest.xpReward} XP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Coins size={13} style={{ color: '#fbbf24' }} />
            <span className="font-mono font-bold text-xs text-yellow-300">+{quest.goldReward} Gold</span>
          </div>
        </div>

        {quest.dueDate && (
          <div className="flex items-center gap-1 text-slate-600" style={{ fontSize: '0.65rem' }}>
            <Calendar size={11} />
            <span>{new Date(quest.dueDate).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {isCompleted ? (
        <div className="flex items-center gap-1.5 justify-center py-2 rounded-xl text-xs font-semibold" style={{
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399',
        }}>
          <Lock size={12} /> COMPLETED — PERMANENT RECORD
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button className="btn-icon" onClick={() => { sound.playClick(); onEdit(quest); }} title="Edit">
            <Edit2 size={14} />
          </button>
          <button className="btn-icon danger" onClick={handleDelete} title="Delete">
            <Trash2 size={14} />
          </button>
          <button
            className="btn-complete flex-1"
            onClick={handleComplete}
            style={{ fontSize: '0.65rem' }}
          >
            <CheckCircle size={14} strokeWidth={2.5} />
            CLAIM REWARD
          </button>
        </div>
      )}
    </div>
  );
}
