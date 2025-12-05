
import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import type { Page, UserRole } from '../types';
import { useLocalization, LANGUAGES } from '../context/LocalizationContext';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { generateSpeech } from '../services/geminiService';

interface HomePageProps {
  onNavigate: (page: Page) => void;
  onLogin: (role: UserRole) => void;
}

const carouselImages = [
  'https://picsum.photos/id/10/1200/800',
  'https://picsum.photos/id/119/1200/800',
  'https://picsum.photos/id/145/1200/800',
  'https://picsum.photos/id/200/1200/800',
];

const SmallSpinner: React.FC = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
);

const IvrSimulator: React.FC = () => {
    const { t } = useLocalization();
    const { play, stop, isLoading, isPlaying } = useAudioPlayer({ sampleRate: 24000 });
    const [isFetching, setIsFetching] = useState(false);
    const [audioData, setAudioData] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleClick = async () => {
        setError(null);
        if (isPlaying) {
            stop();
            return;
        }

        if (audioData) {
            play(audioData);
            return;
        }

        setIsFetching(true);
        try {
            const lessonScript = t('ivr_lesson_script');
            const generatedAudio = await generateSpeech(lessonScript);
            setAudioData(generatedAudio);
            play(generatedAudio);
        } catch (err) {
            console.error("Failed to generate speech", err);
            setError(t('error_generic'));
        } finally {
            setIsFetching(false);
        }
    };

    const getButtonContent = () => {
        if (isFetching || isLoading) {
            return (
                <>
                    <SmallSpinner />
                    <span>{t('ivr_sim_loading')}</span>
                </>
            );
        }
        if (isPlaying) {
            return (
                 <>
                    <Icon name="stop-circle" className="w-6 h-6" />
                    <span>{t('ivr_sim_playing')}</span>
                </>
            );
        }
        return (
            <>
                <Icon name="speaker-wave" className="w-6 h-6" />
                <span>{t('ivr_sim_listen')}</span>
            </>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg flex flex-col">
            <Icon name="phone" className="w-12 h-12 text-blue-500" />
            <h3 className="text-xl font-bold mt-4">{t('channel_ivr')}</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400 flex-grow">{t('ivr_instructions')}</p>
            <div className="mt-4">
                <button
                    onClick={handleClick}
                    disabled={isFetching || isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                    {getButtonContent()}
                </button>
                {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
            </div>
        </div>
    );
};


const LanguageSwitcher = () => {
  const { language, setLanguage } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1 text-white hover:text-green-300">
        <Icon name="globe" className="w-6 h-6" />
        <span className="uppercase text-sm font-semibold">{language}</span>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50">
          <ul className="py-1">
            {LANGUAGES.map(({ code, name }) => (
              <li key={code}>
                <button
                  onClick={() => { setLanguage(code); setIsOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};


export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onLogin }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useLocalization();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const [loginTab, setLoginTab] = useState<UserRole>('farmer');
  
  const handleScrollTo = (event: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    event.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };


  return (
    <div>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-gray-900/50 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Icon name="logo" className="w-9 h-9 text-green-400" />
            <span className="text-xl font-bold text-white">{t('mavuno_sentinel')}</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6 text-white">
            <a href="#features" onClick={(e) => handleScrollTo(e, 'features')} className="hover:text-green-300">{t('features')}</a>
            <a href="#about" onClick={(e) => handleScrollTo(e, 'about')} className="hover:text-green-300">{t('about')}</a>
            <button onClick={() => onNavigate('simulator')} className="hover:text-green-300">{t('simulator')}</button>
          </nav>
          <div className="flex items-center gap-4">
             <ThemeSwitcher />
             <LanguageSwitcher />
            <a href="#login" onClick={(e) => handleScrollTo(e, 'login')} className="hidden sm:block bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition">{t('get_started')}</a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center text-white">
        <div className="absolute inset-0 w-full h-full overflow-hidden">
            {carouselImages.map((src, index) => (
            <div key={src} className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
                <img src={src} className="w-full h-full object-cover" alt={`Carousel image ${index + 1}`} />
            </div>
            ))}
        </div>
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 text-center px-4 animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-bold" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.7)' }}>{t('hero_title1')}</h1>
          <h2 className="text-4xl md:text-6xl font-bold text-green-400" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.7)' }}>{t('hero_title2')}</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-200">{t('hero_subtitle')}</p>
          <div className="mt-8 flex justify-center gap-4">
            <button onClick={() => onNavigate('simulator')} className="bg-yellow-500 text-gray-900 font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-yellow-600 transition-transform hover:scale-105">
              {t('try_the_simulator')}
            </button>
            <a href="#login" onClick={(e) => handleScrollTo(e, 'login')} className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-green-700 transition-transform hover:scale-105">
              {t('access_your_portal')}
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('closed_loop_system_title')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{t('closed_loop_system_subtitle')}</p>
            <div className="mt-12 grid md:grid-cols-3 gap-8">
                <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
                    <Icon name="camera" className="w-12 h-12 text-green-600 mx-auto" />
                    <h3 className="text-xl font-bold mt-4">{t('feature_diagnosis_title')}</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">{t('feature_diagnosis_desc')}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
                    <Icon name="store" className="w-12 h-12 text-green-600 mx-auto" />
                    <h3 className="text-xl font-bold mt-4">{t('feature_supply_title')}</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">{t('feature_supply_desc')}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
                    <Icon name="shield-check" className="w-12 h-12 text-green-600 mx-auto" />
                    <h3 className="text-xl font-bold mt-4">{t('feature_outcomes_title')}</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">{t('feature_outcomes_desc')}</p>
                </div>
            </div>
        </div>
      </section>
      
      {/* About Us Section */}
      <section id="about" className="py-20 bg-gray-100 dark:bg-gray-800">
        <div className="container mx-auto px-6 text-center">
          <Icon name="globe" className="w-16 h-16 text-green-600 mx-auto mb-4 animate-spin-slow opacity-50" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('about_us_title')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-3xl mx-auto">{t('about_us_subtitle')}</p>
          
          <div className="mt-12 grid md:grid-cols-3 gap-8 text-left">
              {/* Pillar 1 */}
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
                  <Icon name="assistant" className="w-12 h-12 text-yellow-500" />
                  <h3 className="text-xl font-bold mt-4">{t('about_pillar1_title')}</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">{t('about_pillar1_desc')}</p>
              </div>
              {/* Pillar 2 */}
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
                  <Icon name="device-phone-mobile" className="w-12 h-12 text-blue-500" />
                  <h3 className="text-xl font-bold mt-4">{t('about_pillar2_title')}</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">{t('about_pillar2_desc')}</p>
              </div>
              {/* Pillar 3 */}
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
                  <Icon name="users" className="w-12 h-12 text-green-500" />
                  <h3 className="text-xl font-bold mt-4">{t('about_pillar3_title')}</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">{t('about_pillar3_desc')}</p>
              </div>
          </div>
        </div>
      </section>

      {/* Low Tech Services Section */}
      <section id="low-tech-services" className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold">{t('low_tech_services')}</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">{t('low_tech_subtitle')}</p>
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
            {/* USSD Card */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <Icon name="hashtag" className="w-12 h-12 text-blue-500" />
                <h3 className="text-xl font-bold mt-4">{t('channel_ussd')}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{t('ussd_instructions')}</p>
            </div>
             {/* SMS Card */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <Icon name="chat-bubble-left-right" className="w-12 h-12 text-blue-500" />
                <h3 className="text-xl font-bold mt-4">{t('channel_sms')}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{t('sms_instructions')}</p>
                <p className="mt-1 text-sm bg-gray-200 dark:bg-gray-700 rounded p-2 font-mono">{t('sms_example')}</p>
            </div>
             {/* IVR Card */}
            <IvrSimulator />
            {/* WhatsApp Card */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <Icon name="photo" className="w-12 h-12 text-blue-500" />
                <h3 className="text-xl font-bold mt-4">{t('channel_whatsapp')}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{t('whatsapp_instructions')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Login Section */}
      <section id="login" className="py-20 bg-gray-100 dark:bg-gray-800">
        <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">{t('portal_title')}</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mt-2">{t('portal_subtitle')}</p>
            <div className="max-w-2xl mx-auto mt-8 bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
                <div className="flex">
                    <button onClick={() => setLoginTab('farmer')} className={`flex-1 p-4 font-bold text-center transition ${loginTab === 'farmer' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>{t('role_farmer')}</button>
                    <button onClick={() => setLoginTab('expert')} className={`flex-1 p-4 font-bold text-center transition ${loginTab === 'expert' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>{t('role_expert')}</button>
                    <button onClick={() => setLoginTab('ministry')} className={`flex-1 p-4 font-bold text-center transition ${loginTab === 'ministry' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>{t('role_ngo_gov')}</button>
                </div>
                <div className="p-8">
                    <form onSubmit={(e) => { e.preventDefault(); onLogin(loginTab); }}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('form_label_auth')}</label>
                                <input type="text" id="email" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder={t(loginTab === 'farmer' ? 'form_placeholder_phone' : 'form_placeholder_email')} />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('form_label_password')}</label>
                                <input type="password" id="password" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder={t('form_placeholder_password')} />
                            </div>
                        </div>
                        <button type="submit" className="w-full mt-6 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition">
                           {t('login_dashboard')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="container mx-auto px-6 py-12">
            <div className="text-center">
                <p>{t('footer_copyright', { year: new Date().getFullYear() })}</p>
                <div className="mt-4 flex justify-center space-x-4">
                    <a href="#" className="hover:text-white">{t('privacy_policy')}</a>
                    <span>&middot;</span>
                    <a href="#" className="hover:text-white">{t('terms_of_service')}</a>
                    <span>&middot;</span>
                    <a href="#" className="hover:text-white">{t('contact_us')}</a>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};