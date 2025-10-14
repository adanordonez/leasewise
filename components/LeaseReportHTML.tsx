'use client';

import React from 'react';
import { Building, User, Mail, MapPin, Calendar, DollarSign, Shield, AlertTriangle, Clock, FileText, Camera } from 'lucide-react';

interface AnalysisData {
  summary: {
    monthlyRent: string;
    securityDeposit: string;
    leaseStart: string;
    leaseEnd: string;
    noticePeriod: string;
  };
  redFlags: Array<{ issue: string; severity: string; explanation: string }>;
  rights: Array<{ right: string; law: string }>;
  keyDates: Array<{ event: string; date: string; description: string }>;
  address: string;
  userName: string;
  userEmail: string;
  comprehensiveLegalInfo?: Array<{
    lawType: string;
    explanation: string;
    example: string;
    sourceUrl?: string;
    sourceTitle?: string;
  }>;
}

interface LeaseReportHTMLProps {
  data: AnalysisData;
  className?: string;
  isPDF?: boolean; // Flag to determine if this is for PDF export
}

export default function LeaseReportHTML({ data, className = '', isPDF = false }: LeaseReportHTMLProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStreetViewUrl = (address: string) => {
    if (!address) return null;
    
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;
    
    const encodedAddress = encodeURIComponent(address);
    return `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&key=${apiKey}&fov=90&pitch=0`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className={`bg-white min-h-screen ${className}`} id="lease-report">
      {/* Header */}
      <div className={`${isPDF ? 'bg-gradient-to-r from-purple-600 to-purple-700' : 'bg-gradient-to-r from-slate-700 to-slate-800'} px-8 py-10 text-white`}>
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <Building className={`${isPDF ? 'w-8 h-8' : 'w-10 h-10'} mr-3`} />
            <h1 className={`${isPDF ? 'text-3xl' : 'text-4xl'} font-bold font-comfortaa`}>LeaseWise</h1>
          </div>
          <h2 className={`${isPDF ? 'text-xl' : 'text-2xl'} font-semibold mb-2`}>Lease Analysis Report</h2>
          <p className={`${isPDF ? 'text-sm' : 'text-base'} text-slate-300`}>
            Generated on {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      <div className={isPDF ? 'w-full px-4 py-6' : 'max-w-4xl mx-auto px-8 py-8'}>
        {/* Tenant Information */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <User className={`${isPDF ? 'w-5 h-5' : 'w-6 h-6'} text-slate-600 mr-3`} />
            <h3 className={`${isPDF ? 'text-xl' : 'text-2xl'} font-bold text-slate-900`}>Tenant Information</h3>
          </div>
          
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
            <div className={`${isPDF ? 'flex flex-wrap gap-6' : 'grid md:grid-cols-2 gap-6'}`}>
              <div className="flex items-start">
                <User className="w-5 h-5 text-slate-400 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Name</p>
                  <p className="text-slate-900">{data.userName || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Mail className="w-5 h-5 text-slate-400 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Email</p>
                  <p className="text-slate-900">{data.userEmail || 'Not provided'}</p>
                </div>
              </div>
              
              <div className={`flex items-start ${isPDF ? 'w-full' : 'md:col-span-2'}`}>
                <MapPin className="w-5 h-5 text-slate-400 mr-3 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-500 mb-1">Property Address</p>
                  <p className="text-slate-900">{data.address || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Property Street View */}
        {data.address && getStreetViewUrl(data.address) && (
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <Camera className={`${isPDF ? 'w-5 h-5' : 'w-6 h-6'} text-slate-600 mr-3`} />
              <h3 className={`${isPDF ? 'text-xl' : 'text-2xl'} font-bold text-slate-900`}>Property Street View</h3>
            </div>
            
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              <div className="relative">
                <img
                  src={getStreetViewUrl(data.address)!}
                  alt={`Street view of ${data.address}`}
                  className="w-full h-auto"
                  style={{ maxHeight: isPDF ? '250px' : '400px', objectFit: 'cover' }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-sm text-white font-medium">{data.address}</p>
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-2 text-xs text-slate-500 text-center border-t border-slate-200">
                Powered by Google Street View
              </div>
            </div>
          </div>
        )}

        {/* Lease Summary */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <FileText className={`${isPDF ? 'w-5 h-5' : 'w-6 h-6'} text-slate-600 mr-3`} />
            <h3 className={`${isPDF ? 'text-xl' : 'text-2xl'} font-bold text-slate-900`}>Lease Summary</h3>
          </div>
          
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div className={isPDF ? '' : 'overflow-x-auto'}>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-700 text-white">
                    <th className={`${isPDF ? 'px-4 py-3' : 'px-6 py-4'} text-left font-semibold text-sm`}>Item</th>
                    <th className={`${isPDF ? 'px-4 py-3' : 'px-6 py-4'} text-left font-semibold text-sm`}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 hover:bg-slate-50">
                    <td className={`${isPDF ? 'px-4 py-3' : 'px-6 py-4'} font-medium text-slate-700 text-sm`}>Monthly Rent</td>
                    <td className={`${isPDF ? 'px-4 py-3' : 'px-6 py-4'} text-slate-900 text-sm`}>{data.summary.monthlyRent || 'Not specified'}</td>
                  </tr>
                  <tr className="border-b border-slate-100 hover:bg-slate-50 bg-slate-50">
                    <td className={`${isPDF ? 'px-4 py-3' : 'px-6 py-4'} font-medium text-slate-700 text-sm`}>Security Deposit</td>
                    <td className={`${isPDF ? 'px-4 py-3' : 'px-6 py-4'} text-slate-900 text-sm`}>{data.summary.securityDeposit || 'Not specified'}</td>
                  </tr>
                  <tr className="border-b border-slate-100 hover:bg-slate-50">
                    <td className={`${isPDF ? 'px-4 py-3' : 'px-6 py-4'} font-medium text-slate-700 text-sm`}>Lease Start</td>
                    <td className={`${isPDF ? 'px-4 py-3' : 'px-6 py-4'} text-slate-900 text-sm`}>{formatDate(data.summary.leaseStart)}</td>
                  </tr>
                  <tr className="border-b border-slate-100 hover:bg-slate-50 bg-slate-50">
                    <td className={`${isPDF ? 'px-4 py-3' : 'px-6 py-4'} font-medium text-slate-700 text-sm`}>Lease End</td>
                    <td className={`${isPDF ? 'px-4 py-3' : 'px-6 py-4'} text-slate-900 text-sm`}>{formatDate(data.summary.leaseEnd)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className={`${isPDF ? 'px-4 py-3' : 'px-6 py-4'} font-medium text-slate-700 text-sm`}>Notice Period</td>
                    <td className={`${isPDF ? 'px-4 py-3' : 'px-6 py-4'} text-slate-900 text-sm`}>{data.summary.noticePeriod || 'Not specified'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Red Flags */}
        {data.redFlags && data.redFlags.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <AlertTriangle className={`${isPDF ? 'w-5 h-5' : 'w-6 h-6'} text-red-600 mr-3`} />
              <h3 className={`${isPDF ? 'text-xl' : 'text-2xl'} font-bold text-slate-900`}>
                Red Flags ({data.redFlags.length})
              </h3>
            </div>
            
            <div className="space-y-4">
              {data.redFlags.map((flag, index) => (
                <div key={index} className="bg-white border border-red-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-lg font-semibold text-slate-900">{flag.issue}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(flag.severity)}`}>
                      {flag.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{flag.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Know Your Renter Rights - Only show in PDF for now */}
        {isPDF && (
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <Shield className="w-5 h-5 text-slate-600 mr-3" />
              <h3 className="text-xl font-bold text-slate-900">Know Your Renter Rights</h3>
            </div>
            
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              <div className="">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-700 text-white">
                      <th className="px-3 py-2 text-left font-semibold text-sm">Law Type</th>
                      <th className="px-3 py-2 text-left font-semibold text-sm">Explanation</th>
                      <th className="px-3 py-2 text-left font-semibold text-sm">How It Applies to You</th>
                      <th className="px-3 py-2 text-left font-semibold text-sm">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.comprehensiveLegalInfo && data.comprehensiveLegalInfo.length > 0 ? (
                      data.comprehensiveLegalInfo.map((item, index) => (
                        <tr key={index} className={`border-b border-slate-100 hover:bg-slate-50 ${index % 2 === 1 ? 'bg-slate-50' : ''}`}>
                          <td className="px-3 py-2 font-medium text-slate-700 text-sm">{item.lawType}</td>
                          <td className="px-3 py-2 text-slate-900 text-sm">{item.explanation}</td>
                          <td className="px-3 py-2 text-slate-700 italic text-sm">{item.example}</td>
                          <td className="px-3 py-2 text-slate-600 text-xs">
                            {item.sourceTitle || 'Legal Reference'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      // Fallback content if no data available
                      <>
                        <tr className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-3 py-2 font-medium text-slate-700 text-sm">Security Deposit Terms</td>
                          <td className="px-3 py-2 text-slate-900 text-sm">State laws regulate how landlords handle security deposits, including return timelines and interest requirements.</td>
                          <td className="px-3 py-2 text-slate-700 italic text-sm">Your security deposit must be returned within the state-mandated timeframe, typically 30-45 days after lease end.</td>
                          <td className="px-3 py-2 text-slate-600 text-xs">State Landlord-Tenant Law</td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50 bg-slate-50">
                          <td className="px-3 py-2 font-medium text-slate-700 text-sm">Rent Amount and Increases</td>
                          <td className="px-3 py-2 text-slate-900 text-sm">Laws govern when and how landlords can increase rent, including notice requirements.</td>
                          <td className="px-3 py-2 text-slate-700 italic text-sm">Your landlord must provide proper notice before any rent increase, typically 30-60 days depending on state law.</td>
                          <td className="px-3 py-2 text-slate-600 text-xs">State Landlord-Tenant Law</td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-3 py-2 font-medium text-slate-700 text-sm">Maintenance and Repairs</td>
                          <td className="px-3 py-2 text-slate-900 text-sm">Landlords have legal obligations to maintain habitable living conditions and make necessary repairs.</td>
                          <td className="px-3 py-2 text-slate-700 italic text-sm">Your landlord must maintain essential services like heat, plumbing, and structural integrity. Document all repair requests.</td>
                          <td className="px-3 py-2 text-slate-600 text-xs">State Landlord-Tenant Law</td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50 bg-slate-50">
                          <td className="px-3 py-2 font-medium text-slate-700 text-sm">Entry and Privacy Rights</td>
                          <td className="px-3 py-2 text-slate-900 text-sm">Tenants have privacy rights that limit when and how landlords can enter rental units.</td>
                          <td className="px-3 py-2 text-slate-700 italic text-sm">Your landlord must provide reasonable notice (usually 24-48 hours) before entering, except in emergencies.</td>
                          <td className="px-3 py-2 text-slate-600 text-xs">State Landlord-Tenant Law</td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-3 py-2 font-medium text-slate-700 text-sm">Eviction Procedures</td>
                          <td className="px-3 py-2 text-slate-900 text-sm">Strict legal procedures govern how landlords can terminate tenancies and evict tenants.</td>
                          <td className="px-3 py-2 text-slate-700 italic text-sm">Your landlord must follow proper legal procedures and cannot lock you out or remove belongings without court order.</td>
                          <td className="px-3 py-2 text-slate-600 text-xs">State Landlord-Tenant Law</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {/* Key Dates */}
        {data.keyDates && data.keyDates.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <Calendar className={`${isPDF ? 'w-5 h-5' : 'w-6 h-6'} text-slate-600 mr-3`} />
              <h3 className={`${isPDF ? 'text-xl' : 'text-2xl'} font-bold text-slate-900`}>
                Important Dates ({data.keyDates.length})
              </h3>
            </div>
            
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              <div className="">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-700 text-white">
                      <th className={`${isPDF ? 'px-3 py-2' : 'px-6 py-4'} text-left font-semibold text-sm`}>Event</th>
                      <th className={`${isPDF ? 'px-3 py-2' : 'px-6 py-4'} text-left font-semibold text-sm`}>Date</th>
                      <th className={`${isPDF ? 'px-3 py-2' : 'px-6 py-4'} text-left font-semibold text-sm`}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.keyDates.map((date, index) => (
                      <tr key={index} className={`border-b border-slate-100 hover:bg-slate-50 ${index % 2 === 1 ? 'bg-slate-50' : ''}`}>
                        <td className={`${isPDF ? 'px-3 py-2' : 'px-6 py-4'} font-medium text-slate-700 text-sm`}>{date.event}</td>
                        <td className={`${isPDF ? 'px-3 py-2' : 'px-6 py-4'} text-slate-900 text-sm`}>{formatDate(date.date)}</td>
                        <td className={`${isPDF ? 'px-3 py-2' : 'px-6 py-4'} text-slate-700 text-sm`}>{date.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-200 pt-8 mt-12">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
            <div className="flex items-center mb-4 md:mb-0">
              <Building className="w-4 h-4 mr-2" />
              <span>
                Generated by LeaseWise | 
                <span className="text-[#800000] font-semibold"> University of Chicago</span>
                <span className="text-[#737373]"> Law School AI Lab</span>
              </span>
            </div>
            <div className="text-slate-400">
              This report is for informational purposes only and does not constitute legal advice.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
