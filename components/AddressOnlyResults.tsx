'use client';

import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  CourtLawIcon,
  CloudUploadIcon,
  Location03Icon,
  UserListIcon,
  ArrowLeft02Icon
} from '@hugeicons-pro/core-stroke-rounded';
import { useTranslations } from 'next-intl';
import ComprehensiveLegalTable from '@/components/ComprehensiveLegalTable';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface AddressOnlyResultsProps {
  userAddress: string;
  userName: string;
  userEmail: string;
  onBackToHome: () => void;
  onUpgradeToFull: () => void;
}

export default function AddressOnlyResults({
  userAddress,
  userName,
  userEmail,
  onBackToHome,
  onUpgradeToFull,
}: AddressOnlyResultsProps) {
  const t = useTranslations();

  return (
    <div className="min-h-screen gradient-bg-modern">
      <Header showBackButton onBackClick={onBackToHome} showLanguageToggle={false} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            {t('ResultsPage.rights.title')}
          </h1>
          <div className="flex items-center justify-center gap-2 text-lg text-slate-600">
            <HugeiconsIcon icon={Location03Icon} size={20} strokeWidth={1.5} />
            <p>{userAddress}</p>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <HugeiconsIcon icon={UserListIcon} size={24} strokeWidth={1.5} className="text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">{t('AnalyzePage.userInfo.title')}</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{t('AnalyzePage.userInfo.fullName')}</p>
              <p className="text-slate-900">{userName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{t('AnalyzePage.userInfo.email')}</p>
              <p className="text-slate-900">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Upgrade CTA Card */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Want a Detailed Analysis of YOUR Lease?
              </h3>
              <p className="text-slate-600 mb-4">
                Upload your lease to get personalized insights, red flag detection, AI chat, and more.
              </p>
              <ul className="text-sm text-slate-700 space-y-2 inline-block text-left">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Smart extraction of key terms
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Red flag detection
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Personalized legal comparisons
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  AI-powered lease chat
                </li>
              </ul>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={onUpgradeToFull}
                className="inline-flex h-12 items-center justify-center gap-2 px-8 rounded-[10px] bg-[#6039B3] text-white font-semibold text-base hover:bg-[#5030A0] active:bg-[#4829A0] transition-all duration-200 shadow-[0_-2px_4px_0_rgba(0,0,0,0.30)_inset,0_2px_4px_0_rgba(255,255,255,0.30)_inset] hover:shadow-[0_-2px_6px_0_rgba(0,0,0,0.35)_inset,0_2px_6px_0_rgba(255,255,255,0.35)_inset] transform hover:-translate-y-0.5"
              >
                <HugeiconsIcon icon={CloudUploadIcon} size={20} strokeWidth={1.5} />
                Upload Your Lease
              </button>
            </div>
          </div>
        </div>

        {/* Legal Rights Table - Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 mb-8">
          <div className="border-b border-slate-200/60 px-6 py-5">
            <div className="flex items-center gap-3">
              <HugeiconsIcon icon={CourtLawIcon} size={32} strokeWidth={1.5} className="text-purple-600" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Your Renter Rights in {userAddress.split(',').slice(-2, -1)[0]?.trim() || 'Your State'}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Legal protections and regulations for tenants in your area
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <ComprehensiveLegalTable 
              userAddress={userAddress}
              leaseContext={{
                monthlyRent: undefined,
                securityDeposit: undefined,
                leaseStart: undefined,
                leaseEnd: undefined,
              }}
            />
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> The information above shows general tenant rights for your area. 
            Upload your lease to see how these laws apply specifically to your rental agreement.
          </p>
        </div>
      </main>

      <Footer showDisclaimer />
    </div>
  );
}

