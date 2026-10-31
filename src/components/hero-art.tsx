/**
 * Homepage hero art: four platform tiles with a glowing growth arrow rising through them.
 * Pure SVG + CSS (see .ha-* rules in styles.css); motion is disabled for reduced-motion users.
 */
export function HeroArt() {
  return (
    <svg className="hero-art" viewBox="0 0 480 480" role="img" aria-label="A glowing growth arrow rising through YouTube, Instagram, TikTok and Facebook tiles">
      <defs>
        <radialGradient id="ha-halo" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#2EC99A" stopOpacity=".3" /><stop offset="1" stopColor="#2EC99A" stopOpacity="0" /></radialGradient>
        <linearGradient id="ha-swoosh" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#2EC99A" /><stop offset=".55" stopColor="#9ff2d8" /><stop offset="1" stopColor="#FF9A2E" /></linearGradient>
        <linearGradient id="ha-insta" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#feda75" /><stop offset=".35" stopColor="#fa7e1e" /><stop offset=".65" stopColor="#d62976" /><stop offset="1" stopColor="#4f5bd5" /></linearGradient>
        <filter id="ha-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <circle cx="240" cy="240" r="236" fill="url(#ha-halo)" />
      <g fill="#2EC99A" opacity=".35" aria-hidden="true">
        <rect x="352" y="318" width="16" height="60" rx="3" /><rect x="376" y="292" width="16" height="86" rx="3" /><rect x="400" y="258" width="16" height="120" rx="3" /><rect x="424" y="224" width="16" height="154" rx="3" />
      </g>
      <ellipse cx="240" cy="296" rx="196" ry="62" fill="none" stroke="#FF9A2E" strokeWidth="2" opacity=".75" transform="rotate(-18 240 296)" aria-hidden="true" />

      <g className="ha-float ha-d1"><g transform="translate(78 110) rotate(-8 60 60)">
        <rect width="120" height="120" rx="30" fill="#e62117" /><rect x="22" y="36" width="76" height="48" rx="14" fill="#fff" /><path d="M52 47v26l24-13z" fill="#e62117" />
      </g></g>
      <g className="ha-float ha-d2"><g transform="translate(250 80) rotate(7 60 60)">
        <rect width="120" height="120" rx="30" fill="url(#ha-insta)" /><rect x="28" y="28" width="64" height="64" rx="20" fill="none" stroke="#fff" strokeWidth="7" /><circle cx="60" cy="60" r="15" fill="none" stroke="#fff" strokeWidth="7" /><circle cx="80" cy="40" r="4.5" fill="#fff" />
      </g></g>
      <g className="ha-float ha-d3"><g transform="translate(104 262) rotate(-6 60 60)">
        <rect width="120" height="120" rx="30" fill="#0b0f16" stroke="#3fe0e0" strokeWidth="2" />
        <g fill="none" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M64 28v46a15 15 0 1 1-15-15" stroke="#25f4ee" transform="translate(-3 -2)" /><path d="M64 28v46a15 15 0 1 1-15-15" stroke="#fe2c55" transform="translate(3 2)" />
          <path d="M64 28v46a15 15 0 1 1-15-15" stroke="#fff" /><path d="M64 28c2 11 9 17 20 19" stroke="#fff" />
        </g>
      </g></g>
      <g className="ha-float ha-d4"><g transform="translate(262 252) rotate(8 60 60)">
        <rect width="120" height="120" rx="30" fill="#1877f2" />
        <path d="M66 104V68h14l2-16H66v-9c0-5 2-8 8-8h9V20c-2 0-7-1-13-1-13 0-21 8-21 22v11H34v16h15v36z" fill="#fff" />
      </g></g>

      <g filter="url(#ha-glow)">
        <path className="ha-arrow-line" pathLength={1} d="M28 420C130 446 330 372 408 150" fill="none" stroke="url(#ha-swoosh)" strokeWidth="11" strokeLinecap="round" />
        <polygon className="ha-arrow-head" points="427,96 386,137 435,153" fill="#FF9A2E" />
      </g>
      <g fill="#fff" aria-hidden="true">
        <circle className="ha-spark" cx="150" cy="58" r="3" /><circle className="ha-spark ha-d2" cx="420" cy="214" r="2.5" /><circle className="ha-spark ha-d3" cx="62" cy="330" r="2.5" />
        <circle className="ha-spark ha-d4" cx="446" cy="130" r="2.5" fill="#FF9A2E" /><circle className="ha-spark ha-d1" cx="214" cy="430" r="2.5" fill="#2EC99A" />
      </g>
    </svg>
  );
}
