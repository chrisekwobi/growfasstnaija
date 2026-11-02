/**
 * Homepage hero art: a compact platform tile cluster (TikTok, Instagram,
 * Facebook, YouTube, Spotify, Apple Music) with a glowing growth
 * arrow rising beside it. Pure SVG + CSS (see .ha-* rules in styles.css);
 * motion is disabled for reduced-motion users.
 */
export function HeroArt() {
  return (
    <svg className="hero-art" viewBox="0 0 480 380" role="img" aria-label="Tiles showing the TikTok, Instagram, Facebook, YouTube, Spotify and Apple Music logos with a glowing growth arrow rising through them">
      <defs>
        <radialGradient id="ha-halo" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#2EC99A" stopOpacity=".3" /><stop offset="1" stopColor="#2EC99A" stopOpacity="0" /></radialGradient>
        <linearGradient id="ha-swoosh" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#2EC99A" /><stop offset=".55" stopColor="#9ff2d8" /><stop offset="1" stopColor="#FF9A2E" /></linearGradient>
        <linearGradient id="ha-insta" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#feda75" /><stop offset=".35" stopColor="#fa7e1e" /><stop offset=".65" stopColor="#d62976" /><stop offset="1" stopColor="#4f5bd5" /></linearGradient>
        <filter id="ha-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="ha-tile-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#000" floodOpacity=".38" /></filter>
      </defs>
      <circle cx="240" cy="190" r="186" fill="url(#ha-halo)" />

      <g filter="url(#ha-tile-shadow)">
        {/* Row 1: TikTok, Instagram, Facebook */}
        <g className="ha-float ha-d1"><g transform="translate(36 40)"><g transform="rotate(-4 53 53)">
          <rect width="106" height="106" rx="26" fill="#0b0f16" stroke="#3fe0e0" strokeWidth="2" />
          <g fill="none" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M57 25v41a13.5 13.5 0 1 1-13.5-13.5" stroke="#25f4ee" transform="translate(-3 -2)" /><path d="M57 25v41a13.5 13.5 0 1 1-13.5-13.5" stroke="#fe2c55" transform="translate(3 2)" />
            <path d="M57 25v41a13.5 13.5 0 1 1-13.5-13.5" stroke="#fff" /><path d="M57 25c2 10 8 15 18 17" stroke="#fff" />
          </g>
        </g></g></g>
        <g className="ha-float ha-d2"><g transform="translate(172 40)"><g transform="rotate(3 53 53)">
          <rect width="106" height="106" rx="26" fill="url(#ha-insta)" />
          <rect x="25" y="25" width="56" height="56" rx="17" fill="none" stroke="#fff" strokeWidth="6" /><circle cx="53" cy="53" r="13" fill="none" stroke="#fff" strokeWidth="6" /><circle cx="70" cy="36" r="4" fill="#fff" />
        </g></g></g>
        <g className="ha-float ha-d3"><g transform="translate(308 40)"><g transform="rotate(-3 53 53)">
          <rect width="106" height="106" rx="26" fill="#1877f2" />
          <path d="M58 91V60h12l2-14H58v-8c0-4 2-7 7-7h8V18c-2 0-6-1-11-1-11 0-19 7-19 19v10H31v14h12v31z" fill="#fff" />
        </g></g></g>

        {/* Row 2: YouTube, Spotify, Apple Music */}
        <g className="ha-float ha-d4"><g transform="translate(36 176)"><g transform="rotate(4 53 53)">
          <rect width="106" height="106" rx="26" fill="#e62117" />
          <rect x="20" y="32" width="66" height="42" rx="12" fill="#fff" /><path d="M46 41v24l21-12z" fill="#e62117" />
        </g></g></g>
        <g className="ha-float ha-d1"><g transform="translate(172 176)"><g transform="rotate(-4 53 53)">
          <rect width="106" height="106" rx="26" fill="#1ed760" />
          <g fill="none" stroke="#0b0f16" strokeWidth="7" strokeLinecap="round">
            <path d="M30 42c16-5 32-3 45 4" /><path d="M33 56c13-4 26-2 37 3" /><path d="M36 69c10-3 20-2 29 2" />
          </g>
        </g></g></g>
        <g className="ha-float ha-d2"><g transform="translate(308 176)"><g transform="rotate(3 53 53)">
          <rect width="106" height="106" rx="26" fill="#fa243c" />
          <circle cx="43" cy="74" r="9" fill="#fff" /><circle cx="71" cy="70" r="9" fill="#fff" />
          <path d="M52 74V38l28-6v38" fill="none" stroke="#fff" strokeWidth="6" strokeLinejoin="round" />
        </g></g></g>
      </g>

      <g filter="url(#ha-glow)">
        <path className="ha-arrow-line" pathLength={1} d="M28 352C120 370 300 320 396 170" fill="none" stroke="url(#ha-swoosh)" strokeWidth="10" strokeLinecap="round" />
        <polygon className="ha-arrow-head" points="415,116 374,157 423,173" fill="#FF9A2E" />
      </g>
      <g fill="#fff" aria-hidden="true">
        <circle className="ha-spark" cx="150" cy="30" r="3" /><circle className="ha-spark ha-d2" cx="420" cy="226" r="2.5" /><circle className="ha-spark ha-d3" cx="46" cy="330" r="2.5" />
        <circle className="ha-spark ha-d4" cx="446" cy="120" r="2.5" fill="#FF9A2E" /><circle className="ha-spark ha-d5" cx="214" cy="352" r="2.5" fill="#2EC99A" />
      </g>
    </svg>
  );
}
