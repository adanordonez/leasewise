export function KnowYourRightsLargeIcon() {
  return (
    <svg width="600" height="400" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Shield background */}
      <path 
        d="M300 80 L380 120 L380 220 Q380 280 300 320 Q220 280 220 220 L220 120 Z" 
        fill="#e3f2fd" 
        stroke="#1976d2" 
        strokeWidth="3"
      />
      
      {/* Shield inner highlight */}
      <path 
        d="M300 100 L360 130 L360 210 Q360 260 300 290 Q240 260 240 210 L240 130 Z" 
        fill="#ffffff" 
        opacity="0.5"
      />
      
      {/* Checkmark */}
      <g>
        <path 
          d="M270 200 L290 220 L340 160" 
          stroke="#1976d2" 
          strokeWidth="12" 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <animate 
            attributeName="stroke-dasharray" 
            values="0,100;100,0;100,0" 
            dur="2s" 
            repeatCount="indefinite"
          />
          <animate 
            attributeName="stroke-dashoffset" 
            values="100;0;0" 
            dur="2s" 
            repeatCount="indefinite"
          />
        </path>
      </g>
      
      {/* Legal document */}
      <g>
        <rect x="140" y="160" width="100" height="140" rx="4" fill="#ffffff" stroke="#dee2e6" strokeWidth="2"/>
        <rect x="155" y="180" width="70" height="4" fill="#e9ecef" rx="1"/>
        <rect x="155" y="195" width="70" height="4" fill="#e9ecef" rx="1"/>
        <rect x="155" y="210" width="50" height="4" fill="#e9ecef" rx="1"/>
        <rect x="155" y="225" width="70" height="4" fill="#e9ecef" rx="1"/>
        <rect x="155" y="240" width="65" height="4" fill="#e9ecef" rx="1"/>
        <rect x="155" y="255" width="70" height="4" fill="#e9ecef" rx="1"/>
        <rect x="155" y="270" width="55" height="4" fill="#e9ecef" rx="1"/>
      </g>
      
      {/* Book/Law book */}
      <g>
        <rect x="360" y="160" width="100" height="140" rx="4" fill="#ffffff" stroke="#dee2e6" strokeWidth="2"/>
        <rect x="360" y="160" width="15" height="140" fill="#1976d2" opacity="0.3"/>
        <text x="410" y="240" fontSize="48" fill="#1976d2" fontWeight="bold" textAnchor="middle">§</text>
      </g>
      
      {/* Gavel */}
      <g transform="translate(500, 240) rotate(45)">
        <rect x="0" y="0" width="40" height="15" rx="2" fill="#8d6e63"/>
        <rect x="35" y="3" width="60" height="9" rx="2" fill="#a1887f"/>
        <circle cx="20" cy="7.5" r="10" fill="#6d4c41"/>
      </g>
      
      {/* Particles/sparkles indicating rights */}
      <g>
        <circle cx="180" cy="140" r="3" fill="#1976d2" opacity="0">
          <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0s" repeatCount="indefinite"/>
        </circle>
        <circle cx="420" cy="145" r="3" fill="#1976d2" opacity="0">
          <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="290" cy="100" r="3" fill="#1976d2" opacity="0">
          <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1s" repeatCount="indefinite"/>
        </circle>
        <circle cx="310" cy="95" r="3" fill="#1976d2" opacity="0">
          <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1.5s" repeatCount="indefinite"/>
        </circle>
      </g>
      
      {/* Pulsing shield effect */}
      <path 
        d="M300 80 L380 120 L380 220 Q380 280 300 320 Q220 280 220 220 L220 120 Z" 
        fill="none" 
        stroke="#1976d2" 
        strokeWidth="3"
        opacity="0"
      >
        <animate 
          attributeName="opacity" 
          values="0;0.5;0" 
          dur="2s" 
          repeatCount="indefinite"
        />
        <animate 
          attributeName="stroke-width" 
          values="3;6;3" 
          dur="2s" 
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}

