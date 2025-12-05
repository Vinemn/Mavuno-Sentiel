
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { Language } from '../types';

type Translations = Record<string, string>;

export const LANGUAGES: { code: Language; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'sw', name: 'Kiswahili' },
  { code: 'fr', name: 'Français' },
  { code: 'kln', name: 'Kalenjin' },
  { code: 'ki', name: 'Kikuyu' },
  { code: 'luo', name: 'Dholuo' },
  { code: 'ha', name: 'Hausa' },
  { code: 'am', name: 'Amharic' },
];

interface LocalizationContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  formatCurrency: (amount: number, currency?: string) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [translations, setTranslations] = useState<Partial<Record<Language, Translations>>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchTranslations = useCallback(async (lang: Language) => {
    try {
      // Use relative path from index.html
      const response = await fetch(`./locales/${lang}.json`);
      if (!response.ok) throw new Error(`Could not load ${lang} translations`);
      const data = await response.json();
      // Ensure empty files don't break the app
      if (Object.keys(data).length === 0 && lang !== 'en') {
        console.warn(`Translation file for ${lang} is empty.`);
        setTranslations(prev => ({ ...prev, [lang]: {} }));
      } else {
        setTranslations(prev => ({ ...prev, [lang]: data }));
      }
    } catch (error) {
      console.error(error);
      setTranslations(prev => ({ ...prev, [lang]: {} })); // Set empty object on failure
    }
  }, []);


  useEffect(() => {
    const init = async () => {
      // Always load English for fallback
      await fetchTranslations('en');

      const browserLang = navigator.language.split('-')[0] as Language;
      const initialLang = LANGUAGES.some(l => l.code === browserLang) ? browserLang : 'en';

      if (initialLang !== 'en') {
        await fetchTranslations(initialLang);
      }
      
      setLanguage(initialLang);
      document.documentElement.lang = initialLang;
      setIsLoaded(true);
    };

    init();
  }, [fetchTranslations]); // Run once on mount

  const handleSetLanguage = async (lang: Language) => {
    if (!translations[lang]) {
      // FIX: `fetchTranslations` was previously scoped within a `useEffect` hook, making it inaccessible here. It has been moved to the component scope and wrapped in `useCallback` to resolve the issue.
      await fetchTranslations(lang);
    }
    setLanguage(lang);
    document.documentElement.lang = lang;
  };
  
  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    const currentMessages = translations[language];
    const fallbackMessages = translations.en;
    
    let translation = currentMessages?.[key] || fallbackMessages?.[key] || key;

    if (replacements) {
        Object.entries(replacements).forEach(([placeholder, value]) => {
            translation = translation.replace(`{${placeholder}}`, String(value));
        });
    }
    return translation;
  }, [language, translations]);

  const formatCurrency = useCallback((amount: number, currency: string = 'KES'): string => {
    // A more robust implementation would use language to determine locale
    // and potentially a user setting for currency.
    // For now, we'll format for Kenya Shillings.
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  // Render children only after essential translations are loaded to prevent FOUC
  if (!isLoaded) {
    return null;
  }

  return (
    <LocalizationContext.Provider value={{ language, setLanguage: handleSetLanguage, t, formatCurrency }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
