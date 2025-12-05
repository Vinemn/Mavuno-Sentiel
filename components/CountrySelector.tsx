
import React, { useState, useEffect } from 'react';
import { COUNTRIES } from '../constants';
import { useLocalization } from '../context/LocalizationContext';

export const CountrySelector: React.FC = () => {
  const { t } = useLocalization();
  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    return localStorage.getItem('userCountry') || 'KE';
  });
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    localStorage.setItem('userCountry', selectedCountry);
  }, [selectedCountry]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(event.target.value);
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 2000); // Hide after 2 seconds
  };

  return (
    <div>
      <label htmlFor="country-selector" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('select_your_country')}
      </label>
      <select
        id="country-selector"
        value={selectedCountry}
        onChange={handleChange}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md bg-white dark:bg-gray-800"
      >
        {COUNTRIES.map(country => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </select>
      {showConfirmation && (
        <p className="mt-2 text-sm text-green-600 dark:text-green-400 transition-opacity duration-300">
          {t('country_saved')}
        </p>
      )}
    </div>
  );
};