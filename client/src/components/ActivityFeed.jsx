import React from 'react';
import { ScrollText, Sparkles, Coins, Trophy, ShoppingBag, Clock, Flame } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { ActivityLogsSkeleton } from './Skeleton';

const ACTION_CONFIG = {
  level_up:       { icon: Trophy,      color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)' },
  item_purchased: { icon: ShoppingBag, color: '#a855f7', bg: 'rgba(168,85,247,0.15)',  border: 'rgba(168,85,247,0.3)' },
  quest_completed:{ icon: Sparkles,    color: '#10b981', bg: 'rgba(16,185,129,0.15)',   border: 'rgba(16,185,129,0.3)' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ActivityFeed() {
  const { activityLogs, dataLoading } = useGame();

  if (dataLoading && activityLogs.length === 0) {
    return <ActivityLogsSkeleton />;
  }

  return (
    <div className="space-y-6 animate-slide">

      {/* Banner */}
      <div className="relative glass rounded-3xl overflow-hidden" style={{ padding:'28px 32px' }}>
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(135deg, rgba(120,40,180,0.15) 0%, transparent 60%, rgba(217,119,6,0.12) 100%)',
        }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 text-xs font-bold tracking-widest uppercase" style={{
            background:'rgba(168,85,247,0.1)', border:'1px solid rgba(168,85,247,0.25)', color:'#a855f7',
          }}>
            <ScrollText size={11} /> Permanent Chronicles
          </div>
          <h2 className="font-cinzel font-black text-2xl md:text-3xl text-arcane mb-1">HERO CHRONICLES</h2>
          <p className="text-slate-400 text-sm">A persistent record of your completed quests, level milestones, and armory acquisitions.</p>
        </div>
      </div>

      {/* Timeline */}
      <div id="chronicles-feed-container" className="glass rounded-3xl overflow-hidden" style={{ padding:'28px' }}>
        {activityLogs.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <ScrollText size={40} style={{ color:'#1e293b', margin:'0 auto' }} />
            <p className="font-cinzel font-bold text-slate-600 text-lg">No Chronicles Yet</p>
            <p className="text-slate-600 text-sm">Complete quests or level up to record your journey!</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div style={{
              position:'absolute', left:17, top:16, bottom:16, width:1,
              background:'linear-gradient(180deg, transparent, rgba(245,158,11,0.2) 10%, rgba(245,158,11,0.15) 90%, transparent)',
            }} />

            <div className="space-y-4 pl-10">
              {activityLogs.map(log => {
                const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.quest_completed;
                const Icon = cfg.icon;
                return (
                  <div key={log.id} className="relative group">
                    {/* Timeline dot */}
                    <div style={{
                      position:'absolute', left:-27, top:12,
                      width:20, height:20, borderRadius:8,
                      background:cfg.bg, border:`1px solid ${cfg.border}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      transition:'transform 0.2s',
                    }}>
                      <Icon size={11} style={{ color:cfg.color }} />
                    </div>

                    <div
                      className="glass glass-hover flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl"
                      style={{ padding:'14px 18px' }}
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-200">
                          {log.text || log.action.replace(/_/g, ' ')}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Clock size={10} />
                          <span>{timeAgo(log.createdAt)}</span>
                          <span style={{ color:'rgba(255,255,255,0.1)' }}>·</span>
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {log.xpDelta > 0 && (
                          <span style={{
                            padding:'4px 10px', borderRadius:8, fontSize:'0.7rem', fontWeight:800, fontFamily:'monospace',
                            background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.25)', color:'#fbbf24',
                          }}>
                            +{log.xpDelta} XP
                          </span>
                        )}
                        {log.goldDelta !== 0 && (
                          <span style={{
                            padding:'4px 10px', borderRadius:8, fontSize:'0.7rem', fontWeight:800, fontFamily:'monospace',
                            background: log.goldDelta > 0 ? 'rgba(234,179,8,0.1)' : 'rgba(220,38,38,0.1)',
                            border: `1px solid ${log.goldDelta > 0 ? 'rgba(234,179,8,0.25)' : 'rgba(220,38,38,0.25)'}`,
                            color: log.goldDelta > 0 ? '#fde047' : '#f87171',
                          }}>
                            {log.goldDelta > 0 ? '+' : ''}{log.goldDelta} Gold
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
