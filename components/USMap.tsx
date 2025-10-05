'use client';

import { useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import MapboxMap from './MapboxMap';

interface USMapProps {
  onStateSelect: (state: string) => void;
}

// Simple list of US states
const states = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

// Simple SVG map data for major states
const stateShapes = [
  { name: 'California', path: 'M 50 200 L 150 200 L 150 300 L 50 300 Z', x: 100, y: 250 },
  { name: 'Texas', path: 'M 200 250 L 300 250 L 300 350 L 200 350 Z', x: 250, y: 300 },
  { name: 'Florida', path: 'M 400 350 L 450 350 L 450 400 L 400 400 Z', x: 425, y: 375 },
  { name: 'New York', path: 'M 450 100 L 500 100 L 500 150 L 450 150 Z', x: 475, y: 125 },
  { name: 'Illinois', path: 'M 300 150 L 350 150 L 350 200 L 300 200 Z', x: 325, y: 175 },
  { name: 'Pennsylvania', path: 'M 420 120 L 470 120 L 470 170 L 420 170 Z', x: 445, y: 145 },
  { name: 'Ohio', path: 'M 350 140 L 400 140 L 400 190 L 350 190 Z', x: 375, y: 165 },
  { name: 'Georgia', path: 'M 380 250 L 430 250 L 430 300 L 380 300 Z', x: 405, y: 275 },
  { name: 'North Carolina', path: 'M 420 200 L 470 200 L 470 250 L 420 250 Z', x: 445, y: 225 },
  { name: 'Michigan', path: 'M 320 100 L 370 100 L 370 150 L 320 150 Z', x: 345, y: 125 },
  { name: 'New Jersey', path: 'M 460 110 L 490 110 L 490 140 L 460 140 Z', x: 475, y: 125 },
  { name: 'Virginia', path: 'M 410 170 L 450 170 L 450 220 L 410 220 Z', x: 430, y: 195 },
  { name: 'Washington', path: 'M 50 50 L 100 50 L 100 100 L 50 100 Z', x: 75, y: 75 },
  { name: 'Arizona', path: 'M 100 250 L 150 250 L 150 300 L 100 300 Z', x: 125, y: 275 },
  { name: 'Massachusetts', path: 'M 470 90 L 490 90 L 490 110 L 470 110 Z', x: 480, y: 100 },
  { name: 'Tennessee', path: 'M 350 200 L 400 200 L 400 250 L 350 250 Z', x: 375, y: 225 },
  { name: 'Indiana', path: 'M 330 160 L 380 160 L 380 210 L 330 210 Z', x: 355, y: 185 },
  { name: 'Missouri', path: 'M 280 200 L 330 200 L 330 250 L 280 250 Z', x: 305, y: 225 },
  { name: 'Maryland', path: 'M 440 140 L 470 140 L 470 170 L 440 170 Z', x: 455, y: 155 },
  { name: 'Wisconsin', path: 'M 300 100 L 350 100 L 350 150 L 300 150 Z', x: 325, y: 125 },
  { name: 'Colorado', path: 'M 150 200 L 200 200 L 200 250 L 150 250 Z', x: 175, y: 225 },
  { name: 'Minnesota', path: 'M 250 80 L 300 80 L 300 130 L 250 130 Z', x: 275, y: 105 },
  { name: 'South Carolina', path: 'M 420 250 L 470 250 L 470 300 L 420 300 Z', x: 445, y: 275 },
  { name: 'Alabama', path: 'M 360 250 L 410 250 L 410 300 L 360 300 Z', x: 385, y: 275 },
  { name: 'Louisiana', path: 'M 250 300 L 300 300 L 300 350 L 250 350 Z', x: 275, y: 325 },
  { name: 'Kentucky', path: 'M 350 180 L 400 180 L 400 230 L 350 230 Z', x: 375, y: 205 },
  { name: 'Oregon', path: 'M 20 100 L 70 100 L 70 150 L 20 150 Z', x: 45, y: 125 },
  { name: 'Oklahoma', path: 'M 200 250 L 250 250 L 250 300 L 200 300 Z', x: 225, y: 275 },
  { name: 'Connecticut', path: 'M 460 100 L 480 100 L 480 120 L 460 120 Z', x: 470, y: 110 },
  { name: 'Utah', path: 'M 120 200 L 170 200 L 170 250 L 120 250 Z', x: 145, y: 225 },
  { name: 'Iowa', path: 'M 280 150 L 330 150 L 330 200 L 280 200 Z', x: 305, y: 175 },
  { name: 'Nevada', path: 'M 80 200 L 130 200 L 130 250 L 80 250 Z', x: 105, y: 225 },
  { name: 'Arkansas', path: 'M 280 250 L 330 250 L 330 300 L 280 300 Z', x: 305, y: 275 },
  { name: 'Mississippi', path: 'M 320 250 L 370 250 L 370 300 L 320 300 Z', x: 345, y: 275 },
  { name: 'Kansas', path: 'M 200 200 L 250 200 L 250 250 L 200 250 Z', x: 225, y: 225 },
  { name: 'New Mexico', path: 'M 130 250 L 180 250 L 180 300 L 130 300 Z', x: 155, y: 275 },
  { name: 'Nebraska', path: 'M 200 150 L 250 150 L 250 200 L 200 200 Z', x: 225, y: 175 },
  { name: 'West Virginia', path: 'M 380 160 L 420 160 L 420 200 L 380 200 Z', x: 400, y: 180 },
  { name: 'Idaho', path: 'M 80 150 L 130 150 L 130 200 L 80 200 Z', x: 105, y: 175 },
  { name: 'Hawaii', path: 'M 100 400 L 120 400 L 120 420 L 100 420 Z', x: 110, y: 410 },
  { name: 'New Hampshire', path: 'M 450 80 L 470 80 L 470 100 L 450 100 Z', x: 460, y: 90 },
  { name: 'Maine', path: 'M 470 60 L 490 60 L 490 80 L 470 80 Z', x: 480, y: 70 },
  { name: 'Rhode Island', path: 'M 450 110 L 460 110 L 460 120 L 450 120 Z', x: 455, y: 115 },
  { name: 'Montana', path: 'M 100 100 L 150 100 L 150 150 L 100 150 Z', x: 125, y: 125 },
  { name: 'Delaware', path: 'M 440 130 L 460 130 L 460 150 L 440 150 Z', x: 450, y: 140 },
  { name: 'South Dakota', path: 'M 200 100 L 250 100 L 250 150 L 200 150 Z', x: 225, y: 125 },
  { name: 'North Dakota', path: 'M 180 80 L 230 80 L 230 130 L 180 130 Z', x: 205, y: 105 },
  { name: 'Alaska', path: 'M 20 20 L 70 20 L 70 70 L 20 70 Z', x: 45, y: 45 },
  { name: 'Vermont', path: 'M 440 70 L 460 70 L 460 90 L 440 90 Z', x: 450, y: 80 },
  { name: 'Wyoming', path: 'M 150 150 L 200 150 L 200 200 L 150 200 Z', x: 175, y: 175 }
];

export default function USMap({ onStateSelect }: USMapProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  const filteredStates = states.filter(state =>
    state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toggle Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowMap(true)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            showMap 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <MapPin className="h-4 w-4 inline mr-2" />
          Map View
        </button>
        <button
          onClick={() => setShowMap(false)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !showMap 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Search className="h-4 w-4 inline mr-2" />
          List View
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search for your state..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
        />
      </div>

      {/* Map View */}
      {showMap && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-gray-200">
          <MapboxMap onStateSelect={onStateSelect} />
        </div>
      )}

      {/* List View */}
      {!showMap && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredStates.map((state) => (
            <button
              key={state}
              onClick={() => onStateSelect(state)}
              onMouseEnter={() => setHoveredState(state)}
              onMouseLeave={() => setHoveredState(null)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-center font-medium ${
                hoveredState === state
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md transform scale-105'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              {state}
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {filteredStates.length === 0 && (
        <div className="text-center py-8">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No states found</h3>
          <p className="text-gray-600">Try searching for a different state name</p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-800">
          <MapPin className="h-4 w-4" />
          <span className="font-medium">How to use:</span>
        </div>
        <p className="text-blue-700 text-sm mt-1">
          Toggle between map and list view, search for your state, or click on any state to view available landlord-tenant laws.
        </p>
      </div>
    </div>
  );
}
