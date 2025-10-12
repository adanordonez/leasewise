'use client';

import { useEffect, useState, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl';
import type { MapRef } from 'react-map-gl';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, DollarSign, Home, Ruler } from 'lucide-react';

interface LeaseData {
  id: string;
  user_address: string;
  building_name: string;
  property_address: string;
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

interface HoverStats {
  count: number;
  avgRent: number;
  minRent: number;
  maxRent: number;
}

export default function DashboardMapboxMap({ leases }: DashboardMapboxMapProps) {
  const [coordinates, setCoordinates] = useState<globalThis.Map<string, Coordinates>>(new globalThis.Map());
  const [loading, setLoading] = useState(true);
  const [selectedLease, setSelectedLease] = useState<LeaseData | null>(null);
  const [hoveredLease, setHoveredLease] = useState<LeaseData | null>(null);
  const [hoverStats, setHoverStats] = useState<HoverStats | null>(null);
  const [zoom, setZoom] = useState(4);
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

  // Batch geocode with parallel requests for faster loading
  useEffect(() => {
    const geocodeLeases = async () => {
      if (!mapboxToken) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const coordsMap = new globalThis.Map<string, Coordinates>();
      
      // Batch geocode in chunks of 10 for faster loading
      const batchSize = 10;
      for (let i = 0; i < leases.length; i += batchSize) {
        const batch = leases.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(lease => geocodeAddress(lease.user_address))
        );
        
        batch.forEach((lease, index) => {
          if (results[index]) {
            coordsMap.set(lease.id, results[index]!);
          }
        });
        
        // Update state incrementally for better UX
        setCoordinates(new globalThis.Map(coordsMap));
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < leases.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      setLoading(false);
    };

    if (leases.length > 0) {
      geocodeLeases();
    } else {
      setLoading(false);
    }
  }, [leases, mapboxToken]);

  // Create GeoJSON for clustering
  const geojsonData = useMemo(() => {
    const validLeases = leases.filter(lease => coordinates.has(lease.id));
    
    return {
      type: 'FeatureCollection' as const,
      features: validLeases.map(lease => {
        const coords = coordinates.get(lease.id)!;
        return {
          type: 'Feature' as const,
          properties: {
            id: lease.id,
            rent: lease.monthly_rent,
            building: lease.building_name,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [coords.lng, coords.lat],
          },
        };
      }),
    };
  }, [leases, coordinates]);

  // Cluster layer configuration
  const clusterLayer: any = {
    id: 'clusters',
    type: 'circle',
    source: 'leases',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#6366F1',
        10,
        '#8B5CF6',
        25,
        '#EC4899'
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        20,
        10,
        30,
        25,
        40
      ],
      'circle-stroke-width': 3,
      'circle-stroke-color': '#fff'
    }
  };

  const clusterCountLayer: any = {
    id: 'cluster-count',
    type: 'symbol',
    source: 'leases',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 14
    },
    paint: {
      'text-color': '#ffffff'
    }
  };

  const unclusteredPointLayer: any = {
    id: 'unclustered-point',
    type: 'circle',
    source: 'leases',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': '#3B82F6',
      'circle-radius': 8,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff'
    }
  };

  // Handle hover for stats
  const handleMarkerHover = (lease: LeaseData) => {
    setHoveredLease(lease);
    
    // Calculate stats for nearby leases (within same city roughly)
    const coords = coordinates.get(lease.id);
    if (!coords) return;
    
    const nearbyLeases = leases.filter(l => {
      const lCoords = coordinates.get(l.id);
      if (!lCoords) return false;
      
      // Calculate simple distance (rough approximation)
      const distance = Math.sqrt(
        Math.pow(lCoords.lat - coords.lat, 2) + 
        Math.pow(lCoords.lng - coords.lng, 2)
      );
      
      return distance < 0.5; // Roughly same area
    });
    
    if (nearbyLeases.length > 0) {
      const rents = nearbyLeases.map(l => l.monthly_rent);
      setHoverStats({
        count: nearbyLeases.length,
        avgRent: Math.round(rents.reduce((a, b) => a + b, 0) / rents.length),
        minRent: Math.min(...rents),
        maxRent: Math.max(...rents),
      });
    }
  };

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

  if (loading && coordinates.size === 0) {
    return (
      <div className="h-[600px] bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl flex items-center justify-center shadow-lg border border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading map data...</p>
          <p className="text-sm text-gray-500 mt-2">Geocoding {leases.length} locations</p>
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
  const centerLat = 39.8283;
  const centerLng = -98.5795;

  return (
    <div className="relative h-[600px] rounded-2xl overflow-hidden shadow-xl border border-gray-200">
      {loading && coordinates.size > 0 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white px-4 py-2 rounded-full shadow-lg">
          <p className="text-sm text-gray-600">Loading {leases.length - coordinates.size} more locations...</p>
        </div>
      )}
      
      <Map
        mapboxAccessToken={mapboxToken}
        initialViewState={{
          longitude: centerLng,
          latitude: centerLat,
          zoom: 4
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        attributionControl={false}
        onZoom={(e) => setZoom(e.viewState.zoom)}
        interactiveLayerIds={['clusters', 'unclustered-point']}
        onClick={(e) => {
          const feature = e.features?.[0];
          if (feature?.properties && feature.properties.id) {
            const lease = leases.find(l => l.id === feature.properties!.id);
            if (lease) setSelectedLease(lease);
          }
        }}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" />

        {/* Render clustered points at low zoom levels */}
        {zoom < 10 && (
          <Source
            id="leases"
            type="geojson"
            data={geojsonData}
            cluster={true}
            clusterMaxZoom={10}
            clusterRadius={50}
          >
            <Layer {...clusterLayer} />
            <Layer {...clusterCountLayer} />
            <Layer {...unclusteredPointLayer} />
          </Source>
        )}

        {/* Render individual markers at high zoom levels */}
        {zoom >= 10 && validLeases.map((lease) => {
          const coords = coordinates.get(lease.id);
          if (!coords) return null;
          
          return (
            <Marker
              key={lease.id}
              longitude={coords.lng}
              latitude={coords.lat}
              onClick={() => setSelectedLease(lease)}
            >
              <div 
                className="relative group"
                onMouseEnter={() => handleMarkerHover(lease)}
                onMouseLeave={() => {
                  setHoveredLease(null);
                  setHoverStats(null);
                }}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full border-3 border-white shadow-xl flex items-center justify-center cursor-pointer hover:scale-125 transition-all duration-200 hover:shadow-2xl">
                  <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Hover stats card */}
        {hoveredLease && hoverStats && !selectedLease && (
          <Popup
            longitude={coordinates.get(hoveredLease.id)?.lng || 0}
            latitude={coordinates.get(hoveredLease.id)?.lat || 0}
            closeButton={false}
            closeOnClick={false}
            className="hover-stats-popup"
            anchor="bottom"
            offset={15}
          >
            <div className="bg-white rounded-lg shadow-2xl p-4 min-w-[240px]">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Area Statistics</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Properties</span>
                  <span className="text-sm font-bold text-gray-900">{hoverStats.count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Rent</span>
                  <span className="text-sm font-bold text-blue-600">${hoverStats.avgRent.toLocaleString()}/mo</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Range</span>
                  <span className="text-xs font-medium text-gray-700">
                    ${hoverStats.minRent.toLocaleString()} - ${hoverStats.maxRent.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Popup>
        )}

        {/* Selected lease popup */}
        {selectedLease && (
          <Popup
            longitude={coordinates.get(selectedLease.id)?.lng || 0}
            latitude={coordinates.get(selectedLease.id)?.lat || 0}
            onClose={() => setSelectedLease(null)}
            closeButton={true}
            closeOnClick={false}
            className="custom-popup"
            maxWidth="400px"
          >
            <div className="min-w-[380px]">
              {/* Card Header */}
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Badge className="bg-blue-600 text-white px-2 py-0.5 rounded-md border text-xs font-semibold">
                    {selectedLease.property_type}
                  </Badge>
                  
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-lg font-semibold text-card-foreground">
                      {selectedLease.building_name || 'Property'}
                    </h2>
                  </div>
                  
                  {/* Key Stats Row */}
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 rounded-md">
                      <DollarSign className="w-3 h-3 text-green-600" />
                      <span className="text-sm font-semibold text-green-700">
                        ${selectedLease.monthly_rent.toLocaleString()}/mo
                      </span>
                    </div>
                    {selectedLease.bedrooms !== undefined && (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 rounded-md">
                        <Home className="w-3 h-3 text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-700">
                          {selectedLease.bedrooms} bed
                        </span>
                      </div>
                    )}
                    {selectedLease.bathrooms && (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-md">
                        <span className="text-sm font-medium text-blue-700">
                          {selectedLease.bathrooms} bath
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Property Details */}
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {selectedLease.user_address}
                      </span>
                    </div>
                    
                    {selectedLease.management_company && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {selectedLease.management_company}
                        </span>
                      </div>
                    )}
                    
                    {selectedLease.square_footage && (
                      <div className="flex items-center gap-1">
                        <Ruler className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {selectedLease.square_footage.toLocaleString()} sq ft
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Amenities Preview */}
                  {selectedLease.amenities && selectedLease.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {selectedLease.amenities.slice(0, 4).map((amenity, index) => (
                        <span 
                          key={index}
                          className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md"
                        >
                          {amenity}
                        </span>
                      ))}
                      {selectedLease.amenities.length > 4 && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                          +{selectedLease.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Card Footer */}
              <div className="flex items-center gap-3 p-6 pt-0 border-t">
                <p className="text-sm text-card-foreground">
                  Security Deposit: ${selectedLease.security_deposit.toLocaleString()}
                </p>
                <div className="h-5 w-px bg-gray-200"></div>
                <p className="text-sm text-muted-foreground">
                  {selectedLease.market_analysis.rent_percentile}th percentile
                </p>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
