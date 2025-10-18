'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';
import { HugeiconsIcon } from '@hugeicons/react';
import { EarthIcon } from '@hugeicons-pro/core-stroke-rounded';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <HugeiconsIcon icon={EarthIcon} size={16} strokeWidth={1.5} className="text-slate-600" />
      <div className="flex items-center bg-slate-100 rounded-lg p-1">
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
            language === 'en'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          English
        </button>
        <button
          onClick={() => setLanguage('es')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
            language === 'es'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Español
        </button>
      </div>
    </div>
  );
}

