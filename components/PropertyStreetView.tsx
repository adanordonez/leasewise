'use client';

import { useState, useEffect } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';

interface PropertyStreetViewProps {
  address: string;
  className?: string;
}

export default function PropertyStreetView({ address, className = '' }: PropertyStreetViewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!address) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Use Google Street View Static API
    // Note: This requires a Google Maps API key with Street View Static API enabled
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not found. Street View will not be available.');
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const encodedAddress = encodeURIComponent(address);
    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&key=${apiKey}&fov=90&pitch=0`;

    // Test if the image exists before setting it
    const img = new Image();
    img.onload = () => {
      setImageUrl(streetViewUrl);
      setIsLoading(false);
      setHasError(false);
    };
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
    };
    img.src = streetViewUrl;
  }, [address]);

  if (isLoading) {
    return (
      <div className={`bg-slate-100 rounded-lg p-8 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-sm text-slate-600">Loading street view...</p>
        </div>
      </div>
    );
  }

  if (hasError || !imageUrl) {
    return (
      <div className={`bg-slate-50 border border-slate-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-start gap-3 text-slate-600">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium mb-1">Street View Not Available</p>
            <p className="text-xs text-slate-500">
              Unable to load street view for this location. The property may be in a location without street view coverage.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden border border-slate-200 shadow-sm ${className}`}>
      <div className="bg-slate-100 px-4 py-2 flex items-center gap-2 border-b border-slate-200">
        <MapPin className="w-4 h-4 text-purple-600" />
        <span className="text-sm font-medium text-slate-700">Property Street View</span>
      </div>
      <div className="relative">
        <img
          src={imageUrl}
          alt={`Street view of ${address}`}
          className="w-full h-auto"
          style={{ maxHeight: '250px', objectFit: 'cover' }}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <p className="text-xs text-white font-medium truncate">{address}</p>
        </div>
      </div>
      <div className="bg-slate-50 px-4 py-2 text-xs text-slate-500 text-center">
        Powered by Google Street View
      </div>
    </div>
  );
}

