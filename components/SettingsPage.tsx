
import React from 'react';
import type { Page, Language } from '../types';
import { Icon } from './Icon';
import { CountrySelector } from './CountrySelector';
import { useLocalization, LANGUAGES } from '../context/LocalizationContext';

interface SettingsPageProps {
  onNavigate: (page: Page) => void;
}

const Card: React.FC<{ children: React.ReactNode; className?: string; }> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 ${className}`}>
    {children}
  </div>
);

const LanguageSelector: React.FC = () => {
    const { t, language, setLanguage } = useLocalization();

    const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(event.target.value as Language);
    };

    return (
        <div>
            <label htmlFor="language-selector" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('select_your_language')}
            </label>
            <select
                id="language-selector"
                value={language}
                onChange={handleLanguageChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md bg-white dark:bg-gray-800"
            >
                {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                        {lang.name}
                    </option>
                ))}
            </select>
        </div>
    );
};


export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { t } = useLocalization();
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => onNavigate('dashboard')} 
          className="flex items-center gap-2 mb-6 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
        >
          <Icon name="arrow-left" className="w-5 h-5" /> {t('back_to_dashboard')}
        </button>

        <h1 className="text-3xl font-bold mb-6">{t('settings')}</h1>

        <Card>
            <h2 className="text-xl font-bold mb-4">{t('localization_settings')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <LanguageSelector />
                 <CountrySelector />
            </div>
        </Card>
      </div>
    </div>
  );
};