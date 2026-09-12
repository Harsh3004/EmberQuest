import React, { useState, useEffect, useMemo } from 'react';
import { X, Swords, Sparkles, Coins, Calendar, Clock } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { rewardsFor } from '../lib/progression';
import { sound } from '../lib/sound';
import { PREDEFINED_QUESTS } from '../lib/predefinedQuests';

const ATTRIBUTES = ['Strength', 'Intellect', 'Vitality', 'Discipline', 'Charisma'];
const DIFFICULTIES = ['TRIVIAL', 'EASY', 'MEDIUM', 'HARD', 'EPIC'];
const RECURRENCES = ['NONE', 'DAILY', 'WEEKLY'];

export const PREDEFINED_TEMPLATES = PREDEFINED_QUESTS;

const ATTR_COLORS = {
  Strength: '#ef4444', Intellect: '#60a5fa', Vitality: '#34d399',
  Discipline: '#fbbf24', Charisma: '#c084fc',
};

const DIFF_COLORS = {
  TRIVIAL: '#64748b', EASY: '#10b981', MEDIUM: '#3b82f6', HARD: '#a855f7', EPIC: '#ef4444',
};

export function QuestModal({ questToEdit, initialTemplate, onClose, onOpenPredefined }) {
  const { createQuest, updateQuest } = useGame();

  const [title, setTitle]           = useState('');
  const [description, setDesc]      = useState('');
  const [attribute, setAttribute]   = useState('Discipline');
  const [difficulty, setDifficulty] = useState('EASY');
  const [recurrence, setRecurrence] = useState('NONE');
  const [dueDate, setDueDate]       = useState('');

  const [timerMinutes, setTimerMinutes] = useState(0);
  const [templateCategory, setTemplateCategory] = useState('ALL');

  const [error, setError]           = useState('');

  useEffect(() => {
    if (questToEdit) {
      setTitle(questToEdit.title || '');
      // Check if description has timer tag e.g. [⏱️ 25m]
      const desc = questToEdit.description || '';
      const timerMatch = desc.match(/\[⏱️\s*(\d+)m\]/);
      if (timerMatch) {
        setTimerMinutes(parseInt(timerMatch[1], 10));
        setDesc(desc.replace(/\[⏱️\s*(\d+)m\]\s*/, ''));
      } else {
        setDesc(desc);
        setTimerMinutes(0);
      }
      setAttribute(questToEdit.attribute || 'Discipline');
      setDifficulty(questToEdit.difficulty || 'EASY');
      setRecurrence(questToEdit.recurrence || 'NONE');
      setDueDate(questToEdit.dueDate ? questToEdit.dueDate.substring(0, 10) : '');
    } else if (initialTemplate) {
      setTitle(initialTemplate.title || '');
      setDesc(initialTemplate.description || '');
      setAttribute(initialTemplate.attribute || 'Discipline');
      setDifficulty(initialTemplate.difficulty || 'EASY');
      setRecurrence(initialTemplate.recurrence || 'NONE');
      setTimerMinutes(initialTemplate.timer || 0);
      setDueDate('');
    } else {
      setTimerMinutes(0);
    }
  }, [questToEdit, initialTemplate]);

  const filteredTemplates = useMemo(() => {
    if (templateCategory === 'ALL') return PREDEFINED_QUESTS;
    return PREDEFINED_QUESTS.filter((t) => t.category === templateCategory);
  }, [templateCategory]);

  const rewards = rewardsFor(difficulty);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Quest title cannot be empty or whitespace only.');
      return;
    }
    setError('');
    sound.playClick();
    
    let finalDesc = description.trim();
    if (timerMinutes > 0) {
      finalDesc = `[⏱️ ${timerMinutes}m] ${finalDesc}`.trim();
    }

    const data = {
      title: title.trim(),
      description: finalDesc || undefined,
      attribute,
      difficulty,
      recurrence,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    };
    if (questToEdit) updateQuest(questToEdit.id, data);
    else createQuest(data);
    onClose();
  };

  const applyTemplate = (tmpl) => {
    sound.playClick();
    setTitle(tmpl.title);
    setDesc(tmpl.description);
    setAttribute(tmpl.attribute);
    setDifficulty(tmpl.difficulty);
    setTimerMinutes(tmpl.timer || 0);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade"
      style={{ background: 'rgba(4,5,13,0.88)', backdropFilter: 'blur(20px)' }}
    >
      <div
        className="relative glass rounded-3xl overflow-hidden animate-scale"
        style={{
          width: '100%', maxWidth: 520,
          maxHeight: '90vh', overflowY: 'auto',
          padding: '32px',
          background: 'linear-gradient(160deg, rgba(12,14,28,0.97) 0%, rgba(30,20,8,0.95) 100%)',
          border: '1px solid rgba(245,158,11,0.3)',
          boxShadow: '0 0 60px rgba(245,158,11,0.12), 0 40px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* Decorative corner rune rings */}
        <div style={{ position:'absolute', top:-50, right:-50, width:150, height:150, borderRadius:'50%', border:'1px solid rgba(245,158,11,0.08)', pointerEvents:'none' }} className="animate-rune" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(217,119,6,0.3), rgba(245,158,11,0.15))',
              border: '1px solid rgba(245,158,11,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(245,158,11,0.25)',
            }}>
              <Swords size={22} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <h2 className="font-cinzel font-black text-xl text-gold leading-none">
                {questToEdit ? 'EDIT QUEST' : 'FORGE QUEST'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">Set your objective and earn rewards upon completion</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Predefined Templates (Only for new quests) */}
        {!questToEdit && (
          <div
            className="mb-5 p-3.5 rounded-2xl"
            style={{
              background: 'rgba(245,158,11,0.04)',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-cinzel font-bold text-amber-400 flex items-center gap-1.5 tracking-wider">
                <Sparkles size={12} className="text-amber-400 animate-pulse" /> PREDEFINED FORGE SCROLLS
              </span>
              {onOpenPredefined && (
                <button
                  type="button"
                  onClick={onOpenPredefined}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-cinzel font-bold underline flex items-center gap-1"
                >
                  Browse Full Codex ({PREDEFINED_QUESTS.length})
                </button>
              )}
            </div>

            {/* Category filter chips */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 mb-2">
              {['ALL', 'DISCIPLINE', 'INTELLECT', 'STRENGTH', 'VITALITY', 'CHARISMA'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setTemplateCategory(cat)}
                  className="px-2 py-0.5 rounded-lg text-[9px] font-cinzel font-bold whitespace-nowrap transition-all"
                  style={{
                    background: templateCategory === cat ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${templateCategory === cat ? 'rgba(245,158,11,0.45)' : 'rgba(255,255,255,0.06)'}`,
                    color: templateCategory === cat ? '#fbbf24' : '#64748b',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {filteredTemplates.map((tmpl) => (
                <button
                  key={tmpl.id || tmpl.title}
                  type="button"
                  onClick={() => applyTemplate(tmpl)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all hover:scale-[1.02] text-left shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                    border: `1px solid ${tmpl.color}35`,
                    maxWidth: 210,
                  }}
                >
                  <span className="text-lg shrink-0">{tmpl.icon}</span>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-200 truncate">{tmpl.title}</div>
                    <div className="text-[10px] text-slate-400 font-cinzel flex items-center gap-1.5 mt-0.5">
                      <span style={{ color: tmpl.color }} className="font-bold">{tmpl.attribute}</span>
                      <span>•</span>
                      <span>{tmpl.difficulty}</span>
                      {tmpl.timer > 0 && <span className="text-amber-400">• ⏱️{tmpl.timer}m</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div
            className="p-3 mb-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-2"
            role="alert"
            aria-live="polite"
          >
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Title */}
          <div>
            <label className="form-label">Quest Title *</label>
            <input
              className="form-input"
              required
              value={title}
              onChange={e => { setTitle(e.target.value); if (error) setError(''); }}
              placeholder="e.g. 30 minutes of deep focus coding session"
            />
          </div>

          {/* Description */}
          <div>
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              style={{ height: 72, resize: 'none' }}
              value={description}
              onChange={e => setDesc(e.target.value)}
              placeholder="Steps, criteria, or motivation..."
            />
          </div>

          {/* Attribute */}
          <div>
            <label className="form-label">Skill Tree</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {ATTRIBUTES.map(attr => {
                const c = ATTR_COLORS[attr];
                const isActive = attribute === attr;
                return (
                  <button
                    type="button" key={attr}
                    onClick={() => setAttribute(attr)}
                    style={{
                      padding: '8px 4px', borderRadius: 10, fontSize: '0.68rem', fontWeight: 700,
                      background: isActive ? `${c}20` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isActive ? `${c}55` : 'rgba(255,255,255,0.08)'}`,
                      color: isActive ? c : '#64748b',
                      boxShadow: isActive ? `0 0 14px ${c}30` : 'none',
                      transition: 'all 0.2s',
                      fontFamily: "'Cinzel', serif",
                    }}
                  >
                    {attr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="form-label">Difficulty</label>
            <div className="grid grid-cols-5 gap-2">
              {DIFFICULTIES.map(diff => {
                const c = DIFF_COLORS[diff];
                const isActive = difficulty === diff;
                return (
                  <button
                    type="button" key={diff}
                    onClick={() => setDifficulty(diff)}
                    style={{
                      padding: '8px 4px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 800,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      background: isActive ? `${c}20` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isActive ? `${c}55` : 'rgba(255,255,255,0.08)'}`,
                      color: isActive ? c : '#475569',
                      boxShadow: isActive ? `0 0 12px ${c}35` : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {diff}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Projected Rewards */}
          <div style={{
            padding: '14px 18px', borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(217,119,6,0.15), rgba(8,10,24,0.9))',
            border: '1px solid rgba(245,158,11,0.25)',
          }}>
            <div className="flex items-center justify-between">
              <span className="font-cinzel font-bold text-xs text-amber-500 tracking-wider">PROJECTED REWARDS</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 font-mono font-bold text-sm text-amber-400">
                  <Sparkles size={13} /> +{rewards.xpReward} XP
                </span>
                <span className="flex items-center gap-1.5 font-mono font-bold text-sm text-yellow-300">
                  <Coins size={13} style={{ color: '#f59e0b' }} /> +{rewards.goldReward} Gold
                </span>
              </div>
            </div>
          </div>

          {/* Recurrence + Due date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Recurrence</label>
              <select
                className="form-input"
                value={recurrence}
                onChange={e => setRecurrence(e.target.value)}
              >
                {RECURRENCES.map(r => (
                  <option key={r} value={r} style={{ background: '#0a0c1a' }}>
                    {r === 'NONE' ? 'One-time Quest' : `${r} Recurring`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label flex items-center gap-1">
                <Calendar size={11} style={{ color: '#f59e0b' }} /> Due Date
              </label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Optional Focus Timer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label flex items-center gap-1 m-0">
                <Clock size={11} style={{ color: '#f59e0b' }} /> Focus Timer (Optional)
              </label>
              <span className="text-[11px] text-slate-500 font-cinzel">
                {timerMinutes > 0 ? `${timerMinutes}m focus countdown` : 'Untimed'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { m: 0, label: 'None' },
                { m: 15, label: '15m' },
                { m: 25, label: '25m 🍅' },
                { m: 45, label: '45m' },
                { m: 60, label: '60m' },
              ].map(({ m, label }) => {
                const isSelected = timerMinutes === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { sound.playClick(); setTimerMinutes(m); }}
                    style={{
                      padding: '6px 2px',
                      borderRadius: 9,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      fontFamily: "'Cinzel',serif",
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.1))'
                        : 'rgba(255,255,255,0.03)',
                      border: isSelected
                        ? '1px solid rgba(245,158,11,0.45)'
                        : '1px solid rgba(255,255,255,0.07)',
                      color: isSelected ? '#fbbf24' : '#64748b',
                      boxShadow: isSelected ? '0 0 12px rgba(245,158,11,0.2)' : 'none',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-ghost flex-1" onClick={onClose} style={{ justifyContent: 'center' }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              <Swords size={14} />
              {questToEdit ? 'Save Changes' : 'Embark Quest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
