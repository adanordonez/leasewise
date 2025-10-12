'use client';

import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-300 py-12 mt-auto">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Main Content - All in front */}
        <div className="flex flex-col items-center gap-8">
          {/* Logo and Navigation */}
          <div className="flex flex-col items-center gap-4">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-xl font-bold text-slate-900">LeaseWise</span>
            </a>
            
            <div className="flex flex-wrap items-center justify-center gap-8">
              <a 
                href="/" 
                className="text-base font-semibold text-slate-900 hover:text-purple-600 transition-colors relative group"
              >
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a 
                href="/laws" 
                className="text-base font-semibold text-slate-900 hover:text-purple-600 transition-colors relative group"
              >
                Laws
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a 
                href="/dashboard" 
                className="text-base font-semibold text-slate-900 hover:text-purple-600 transition-colors relative group"
              >
                Dashboard
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a 
                href="/" 
                className="text-base font-semibold text-slate-900 hover:text-purple-600 transition-colors relative group"
              >
                Analyze
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"></span>
              </a>
            </div>
          </div>
          
          {/* UChicago Branding - Using UChicago font (Georgia) and colors */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <span 
                className="text-sm font-semibold"
                style={{ 
                  color: '#800000',
                  fontFamily: 'Georgia, serif'
                }}
              >
                Created by
              </span>
              <div className="relative h-7 w-auto">
                <Image
                  src="/pictures/New+Logo+-+2022 (1).png"
                  alt="University of Chicago Law School"
                  width={120}
                  height={28}
                  className="object-contain"
                  style={{ maxHeight: '28px' }}
                />
              </div>
            </div>
            <p 
              className="text-sm text-center font-medium"
              style={{ 
                color: '#800000',
                fontFamily: 'Georgia, serif'
              }}
            >
              University of Chicago Law School • AI Lab
            </p>
          </div>
          
          {/* Copyright and Legal */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-sm">
            <p className="text-slate-700 font-medium">
              © {new Date().getFullYear()} LeaseWise. All rights reserved.
            </p>
            <span className="hidden sm:inline text-slate-400">•</span>
            <a 
              href="#privacy" 
              className="text-slate-700 hover:text-purple-600 hover:underline transition-colors font-semibold"
            >
              Privacy Policy
            </a>
            <span className="hidden sm:inline text-slate-400">•</span>
            <a 
              href="#terms" 
              className="text-slate-700 hover:text-purple-600 hover:underline transition-colors font-semibold"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

