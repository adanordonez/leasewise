'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Search, FileText, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import LawSources from '@/components/LawSources';
import SourcesPopup from '@/components/SourcesPopup';

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

interface GroupedLaws {
  [state: string]: {
    [city: string]: {
      [topic: string]: Law[];
    };
  };
}

export default function LawsPage() {
  const [laws, setLaws] = useState<Law[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [sourcesPopup, setSourcesPopup] = useState<{
    isOpen: boolean;
    sources: LawSource[];
    state: string;
    city: string;
  }>({
    isOpen: false,
    sources: [],
    state: '',
    city: ''
  });

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

  const groupLaws = (laws: Law[]): GroupedLaws => {
    const grouped: GroupedLaws = {};
    
    laws.forEach(law => {
      if (!grouped[law.state]) {
        grouped[law.state] = {};
      }
      if (!grouped[law.state][law.city]) {
        grouped[law.state][law.city] = {};
      }
      if (!grouped[law.state][law.city][law.topic]) {
        grouped[law.state][law.city][law.topic] = [];
      }
      grouped[law.state][law.city][law.topic].push(law);
    });
    
    return grouped;
  };

  const filteredLaws = laws.filter(law => {
    const matchesSearch = searchTerm === '' || 
      law.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      law.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      law.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      law.info.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesState = selectedState === null || law.state === selectedState;
    const matchesCity = selectedCity === null || law.city === selectedCity;
    const matchesTopic = selectedTopic === null || law.topic === selectedTopic;
    
    return matchesSearch && matchesState && matchesCity && matchesTopic;
  });

  const groupedLaws = groupLaws(filteredLaws);
  const states = Object.keys(groupedLaws).sort();
  const topics = [...new Set(laws.map(law => law.topic))].sort();

  const toggleState = (state: string) => {
    const newExpanded = new Set(expandedStates);
    if (newExpanded.has(state)) {
      newExpanded.delete(state);
    } else {
      newExpanded.add(state);
    }
    setExpandedStates(newExpanded);
  };

  const toggleCity = (cityKey: string) => {
    const newExpanded = new Set(expandedCities);
    if (newExpanded.has(cityKey)) {
      newExpanded.delete(cityKey);
    } else {
      newExpanded.add(cityKey);
    }
    setExpandedCities(newExpanded);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedState(null);
    setSelectedCity(null);
    setSelectedTopic(null);
  };

  const openSourcesPopup = (state: string, city: string) => {
    // Find sources for this state/city combination
    const stateLaws = groupedLaws[state]?.[city];
    if (!stateLaws) return;

    // Get sources from any law in this city (they should all have the same sources)
    const firstLaw = Object.values(stateLaws)[0]?.[0];
    const sources = firstLaw?.law_sources || [];

    setSourcesPopup({
      isOpen: true,
      sources,
      state,
      city
    });
  };

  const closeSourcesPopup = () => {
    setSourcesPopup({
      isOpen: false,
      sources: [],
      state: '',
      city: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading laws...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Laws</h2>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Landlord-Tenant Laws</h1>
              <p className="text-gray-600">Find laws by state, city, and topic</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* State Filter */}
            <select
              value={selectedState || ''}
              onChange={(e) => setSelectedState(e.target.value || null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All States</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>

            {/* City Filter */}
            <select
              value={selectedCity || ''}
              onChange={(e) => setSelectedCity(e.target.value || null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Cities</option>
              {selectedState && groupedLaws[selectedState] && Object.keys(groupedLaws[selectedState]).sort().map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            {/* Topic Filter */}
            <select
              value={selectedTopic || ''}
              onChange={(e) => setSelectedTopic(e.target.value || null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Topics</option>
              {topics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search laws..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Clear Filters */}
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        </div>

        {/* States Tabs */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a State</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.keys(groupedLaws).sort().map(state => {
                const cityCount = Object.keys(groupedLaws[state]).length;
                const totalTopics = Object.values(groupedLaws[state]).reduce((acc, city) => acc + Object.keys(city).length, 0);
                return (
                  <button
                    key={state}
                    onClick={() => toggleState(state)}
                    className={`p-4 rounded-xl text-center transition-all duration-200 transform hover:scale-105 ${
                      expandedStates.has(state)
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg ring-2 ring-blue-200'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md border border-gray-200'
                    }`}
                  >
                    <div className="font-bold text-lg mb-1">{state}</div>
                    <div className={`text-sm ${
                      expandedStates.has(state) ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {cityCount} {cityCount === 1 ? 'city' : 'cities'}
                    </div>
                    <div className={`text-xs mt-1 ${
                      expandedStates.has(state) ? 'text-blue-200' : 'text-gray-400'
                    }`}>
                      {totalTopics} topics
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Laws List */}
        <div className="space-y-8">
          {Object.keys(groupedLaws).sort().map(state => (
            expandedStates.has(state) && (
              <div key={state} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">{state.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{state}</h3>
                        <p className="text-gray-600">
                          {Object.keys(groupedLaws[state]).length} cities • {Object.values(groupedLaws[state]).reduce((acc, city) => acc + Object.keys(city).length, 0)} topics
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleState(state)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                    >
                      <ChevronDown className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="p-8">
                  <div className="grid gap-6">
                    {Object.keys(groupedLaws[state]).sort().map(city => {
                      const cityKey = `${state}-${city}`;
                      const topicCount = Object.keys(groupedLaws[state][city]).length;
                      return (
                        <div key={city} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-4">
                            <button
                              onClick={() => toggleCity(cityKey)}
                              className="flex items-center gap-4 text-left hover:text-blue-600 transition-colors group"
                            >
                              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                <span className="text-lg font-semibold text-blue-600">{city.charAt(0)}</span>
                              </div>
                              <div>
                                <h4 className="text-xl font-bold text-gray-800">{city}</h4>
                                <p className="text-gray-500">
                                  {topicCount} {topicCount === 1 ? 'topic' : 'topics'}
                                </p>
                              </div>
                              {expandedCities.has(cityKey) ? (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                            
                            {/* Sources Button */}
                            <button
                              onClick={() => openSourcesPopup(state, city)}
                              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Sources
                            </button>
                          </div>

                          {expandedCities.has(cityKey) && (
                            <div className="ml-14 space-y-6">
                              {Object.keys(groupedLaws[state][city]).sort().map(topic => (
                                <div key={topic} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                      <span className="text-sm font-bold text-white">{topic.charAt(0)}</span>
                                    </div>
                                    <h5 className="text-lg font-bold text-gray-900">{topic}</h5>
                                  </div>
                                  <div className="space-y-4">
                                    {groupedLaws[state][city][topic].map(law => (
                                      <div key={law.id} className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                                        <p className="text-gray-700 leading-relaxed mb-4">{law.info}</p>
                                        {law.law_sources && law.law_sources.length > 0 && (
                                          <LawSources sources={law.law_sources} />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Sources Popup */}
      <SourcesPopup
        isOpen={sourcesPopup.isOpen}
        onClose={closeSourcesPopup}
        sources={sourcesPopup.sources}
        state={sourcesPopup.state}
        city={sourcesPopup.city}
      />
    </div>
  );
}