import React from 'react';

// Decorative, expense-themed animated backdrop: trend lines that drift sideways,
// rising bars and floating peso signs. Pure SVG/CSS, no interaction.
const W = 1200;
const STEP = 100;

// One repeating period of a jagged "spending trend" line; drawn twice so the
// slide-by-one-period animation loops seamlessly.
function trendPath(ys, baseline) {
  const pts = [];
  for (let rep = 0; rep < 2; rep += 1) {
    ys.forEach((y, i) => pts.push([rep * W + i * STEP, baseline + y]));
  }
  pts.push([2 * W, baseline + ys[0]]);
  return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
}

const LINES = [
  { ys: [0, -40, -15, -70, -35, -95, -60, -110, -70, -130, -85, -45], base: 520, cls: 'teal', dur: 38 },
  { ys: [0, 30, -10, 45, 5, 60, 15, 70, 25, 90, 35, 20], base: 380, cls: 'red', dur: 52 },
  { ys: [0, -25, 10, -55, -20, -80, -30, -50, -90, -60, -20, -35], base: 640, cls: 'teal faint', dur: 66 },
  { ys: [0, 20, 50, 30, 70, 45, 85, 60, 40, 75, 30, 10], base: 230, cls: 'red faint', dur: 80 },
];

const BARS = Array.from({ length: 18 }, (_, i) => ({
  x: 40 + i * 66,
  h: 50 + ((i * 53) % 140),
  delay: (i * 0.45) % 5,
}));

const COINS = [
  { left: '8%', size: 26, dur: 17, delay: 0 },
  { left: '24%', size: 18, dur: 22, delay: 4 },
  { left: '41%', size: 30, dur: 19, delay: 9 },
  { left: '63%', size: 20, dur: 24, delay: 2 },
  { left: '78%', size: 28, dur: 18, delay: 7 },
  { left: '92%', size: 16, dur: 21, delay: 12 },
];

export default function LoginBackground() {
  return (
    <div className="login-bg" aria-hidden="true">
      <svg className="lb-layer" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="lbFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.18" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} className="lb-grid" x1="0" x2="1200" y1={i * 100} y2={i * 100} />
        ))}
        <g className="lb-bars">
          {BARS.map((b) => (
            <rect key={b.x} x={b.x} y={800 - b.h} width="34" height={b.h} rx="5" style={{ animationDelay: `-${b.delay}s`, transformOrigin: `${b.x + 17}px 800px` }} />
          ))}
        </g>
      </svg>
      {LINES.map((l) => (
        <svg key={l.base} className="lb-layer lb-slide" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <g style={{ animationDuration: `${l.dur}s` }}>
            {l.cls === 'teal' && <path className="lb-area" d={`${trendPath(l.ys, l.base)} L${2 * W} 800 L0 800 Z`} />}
            <path className={`lb-line ${l.cls}`} d={trendPath(l.ys, l.base)} />
          </g>
        </svg>
      ))}
      {COINS.map((c, i) => (
        <span key={i} className="lb-coin" style={{ left: c.left, width: c.size * 1.6, height: c.size * 1.6, fontSize: c.size, animationDuration: `${c.dur}s`, animationDelay: `-${c.delay}s` }}>₱</span>
      ))}
    </div>
  );
}
