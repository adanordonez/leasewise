'use client';

import { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';

export default function LanguageToggle() {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'es' : 'en';
    
    startTransition(() => {
      // Set cookie to persist language preference
      document.cookie = `locale=${newLocale}; path=/; max-age=31536000`; // 1 year
      
      // Reload page to apply new locale
      window.location.reload();
    });
  };

  return (
    <button
      onClick={toggleLanguage}
      disabled={isPending}
      className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-[10px] bg-white/80 hover:bg-white border border-slate-200 text-slate-700 font-medium text-sm transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50"
      title={locale === 'en' ? 'Switch to Spanish' : 'Cambiar a inglés'}
    >
      <Globe className="w-4 h-4" />
      <span className="hidden sm:inline">{locale === 'en' ? 'ES' : 'EN'}</span>
      <span className="sm:hidden">{locale === 'en' ? 'ES' : 'EN'}</span>
    </button>
  );
}

