export function MarketDashboardLargeIcon() {
  return (
    <svg width="800" height="500" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Map base */}
      <rect x="100" y="100" width="350" height="300" rx="8" fill="#e8f4f8" stroke="#0369a1" strokeWidth="4"/>
      
      {/* Map details (simplified state/region boundaries) */}
      <path d="M100 200 L200 200 L200 300 L100 300" fill="none" stroke="#a3d5e8" strokeWidth="2"/>
      <path d="M200 100 L200 300" fill="none" stroke="#a3d5e8" strokeWidth="2"/>
      <path d="M325 100 L325 300" fill="none" stroke="#a3d5e8" strokeWidth="2"/>
      <path d="M100 300 L450 300" fill="none" stroke="#a3d5e8" strokeWidth="2"/>
      <path d="M200 200 L325 200" fill="none" stroke="#a3d5e8" strokeWidth="2"/>
      <path d="M325 200 L450 200" fill="none" stroke="#a3d5e8" strokeWidth="2"/>
      
      {/* Location pin dropping */}
      <g opacity="0">
        <path d="M240 180 C240 160, 220 140, 200 140 C180 140, 160 160, 160 180 C160 200, 200 240, 200 240 S240 200, 240 180 Z" 
              fill="#dc2626" stroke="#991b1b" strokeWidth="4">
          <animateTransform attributeName="transform" type="translate" values="0,-120;0,0" dur="0.5s" begin="0.5s" fill="freeze"/>
        </path>
        <circle cx="200" cy="180" r="18" fill="#ffffff"/>
        <animate attributeName="opacity" values="0;1" dur="0.1s" begin="0.5s" fill="freeze"/>
      </g>
      
      {/* Ripple effect from pin */}
      <circle cx="200" cy="220" r="20" fill="none" stroke="#dc2626" strokeWidth="4" opacity="0">
        <animate attributeName="r" values="20;70;120" dur="1s" begin="1s" />
        <animate attributeName="opacity" values="0;0.6;0" dur="1s" begin="1s" />
      </circle>
      
      {/* Rights document appearing */}
      <g opacity="0">
        <rect x="480" y="120" width="250" height="300" rx="8" fill="#ffffff" stroke="#0369a1" strokeWidth="4"/>
        
        {/* Gavel icon */}
        <rect x="580" y="160" width="40" height="8" fill="#0369a1" transform="rotate(-30 600 164)"/>
        <circle cx="570" cy="152" r="12" fill="#0369a1"/>
        <circle cx="630" cy="176" r="12" fill="#0369a1"/>
        
        {/* Rights lines */}
        <rect x="510" y="230" width="180" height="8" fill="#e5e7eb" rx="2"/>
        <rect x="510" y="250" width="140" height="8" fill="#e5e7eb" rx="2"/>
        <rect x="510" y="270" width="160" height="8" fill="#e5e7eb" rx="2"/>
        <rect x="510" y="290" width="180" height="8" fill="#e5e7eb" rx="2"/>
        <rect x="510" y="310" width="120" height="8" fill="#e5e7eb" rx="2"/>
        <rect x="510" y="330" width="180" height="8" fill="#e5e7eb" rx="2"/>
        <rect x="510" y="350" width="150" height="8" fill="#e5e7eb" rx="2"/>
        <rect x="510" y="370" width="170" height="8" fill="#e5e7eb" rx="2"/>
        
        {/* Checkmarks appearing */}
        <path d="M495 232 L501 238 L513 226" stroke="#10b981" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0">
          <animate attributeName="opacity" values="0;1" dur="0.2s" begin="2.2s" fill="freeze"/>
        </path>
        <path d="M495 272 L501 278 L513 266" stroke="#10b981" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0">
          <animate attributeName="opacity" values="0;1" dur="0.2s" begin="2.4s" fill="freeze"/>
        </path>
        <path d="M495 292 L501 298 L513 286" stroke="#10b981" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0">
          <animate attributeName="opacity" values="0;1" dur="0.2s" begin="2.6s" fill="freeze"/>
        </path>
        <path d="M495 332 L501 338 L513 326" stroke="#10b981" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0">
          <animate attributeName="opacity" values="0;1" dur="0.2s" begin="2.8s" fill="freeze"/>
        </path>
        
        <animate attributeName="opacity" values="0;1" dur="0.5s" begin="1.5s" fill="freeze"/>
        <animateTransform attributeName="transform" type="translate" values="60,0;0,0" dur="0.5s" begin="1.5s" fill="freeze"/>
      </g>
      
      {/* Location-specific highlight */}
      <rect x="160" y="140" width="120" height="100" fill="#dc2626" opacity="0" rx="4">
        <animate attributeName="opacity" values="0;0.2;0.2;0.2;0" dur="4s" begin="1s" repeatCount="indefinite"/>
      </rect>
      
      {/* Connection line */}
      <path d="M280 180 Q380 180 480 180" stroke="#0369a1" strokeWidth="4" strokeDasharray="8,8" opacity="0">
        <animate attributeName="opacity" values="0;1" dur="0.3s" begin="1.5s" fill="freeze"/>
      </path>
    </svg>
  );
}

