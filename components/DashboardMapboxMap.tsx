'use client';

import { useEffect, useState } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl';

interface LeaseData {
  id: string;
  user_address: string; // User's input address for map pins
  building_name: string;
  property_address: string; // AI-extracted address from lease
  monthly_rent: number;
  security_deposit: number;
  property_type: string;
  square_footage?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities: string[];
  landlord_name?: string;
  management_company?: string;
  market_analysis: {
    rent_percentile: number;
    deposit_status: string;
    rent_analysis: string;
  };
}

interface DashboardMapboxMapProps {
  leases: LeaseData[];
}

interface Coordinates {
  lat: number;
  lng: number;
}

export default function DashboardMapboxMap({ leases }: DashboardMapboxMapProps) {
  const [coordinates, setCoordinates] = useState<globalThis.Map<string, Coordinates>>(new globalThis.Map());
  const [loading, setLoading] = useState(true);
  const [selectedLease, setSelectedLease] = useState<LeaseData | null>(null);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Geocoding function using Mapbox Geocoding API
  const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return { lat, lng };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  useEffect(() => {
    const geocodeLeases = async () => {
      if (!mapboxToken) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const coordsMap = new globalThis.Map<string, Coordinates>();
      
      for (const lease of leases) {
        // Use user's input address for geocoding (where they actually live)
        const coords = await geocodeAddress(lease.user_address);
        if (coords) {
          coordsMap.set(lease.id, coords);
        }
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setCoordinates(coordsMap);
      setLoading(false);
    };

    if (leases.length > 0) {
      geocodeLeases();
    } else {
      setLoading(false);
    }
  }, [leases, mapboxToken]);

  if (!mapboxToken) {
    return (
      <div className="h-96 bg-gradient-to-br from-gray-900 to-black rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-yellow-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Mapbox API Key Required</h3>
          <p className="text-gray-300 mb-4">
            To see the interactive map, please add your Mapbox API key to the environment variables.
          </p>
          <div className="bg-gray-800 rounded-lg p-3 text-sm font-mono text-gray-300">
            NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Get your free token at <a href="https://www.mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">mapbox.com</a>
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[600px] bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl flex items-center justify-center shadow-lg border border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading beautiful map...</p>
        </div>
      </div>
    );
  }

  const validLeases = leases.filter(lease => coordinates.has(lease.id));
  
  if (validLeases.length === 0) {
    return (
      <div className="h-[600px] bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl flex items-center justify-center shadow-lg border border-gray-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">No lease locations found</p>
        </div>
      </div>
    );
  }

  // Default to US center for country-wide view
  const centerLat = validLeases.length > 0 ? 
    validLeases.reduce((sum, lease) => {
      const coords = coordinates.get(lease.id);
      return sum + (coords?.lat || 0);
    }, 0) / validLeases.length : 39.8283; // Default to US center

  const centerLng = validLeases.length > 0 ? 
    validLeases.reduce((sum, lease) => {
      const coords = coordinates.get(lease.id);
      return sum + (coords?.lng || 0);
    }, 0) / validLeases.length : -98.5795; // Default to US center

  return (
    <div className="h-[600px] rounded-2xl overflow-hidden shadow-xl border border-gray-200">
      <Map
        mapboxAccessToken={mapboxToken}
        initialViewState={{
          longitude: centerLng,
          latitude: centerLat,
          zoom: validLeases.length === 1 ? 8 : 4 // Zoom out for country view, closer if only one location
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        attributionControl={false}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" />

        {validLeases.map((lease) => {
          const coords = coordinates.get(lease.id);
          if (!coords) return null;
          
          return (
            <Marker
              key={lease.id}
              longitude={coords.lng}
              latitude={coords.lat}
              onClick={() => setSelectedLease(lease)}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full border-3 border-white shadow-xl flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-200 hover:shadow-2xl">
                <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
              </div>
            </Marker>
          );
        })}

        {selectedLease && (
          <Popup
            longitude={coordinates.get(selectedLease.id)?.lng || 0}
            latitude={coordinates.get(selectedLease.id)?.lat || 0}
            onClose={() => setSelectedLease(null)}
            closeButton={true}
            closeOnClick={false}
            className="custom-popup"
            maxWidth="360px"
          >
            <div className="p-6 min-w-[360px]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🏠</span>
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900">{selectedLease.building_name || 'Property'}</h3>
                  <p className="text-sm text-gray-500">Lease Location</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-sm">📍</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Address</p>
                      <p className="text-sm text-gray-600">{selectedLease.user_address}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-green-600 text-sm">💰</span>
                      <p className="text-sm font-semibold text-gray-700">Monthly Rent</p>
                    </div>
                    <p className="text-lg font-bold text-green-700">${selectedLease.monthly_rent.toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-yellow-600 text-sm">🔒</span>
                      <p className="text-sm font-semibold text-gray-700">Security Deposit</p>
                    </div>
                    <p className="text-lg font-bold text-yellow-700">${selectedLease.security_deposit.toLocaleString()}</p>
                  </div>
                </div>
                
                {(selectedLease.bedrooms || selectedLease.bathrooms || selectedLease.square_footage) && (
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-indigo-600 text-sm">🛏️</span>
                      <p className="text-sm font-semibold text-gray-700">Property Details</p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {selectedLease.bedrooms && (
                        <span className="text-indigo-700 font-medium">{selectedLease.bedrooms} bed</span>
                      )}
                      {selectedLease.bathrooms && (
                        <span className="text-indigo-700 font-medium">{selectedLease.bathrooms} bath</span>
                      )}
                      {selectedLease.square_footage && (
                        <span className="text-indigo-700 font-medium">{selectedLease.square_footage} sq ft</span>
                      )}
                      <span className="text-indigo-700 font-medium capitalize">{selectedLease.property_type}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">Market Analysis</p>
                  <p className="text-xs font-semibold text-blue-600">
                    {selectedLease.market_analysis.rent_percentile}th percentile
                  </p>
                </div>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
