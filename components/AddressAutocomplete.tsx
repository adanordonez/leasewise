'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';

interface AddressAutocompleteProps {
  onAddressSelect: (address: string) => void;
  value: string;
}

export default function AddressAutocomplete({ onAddressSelect, value }: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=US&types=address`
      );
      const data = await response.json();
      setSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Address search error:', error);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onAddressSelect(e.target.value);
            searchAddress(e.target.value);
          }}
          placeholder="Start typing your address..."
          className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => {
                onAddressSelect(suggestion.place_name);
                setShowSuggestions(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-slate-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{suggestion.text}</p>
                  <p className="text-xs text-slate-600">{suggestion.place_name}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}