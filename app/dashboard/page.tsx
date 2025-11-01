'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapPin, DollarSign, Home, Filter, Search, TrendingUp, TrendingDown, BarChart3, Table, Map as MapIcon, Eye, Download, Plus, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';

// Dynamically import the map component to avoid SSR issues
const DashboardMapboxMap = dynamic(() => import('@/components/DashboardMapboxMap'), { 
  ssr: false,
  loading: () => <div className="h-96 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p className="text-gray-600">Loading map...</p>
    </div>
  </div>
});

interface LeaseData {
  id: string;
  created_at: string;
  user_address: string;
  building_name: string;
  property_address: string;
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
  // These may be NULL if not analyzed yet (on-demand loading)
  red_flags?: any[] | null;
  tenant_rights?: any[] | null;
}

type TabType = 'overview' | 'market' | 'list' | 'map';

interface SavedView {
  id: string;
  name: string;
  filters: FilterState;
}

interface FilterState {
  minRent: string;
  maxRent: string;
  propertyType: string;
  city: string;
  bedrooms: string;
}

export default function Dashboard() {
  const [leases, setLeases] = useState<LeaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    minRent: '',
    maxRent: '',
    propertyType: '',
    city: '',
    bedrooms: ''
  });
  const [sortBy, setSortBy] = useState<'rent' | 'name' | 'date' | 'percentile'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Predefined saved views
  const [savedViews] = useState<SavedView[]>([
    { id: 'all', name: 'All Properties', filters: { minRent: '', maxRent: '', propertyType: '', city: '', bedrooms: '' } },
    { id: 'high-end', name: 'High-End (>$3k)', filters: { minRent: '3000', maxRent: '', propertyType: '', city: '', bedrooms: '' } },
    { id: 'studios', name: 'Studios & 1BR', filters: { minRent: '', maxRent: '', propertyType: '', city: '', bedrooms: '0,1' } },
  ]);

  useEffect(() => {
    fetchLeases();
  }, []);

  const fetchLeases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leases');
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

  // Filter and search logic
  const filteredLeases = useMemo(() => {
    return leases.filter(lease => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          lease.building_name?.toLowerCase().includes(searchLower) ||
          lease.property_address?.toLowerCase().includes(searchLower) ||
          lease.landlord_name?.toLowerCase().includes(searchLower) ||
          lease.management_company?.toLowerCase().includes(searchLower) ||
          lease.user_address?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Rent filters
      if (filters.minRent && lease.monthly_rent < parseInt(filters.minRent)) return false;
      if (filters.maxRent && lease.monthly_rent > parseInt(filters.maxRent)) return false;

      // Property type filter
      if (filters.propertyType && lease.property_type.toLowerCase() !== filters.propertyType.toLowerCase()) return false;

      // City filter
      if (filters.city) {
        const cityMatch = lease.user_address?.toLowerCase().includes(filters.city.toLowerCase()) ||
                         lease.property_address?.toLowerCase().includes(filters.city.toLowerCase());
        if (!cityMatch) return false;
      }

      // Bedrooms filter
      if (filters.bedrooms) {
        const bedroomOptions = filters.bedrooms.split(',').map(b => parseInt(b));
        if (lease.bedrooms !== undefined && !bedroomOptions.includes(lease.bedrooms)) return false;
      }

      return true;
    });
  }, [leases, searchTerm, filters]);

  // Sort logic
  const sortedLeases = useMemo(() => {
    const sorted = [...filteredLeases];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'rent':
          comparison = a.monthly_rent - b.monthly_rent;
          break;
        case 'name':
          comparison = (a.building_name || '').localeCompare(b.building_name || '');
          break;
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'percentile':
          comparison = a.market_analysis.rent_percentile - b.market_analysis.rent_percentile;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [filteredLeases, sortBy, sortOrder]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = leases.length;
    const avgRent = total > 0 ? Math.round(leases.reduce((sum, l) => sum + l.monthly_rent, 0) / total) : 0;
    const avgDeposit = total > 0 ? Math.round(leases.reduce((sum, l) => sum + l.security_deposit, 0) / total) : 0;
    const avgPercentile = total > 0 ? Math.round(leases.reduce((sum, l) => sum + l.market_analysis.rent_percentile, 0) / total) : 0;
    
    // Get unique cities
    const cities = new Set<string>();
    leases.forEach(l => {
      const match = l.user_address?.match(/,\s*([^,]+),\s*[A-Z]{2}/);
      if (match) cities.add(match[1]);
    });

    return {
      total,
      avgRent,
      avgDeposit,
      avgPercentile,
      depositRatio: avgRent > 0 ? (avgDeposit / avgRent).toFixed(1) : '0',
      cities: cities.size,
      filtered: filteredLeases.length
    };
  }, [leases, filteredLeases]);

  const applyView = (view: SavedView) => {
    setFilters(view.filters);
  };

  const clearFilters = () => {
    setFilters({ minRent: '', maxRent: '', propertyType: '', city: '', bedrooms: '' });
    setSearchTerm('');
  };

  const exportToCSV = () => {
    const headers = ['Building Name', 'Address', 'Type', 'Rent', 'Bedrooms', 'Bathrooms', 'Sq Ft', 'Deposit', 'Percentile'];
    const rows = sortedLeases.map(l => [
      l.building_name,
      l.user_address,
      l.property_type,
      l.monthly_rent,
      l.bedrooms || 'N/A',
      l.bathrooms || 'N/A',
      l.square_footage || 'N/A',
      l.security_deposit,
      l.market_analysis.rent_percentile
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lease-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
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
      <Header />
      
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Market Dashboard</h1>
              <p className="text-gray-600 mt-1">Portfolio insights and market intelligence</p>
            </div>
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Hero Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Home className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</p>
            <p className="text-sm text-gray-500">
              {stats.filtered !== stats.total && `${stats.filtered} filtered`}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Avg Monthly Rent</p>
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">${stats.avgRent.toLocaleString()}</p>
            <p className="text-sm text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Market competitive
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Avg Deposit</p>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">${stats.avgDeposit.toLocaleString()}</p>
            <p className="text-sm text-gray-500">{stats.depositRatio}x monthly rent</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Market Position</p>
              <div className="p-2 bg-purple-50 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.avgPercentile}th</p>
            <p className="text-sm text-gray-500">Avg percentile • {stats.cities} cities</p>
          </div>
        </div>

        {/* Mobile Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-800 transition-all"
        >
          <Filter className="h-5 w-5" />
          <span className="text-sm font-medium">Filters</span>
        </button>

        {/* Backdrop Overlay for Mobile */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex gap-6">
          {/* Sidebar */}
          <div 
            className={`
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
              lg:translate-x-0
              fixed lg:relative
              top-0 left-0
              h-screen lg:h-auto
              w-64 flex-shrink-0
              bg-gray-50 lg:bg-transparent
              z-40
              transition-transform duration-300
              overflow-y-auto
              pt-20 lg:pt-0
              px-4 lg:px-0
              space-y-6
            `}
          >
            {/* Close button for mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-200 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
            {/* Quick Search */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Search className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-900">Quick Search</h3>
              </div>
              <input
                type="text"
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Saved Views */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-900">Saved Views</h3>
              </div>
              <div className="space-y-1">
                {savedViews.map(view => (
                  <button
                    key={view.id}
                    onClick={() => applyView(view)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {view.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
                </div>
                {(filters.minRent || filters.maxRent || filters.propertyType || filters.city || filters.bedrooms) && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Min Rent</label>
                  <input
                    type="number"
                    placeholder="$0"
                    value={filters.minRent}
                    onChange={(e) => setFilters({...filters, minRent: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Rent</label>
                  <input
                    type="number"
                    placeholder="$10,000"
                    value={filters.maxRent}
                    onChange={(e) => setFilters({...filters, maxRent: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Property Type</label>
                  <select
                    value={filters.propertyType}
                    onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="apartment">Apartment</option>
                    <option value="studio">Studio</option>
                    <option value="loft">Loft</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g., New York"
                    value={filters.city}
                    onChange={(e) => setFilters({...filters, city: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bedrooms</label>
                  <select
                    value={filters.bedrooms}
                    onChange={(e) => setFilters({...filters, bedrooms: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All</option>
                    <option value="0">Studio</option>
                    <option value="1">1 Bedroom</option>
                    <option value="2">2 Bedrooms</option>
                    <option value="3">3+ Bedrooms</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
              <div className="border-b border-gray-200">
                <div className="flex gap-1 p-2 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === 'overview'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Overview</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('list')}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === 'list'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Table className="h-4 w-4" />
                    <span className="hidden sm:inline">Property List</span>
                    <span className="sm:hidden">List</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('map')}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === 'map'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <MapIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Map View</span>
                    <span className="sm:hidden">Map</span>
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <OverviewTab leases={sortedLeases} stats={stats} />
                )}
                
                {activeTab === 'list' && (
                  <PropertyListTab 
                    leases={sortedLeases} 
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    setSortBy={setSortBy}
                    setSortOrder={setSortOrder}
                  />
                )}
                
                {activeTab === 'map' && (
                  <MapViewTab leases={sortedLeases} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ leases, stats }: { leases: LeaseData[], stats: any }) {
  // Calculate insights
  const insights = useMemo(() => {
    const highEnd = leases.filter(l => l.market_analysis.rent_percentile >= 80).length;
    const cities = new Set(leases.map(l => {
      const match = l.user_address?.match(/,\s*([^,]+),\s*[A-Z]{2}/);
      return match ? match[1] : null;
    }).filter(Boolean));

    const cityRents = Array.from(cities).map(city => {
      const cityLeases = leases.filter(l => l.user_address?.includes(city as string));
      const avgRent = cityLeases.reduce((sum, l) => sum + l.monthly_rent, 0) / cityLeases.length;
      return { city, avgRent, count: cityLeases.length };
    }).sort((a, b) => b.avgRent - a.avgRent);

    return { highEnd, cityRents };
  }, [leases]);

  // Group by property type
  const byType = useMemo(() => {
    const types = new Map<string, { count: number, avgRent: number, totalRent: number }>();
    leases.forEach(l => {
      const type = l.property_type;
      if (!types.has(type)) {
        types.set(type, { count: 0, avgRent: 0, totalRent: 0 });
      }
      const data = types.get(type)!;
      data.count++;
      data.totalRent += l.monthly_rent;
    });
    
    types.forEach((data, type) => {
      data.avgRent = Math.round(data.totalRent / data.count);
    });

    return Array.from(types.entries())
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [leases]);

  return (
    <div className="space-y-6">
      {/* Auto Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Market Insights</h3>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-700">
            • <strong>{insights.highEnd}</strong> properties priced above 80th percentile
          </p>
          {insights.cityRents.length >= 2 && (
            <p className="text-sm text-gray-700">
              • <strong>{insights.cityRents[0].city}</strong> properties averaging ${Math.round(insights.cityRents[0].avgRent - insights.cityRents[1].avgRent).toLocaleString()} more than <strong>{insights.cityRents[1].city}</strong>
            </p>
          )}
          <p className="text-sm text-gray-700">
            • Portfolio spans <strong>{insights.cityRents.length}</strong> cities with <strong>{leases.length}</strong> total properties
          </p>
        </div>
      </div>

      {/* Rent Distribution by City */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rent Distribution by City</h3>
        <div className="space-y-3">
          {insights.cityRents.slice(0, 5).map(({ city, avgRent, count }) => (
            <div key={city} className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium text-gray-700">{city}</div>
              <div className="flex-1">
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center px-3"
                    style={{ width: `${(avgRent / insights.cityRents[0].avgRent) * 100}%` }}
                  >
                    <span className="text-sm font-semibold text-white">${avgRent.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="w-20 text-sm text-gray-500 text-right">{count} props</div>
            </div>
          ))}
        </div>
      </div>

      {/* Property Type Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Composition</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {byType.map(({ type, count, avgRent }) => (
            <div key={type} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 capitalize">{type}</span>
                <Badge className="bg-blue-100 text-blue-700">{count}</Badge>
              </div>
              <p className="text-2xl font-bold text-gray-900">${avgRent.toLocaleString()}</p>
              <p className="text-xs text-gray-500">avg monthly rent</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Property List Tab Component
function PropertyListTab({ 
  leases, 
  sortBy, 
  sortOrder, 
  setSortBy, 
  setSortOrder 
}: { 
  leases: LeaseData[], 
  sortBy: string, 
  sortOrder: string,
  setSortBy: (sort: any) => void,
  setSortOrder: (order: any) => void
}) {
  const toggleSort = (field: any) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <p className="text-sm text-gray-600">Showing {leases.length} properties</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 hidden sm:inline">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-auto px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">Date Added</option>
            <option value="rent">Monthly Rent</option>
            <option value="name">Building Name</option>
            <option value="percentile">Market Percentile</option>
          </select>
        </div>
      </div>

      {leases.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-500">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leases.map((lease) => (
            <div key={lease.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900">{lease.building_name}</h3>
                    <Badge className="bg-blue-50 text-blue-700 flex-shrink-0 text-xs">{lease.property_type}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 mb-3">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{lease.user_address}</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm">
                    <div>
                      <span className="text-gray-500">Rent:</span>
                      <span className="ml-2 font-semibold text-green-600">${lease.monthly_rent.toLocaleString()}</span>
                    </div>
                    {lease.bedrooms !== undefined && (
                      <div>
                        <span className="text-gray-500">{lease.bedrooms === 0 ? 'Studio' : `${lease.bedrooms} bed`}</span>
                      </div>
                    )}
                    {lease.square_footage && (
                      <div>
                        <span className="text-gray-500">{lease.square_footage.toLocaleString()} sq ft</span>
                      </div>
                    )}
                    {/* Show analysis status badge */}
                    {(lease.red_flags === null || lease.tenant_rights === null) && (
                      <Badge className="bg-amber-100 text-amber-700 text-xs">
                        Partial Analysis
                      </Badge>
                    )}
                    {lease.red_flags && Array.isArray(lease.red_flags) && lease.red_flags.length > 0 && (
                      <Badge className="bg-red-100 text-red-700 text-xs">
                        {lease.red_flags.length} Red Flag{lease.red_flags.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="text-left sm:text-right flex-shrink-0">
                  <div className="text-xs text-gray-500 mb-1">Market Position</div>
                  <div className="text-xl font-bold text-blue-600">
                    {lease.market_analysis.rent_percentile}th
                  </div>
                  <div className="text-xs text-gray-500">percentile</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Map View Tab Component
function MapViewTab({ leases }: { leases: LeaseData[] }) {
  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing <strong>{leases.length}</strong> properties on map
        </p>
      </div>
      <DashboardMapboxMap leases={leases} />
    </div>
  );
}
