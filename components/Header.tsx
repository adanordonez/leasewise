'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import LanguageToggle from './LanguageToggle';

interface HeaderProps {
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export default function Header({ showBackButton = false, onBackClick }: HeaderProps = {}) {
  const t = useTranslations();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo or Back Button */}
          {showBackButton && onBackClick ? (
            <button 
              onClick={onBackClick}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-slate-700" />
              <span className="font-medium text-slate-700">{t('Nav.back')}</span>
            </button>
          ) : (
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <span className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-comfortaa)' }}>{t('Nav.brand')}</span>
            </Link>
          )}

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
            <LanguageToggle />
            {/* Temporarily hidden - Laws
            <Link
              href="/laws"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive('/laws')
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Laws
            </Link>
            */}
            {/* Temporarily hidden - Dashboard
            <Link
              href="/dashboard"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive('/dashboard')
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Dashboard
            </Link>
            */}
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                pathname === '/' || pathname === '/analyze'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {t('Nav.analyze')}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-slate-700" />
            ) : (
              <Menu className="h-6 w-6 text-slate-700" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-2 border-t border-slate-200 mt-4">
            <div className="flex flex-col gap-2">
              {/* Temporarily hidden - Laws
              <Link
                href="/laws"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isActive('/laws')
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Laws
              </Link>
              */}
              {/* Temporarily hidden - Dashboard
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isActive('/dashboard')
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Dashboard
              </Link>
              */}
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  pathname === '/' || pathname === '/analyze'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {t('Nav.analyze')}
              </Link>
              <div className="px-2">
                <LanguageToggle />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

