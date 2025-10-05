import React from 'react';

export const SmartExtractionIcon = () => (
  <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20">
    {/* Document */}
    <rect x="50" y="40" width="100" height="120" rx="4" fill="#ffffff" stroke="#dee2e6" strokeWidth="2"/>
    
    {/* Text lines */}
    <rect x="65" y="60" width="70" height="4" fill="#e9ecef" rx="1"/>
    <rect x="65" y="70" width="50" height="4" fill="#e9ecef" rx="1"/>
    <rect x="65" y="80" width="65" height="4" fill="#e9ecef" rx="1"/>
    <rect x="65" y="90" width="70" height="4" fill="#e9ecef" rx="1"/>
    <rect x="65" y="100" width="55" height="4" fill="#e9ecef" rx="1"/>
    <rect x="65" y="110" width="70" height="4" fill="#e9ecef" rx="1"/>
    <rect x="65" y="120" width="60" height="4" fill="#e9ecef" rx="1"/>
    <rect x="65" y="130" width="70" height="4" fill="#e9ecef" rx="1"/>
    <rect x="65" y="140" width="45" height="4" fill="#e9ecef" rx="1"/>
    
    {/* Scanning line */}
    <rect x="50" y="40" width="100" height="3" fill="#007bff" opacity="0.4">
      <animate attributeName="y" values="40;160;40" dur="3s" repeatCount="indefinite"/>
    </rect>
    
    {/* Red flags appearing */}
    {/* Flag 1 */}
    <g opacity="0">
      <rect x="63" y="78" width="69" height="8" fill="#dc3545" opacity="0.3" rx="1"/>
      <path d="M140 82 L145 77 L145 87 L140 82" fill="#dc3545"/>
      <rect x="144" y="77" width="1" height="15" fill="#dc3545"/>
      <animate attributeName="opacity" values="0;0;1;1;1;1;0" dur="3s" repeatCount="indefinite"/>
    </g>
    
    {/* Flag 2 */}
    <g opacity="0">
      <rect x="63" y="108" width="69" height="8" fill="#dc3545" opacity="0.3" rx="1"/>
      <path d="M140 112 L145 107 L145 117 L140 112" fill="#dc3545"/>
      <rect x="144" y="107" width="1" height="15" fill="#dc3545"/>
      <animate attributeName="opacity" values="0;0;0;1;1;1;0" dur="3s" repeatCount="indefinite"/>
    </g>
    
    {/* Flag 3 */}
    <g opacity="0">
      <rect x="63" y="138" width="49" height="8" fill="#dc3545" opacity="0.3" rx="1"/>
      <path d="M120 142 L125 137 L125 147 L120 142" fill="#dc3545"/>
      <rect x="124" y="137" width="1" height="15" fill="#dc3545"/>
      <animate attributeName="opacity" values="0;0;0;0;1;1;0" dur="3s" repeatCount="indefinite"/>
    </g>
  </svg>
);

export const RedFlagDetectionIcon = () => (
  <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20">
    {/* Map base */}
    <rect x="40" y="50" width="120" height="100" rx="4" fill="#e8f4f8" stroke="#0369a1" strokeWidth="2"/>
    
    {/* Map details (simplified state/region boundaries) */}
    <path d="M40 80 L80 80 L80 110 L40 110" fill="none" stroke="#a3d5e8" strokeWidth="1"/>
    <path d="M80 50 L80 110" fill="none" stroke="#a3d5e8" strokeWidth="1"/>
    <path d="M120 50 L120 110" fill="none" stroke="#a3d5e8" strokeWidth="1"/>
    <path d="M40 110 L160 110" fill="none" stroke="#a3d5e8" strokeWidth="1"/>
    <path d="M80 80 L120 80" fill="none" stroke="#a3d5e8" strokeWidth="1"/>
    <path d="M120 80 L160 80" fill="none" stroke="#a3d5e8" strokeWidth="1"/>
    
    {/* Location pin dropping */}
    <g opacity="0">
      <path d="M100 70 C100 60, 90 50, 80 50 C70 50, 60 60, 60 70 C60 80, 80 100, 80 100 S100 80, 100 70 Z" 
            fill="#dc2626" stroke="#991b1b" strokeWidth="2">
        <animateTransform attributeName="transform" type="translate" values="0,-50;0,0" dur="0.5s" begin="0.5s" fill="freeze"/>
      </path>
      <circle cx="80" cy="70" r="8" fill="#ffffff"/>
      <animate attributeName="opacity" values="0;1" dur="0.1s" begin="0.5s" fill="freeze"/>
    </g>
    
    {/* Ripple effect from pin */}
    <circle cx="80" cy="90" r="10" fill="none" stroke="#dc2626" strokeWidth="2" opacity="0">
      <animate attributeName="r" values="10;30;50" dur="1s" begin="1s" />
      <animate attributeName="opacity" values="0;0.6;0" dur="1s" begin="1s" />
    </circle>
    
    {/* Rights document appearing */}
    <g opacity="0">
      <rect x="110" y="60" width="70" height="90" rx="3" fill="#ffffff" stroke="#0369a1" strokeWidth="2"/>
      
      {/* Gavel icon */}
      <rect x="140" y="75" width="10" height="2" fill="#0369a1" transform="rotate(-30 145 76)"/>
      <circle cx="137" cy="73" r="3" fill="#0369a1"/>
      <circle cx="153" cy="79" r="3" fill="#0369a1"/>
      
      {/* Rights lines */}
      <rect x="120" y="95" width="50" height="3" fill="#e5e7eb" rx="1"/>
      <rect x="120" y="102" width="40" height="3" fill="#e5e7eb" rx="1"/>
      <rect x="120" y="109" width="45" height="3" fill="#e5e7eb" rx="1"/>
      <rect x="120" y="116" width="50" height="3" fill="#e5e7eb" rx="1"/>
      <rect x="120" y="123" width="35" height="3" fill="#e5e7eb" rx="1"/>
      <rect x="120" y="130" width="50" height="3" fill="#e5e7eb" rx="1"/>
      
      {/* Checkmarks appearing */}
      <path d="M115 96 L117 98 L121 94" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0">
        <animate attributeName="opacity" values="0;1" dur="0.2s" begin="2.2s" fill="freeze"/>
      </path>
      <path d="M115 110 L117 112 L121 108" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0">
        <animate attributeName="opacity" values="0;1" dur="0.2s" begin="2.4s" fill="freeze"/>
      </path>
      <path d="M115 117 L117 119 L121 115" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0">
        <animate attributeName="opacity" values="0;1" dur="0.2s" begin="2.6s" fill="freeze"/>
      </path>
      <path d="M115 131 L117 133 L121 129" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0">
        <animate attributeName="opacity" values="0;1" dur="0.2s" begin="2.8s" fill="freeze"/>
      </path>
      
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="1.5s" fill="freeze"/>
      <animateTransform attributeName="transform" type="translate" values="20,0;0,0" dur="0.5s" begin="1.5s" fill="freeze"/>
    </g>
    
    {/* Location-specific highlight */}
    <rect x="60" y="60" width="40" height="30" fill="#dc2626" opacity="0" rx="2">
      <animate attributeName="opacity" values="0;0.2;0.2;0.2;0" dur="4s" begin="1s" repeatCount="indefinite"/>
    </rect>
    
    {/* Connection line */}
    <path d="M90 75 Q100 75 110 75" stroke="#0369a1" strokeWidth="2" strokeDasharray="3,3" opacity="0">
      <animate attributeName="opacity" values="0;1" dur="0.3s" begin="1.5s" fill="freeze"/>
    </path>
  </svg>
);

export const KnowYourRightsIcon = () => (
  <svg width="300" height="150" viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20">
    {/* Document */}
    <rect x="30" y="30" width="80" height="90" rx="4" fill="#f8f9fa" stroke="#dee2e6" strokeWidth="2"/>
    
    {/* Scanning line effect */}
    <rect x="30" y="30" width="80" height="6" fill="#007bff" opacity="0.4">
      <animate attributeName="y" values="30;114;30" dur="3s" repeatCount="indefinite"/>
    </rect>
    
    {/* Text lines that get highlighted */}
    <rect x="40" y="45" width="60" height="4" fill="#e9ecef" rx="1"/>
    <rect x="40" y="55" width="40" height="4" fill="#e9ecef" rx="1">
      <animate attributeName="fill" values="#e9ecef;#ffc107;#ffc107;#e9ecef" dur="3s" repeatCount="indefinite"/>
    </rect>
    <rect x="40" y="65" width="60" height="4" fill="#e9ecef" rx="1"/>
    <rect x="40" y="75" width="45" height="4" fill="#e9ecef" rx="1">
      <animate attributeName="fill" values="#e9ecef;#e9ecef;#28a745;#e9ecef" dur="3s" repeatCount="indefinite"/>
    </rect>
    <rect x="40" y="85" width="55" height="4" fill="#e9ecef" rx="1"/>
    <rect x="40" y="95" width="35" height="4" fill="#e9ecef" rx="1">
      <animate attributeName="fill" values="#e9ecef;#e9ecef;#e9ecef;#dc3545" dur="3s" repeatCount="indefinite"/>
    </rect>
    <rect x="40" y="105" width="60" height="4" fill="#e9ecef" rx="1"/>
    
    {/* Extraction particles flying to the right */}
    {/* Yellow particle (terms) */}
    <circle r="3" fill="#ffc107" opacity="0">
      <animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite"/>
      <animate attributeName="cx" values="100;170;210;210" dur="3s" repeatCount="indefinite"/>
      <animate attributeName="cy" values="55;55;55;65" dur="3s" repeatCount="indefinite"/>
    </circle>
    
    {/* Green particle (dates) */}
    <circle r="3" fill="#28a745" opacity="0">
      <animate attributeName="opacity" values="0;0;1;0" dur="3s" repeatCount="indefinite"/>
      <animate attributeName="cx" values="100;100;170;210" dur="3s" repeatCount="indefinite"/>
      <animate attributeName="cy" values="75;75;75;90" dur="3s" repeatCount="indefinite"/>
    </circle>
    
    {/* Red particle (clauses) */}
    <circle r="3" fill="#dc3545" opacity="0">
      <animate attributeName="opacity" values="0;0;0;1" dur="3s" repeatCount="indefinite"/>
      <animate attributeName="cx" values="100;100;100;210" dur="3s" repeatCount="indefinite"/>
      <animate attributeName="cy" values="95;95;95;115" dur="3s" repeatCount="indefinite"/>
    </circle>
    
    {/* AI processing circle */}
    <g transform="translate(150, 75)">
      <circle r="15" fill="#f8f9fa" stroke="#007bff" strokeWidth="2" opacity="0.8">
        <animate attributeName="r" values="15;18;15" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle r="3" fill="#007bff"/>
      <circle r="3" fill="#007bff" transform="translate(-8, -8)" opacity="0.6"/>
      <circle r="3" fill="#007bff" transform="translate(8, -8)" opacity="0.6"/>
      <circle r="3" fill="#007bff" transform="translate(-8, 8)" opacity="0.6"/>
      <circle r="3" fill="#007bff" transform="translate(8, 8)" opacity="0.6"/>
      <path d="M0,-8 L-8,0 M0,-8 L8,0 M-8,0 L0,8 M8,0 L0,8" stroke="#007bff" strokeWidth="1" opacity="0.3"/>
    </g>
    
    {/* Extracted data containers */}
    {/* Terms container */}
    <rect x="200" y="55" width="80" height="20" rx="3" fill="#fff3cd" stroke="#ffc107" strokeWidth="2" opacity="0">
      <animate attributeName="opacity" values="0;0;1;1" dur="3s" repeatCount="indefinite"/>
    </rect>
    <rect x="206" y="61" width="20" height="3" fill="#ffc107" opacity="0">
      <animate attributeName="opacity" values="0;0;1;1" dur="3s" repeatCount="indefinite"/>
    </rect>
    <rect x="230" y="61" width="15" height="3" fill="#ffc107" opacity="0">
      <animate attributeName="opacity" values="0;0;1;1" dur="3s" repeatCount="indefinite"/>
    </rect>
    <rect x="249" y="61" width="25" height="3" fill="#ffc107" opacity="0">
      <animate attributeName="opacity" values="0;0;1;1" dur="3s" repeatCount="indefinite"/>
    </rect>
    
    {/* Dates container */}
    <rect x="200" y="80" width="80" height="20" rx="3" fill="#d1ecf1" stroke="#17a2b8" strokeWidth="2" opacity="0">
      <animate attributeName="opacity" values="0;0;0;1" dur="3s" repeatCount="indefinite"/>
    </rect>
    <rect x="206" y="86" width="30" height="3" fill="#17a2b8" opacity="0">
      <animate attributeName="opacity" values="0;0;0;1" dur="3s" repeatCount="indefinite"/>
    </rect>
    <rect x="240" y="86" width="30" height="3" fill="#17a2b8" opacity="0">
      <animate attributeName="opacity" values="0;0;0;1" dur="3s" repeatCount="indefinite"/>
    </rect>
    
    {/* Clauses container */}
    <rect x="200" y="105" width="80" height="20" rx="3" fill="#f8d7da" stroke="#dc3545" strokeWidth="2" opacity="0">
      <animate attributeName="opacity" values="0;0;0;1" dur="3s" repeatCount="indefinite"/>
    </rect>
    <rect x="206" y="111" width="15" height="3" fill="#dc3545" opacity="0">
      <animate attributeName="opacity" values="0;0;0;1" dur="3s" repeatCount="indefinite"/>
    </rect>
    <rect x="225" y="111" width="20" height="3" fill="#dc3545" opacity="0">
      <animate attributeName="opacity" values="0;0;0;1" dur="3s" repeatCount="indefinite"/>
    </rect>
    <rect x="249" y="111" width="25" height="3" fill="#dc3545" opacity="0">
      <animate attributeName="opacity" values="0;0;0;1" dur="3s" repeatCount="indefinite"/>
    </rect>
  </svg>
);
