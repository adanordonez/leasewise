'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, DollarSign, Home, Calendar, Users } from 'lucide-react';

// Dynamically import the entire MapboxMap component to avoid SSR issues
const MapboxMapComponent = dynamic(() => import('./MapboxMapInner'), { 
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading beautiful map...</p>
      </div>
    </div>
  )
});

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

interface MapboxMapProps {
  leases: LeaseData[];
}

export default function MapboxMap({ leases }: MapboxMapProps) {
  return <MapboxMapComponent leases={leases} />;
}
