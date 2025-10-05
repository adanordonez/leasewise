'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import Map, { Source, Layer } from 'react-map-gl';
import usStatesGeoJSON from '@/lib/us-states-complete.json';

interface MapboxMapProps {
  onStateSelect: (state: string) => void;
}

export default function MapboxMap({ onStateSelect }: MapboxMapProps) {
  const [hoveredState, setHoveredState] = useState<any>(null);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!mapboxToken) {
    return (
      <div className="h-96 bg-gradient-to-br from-gray-900 to-black rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-yellow-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-yellow-600" />
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

  const onHover = (event: any) => {
    const feature = event.features?.[0];
    if (feature) {
      setHoveredState(feature);
    } else {
      setHoveredState(null);
    }
  };

  const onClick = (event: any) => {
    const feature = event.features?.[0];
    if (feature) {
      onStateSelect(feature.properties.name);
    }
  };

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden shadow-sm">
      <Map
        mapboxAccessToken={mapboxToken}
        initialViewState={{
          longitude: -98.5795,
          latitude: 39.8283,
          zoom: 3
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        interactiveLayerIds={['us-states-fill']}
        onMouseMove={onHover}
        onClick={onClick}
        cursor={hoveredState ? 'pointer' : 'default'}
      >
        <Source id="us-states" type="geojson" data={usStatesGeoJSON}>
          {/* Base state fill */}
          <Layer
            id="us-states-fill"
            type="fill"
            paint={{
              'fill-color': '#3b82f6',
              'fill-opacity': 0.6
            }}
          />
          {/* State borders */}
          <Layer
            id="us-states-stroke"
            type="line"
            paint={{
              'line-color': '#ffffff',
              'line-width': 2
            }}
          />
          {/* Hover effect */}
          <Layer
            id="us-states-hover"
            type="fill"
            paint={{
              'fill-color': '#1d4ed8',
              'fill-opacity': 0.8
            }}
            filter={['==', 'name', hoveredState?.properties?.name || '']}
          />
        </Source>

        {/* Hover Info */}
        {hoveredState && (
          <div className="absolute top-4 right-4 bg-white rounded-lg p-3 shadow-lg border border-gray-200 z-10">
            <div className="text-sm font-medium text-gray-900">
              {hoveredState.properties.name}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Click to view laws
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="h-4 w-4" />
            <span>Click on any state to view laws</span>
          </div>
        </div>
      </Map>
    </div>
  );
}