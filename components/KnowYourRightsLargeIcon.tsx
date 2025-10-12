export function KnowYourRightsLargeIcon() {
  return (
    <svg width="800" height="400" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Document */}
      <rect x="80" y="80" width="200" height="240" rx="8" fill="#f8f9fa" stroke="#dee2e6" strokeWidth="3"/>
      
      {/* Scanning line effect */}
      <rect x="80" y="80" width="200" height="12" fill="#007bff" opacity="0.4">
        <animate attributeName="y" values="80;308;80" dur="3s" repeatCount="indefinite"/>
      </rect>
      
      {/* Text lines that get highlighted */}
      <rect x="100" y="110" width="160" height="8" fill="#e9ecef" rx="2"/>
      <rect x="100" y="135" width="110" height="8" fill="#e9ecef" rx="2">
        <animate attributeName="fill" values="#e9ecef;#ffc107;#ffc107;#e9ecef" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="100" y="160" width="160" height="8" fill="#e9ecef" rx="2"/>
      <rect x="100" y="185" width="120" height="8" fill="#e9ecef" rx="2">
        <animate attributeName="fill" values="#e9ecef;#e9ecef;#28a745;#e9ecef" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="100" y="210" width="145" height="8" fill="#e9ecef" rx="2"/>
      <rect x="100" y="235" width="95" height="8" fill="#e9ecef" rx="2">
        <animate attributeName="fill" values="#e9ecef;#e9ecef;#e9ecef;#dc3545" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="100" y="260" width="160" height="8" fill="#e9ecef" rx="2"/>
      <rect x="100" y="285" width="130" height="8" fill="#e9ecef" rx="2"/>
      
      {/* Extraction particles flying to the right */}
      {/* Yellow particle (terms) */}
      <circle r="6" fill="#ffc107" opacity="0">
        <animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="cx" values="270;400;530;530" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="135;135;135;165" dur="3s" repeatCount="indefinite"/>
      </circle>
      
      {/* Green particle (dates) */}
      <circle r="6" fill="#28a745" opacity="0">
        <animate attributeName="opacity" values="0;0;1;0" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="cx" values="270;270;400;530" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="185;185;185;225" dur="3s" repeatCount="indefinite"/>
      </circle>
      
      {/* Red particle (clauses) */}
      <circle r="6" fill="#dc3545" opacity="0">
        <animate attributeName="opacity" values="0;0;0;1" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="cx" values="270;270;270;530" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="235;235;235;285" dur="3s" repeatCount="indefinite"/>
      </circle>
      
      {/* AI processing circle */}
      <g transform="translate(400, 200)">
        <circle r="35" fill="#f8f9fa" stroke="#007bff" strokeWidth="3" opacity="0.8">
          <animate attributeName="r" values="35;42;35" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        <circle r="7" fill="#007bff"/>
        <circle r="7" fill="#007bff" transform="translate(-18, -18)" opacity="0.6"/>
        <circle r="7" fill="#007bff" transform="translate(18, -18)" opacity="0.6"/>
        <circle r="7" fill="#007bff" transform="translate(-18, 18)" opacity="0.6"/>
        <circle r="7" fill="#007bff" transform="translate(18, 18)" opacity="0.6"/>
        <path d="M0,-18 L-18,0 M0,-18 L18,0 M-18,0 L0,18 M18,0 L0,18" stroke="#007bff" strokeWidth="2" opacity="0.3"/>
      </g>
      
      {/* Extracted data containers */}
      {/* Terms container */}
      <rect x="520" y="145" width="200" height="50" rx="6" fill="#fff3cd" stroke="#ffc107" strokeWidth="3" opacity="0">
        <animate attributeName="opacity" values="0;0;1;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="532" y="157" width="50" height="6" fill="#ffc107" opacity="0">
        <animate attributeName="opacity" values="0;0;1;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="590" y="157" width="38" height="6" fill="#ffc107" opacity="0">
        <animate attributeName="opacity" values="0;0;1;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="636" y="157" width="62" height="6" fill="#ffc107" opacity="0">
        <animate attributeName="opacity" values="0;0;1;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="532" y="170" width="80" height="6" fill="#ffc107" opacity="0">
        <animate attributeName="opacity" values="0;0;1;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="620" y="170" width="45" height="6" fill="#ffc107" opacity="0">
        <animate attributeName="opacity" values="0;0;1;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="532" y="183" width="70" height="6" fill="#ffc107" opacity="0">
        <animate attributeName="opacity" values="0;0;1;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      
      {/* Dates container */}
      <rect x="520" y="205" width="200" height="50" rx="6" fill="#d1ecf1" stroke="#17a2b8" strokeWidth="3" opacity="0">
        <animate attributeName="opacity" values="0;0;0;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="532" y="217" width="75" height="6" fill="#17a2b8" opacity="0">
        <animate attributeName="opacity" values="0;0;0;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="615" y="217" width="75" height="6" fill="#17a2b8" opacity="0">
        <animate attributeName="opacity" values="0;0;0;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="532" y="230" width="90" height="6" fill="#17a2b8" opacity="0">
        <animate attributeName="opacity" values="0;0;0;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="630" y="230" width="60" height="6" fill="#17a2b8" opacity="0">
        <animate attributeName="opacity" values="0;0;0;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="532" y="243" width="100" height="6" fill="#17a2b8" opacity="0">
        <animate attributeName="opacity" values="0;0;0;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      
      {/* Clauses container */}
      <rect x="520" y="265" width="200" height="50" rx="6" fill="#f8d7da" stroke="#dc3545" strokeWidth="3" opacity="0">
        <animate attributeName="opacity" values="0;0;0;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="532" y="277" width="38" height="6" fill="#dc3545" opacity="0">
        <animate attributeName="opacity" values="0;0;0;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="576" y="277" width="50" height="6" fill="#dc3545" opacity="0">
        <animate attributeName="opacity" values="0;0;0;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="633" y="277" width="62" height="6" fill="#dc3545" opacity="0">
        <animate attributeName="opacity" values="0;0;0;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="532" y="290" width="120" height="6" fill="#dc3545" opacity="0">
        <animate attributeName="opacity" values="0;0;0;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="660" y="290" width="35" height="6" fill="#dc3545" opacity="0">
        <animate attributeName="opacity" values="0;0;0;1" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="532" y="303" width="85" height="6" fill="#dc3545" opacity="0">
        <animate attributeName="opacity" values="0;0;0;1" dur="3s" repeatCount="indefinite"/>
      </rect>
    </svg>
  );
}

