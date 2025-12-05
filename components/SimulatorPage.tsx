
import React from 'react';
import { PhoneSimulator } from './PhoneSimulator';
import { Icon } from './Icon';
import type { Page } from '../types';
import { useLocalization } from '../context/LocalizationContext';


interface SimulatorPageProps {
  onNavigate: (page: Page) => void;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({ onNavigate }) => {
  const { t } = useLocalization();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
      <header className="text-center mb-8">
        <div className="flex justify-center items-center gap-4 mb-2">
          <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
            <Icon name="leaf" className="w-8 h-8 text-green-700 dark:text-green-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-green-800 dark:text-green-300">{t('simulator_page_title')}</h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t('simulator_page_subtitle')}
        </p>
      </header>
      
      <PhoneSimulator />

      <div className="mt-8">
        <button 
          onClick={() => onNavigate('home')} 
          className="bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-yellow-600 transition-transform hover:scale-105"
        >
          &larr; {t('back_to_home')}
        </button>
      </div>
    </div>
  );
};
