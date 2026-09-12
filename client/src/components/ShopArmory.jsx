import React, { useState } from 'react';
import { ShoppingBag, Coins, CheckCircle, Shield, Filter } from 'lucide-react';
import { useGame } from '../context/GameContext';

const CATEGORIES = [
  { id: 'ALL', label: 'All Items' },
  { id: 'theme', label: '🏰 Themes' },
  { id: 'badge', label: '🏅 Badges' },
  { id: 'title', label: '👑 Titles' },
  { id: 'avatar', label: '🎭 Portraits' },
];

const TYPE_CONFIG = {
  theme:  { label: 'Hall Theme',  color: '#f59e0b' },
  badge:  { label: 'Honor Badge', color: '#a855f7' },
  title:  { label: 'Hero Title',  color: '#60a5fa' },
  avatar: { label: 'Portrait',    color: '#34d399' },
};

export function ShopArmory() {
  const { character, shopItems, inventory, purchaseShopItem, toggleEquipItem } = useGame();
  const [cat, setCat] = useState('ALL');

  const ownedMap = new Map(inventory.map(inv => [inv.itemId, inv]));
  const filtered = shopItems.filter(item => cat === 'ALL' || item.type === cat);

  return (
    <div className="space-y-6 animate-slide">

      {/* Hero Banner */}
      <div className="relative glass rounded-3xl overflow-hidden" style={{ padding: '28px 32px' }}>
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(135deg, rgba(217,119,6,0.18) 0%, transparent 50%, rgba(60,20,120,0.12) 100%)',
        }} />
        <div style={{
          position:'absolute', right:-50, top:-50, width:200, height:200,
          borderRadius:'50%', border:'1px solid rgba(245,158,11,0.08)',
        }} className="animate-rune" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 text-xs font-bold tracking-widest uppercase" style={{
              background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', color:'#f59e0b',
            }}>
              <ShoppingBag size={11} /> Hero Marketplace
            </div>
            <h2 className="font-cinzel font-black text-2xl md:text-3xl text-gold mb-1">SHOP & ARMORY</h2>
            <p className="text-slate-400 text-sm">Spend your earned Gold on exclusive themes, titles, badges, and avatars.</p>
          </div>

          {/* Treasury */}
          <div style={{
            padding:'16px 24px', borderRadius:16, whiteSpace:'nowrap',
            background:'linear-gradient(135deg, rgba(217,119,6,0.25), rgba(8,10,24,0.9))',
            border:'1px solid rgba(245,158,11,0.4)',
            boxShadow:'0 0 30px rgba(245,158,11,0.15)',
          }}>
            <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color:'#92400e' }}>Treasury</div>
            <div className="flex items-center gap-2">
              <Coins size={20} style={{ color:'#f59e0b' }} />
              <span className="font-mono font-black text-2xl text-amber-300">{character.gold}</span>
              <span className="text-xs font-bold text-amber-600">GOLD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            style={{
              padding:'8px 18px', borderRadius:10, fontSize:'0.75rem', fontWeight:700,
              whiteSpace:'nowrap', transition:'all 0.2s',
              background: cat === c.id ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${cat === c.id ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.07)'}`,
              color: cat === c.id ? '#fbbf24' : '#64748b',
              boxShadow: cat === c.id ? '0 0 16px rgba(245,158,11,0.15)' : 'none',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Item grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(item => {
          const inv = ownedMap.get(item.id);
          const isOwned = Boolean(inv);
          const isEquipped = Boolean(inv?.equipped);
          const canAfford = character.gold >= item.cost;
          const typeCfg = TYPE_CONFIG[item.type] || { label: item.type, color: '#94a3b8' };

          return (
            <div
              key={item.id}
              className="relative glass glass-hover rounded-3xl overflow-hidden"
              style={{
                padding:'22px',
                border: isEquipped
                  ? '1px solid rgba(245,158,11,0.45)'
                  : '1px solid rgba(255,255,255,0.07)',
                boxShadow: isEquipped ? '0 0 30px rgba(245,158,11,0.15)' : 'none',
              }}
            >
              {/* Equipped top glow bar */}
              {isEquipped && (
                <div style={{
                  position:'absolute', top:0, left:0, right:0, height:2,
                  background:'linear-gradient(90deg, transparent, #f59e0b, transparent)',
                  boxShadow:'0 0 12px rgba(245,158,11,0.6)',
                }} />
              )}

              <div className="flex items-start gap-4 mb-4">
                <div style={{
                  width:52, height:52, borderRadius:14, fontSize:'1.6rem',
                  background:`linear-gradient(135deg, ${typeCfg.color}20, rgba(8,10,24,0.8))`,
                  border:`1px solid ${typeCfg.color}35`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {item.icon || '⚔️'}
                </div>
                <div className="flex-1">
                  <div style={{ fontSize:'0.6rem', color:typeCfg.color, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:3 }}>
                    {typeCfg.label}
                  </div>
                  <h3 className="font-cinzel font-bold text-sm text-slate-100 leading-snug">{item.name}</h3>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed mb-4" style={{ minHeight:32 }}>
                {item.description}
              </p>

              <div className="flex items-center justify-between pt-3" style={{ borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                {!isOwned ? (
                  <>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-sm">
                      <Coins size={14} style={{ color:'#f59e0b' }} />
                      <span style={{ color: canAfford ? '#fbbf24' : '#64748b' }}>{item.cost}</span>
                    </div>
                    <button
                      onClick={() => purchaseShopItem(item)}
                      disabled={!canAfford}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${canAfford ? 'btn-primary' : ''}`}
                      style={!canAfford ? {
                        background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
                        color:'#475569', cursor:'not-allowed', display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10,
                      } : { padding:'8px 14px', borderRadius:10, fontSize:'0.7rem' }}
                    >
                      <ShoppingBag size={13} />
                      {canAfford ? 'Purchase' : 'Need Gold'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color:'#34d399' }}>
                      <CheckCircle size={14} /> OWNED
                    </div>
                    <button
                      onClick={() => toggleEquipItem(inv.id)}
                      style={{
                        display:'flex', alignItems:'center', gap:6,
                        padding:'8px 14px', borderRadius:10, fontSize:'0.7rem', fontWeight:800, fontFamily:"'Cinzel',serif",
                        transition:'all 0.2s',
                        background: isEquipped ? 'linear-gradient(135deg,#d97706,#f59e0b)' : 'rgba(255,255,255,0.05)',
                        border: isEquipped ? '1px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.1)',
                        color: isEquipped ? '#1c1400' : '#94a3b8',
                        boxShadow: isEquipped ? '0 0 16px rgba(245,158,11,0.35)' : 'none',
                      }}
                    >
                      <Shield size={13} />
                      {isEquipped ? 'EQUIPPED' : 'EQUIP'}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
