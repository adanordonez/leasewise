'use client';

import { useState, useEffect } from 'react';
import { MapPin, DollarSign, Home, Filter, Search, Calendar, Users, Map, ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import the map component to avoid SSR issues
const MapboxMap = dynamic(() => import('@/components/MapboxMap'), { 
  ssr: false,
  loading: () => <div className="h-96 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p className="text-gray-600">Loading beautiful map...</p>
    </div>
  </div>
});

interface LeaseData {
  id: string;
  created_at: string;
  user_address: string; // User's input address for map pins
  building_name: string;
  property_address: string; // AI-extracted address from lease
  monthly_rent: number;
  security_deposit: number;
  lease_start_date: string;
  lease_end_date: string;
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

export default function Dashboard() {
  const [leases, setLeases] = useState<LeaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    minRent: '',
    maxRent: '',
    propertyType: '',
    city: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLeases();
  }, [filters]);

  const fetchLeases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.minRent) params.append('minRent', filters.minRent);
      if (filters.maxRent) params.append('maxRent', filters.maxRent);
      if (filters.propertyType) params.append('propertyType', filters.propertyType);
      if (filters.city) params.append('city', filters.city);

      const response = await fetch(`/api/leases?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setLeases(data.leases);
      } else {
        setError(data.error || 'Failed to fetch lease data');
      }
    } catch (err) {
      setError('Failed to fetch lease data');
      console.error('Error fetching leases:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeases = leases.filter(lease => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      lease.building_name.toLowerCase().includes(searchLower) ||
      lease.property_address.toLowerCase().includes(searchLower) ||
      lease.landlord_name?.toLowerCase().includes(searchLower) ||
      lease.management_company?.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    totalLeases: leases.length,
    avgRent: leases.length > 0 ? Math.round(leases.reduce((sum, lease) => sum + lease.monthly_rent, 0) / leases.length) : 0,
    avgDeposit: leases.length > 0 ? Math.round(leases.reduce((sum, lease) => sum + lease.security_deposit, 0) / leases.length) : 0,
    propertyTypes: [...new Set(leases.map(lease => lease.property_type))].length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lease data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchLeases}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm font-medium">Back to Analyze</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Lease Data Dashboard</h1>
                <p className="text-gray-600 mt-1">Market insights from analyzed lease agreements</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                {stats.totalLeases} leases analyzed
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Home className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Leases</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLeases}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rent</p>
                <p className="text-2xl font-bold text-gray-900">${stats.avgRent.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Deposit</p>
                <p className="text-2xl font-bold text-gray-900">${stats.avgDeposit.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Property Types</p>
                <p className="text-2xl font-bold text-gray-900">{stats.propertyTypes}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Rent</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minRent}
                onChange={(e) => setFilters({...filters, minRent: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Rent</label>
              <input
                type="number"
                placeholder="10000"
                value={filters.maxRent}
                onChange={(e) => setFilters({...filters, maxRent: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
              <select
                value={filters.propertyType}
                onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="studio">Studio</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                placeholder="Enter city"
                value={filters.city}
                onChange={(e) => setFilters({...filters, city: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by building name, address, landlord, or management company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Map View */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Map className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Lease Locations Map</h3>
            <span className="text-sm text-gray-500">({filteredLeases.length} locations)</span>
          </div>
          <MapboxMap leases={filteredLeases} />
        </div>

        {/* Leases List */}
        <div className="space-y-6">
          {filteredLeases.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leases found</h3>
              <p className="text-gray-500">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            filteredLeases.map((lease) => (
              <div key={lease.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{lease.building_name}</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {lease.property_type}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600 mb-4">
                      <MapPin className="h-4 w-4" />
                      <span>{lease.property_address}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Monthly Rent</p>
                        <p className="text-lg font-semibold text-green-600">${lease.monthly_rent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Security Deposit</p>
                        <p className="text-lg font-semibold text-yellow-600">${lease.security_deposit.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Size</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {lease.square_footage ? `${lease.square_footage} sq ft` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Bedrooms</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {lease.bedrooms ? `${lease.bedrooms} bed` : 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    {lease.amenities.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-2">Amenities</p>
                        <div className="flex flex-wrap gap-2">
                          {lease.amenities.slice(0, 5).map((amenity, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                              {amenity}
                            </span>
                          ))}
                          {lease.amenities.length > 5 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                              +{lease.amenities.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {lease.landlord_name && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{lease.landlord_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Added {new Date(lease.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">Market Position</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {lease.market_analysis.rent_percentile}th percentile
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {lease.market_analysis.rent_analysis}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
