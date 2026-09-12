import React, { useState, useEffect, useRef } from 'react';
import {
  Flame, Swords, Sparkles, Coins, Shield, Brain, Heart, Zap,
  MessageSquare, Dumbbell, Trophy, ChevronRight, Star,
  TrendingUp, Scroll, ShoppingBag, ArrowRight, Play
} from 'lucide-react';

const FEATURES = [
  {
    icon: Swords,
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.3)',
    title: 'Quest Board',
    desc: 'Turn every task into an epic quest. Assign difficulty, set deadlines, and earn XP & Gold upon completion.',
  },
  {
    icon: Sparkles,
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.3)',
    title: 'Skill Trees',
    desc: 'Level up 5 independent attributes — Strength, Intellect, Vitality, Discipline, Charisma — by completing aligned quests.',
  },
  {
    icon: Flame,
    color: '#f97316',
    glow: 'rgba(249,115,22,0.3)',
    title: 'Flame Streaks',
    desc: 'Maintain daily activity to build a burning streak. Earn up to +50% XP bonus for consistent heroism.',
  },
  {
    icon: ShoppingBag,
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.3)',
    title: 'Hero Armory',
    desc: 'Spend your earned Gold on exclusive hall themes, honor badges, hero titles, and avatar portraits.',
  },
  {
    icon: Trophy,
    color: '#34d399',
    glow: 'rgba(52,211,153,0.3)',
    title: 'Level Celebrations',
    desc: 'Watch the realm explode with confetti and fanfare every time your hero or an attribute levels up.',
  },
  {
    icon: Scroll,
    color: '#f87171',
    glow: 'rgba(248,113,113,0.3)',
    title: 'Hero Chronicles',
    desc: 'Every quest completion, level-up, and purchase is permanently recorded in your hero\'s living history.',
  },
];

const SKILL_TREES = [
  { name: 'Strength',   icon: Dumbbell,      color: '#ef4444', desc: 'Physical training & fitness' },
  { name: 'Intellect',  icon: Brain,          color: '#60a5fa', desc: 'Knowledge & technical mastery' },
  { name: 'Vitality',   icon: Heart,          color: '#34d399', desc: 'Health, sleep & wellness' },
  { name: 'Discipline', icon: Zap,            color: '#fbbf24', desc: 'Focus, habits & consistency' },
  { name: 'Charisma',   icon: MessageSquare,  color: '#c084fc', desc: 'Social skills & leadership' },
];

const STATS = [
  { value: '5', label: 'Skill Trees', icon: Sparkles },
  { value: '5×', label: 'Difficulty Tiers', icon: Shield },
  { value: '+50%', label: 'Max Streak Bonus', icon: Flame },
  { value: '∞', label: 'Quests to Forge', icon: Swords },
];

const HOW_IT_WORKS = [
  { step: '01', color: '#f59e0b', title: 'Forge a Quest', desc: 'Create a task, pick its skill tree, set difficulty from Trivial to Epic, and schedule it.' },
  { step: '02', color: '#a855f7', title: 'Complete & Claim', desc: 'Finish the task in real life, then hit Claim Reward. The server awards XP and Gold instantly.' },
  { step: '03', color: '#34d399', title: 'Level Your Hero', desc: 'XP flows into your character and the matching skill tree. Watch both level up independently.' },
  { step: '04', color: '#60a5fa', title: 'Spend Your Gold', desc: 'Visit the Armory to unlock hall themes, honor badges, hero titles and unique avatars.' },
];

// Animated counter
function AnimCounter({ target, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const isInfinity = target === '∞';
        if (isInfinity) { setVal('∞'); return; }
        const num = parseInt(target);
        let start = 0;
        const step = Math.ceil(num / 30);
        const timer = setInterval(() => {
          start += step;
          if (start >= num) { setVal(num); clearInterval(timer); }
          else setVal(start);
        }, 40);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{val}{suffix}</span>;
}

export function LandingPage({ onOpenAuth }) {
  const [particlesReady, setParticlesReady] = useState(false);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  // Live ember canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    class Ember {
      constructor() { this.reset(true); }
      reset(init = false) {
        this.x = Math.random() * canvas.width;
        this.y = init ? Math.random() * canvas.height : canvas.height + 10;
        this.size = Math.random() * 2.8 + 0.6;
        this.vx = (Math.random() - 0.5) * 0.7;
        this.vy = -(Math.random() * 1.0 + 0.5);
        this.life = 1;
        this.decay = Math.random() * 0.004 + 0.0015;
        this.hue = Math.random() * 30 + 10;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = Math.random() * 0.03 + 0.01;
      }
      update() {
        this.life -= this.decay;
        this.wobble += this.wobbleSpeed;
        this.x += this.vx + Math.sin(this.wobble) * 0.35;
        this.y += this.vy;
        if (this.life <= 0 || this.y < -10) this.reset();
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = this.life * 0.65;
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2.5);
        g.addColorStop(0, `hsla(${this.hue},100%,92%,1)`);
        g.addColorStop(0.4, `hsla(${this.hue},100%,62%,0.8)`);
        g.addColorStop(1, `hsla(${this.hue},100%,40%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const embers = Array.from({ length: 80 }, () => new Ember());
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      embers.forEach(e => { e.update(); e.draw(); });
      animRef.current = requestAnimationFrame(animate);
    };
    animate();
    setParticlesReady(true);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      {/* Ember Canvas */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />

      {/* Ambient background glows */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '60vh', background: 'radial-gradient(ellipse, rgba(120,40,0,0.4) 0%, transparent 70%)', filter: 'blur(2px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-10%', width: '50vw', height: '50vh', background: 'radial-gradient(ellipse, rgba(60,20,100,0.3) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '20%', left: '-5%', width: '40vw', height: '40vh', background: 'radial-gradient(ellipse, rgba(20,10,80,0.25) 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── NAVBAR ── */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 40,
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          background: 'rgba(4,5,13,0.85)',
          borderBottom: '1px solid rgba(245,158,11,0.1)',
        }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'linear-gradient(135deg,rgba(217,119,6,0.35),rgba(245,158,11,0.15))',
                border: '1px solid rgba(245,158,11,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 18px rgba(245,158,11,0.25)',
              }}>
                <Flame size={20} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <div className="font-cinzel-deco font-bold" style={{ fontSize: '1rem', letterSpacing: '0.04em', background: 'linear-gradient(135deg,#fef3c7,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  EMBERQUEST
                </div>
              </div>
            </div>

            {/* Nav actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                className="btn-ghost"
                onClick={() => onOpenAuth('login')}
                style={{ fontSize: '0.75rem' }}
              >
                Sign In
              </button>
              <button
                className="btn-primary"
                onClick={() => onOpenAuth('signup')}
                style={{ padding: '9px 20px', fontSize: '0.72rem' }}
              >
                Start Free <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </nav>

        {/* ── HERO SECTION ── */}
        <section style={{ paddingTop: 100, paddingBottom: 80, textAlign: 'center', position: 'relative' }}>
          <div className="container">

            {/* Top pill badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 18px', borderRadius: 100, marginBottom: 28,
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em',
              color: '#f59e0b', textTransform: 'uppercase',
            }}>
              <Star size={11} fill="#f59e0b" style={{ color: '#f59e0b' }} />
              Turn Tasks Into Epic Quests
              <Star size={11} fill="#f59e0b" style={{ color: '#f59e0b' }} />
            </div>

            {/* Hero title */}
            <h1 className="font-cinzel-deco" style={{
              fontSize: 'clamp(2.5rem, 8vw, 5.5rem)',
              fontWeight: 900,
              lineHeight: 1.05,
              marginBottom: 12,
              background: 'linear-gradient(160deg, #fef9c3 0%, #fde68a 25%, #f59e0b 55%, #d97706 80%, #92400e 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.01em',
            }}>
              EMBERQUEST
            </h1>

            <div className="font-cinzel" style={{
              fontSize: 'clamp(1rem, 3vw, 1.6rem)',
              fontWeight: 600,
              color: 'rgba(241,245,249,0.55)',
              marginBottom: 28,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              Your Life. Gamified.
            </div>

            {/* Subtitle */}
            <p style={{
              fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
              color: '#94a3b8',
              maxWidth: 560,
              margin: '0 auto 44px',
              lineHeight: 1.75,
            }}>
              Transform your daily tasks into epic quests. Earn XP, level up 5 independent skill trees, and build a legendary hero out of your real life.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                onClick={() => onOpenAuth('signup')}
                style={{ padding: '15px 36px', fontSize: '0.85rem', letterSpacing: '0.12em' }}
              >
                <Flame size={18} /> BEGIN YOUR QUEST
              </button>
              <button
                className="btn-ghost"
                onClick={() => onOpenAuth('login')}
                style={{ padding: '15px 28px', fontSize: '0.82rem' }}
              >
                <Shield size={16} /> Already a Hero? Sign In
              </button>
            </div>

            {/* Social proof note */}
            <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#475569', fontSize: '0.78rem' }}>
              <span>✦</span>
              <span>Free to start • No credit card required • Your data, your realm</span>
              <span>✦</span>
            </div>
          </div>
        </section>

        {/* ── STATS BAR ── */}
        <section style={{ padding: '0 0 80px' }}>
          <div className="container">
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 16,
              padding: '28px 36px',
              borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(14,16,32,0.9) 0%, rgba(24,16,6,0.85) 100%)',
              border: '1px solid rgba(245,158,11,0.18)',
              boxShadow: '0 0 50px rgba(245,158,11,0.07)',
            }}>
              {STATS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} style={{ textAlign: 'center', padding: '8px' }}>
                    <Icon size={20} style={{ color: '#f59e0b', margin: '0 auto 8px' }} />
                    <div className="font-cinzel font-black" style={{ fontSize: '2rem', lineHeight: 1, background: 'linear-gradient(135deg,#fde68a,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {typeof s.value === 'string' && s.value.includes('%') ? (
                        <AnimCounter target={s.value.replace('%','')} suffix="%" />
                      ) : s.value === '∞' ? (
                        <AnimCounter target="∞" />
                      ) : s.value.includes('×') ? (
                        <AnimCounter target={s.value.replace('×','')} suffix="×" />
                      ) : (
                        <AnimCounter target={s.value} />
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── SKILL TREES PREVIEW ── */}
        <section style={{ padding: '0 0 100px' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16,
                padding: '5px 16px', borderRadius: 100,
                background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)',
                fontSize: '0.65rem', fontWeight: 700, color: '#a855f7', letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>
                <Sparkles size={10} /> Independent Mastery
              </div>
              <h2 className="font-cinzel font-black" style={{ fontSize: 'clamp(1.6rem,4vw,2.8rem)', marginBottom: 12, color: '#e2e8f0' }}>
                5 HERO SKILL TREES
              </h2>
              <p style={{ color: '#64748b', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
                Each quest targets one skill tree. Level them up independently and shape your hero's unique archetype.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              {SKILL_TREES.map((tree, i) => {
                const Icon = tree.icon;
                return (
                  <div
                    key={tree.name}
                    className="glass glass-hover"
                    style={{
                      padding: '24px 20px',
                      borderRadius: 20,
                      textAlign: 'center',
                      border: `1px solid ${tree.color}30`,
                      background: `linear-gradient(135deg, ${tree.color}15, rgba(8,10,24,0.95))`,
                      animationDelay: `${i * 0.08}s`,
                    }}
                  >
                    <div style={{
                      width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px',
                      background: `linear-gradient(135deg, ${tree.color}25, ${tree.color}10)`,
                      border: `1px solid ${tree.color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 0 20px ${tree.color}30`,
                    }} className="animate-orb">
                      <Icon size={26} style={{ color: tree.color }} />
                    </div>
                    <h3 className="font-cinzel font-bold" style={{ fontSize: '0.95rem', color: tree.color, marginBottom: 6 }}>
                      {tree.name}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>{tree.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ padding: '0 0 100px' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16,
                padding: '5px 16px', borderRadius: 100,
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>
                <Play size={10} /> The Quest Cycle
              </div>
              <h2 className="font-cinzel font-black" style={{ fontSize: 'clamp(1.6rem,4vw,2.8rem)', color: '#e2e8f0', marginBottom: 12 }}>
                HOW IT WORKS
              </h2>
              <p style={{ color: '#64748b', maxWidth: 440, margin: '0 auto' }}>
                Four steps separate you from legendary hero status.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, position: 'relative' }}>
              {HOW_IT_WORKS.map((step, i) => (
                <div
                  key={step.step}
                  className="glass glass-hover"
                  style={{
                    padding: '28px 24px',
                    borderRadius: 20,
                    border: `1px solid ${step.color}25`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Big step number background */}
                  <div style={{
                    position: 'absolute', top: -10, right: -8,
                    fontFamily: "'Cinzel Decorative', cursive", fontWeight: 900,
                    fontSize: '5rem', lineHeight: 1, color: `${step.color}08`,
                    userSelect: 'none', pointerEvents: 'none',
                  }}>
                    {step.step}
                  </div>

                  <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 36, height: 36, borderRadius: 10, marginBottom: 16,
                    background: `${step.color}20`, border: `1px solid ${step.color}40`,
                    fontSize: '0.8rem', fontWeight: 900, fontFamily: "'Cinzel',serif",
                    color: step.color,
                  }}>
                    {step.step}
                  </div>

                  <h3 className="font-cinzel font-bold" style={{ fontSize: '1rem', color: '#e2e8f0', marginBottom: 8 }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.65 }}>
                    {step.desc}
                  </p>

                  {/* Arrow between steps */}
                  {i < HOW_IT_WORKS.length - 1 && (
                    <ChevronRight
                      size={16}
                      style={{
                        position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)',
                        color: 'rgba(245,158,11,0.3)', display: 'none',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES GRID ── */}
        <section style={{ padding: '0 0 100px' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <h2 className="font-cinzel font-black" style={{ fontSize: 'clamp(1.6rem,4vw,2.8rem)', color: '#e2e8f0', marginBottom: 12 }}>
                EVERYTHING YOU NEED
              </h2>
              <p style={{ color: '#64748b', maxWidth: 420, margin: '0 auto' }}>
                A complete gamified productivity system built for real-life heroes.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
              {FEATURES.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.title}
                    className="glass glass-hover"
                    style={{
                      padding: '26px',
                      borderRadius: 20,
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'flex-start', gap: 18,
                    }}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                      background: `${feat.color}18`, border: `1px solid ${feat.color}35`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 0 18px ${feat.glow}`,
                    }}>
                      <Icon size={22} style={{ color: feat.color }} />
                    </div>
                    <div>
                      <h3 className="font-cinzel font-bold" style={{ fontSize: '0.95rem', color: '#e2e8f0', marginBottom: 6 }}>
                        {feat.title}
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6 }}>
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section style={{ padding: '0 0 100px' }}>
          <div className="container">
            <div style={{
              position: 'relative', overflow: 'hidden',
              borderRadius: 28,
              padding: 'clamp(40px,6vw,72px) clamp(28px,5vw,64px)',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(30,20,4,0.97) 0%, rgba(10,8,0,0.98) 100%)',
              border: '1px solid rgba(245,158,11,0.35)',
              boxShadow: '0 0 80px rgba(245,158,11,0.12)',
            }}>
              {/* Glow */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                width: '60%', height: '80%', borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(217,119,6,0.15) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              {/* Rune rings */}
              <div className="animate-rune" style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:400, height:400, borderRadius:'50%', border:'1px solid rgba(245,158,11,0.06)', pointerEvents:'none' }} />
              <div className="animate-rune" style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:280, height:280, borderRadius:'50%', border:'1px solid rgba(245,158,11,0.08)', pointerEvents:'none', animationDirection:'reverse', animationDuration:'7s' }} />

              <div style={{ position: 'relative' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 68, height: 68, borderRadius: 18, marginBottom: 24,
                  background: 'linear-gradient(135deg,rgba(217,119,6,0.35),rgba(245,158,11,0.15))',
                  border: '1px solid rgba(245,158,11,0.45)',
                  boxShadow: '0 0 35px rgba(245,158,11,0.3)',
                }}>
                  <Flame size={32} style={{ color: '#f59e0b' }} className="animate-flame" />
                </div>

                <h2 className="font-cinzel-deco font-bold" style={{
                  fontSize: 'clamp(1.8rem,5vw,3.2rem)',
                  background: 'linear-gradient(135deg,#fef3c7,#fde68a,#f59e0b)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  marginBottom: 14,
                }}>
                  FORGE YOUR LEGEND
                </h2>
                <p style={{ color: '#94a3b8', maxWidth: 440, margin: '0 auto 36px', lineHeight: 1.75, fontSize: '1rem' }}>
                  Your journey begins with a single quest. Sign up free and start leveling your real life today.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <button
                    className="btn-primary"
                    onClick={() => onOpenAuth('signup')}
                    style={{ padding: '15px 40px', fontSize: '0.85rem', letterSpacing: '0.14em' }}
                  >
                    <Flame size={17} /> CREATE YOUR HERO
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => onOpenAuth('login')}
                    style={{ padding: '15px 28px' }}
                  >
                    Already a member? Sign in
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '32px 0', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <Flame size={16} style={{ color: '#f59e0b' }} />
            <span className="font-cinzel font-bold" style={{ color: 'rgba(245,158,11,0.5)', fontSize: '0.85rem' }}>
              EMBERQUEST
            </span>
          </div>
          <div style={{ color: '#334155', fontSize: '0.75rem' }}>
            Turn tasks into quests • Earn XP & Gold • Forge your legacy
          </div>
        </footer>

      </div>
    </div>
  );
}
