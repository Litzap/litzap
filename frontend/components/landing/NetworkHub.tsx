"use client";

/**
 * The money network: People / Business / Developers / Projects all connect
 * through LitZap (the hub), which settles out across chains. Continuous,
 * intentional motion — the visual argument that we're the layer everyone plugs into.
 */
const LEFT = [
  { label: "People", y: 64 },
  { label: "Business", y: 152 },
  { label: "Developers", y: 248 },
  { label: "Projects", y: 336 },
];
const RIGHT = [
  { label: "LitVM", y: 120 },
  { label: "Ethereum", y: 200 },
  { label: "Base", y: 280 },
];

export function NetworkHub() {
  const A = "#5b86ff";
  const inPaths = LEFT.map((n) => `M70 ${n.y} C140 ${n.y} 150 200 200 200`);
  const outPaths = RIGHT.map((n) => `M200 200 C250 200 270 ${n.y} 330 ${n.y}`);

  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" fill="none" aria-hidden>
      <defs>
        <linearGradient id="hubg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={A} />
          <stop offset="100%" stopColor="#9b8cff" />
        </linearGradient>
        <filter id="hglow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* connectors + pulses */}
      {[...inPaths, ...outPaths].map((d, i) => (
        <g key={i}>
          <path id={`np-${i}`} d={d} stroke="var(--border)" strokeWidth="1.4" fill="none" />
          <circle r="3" fill={A} filter="url(#hglow)">
            <animateMotion dur={`${2.6 + (i % 4) * 0.5}s`} begin={`${i * 0.3}s`} repeatCount="indefinite">
              <mpath href={`#np-${i}`} />
            </animateMotion>
          </circle>
        </g>
      ))}

      {/* source nodes */}
      {LEFT.map((n) => (
        <g key={n.label}>
          <circle cx="70" cy={n.y} r="4.5" fill={A} />
          <text x="58" y={n.y + 4} textAnchor="end" fontSize="13" fontWeight="600" fill="var(--text)">
            {n.label}
          </text>
        </g>
      ))}

      {/* chain nodes */}
      {RIGHT.map((n) => (
        <g key={n.label}>
          <circle cx="330" cy={n.y} r="4.5" fill="#9b8cff" />
          <text x="342" y={n.y + 4} fontSize="12" fontWeight="600" fill="var(--muted)">
            {n.label}
          </text>
        </g>
      ))}

      {/* hub */}
      <circle cx="200" cy="200" r="46" fill="none" stroke={A} strokeOpacity="0.25" strokeWidth="1">
        <animate attributeName="r" values="42;52;42" dur="3.5s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="0.35;0;0.35" dur="3.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="200" cy="200" r="34" fill="url(#hubg)" filter="url(#hglow)" />
      <path d="M204 182 L191 204 H200 L196 220 L211 198 H202 L206 182 Z" fill="#fff" />
    </svg>
  );
}
