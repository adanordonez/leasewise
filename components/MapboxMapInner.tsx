'use client';

import { useEffect, useState, useCallback } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import { MapPin, DollarSign, Home, Calendar, Users } from 'lucide-react';

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

interface MapboxMapInnerProps {
  leases: LeaseData[];
}

interface Coordinates {
  lat: number;
  lng: number;
}

// Use a different name to avoid conflict with Mapbox Map component
type CoordinatesMap = Map<string, Coordinates>;

// Custom marker component
const CustomMarker = ({ lease, onClick }: { lease: LeaseData; onClick: () => void }) => {
  const getMarkerColor = (rent: number) => {
    if (rent < 2000) return '#10B981'; // Green for affordable
    if (rent < 3500) return '#F59E0B'; // Yellow for moderate
    if (rent < 5000) return '#EF4444'; // Red for expensive
    return '#8B5CF6'; // Purple for luxury
  };

  const getMarkerSize = (rent: number) => {
    if (rent < 2000) return 'w-8 h-8';
    if (rent < 3500) return 'w-10 h-10';
    if (rent < 5000) return 'w-12 h-12';
    return 'w-14 h-14';
  };

  return (
    <div 
      className={`${getMarkerSize(lease.monthly_rent)} relative cursor-pointer transform transition-all duration-200 hover:scale-110`}
      onClick={onClick}
    >
      {/* Outer ring */}
      <div 
        className="absolute inset-0 rounded-full animate-ping opacity-20"
        style={{ backgroundColor: getMarkerColor(lease.monthly_rent) }}
      />
      
      {/* Main marker */}
      <div 
        className="relative w-full h-full rounded-full shadow-lg border-2 border-white flex items-center justify-center"
        style={{ backgroundColor: getMarkerColor(lease.monthly_rent) }}
      >
        <DollarSign className="w-4 h-4 text-white" />
      </div>
      
      {/* Price label */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-lg px-2 py-1 shadow-lg border text-xs font-semibold whitespace-nowrap">
        ${lease.monthly_rent.toLocaleString()}
      </div>
    </div>
  );
};

export default function MapboxMapInner({ leases }: MapboxMapInnerProps) {
  const [coordinates, setCoordinates] = useState<CoordinatesMap>(new globalThis.Map());
  const [loading, setLoading] = useState(true);
  const [selectedLease, setSelectedLease] = useState<LeaseData | null>(null);
  const [popupLocation, setPopupLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Geocoding function using server-side API
  const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const [lng, lat] = data.coordinates;
          return { lat, lng };
        }
      }
      // Return a fallback coordinate for Chicago if geocoding fails
      return { lat: 41.8781, lng: -87.6298 };
    } catch (error) {
      console.error('Geocoding error:', error);
      // Return a fallback coordinate for Chicago if geocoding fails
      return { lat: 41.8781, lng: -87.6298 };
    }
  };

  useEffect(() => {
    const geocodeLeases = async () => {
      setLoading(true);
      const coordsMap = new globalThis.Map<string, Coordinates>();
      
      for (const lease of leases) {
        const coords = await geocodeAddress(lease.user_address);
        if (coords) {
          coordsMap.set(lease.id, coords);
        }
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
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

  const handleMarkerClick = useCallback((lease: LeaseData, coords: Coordinates) => {
    setSelectedLease(lease);
    setPopupLocation(coords);
  }, []);

  const handleClosePopup = useCallback(() => {
    setSelectedLease(null);
    setPopupLocation(null);
  }, []);

  if (loading) {
    return (
      <div className="h-96 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
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
      <div className="h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No lease locations found</h3>
          <p className="text-gray-500">Try uploading more leases to see them on the map</p>
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

  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  // Get Mapbox token from server
  useEffect(() => {
    const getToken = async () => {
      try {
        const response = await fetch('/api/mapbox-token');
        if (response.ok) {
          const data = await response.json();
          setMapboxToken(data.token);
        }
      } catch (error) {
        console.error('Failed to get Mapbox token:', error);
      }
    };
    getToken();
  }, []);
  
  if (!mapboxToken) {
    return (
      <div className="h-96 bg-gradient-to-br from-yellow-50 to-orange-100 rounded-lg flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="p-4 bg-yellow-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Mapbox API Key Required</h3>
          <p className="text-gray-600 mb-4">
            To see the interactive map with lease locations, please add your Mapbox API key to the environment variables.
          </p>
          <div className="bg-gray-100 rounded-lg p-3 text-sm font-mono text-gray-700">
            NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Get your free token at <a href="https://www.mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">mapbox.com</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 rounded-lg overflow-hidden shadow-lg">
      <Map
        mapboxAccessToken={mapboxToken}
        initialViewState={{
          longitude: centerLng,
          latitude: centerLat,
          zoom: 10
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        attributionControl={false}
      >
        {validLeases.map((lease) => {
          const coords = coordinates.get(lease.id);
          if (!coords) return null;
          
          return (
            <Marker
              key={lease.id}
              longitude={coords.lng}
              latitude={coords.lat}
              onClick={() => handleMarkerClick(lease, coords)}
            >
              <CustomMarker lease={lease} onClick={() => handleMarkerClick(lease, coords)} />
            </Marker>
          );
        })}

        {selectedLease && popupLocation && (
          <Popup
            longitude={popupLocation.lng}
            latitude={popupLocation.lat}
            onClose={handleClosePopup}
            closeButton={true}
            closeOnClick={false}
            className="custom-popup"
            maxWidth="700px"
            offset={[0, -10]}
          >
            <div className="p-6 bg-white rounded-xl shadow-2xl min-w-[600px] max-w-[700px]">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <Home className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-2xl text-gray-900 mb-1">
                      {selectedLease.building_name || 'Property'}
                    </h3>
                    <p className="text-sm text-gray-600 capitalize">{selectedLease.property_type || 'Property'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">
                    ${selectedLease.monthly_rent?.toLocaleString() || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">per month</div>
                </div>
              </div>
              
              {/* Address Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 mb-1">User Address</p>
                    <p className="text-sm text-gray-700">{selectedLease.user_address}</p>
                    <p className="font-medium text-gray-800 mt-2 mb-1">Property Address</p>
                    <p className="text-sm text-gray-700">{selectedLease.property_address}</p>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-xs text-green-700 font-medium mb-1">Monthly Rent</p>
                  <p className="text-2xl font-bold text-green-800">
                    ${selectedLease.monthly_rent?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-xs text-blue-700 font-medium mb-1">Security Deposit</p>
                  <p className="text-2xl font-bold text-blue-800">
                    ${selectedLease.security_deposit?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                  <p className="text-xs text-purple-700 font-medium mb-1">Total Move-in</p>
                  <p className="text-2xl font-bold text-purple-800">
                    ${((selectedLease.monthly_rent || 0) + (selectedLease.security_deposit || 0)).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800 mb-3">Property Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Square Footage:</span>
                      <span className="font-medium">{selectedLease.square_footage?.toLocaleString() || 'N/A'} sq ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bedrooms:</span>
                      <span className="font-medium">{selectedLease.bedrooms || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bathrooms:</span>
                      <span className="font-medium">{selectedLease.bathrooms || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Parking:</span>
                      <span className="font-medium">{selectedLease.parking_spaces || 'N/A'} spaces</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800 mb-3">Lease Terms</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">{selectedLease.lease_start_date || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span className="font-medium">{selectedLease.lease_end_date || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Notice Period:</span>
                      <span className="font-medium">{selectedLease.notice_period_days || 'N/A'} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pet Policy:</span>
                      <span className="font-medium">{selectedLease.pet_policy || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Utilities & Amenities */}
              {(selectedLease.utilities_included && selectedLease.utilities_included.length > 0) && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Utilities Included</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedLease.utilities_included.map((utility, index) => (
                      <span key={index} className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
                        {utility}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedLease.amenities && selectedLease.amenities.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedLease.amenities.slice(0, 10).map((amenity, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                        {amenity}
                      </span>
                    ))}
                    {selectedLease.amenities.length > 10 && (
                      <span className="text-xs text-gray-500 px-3 py-1">+{selectedLease.amenities.length - 10} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {(selectedLease.landlord_name || selectedLease.management_company || selectedLease.contact_email || selectedLease.contact_phone) && (
                <div className="border-t pt-4 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedLease.landlord_name && (
                      <div>
                        <span className="text-gray-600">Landlord:</span>
                        <p className="font-medium">{selectedLease.landlord_name}</p>
                      </div>
                    )}
                    {selectedLease.management_company && (
                      <div>
                        <span className="text-gray-600">Management:</span>
                        <p className="font-medium">{selectedLease.management_company}</p>
                      </div>
                    )}
                    {selectedLease.contact_email && (
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <p className="font-medium text-blue-600">{selectedLease.contact_email}</p>
                      </div>
                    )}
                    {selectedLease.contact_phone && (
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <p className="font-medium">{selectedLease.contact_phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Market Analysis */}
              {selectedLease.market_analysis && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Market Analysis</h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-yellow-800">Rent Percentile</span>
                      <span className="text-xl font-bold text-yellow-900">{selectedLease.market_analysis.rent_percentile}%</span>
                    </div>
                    <p className="text-sm text-yellow-700">{selectedLease.market_analysis.rent_analysis}</p>
                    <p className="text-xs text-yellow-600 mt-1">Deposit Status: {selectedLease.market_analysis.deposit_status}</p>
                  </div>
                </div>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
