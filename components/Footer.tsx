'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface FooterProps {
  showDisclaimer?: boolean;
}

export default function Footer({ showDisclaimer = false }: FooterProps) {
  const t = useTranslations();
  
  return (
    <footer className="bg-[#2d1b4e] py-12 mt-auto">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Main Content - All in front */}
        <div className="flex flex-col items-center gap-8">
          {/* Disclaimer - Only shown on analyze pages */}
          {showDisclaimer && (
            <div className="w-full max-w-3xl bg-amber-50 border border-amber-200 rounded-lg p-6">
              <p className="text-sm text-slate-700 leading-relaxed text-center">
                {t('Disclaimer.text')}
              </p>
            </div>
          )}
          
          {/* Logo and Navigation */}
          <div className="flex flex-col items-center gap-4">
            <a href="/" className="hover:opacity-80 transition-opacity">
              <span className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-comfortaa)' }}>LeaseChat</span>
            </a>
            
            <div className="flex flex-wrap items-center justify-center gap-8">
              <a 
                href="/" 
                className="text-base font-semibold text-slate-300 hover:text-white transition-colors relative group"
              >
                {t('Nav.home')}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#6039B3] group-hover:w-full transition-all duration-300"></span>
              </a>
              {/* Temporarily hidden - Laws
              <a 
                href="/laws" 
                className="text-base font-semibold text-slate-300 hover:text-white transition-colors relative group"
              >
                Laws
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#6039B3] group-hover:w-full transition-all duration-300"></span>
              </a>
              */}
              {/* Temporarily hidden - Dashboard
              <a 
                href="/dashboard" 
                className="text-base font-semibold text-slate-300 hover:text-white transition-colors relative group"
              >
                Dashboard
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#6039B3] group-hover:w-full transition-all duration-300"></span>
              </a>
              */}
              <a 
                href="/" 
                className="text-base font-semibold text-slate-300 hover:text-white transition-colors relative group"
              >
                {t('Nav.analyze')}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#6039B3] group-hover:w-full transition-all duration-300"></span>
              </a>
            </div>
          </div>
          
          {/* UChicago Branding - Using UChicago font (Georgia) and colors */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <span 
                className="text-sm font-semibold text-white"
                style={{ 
                  fontFamily: 'Georgia, serif'
                }}
              >
                {t('Creator.createdBy')}
              </span>
              <div className="relative h-7 w-auto">
                <Image
                  src="/pictures/New+Logo+-+2022 (1).png"
                  alt="University of Chicago Law School"
                  width={120}
                  height={28}
                  className="object-contain brightness-0 invert"
                  style={{ maxHeight: '28px' }}
                />
              </div>
            </div>
            <p 
              className="text-sm text-center font-medium text-slate-300"
              style={{ 
                fontFamily: 'Georgia, serif'
              }}
            >
              {t('Creator.institution')}
            </p>
          </div>
          
          {/* Copyright and Legal */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-sm">
            <p className="text-slate-400 font-medium">
              {t('Footer.copyright')}
            </p>
            <span className="hidden sm:inline text-slate-600">•</span>
            <a 
              href="#privacy" 
              className="text-slate-400 hover:text-white hover:underline transition-colors font-semibold"
            >
              {t('Footer.privacyPolicy')}
            </a>
            <span className="hidden sm:inline text-slate-600">•</span>
            <a 
              href="#terms" 
              className="text-slate-400 hover:text-white hover:underline transition-colors font-semibold"
            >
              {t('Footer.termsOfService')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

