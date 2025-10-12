export function AnalyzeLargeIcon() {
  return (
    <svg width="600" height="400" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Document */}
      <rect x="150" y="80" width="300" height="240" rx="8" fill="#ffffff" stroke="#dee2e6" strokeWidth="3"/>
      
      {/* Text lines */}
      <rect x="180" y="120" width="210" height="8" fill="#e9ecef" rx="2"/>
      <rect x="180" y="140" width="150" height="8" fill="#e9ecef" rx="2"/>
      <rect x="180" y="160" width="195" height="8" fill="#e9ecef" rx="2"/>
      <rect x="180" y="180" width="210" height="8" fill="#e9ecef" rx="2"/>
      <rect x="180" y="200" width="165" height="8" fill="#e9ecef" rx="2"/>
      <rect x="180" y="220" width="210" height="8" fill="#e9ecef" rx="2"/>
      <rect x="180" y="240" width="180" height="8" fill="#e9ecef" rx="2"/>
      <rect x="180" y="260" width="210" height="8" fill="#e9ecef" rx="2"/>
      <rect x="180" y="280" width="135" height="8" fill="#e9ecef" rx="2"/>
      
      {/* Scanning line */}
      <rect x="150" y="80" width="300" height="6" fill="#007bff" opacity="0.4">
        <animate attributeName="y" values="80;320;80" dur="3s" repeatCount="indefinite"/>
      </rect>
      
      {/* Red flags appearing */}
      {/* Flag 1 */}
      <g opacity="0">
        <rect x="176" y="156" width="207" height="16" fill="#dc3545" opacity="0.3" rx="2"/>
        <path d="M400 164 L415 154 L415 174 L400 164" fill="#dc3545"/>
        <rect x="413" y="154" width="2" height="30" fill="#dc3545"/>
        <animate attributeName="opacity" values="0;0;1;1;1;1;0" dur="3s" repeatCount="indefinite"/>
      </g>
      
      {/* Flag 2 */}
      <g opacity="0">
        <rect x="176" y="216" width="207" height="16" fill="#dc3545" opacity="0.3" rx="2"/>
        <path d="M400 224 L415 214 L415 234 L400 224" fill="#dc3545"/>
        <rect x="413" y="214" width="2" height="30" fill="#dc3545"/>
        <animate attributeName="opacity" values="0;0;0;1;1;1;0" dur="3s" repeatCount="indefinite"/>
      </g>
      
      {/* Flag 3 */}
      <g opacity="0">
        <rect x="176" y="276" width="147" height="16" fill="#dc3545" opacity="0.3" rx="2"/>
        <path d="M340 284 L355 274 L355 294 L340 284" fill="#dc3545"/>
        <rect x="353" y="274" width="2" height="30" fill="#dc3545"/>
        <animate attributeName="opacity" values="0;0;0;0;1;1;0" dur="3s" repeatCount="indefinite"/>
      </g>
    </svg>
  );
}

