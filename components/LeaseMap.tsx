'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

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

interface LeaseMapProps {
  leases: LeaseData[];
}

interface Coordinates {
  lat: number;
  lng: number;
}

export default function LeaseMap({ leases }: LeaseMapProps) {
  const [coordinates, setCoordinates] = useState<Map<string, Coordinates>>(new Map());
  const [loading, setLoading] = useState(true);

  // Simple geocoding function (in production, use a proper geocoding service)
  const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
    try {
      // Using a free geocoding service (replace with proper service in production)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  useEffect(() => {
    const geocodeLeases = async () => {
      setLoading(true);
      const coordsMap = new Map<string, Coordinates>();
      
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
  }, [leases]);

  if (loading) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  const validLeases = leases.filter(lease => coordinates.has(lease.id));
  
  if (validLeases.length === 0) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No lease locations found</p>
        </div>
      </div>
    );
  }

  // Calculate center of all coordinates
  const centerLat = validLeases.reduce((sum, lease) => {
    const coords = coordinates.get(lease.id);
    return sum + (coords?.lat || 0);
  }, 0) / validLeases.length;

  const centerLng = validLeases.reduce((sum, lease) => {
    const coords = coordinates.get(lease.id);
    return sum + (coords?.lng || 0);
  }, 0) / validLeases.length;

  return (
    <div className="h-96 rounded-lg overflow-hidden">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {validLeases.map((lease) => {
          const coords = coordinates.get(lease.id);
          if (!coords) return null;
          
          return (
            <Marker key={lease.id} position={[coords.lat, coords.lng]}>
              <Popup>
                <div className="p-2 min-w-[250px]">
                  <h3 className="font-semibold text-lg mb-2">{lease.building_name}</h3>
                  <p className="text-gray-600 text-sm mb-2">📍 {lease.user_address}</p>
                  <p className="text-gray-500 text-xs mb-2">Property: {lease.property_address}</p>
                  
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Rent:</span>
                      <span className="font-semibold text-green-600">${lease.monthly_rent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Deposit:</span>
                      <span className="font-semibold text-yellow-600">${lease.security_deposit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Type:</span>
                      <span className="text-sm capitalize">{lease.property_type}</span>
                    </div>
                    {lease.square_footage && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Size:</span>
                        <span className="text-sm">{lease.square_footage} sq ft</span>
                      </div>
                    )}
                    {lease.bedrooms && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Bedrooms:</span>
                        <span className="text-sm">{lease.bedrooms}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Market: {lease.market_analysis.rent_percentile}th percentile
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
