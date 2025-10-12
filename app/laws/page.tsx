'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, Home, Building2, Shield, Droplet, Zap, Flame, Book, ChevronRight, X, ChevronLeft, Menu } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface LawSource {
  source_type: string;
  source_text: string;
  source_url?: string;
  display_order: number;
}

interface Law {
  id: string;
  state: string;
  city: string;
  topic: string;
  info: string;
  law_sources?: LawSource[];
}

interface TopicCard {
  topic: string;
  count: number;
  cityCount: number;
  icon: typeof FileText;
  color: string;
  bgColor: string;
  description: string;
  laws: Law[];
}

// Topic icon, color, and tenant-friendly description mapping
const topicConfig: { [key: string]: { icon: typeof FileText; color: string; bgColor: string; description: string } } = {
  'Security Deposits': { 
    icon: Shield, 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-100',
    description: 'Getting your deposit back, limits on charges, and deductions'
  },
  'Lease Termination': { 
    icon: Home, 
    color: 'text-red-700', 
    bgColor: 'bg-red-100',
    description: 'Breaking your lease early, notice requirements, and moving out'
  },
  'Rent': { 
    icon: Building2, 
    color: 'text-green-700', 
    bgColor: 'bg-green-100',
    description: 'Rent increases, late fees, and payment requirements'
  },
  'Maintenance': { 
    icon: Droplet, 
    color: 'text-cyan-700', 
    bgColor: 'bg-cyan-100',
    description: 'Repairs, unsafe conditions, and landlord responsibilities'
  },
  'Utilities': { 
    icon: Zap, 
    color: 'text-yellow-700', 
    bgColor: 'bg-yellow-100',
    description: 'Heat, water, electricity, and utility shut-offs'
  },
  'Fire Safety': { 
    icon: Flame, 
    color: 'text-orange-700', 
    bgColor: 'bg-orange-100',
    description: 'Smoke detectors, fire escapes, and safety requirements'
  },
  'Default': { 
    icon: Book, 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-100',
    description: 'Tenant rights and landlord obligations'
  },
};

const getTopicConfig = (topic: string) => {
  return topicConfig[topic] || topicConfig['Default'];
};

export default function LawsPage() {
  const [laws, setLaws] = useState<Law[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<TopicCard | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchLaws();
  }, []);

  const fetchLaws = async () => {
    try {
      const response = await fetch('/api/laws');
      const data = await response.json();
      
      if (data.success) {
        setLaws(data.laws);
      } else {
        setError(data.error || 'Failed to fetch laws');
      }
    } catch (err) {
      setError('Failed to fetch laws');
      console.error('Error fetching laws:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLaws = laws.filter(law => {
    const matchesSearch = searchTerm === '' || 
      law.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      law.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      law.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      law.info.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesState = selectedState === null || law.state === selectedState;
    const matchesTopic = selectedTopic === null || law.topic === selectedTopic;
    
    return matchesSearch && matchesState && matchesTopic;
  });

  // Group laws by topic for card display
  const getTopicCards = (): TopicCard[] => {
    const topicMap = new Map<string, Law[]>();
    
    filteredLaws.forEach(law => {
      const existing = topicMap.get(law.topic) || [];
      topicMap.set(law.topic, [...existing, law]);
    });

    return Array.from(topicMap.entries()).map(([topic, laws]) => {
      const config = getTopicConfig(topic);
      const uniqueCities = new Set(laws.map(l => `${l.state}-${l.city}`)).size;
      return {
        topic,
        count: laws.length,
        cityCount: uniqueCities,
        icon: config.icon,
        color: config.color,
        bgColor: config.bgColor,
        description: config.description,
        laws,
      };
    }).sort((a, b) => b.count - a.count);
  };

  const topicCards = getTopicCards();
  const states = [...new Set(laws.map(law => law.state))].sort();
  const topics = [...new Set(laws.map(law => law.topic))].sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading laws...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Laws</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div 
          className={`
            border-r border-gray-200 bg-white flex flex-col transition-all duration-300
            ${sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-64'}
            fixed md:relative
            h-[calc(100vh-4rem)] top-16 left-0
            z-30
            ${sidebarCollapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
          `}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900">Jurisdictions</span>
                <span className="text-xs text-slate-600">{states.length} states</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            <div className="space-y-1">
              <div className="px-2 py-1.5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  United States
                </h3>
              </div>
              
              <button
                onClick={() => setSelectedState(null)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedState === null
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>All States</span>
                <span className={`text-xs ${selectedState === null ? 'text-slate-300' : 'text-slate-500'}`}>
                  {laws.length}
                </span>
              </button>
              
              {states.map(state => {
                const stateCount = laws.filter(l => l.state === state).length;
                return (
                  <button
                    key={state}
                    onClick={() => setSelectedState(state)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedState === state
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{state}</span>
                    <span className={`text-xs ${selectedState === state ? 'text-slate-300' : 'text-slate-500'}`}>
                      {stateCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Backdrop for Mobile Sidebar */}
        {!sidebarCollapsed && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-20 top-16"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 w-full">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
                  aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  <Menu className="h-4 w-4 text-gray-600" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:inline">Jurisdictions</span>
                </button>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                    Know Your Rights in {selectedState || 'Your State'}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Find answers about your rights as a tenant • {filteredLaws.length} laws available
                  </p>
                </div>
              </div>
            </div>

            {/* Helper Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg">💡</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">
                    How to use this page
                  </h3>
                  <p className="text-sm text-blue-800">
                    {selectedState 
                      ? `Browse topics below or search for a specific issue. Each topic shows your rights and what landlords must do in ${selectedState}.`
                      : 'Select your state from the sidebar, then browse topics or search for your specific situation.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white border border-gray-200 rounded-lg p-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for your situation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Topic Filter */}
              <select
                value={selectedTopic || ''}
                onChange={(e) => setSelectedTopic(e.target.value || null)}
                className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">All Topics</option>
                {topics.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between bg-gray-100 border border-gray-200 rounded-lg px-4 py-2.5">
              <p className="text-sm text-gray-700">
                Showing <span className="font-semibold">{topicCards.length}</span> of {filteredLaws.length}
              </p>
              {(searchTerm || selectedTopic) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedTopic(null);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Topic Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {topicCards.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.topic}
                    onClick={() => setSelectedCard(card)}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all duration-200 text-left group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 ${card.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className={`h-5 w-5 ${card.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {card.topic}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {card.description}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap text-xs text-gray-500">
                          <span className="font-medium">{card.count} {card.count === 1 ? 'law' : 'laws'}</span>
                          <span className="text-gray-400">•</span>
                          <span>{card.cityCount} {card.cityCount === 1 ? 'location' : 'locations'}</span>
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* No Results */}
            {topicCards.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No laws found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Detail Modal */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${selectedCard.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <selectedCard.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${selectedCard.color}`} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate">{selectedCard.topic}</h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {selectedCard.count} {selectedCard.count === 1 ? 'law' : 'laws'} • {selectedCard.cityCount} {selectedCard.cityCount === 1 ? 'city' : 'cities'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                {/* Group by state and city */}
                {Object.entries(
                  selectedCard.laws.reduce((acc, law) => {
                    const key = `${law.state} - ${law.city}`;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(law);
                    return acc;
                  }, {} as Record<string, Law[]>)
                ).map(([location, laws]) => (
                  <div key={location} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                      <h3 className="font-semibold text-base sm:text-lg text-gray-900">{location}</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {laws.map((law) => (
                        <div key={law.id} className="p-4 sm:p-6">
                          <p className="text-gray-800 leading-relaxed mb-4">{law.info}</p>
                          
                          {/* Sources */}
                          {law.law_sources && law.law_sources.length > 0 && (
                            <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
                              <span className="text-xs font-semibold text-gray-500 uppercase">Sources:</span>
                              <div className="flex flex-wrap gap-2">
                                {law.law_sources.map((source, idx) => (
                                  <div key={idx}>
                                    {source.source_url ? (
                                      <a
                                        href={source.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                      >
                                        {source.source_type || source.source_text}
                                      </a>
                                    ) : (
                                      <span className="text-sm text-gray-600">
                                        {source.source_text}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <button
                onClick={() => setSelectedCard(null)}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
}
