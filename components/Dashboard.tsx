
// FIX: Replaced by a more robust and feature-rich Dashboard component.
import React, { useState, useEffect, useCallback, useRef, ReactNode, useMemo } from 'react';
import {
  User,
  Page,
  DiagnosisCase,
  Weather,
  CommunityAlert,
  ProductDealerResult,
  SeasonalNudge,
  Notification,
  ChatMessage,
  MinistryAnalytics,
  Product,
  DemandHeatItem,
  Diagnosis,
  MapItem,
  AgroDealer,
  Reward,
  PointsTransaction,
  FollowUpStatus,
  MarketPrice,
  ProductivityReport,
  ProduceItem,
  MarketOpportunity
} from '../types';
import { Icon } from './Icon';
import { diagnosisService } from '../services/diagnosisService';
import { getWeather } from '../services/weatherService';
import { communityAlertService } from '../services/communityAlertService';
import { agroDealerService } from '../services/agroDealerService';
import { seasonalNudgeService } from '../services/seasonalNudgeService';
import { notificationService } from '../services/notificationService';
import { chatService } from '../services/chatService';
import { userService } from '../services/userService';
import { rewardsService } from '../services/rewardsService';
import { marketService } from '../services/marketService';
import { produceService } from '../services/produceService';
import { useLocalization } from '../context/LocalizationContext';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useTTS } from '../hooks/useTTS';
import { AIAssistant } from './AIAssistant';
import { COUNTRIES, SCENARIOS } from '../constants';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { diagnosePlantDisease, generateText } from '../services/geminiService';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


// #region Offline Sync
// The payload for items in the offline diagnosis queue.
type DiagnosisQueuePayload = {
  imageData: { data: string; mimeType: string };
  userQuery?: string;
  // We add a temporary client-side ID to track it if needed.
  clientId: string; 
};

// Processor function for the useOfflineQueue hook.
// This function is responsible for taking a queued item and sending it to the "backend".
const diagnosisProcessor = async (payload: DiagnosisQueuePayload): Promise<boolean> => {
  try {
    console.log(`Processing offline diagnosis: ${payload.clientId}`);
    const diagnosisResult = await diagnosePlantDisease(payload.imageData, payload.userQuery);
    
    // Create a data URI for the image to be stored in the mock service
    const imageUri = `data:${payload.imageData.mimeType};base64,${payload.imageData.data}`;
    
    // Create the case in the backend service
    await diagnosisService.createCase(
      imageUri,
      diagnosisResult.label,
      diagnosisResult.crop,
      diagnosisResult
    );
    
    // Notify the user of the successful sync
    notificationService.addNotification({
      type: 'case_update',
      messageKey: 'notification_case_synced',
      messageParams: { diagnosisLabel: diagnosisResult.label },
    });
    
    return true; // Indicates success, item will be removed from queue.
  } catch (error) {
    // The Gemini call will throw if there's a network issue.
    // The useOfflineQueue hook will catch this and retry later.
    console.error('Failed to process offline diagnosis request:', error);
    return false; // Indicates failure, item remains in queue for retry.
  }
};
// #endregion Offline Sync


// #region Helper Components
const Card: React.FC<{ children: ReactNode; className?: string; }> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 ${className}`}>
    {children}
  </div>
);

const Spinner: React.FC = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
  </div>
);

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
            <Icon name="x" className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const Tag: React.FC<{ children: ReactNode; color?: string; }> = ({ children, color = 'gray' }) => {
    const colorClasses: Record<string, string> = {
        green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    return <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${colorClasses[color]}`}>{children}</span>;
};
// #endregion Helper Components


// #region Shared Components (Header, Sidebar)

const Header: React.FC<{ user: User; onLogout: () => void; syncQueueLength: number }> = ({ user, onLogout, syncQueueLength }) => {
    const { t } = useLocalization();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    
    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        notificationService.getNotifications().then(setNotifications);
    }, []);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
            setIsNotificationOpen(false);
          }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const handleMarkAsRead = async (id: string) => {
        await notificationService.markAsRead(id);
        setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    return (
        <header className="bg-white dark:bg-gray-900 shadow-sm p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
                <Icon name="logo" className="w-9 h-9 text-green-500"/>
                <h1 className="text-xl font-bold">{t('mavuno_sentinel')}</h1>
                 {!isOnline ? (
                    <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 text-xs font-semibold px-2 py-1 rounded-full">
                        <Icon name="signal-slash" className="w-4 h-4" />
                        <span>{t('offline_indicator')}</span>
                    </div>
                 ) : syncQueueLength > 0 ? (
                    <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-semibold px-2 py-1 rounded-full">
                        <Icon name="arrows-path" className="w-4 h-4 animate-spin" />
                        <span>{t('offline_queue_processing', { count: syncQueueLength })}</span>
                    </div>
                ) : null}
            </div>
            <div className="flex items-center gap-4">
                <div className="relative" ref={notificationRef}>
                    <button onClick={() => setIsNotificationOpen(!isNotificationOpen)} className="relative text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                        <Icon name="bell" className="w-6 h-6" />
                        {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">{unreadCount}</span>}
                    </button>
                    {isNotificationOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-xl border dark:border-gray-700 z-50">
                            <div className="p-3 font-bold border-b dark:border-gray-700">{t('notifications')}</div>
                            <ul className="max-h-96 overflow-y-auto">
                                {notifications.map(n => (
                                    <li key={n.id} onClick={() => handleMarkAsRead(n.id)} className={`p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${!n.isRead ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                                        <p className="text-sm">{t(n.messageKey, n.messageParams)}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                                    </li>
                                ))}
                                {notifications.length === 0 && <li className="p-4 text-center text-sm text-gray-500">{t('no_notifications')}</li>}
                            </ul>
                        </div>
                    )}
                </div>
                <ThemeSwitcher />
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-200 dark:bg-green-700 rounded-full flex items-center justify-center font-bold text-green-700 dark:text-green-200">{user.name.charAt(0)}</div>
                    <div>
                        <p className="font-semibold text-sm">{user.name}</p>
                        <p className="text-xs font-semibold text-green-600 dark:text-green-400">
                            {t(`role_${user.role.replace('-', '_')}`)}
                        </p>
                    </div>
                </div>
                <button onClick={onLogout} className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400" title={t('logout')}>
                    <Icon name="arrow-left" className="w-6 h-6" />
                </button>
            </div>
        </header>
    );
};

// #endregion Shared Components


// #region Farmer Dashboard

type FarmerView = 'home' | 'cases' | 'case_detail' | 'alerts' | 'treatment_finder' | 'new_diagnosis' | 'strategy' | 'rewards' | 'market' | 'reports' | 'produce';

const FarmerSidebar: React.FC<{ activeView: FarmerView; setView: (view: FarmerView) => void; onNavigate: (page: Page) => void; }> = ({ activeView, setView, onNavigate }) => {
    const { t } = useLocalization();
    const navItems = [
        { id: 'home', icon: 'star', label: t('dashboard') },
        { id: 'strategy', icon: 'chart-bar', label: t('strategy_planner') }, // Replaced Map
        { id: 'produce', icon: 'basket', label: t('my_produce') },
        { id: 'cases', icon: 'clipboard-document-check', label: t('my_cases') },
        { id: 'alerts', icon: 'megaphone', label: t('community_feed') },
        { id: 'market', icon: 'truck', label: t('market_prices') }, 
        { id: 'reports', icon: 'clipboard-document-check', label: t('reports') }, 
        { id: 'rewards', icon: 'gift', label: t('rewards') },
        { id: 'treatment_finder', icon: 'store', label: t('treatment_finder_title') },
    ];
    
    return (
        <aside className="w-64 bg-gray-50 dark:bg-gray-950 p-4 flex flex-col border-r border-gray-200 dark:border-gray-800">
            <nav className="space-y-2">
                {navItems.map(item => (
                    <button key={item.id} onClick={() => setView(item.id as FarmerView)} className={`w-full flex items-center gap-3 p-3 rounded-lg text-left font-semibold transition ${activeView === item.id ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                        <Icon name={item.icon} className="w-6 h-6" />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
            <div className="mt-auto space-y-2 pt-4 border-t dark:border-gray-800">
                 <button onClick={() => onNavigate('settings')} className="w-full flex items-center gap-3 p-3 rounded-lg text-left text-gray-700 dark:text-gray-300 font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-700">
                    <Icon name="cog-6-tooth" className="w-6 h-6" />
                    <span>{t('settings')}</span>
                 </button>
                 <button onClick={() => alert("Help Center Coming Soon!")} className="w-full flex items-center gap-3 text-left p-3 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                    <span>{t('help_support')}</span>
                </button>
            </div>
        </aside>
    );
};

interface StrategyReportData {
    costBreakdown: {
        seeds: string;
        fertilizer: string;
        labor: string;
        total: string;
    };
    revenueProjection: {
        minPrice: string;
        maxPrice: string;
        estimatedYield: string;
        totalRevenue: string;
        netProfit: string;
    };
    strategicAdvice: {
        sellingStrategy: string;
        risksToAvoid: string[];
        keyConsiderations: string[];
    };
    summary: string;
}

const FarmerStrategyView: React.FC = () => {
    const { t } = useLocalization();
    const [crop, setCrop] = useState('Maize');
    const [landSize, setLandSize] = useState<number | ''>('');
    const [unit, setUnit] = useState('Acres');
    const [location, setLocation] = useState('Nakuru');
    const [report, setReport] = useState<StrategyReportData | null>(null);
    const [loading, setLoading] = useState(false);

    const KENYAN_COUNTIES = [
        'Nakuru', 'Uasin Gishu', 'Trans Nzoia', 'Kiambu', 'Meru', 
        'Machakos', 'Kisumu', 'Kakamega', 'Bungoma', 'Nyeri', 
        'Makueni', 'Narok', 'Nyandarua', 'Bomet', 'Kericho', 'Murang\'a', 'Kirinyaga',
        'Mombasa', 'Kilifi', 'Kwale', 'Kajiado', 'Laikipia'
    ];

    const handleGenerateStrategy = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!landSize) return;

        setLoading(true);
        setReport(null);

        const prompt = `Act as an expert agricultural economist for Kenya. A farmer in ${location} County, Kenya plans to grow ${crop} on ${landSize} ${unit}. 
        Provide a detailed JSON response with the following structure:
        {
            "costBreakdown": { "seeds": "cost string in KES", "fertilizer": "cost string in KES", "labor": "cost string in KES", "total": "total cost string in KES" },
            "revenueProjection": { "minPrice": "price/unit", "maxPrice": "price/unit", "estimatedYield": "total yield with units", "totalRevenue": "range string in KES", "netProfit": "range string in KES" },
            "strategicAdvice": { 
                "sellingStrategy": "Best time/price to sell for max profit considering market trends in ${location}", 
                "risksToAvoid": ["risk 1 (specific to ${location} weather/pests)", "risk 2", "risk 3"], 
                "keyConsiderations": ["tip 1 (soil/climate in ${location})", "tip 2", "tip 3"] 
            },
            "summary": "A short executive summary paragraph specific to farming ${crop} in ${location}."
        }
        Keep costs realistic for Kenyan market standards.
        `;

        try {
            const responseText = await generateText(prompt, "You are a specialized Kenyan agricultural consultant. Use local data regarding soil type, weather patterns, and market access.");
            // Sanitize response in case of markdown blocks
            const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const data: StrategyReportData = JSON.parse(jsonStr);
            setReport(data);
        } catch (error) {
            console.error("Strategy generation failed", error);
            alert(t('error_gemini_api'));
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!report) return;
        const content = `
MAVUNO SENTINEL - STRATEGY REPORT
---------------------------------
Crop: ${crop}
Location: ${location} County, Kenya
Land Size: ${landSize} ${unit}
Date: ${new Date().toLocaleDateString()}

EXECUTIVE SUMMARY
${report.summary}

FINANCIAL BREAKDOWN
-------------------
Estimated Costs:
- Seeds: ${report.costBreakdown.seeds}
- Fertilizer: ${report.costBreakdown.fertilizer}
- Labor: ${report.costBreakdown.labor}
- TOTAL ESTIMATED COST: ${report.costBreakdown.total}

REVENUE PROJECTIONS
-------------------
- Estimated Yield: ${report.revenueProjection.estimatedYield}
- Price Range: ${report.revenueProjection.minPrice} - ${report.revenueProjection.maxPrice}
- Projected Revenue: ${report.revenueProjection.totalRevenue}
- NET PROFIT ESTIMATE: ${report.revenueProjection.netProfit}

STRATEGIC ADVICE
----------------
Selling Strategy:
${report.strategicAdvice.sellingStrategy}

Risks to Avoid:
${report.strategicAdvice.risksToAvoid.map(r => `- ${r}`).join('\n')}

Key Considerations:
${report.strategicAdvice.keyConsiderations.map(c => `- ${c}`).join('\n')}
        `;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Mavuno_Strategy_${crop}_${location}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold mb-2">{t('strategy_planner_title')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t('strategy_planner_desc')}</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card>
                        <h3 className="font-bold text-lg mb-4">{t('strategy_inputs')}</h3>
                        <form onSubmit={handleGenerateStrategy} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('location')}</label>
                                <select value={location} onChange={e => setLocation(e.target.value)} className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600">
                                    {KENYAN_COUNTIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('crop_type')}</label>
                                <select value={crop} onChange={e => setCrop(e.target.value)} className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600">
                                    <option value="Maize">Maize</option>
                                    <option value="Beans">Beans</option>
                                    <option value="Potatoes">Potatoes</option>
                                    <option value="Tomatoes">Tomatoes</option>
                                    <option value="Cabbage">Cabbage</option>
                                    <option value="Avocados">Avocados</option>
                                    <option value="Coffee">Coffee</option>
                                    <option value="Tea">Tea</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('land_size')}</label>
                                    <input 
                                        type="number" 
                                        value={landSize} 
                                        onChange={e => setLandSize(Number(e.target.value))} 
                                        className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                                        placeholder="e.g. 2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('unit')}</label>
                                    <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600">
                                        <option value="Acres">Acres</option>
                                        <option value="Hectares">Hectares</option>
                                    </select>
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading || !landSize}
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {loading ? t('generating_strategy') : t('generate_report')}
                            </button>
                        </form>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center">
                            <Spinner />
                            <p className="mt-4 text-gray-500 animate-pulse">{t('analyzing_market_data')}</p>
                        </div>
                    ) : report ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-xl">
                                <div>
                                    <h3 className="font-bold text-lg">{crop} Strategy for {location}</h3>
                                    <p className="text-sm text-gray-500">{landSize} {unit}</p>
                                </div>
                                <Tag color="blue">{new Date().toLocaleDateString()}</Tag>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
                                    <h4 className="text-sm font-bold text-gray-500 uppercase">{t('estimated_cost')}</h4>
                                    <p className="text-2xl font-bold text-red-700 dark:text-red-400">{report.costBreakdown.total}</p>
                                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                        <p className="flex justify-between"><span>{t('seeds')}:</span> <span>{report.costBreakdown.seeds}</span></p>
                                        <p className="flex justify-between"><span>{t('fertilizer')}:</span> <span>{report.costBreakdown.fertilizer}</span></p>
                                        <p className="flex justify-between"><span>{t('labor')}:</span> <span>{report.costBreakdown.labor}</span></p>
                                    </div>
                                </Card>
                                <Card className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500">
                                    <h4 className="text-sm font-bold text-gray-500 uppercase">{t('projected_revenue')}</h4>
                                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">{report.revenueProjection.totalRevenue}</p>
                                    <p className="text-xs text-gray-500 mt-1">{t('based_on_yield', { yield: report.revenueProjection.estimatedYield })}</p>
                                    <div className="mt-4 pt-2 border-t border-green-200 dark:border-green-800">
                                        <p className="text-sm font-bold">{t('net_profit_potential')}</p>
                                        <p className="text-xl font-bold text-green-800 dark:text-green-300">{report.revenueProjection.netProfit}</p>
                                    </div>
                                </Card>
                            </div>

                            <Card>
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-600">
                                    <Icon name="sparkles" className="w-5 h-5" />
                                    {t('strategic_advice')}
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-bold text-sm uppercase text-gray-500 mb-1">{t('selling_strategy')}</h4>
                                        <p className="text-gray-800 dark:text-gray-200">{report.strategicAdvice.sellingStrategy}</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                                            <h4 className="font-bold text-sm text-yellow-700 dark:text-yellow-400 mb-2 flex items-center gap-2">
                                                <Icon name="exclamation-triangle" className="w-4 h-4" />
                                                {t('risks_to_avoid')}
                                            </h4>
                                            <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                                {report.strategicAdvice.risksToAvoid.map((risk, i) => (
                                                    <li key={i}>{risk}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                            <h4 className="font-bold text-sm text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                                                <Icon name="check-circle" className="w-4 h-4" />
                                                {t('key_considerations')}
                                            </h4>
                                            <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                                {report.strategicAdvice.keyConsiderations.map((tip, i) => (
                                                    <li key={i}>{tip}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <button 
                                onClick={handleDownload}
                                className="w-full bg-gray-800 text-white font-bold py-4 rounded-xl hover:bg-gray-900 transition flex items-center justify-center gap-2 shadow-lg"
                            >
                                <Icon name="arrow-down-tray" className="w-5 h-5" />
                                {t('download_full_report')}
                            </button>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                            <Icon name="chart-bar" className="w-16 h-16 mb-4 text-gray-300" />
                            <p className="text-lg font-semibold">{t('strategy_intro_title')}</p>
                            <p>{t('strategy_intro_desc')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const FarmerProduceView: React.FC = () => {
    const { t, formatCurrency } = useLocalization();
    const [crop, setCrop] = useState('Mangoes');
    const [quantity, setQuantity] = useState<number | ''>('');
    const [unit, setUnit] = useState('Tons');
    const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([]);
    const [loading, setLoading] = useState(false);
    const [analyzed, setAnalyzed] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [analyzingAi, setAnalyzingAi] = useState(false);
    const [logs, setLogs] = useState<ProduceItem[]>([]);

    useEffect(() => {
        produceService.getHarvestLogs().then(setLogs);
    }, []);

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quantity) return;
        
        setLoading(true);
        setAnalyzed(false);
        setAiAnalysis(null);
        setOpportunities([]);

        const produceItem: ProduceItem = {
            id: `h-${Date.now()}`,
            crop,
            quantity: Number(quantity),
            unit,
            harvestDate,
            notes: notes.trim() ? notes : undefined
        };

        // Save harvest log
        await produceService.logHarvest(produceItem);
        setLogs(prev => [produceItem, ...prev]);
        setQuantity(''); // Clear quantity to prevent double submission
        setNotes('');    // Clear notes

        // Get analysis
        const results = await produceService.getMarketOpportunities(produceItem);
        setOpportunities(results);
        setLoading(false);
        setAnalyzed(true);

        // Trigger AI Analysis after fetching markets
        setAnalyzingAi(true);
        try {
            const topMarkets = results.slice(0, 3).map(m => `${m.marketName} (${m.pricePerUnit} KES/${unit})`).join(', ');
            const prompt = `I am a Kenyan farmer. I just harvested ${produceItem.quantity} ${produceItem.unit} of ${produceItem.crop}. 
            My available market options are: ${topMarkets || "None found"}. 
            Please provide a concise strategic report (max 150 words) on:
            1. Profitability: Whether to sell now or hold (considering general seasonality of ${produceItem.crop} in Kenya).
            2. Logistics: Which market option seems best and why (consider distance vs price).
            3. Quality: A quick tip on post-harvest handling for ${produceItem.crop} to prevent spoilage during transport.`;
            
            const analysis = await generateText(prompt, "You are a savvy Kenyan agricultural economist. Keep advice practical, short, and formatted with bullet points.");
            setAiAnalysis(analysis);
        } catch (e) {
            console.error("AI Analysis failed", e);
            setAiAnalysis(t('error_gemini_api'));
        } finally {
            setAnalyzingAi(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold mb-6">{t('produce_tracker_title')}</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <h3 className="text-xl font-bold mb-4">{t('log_harvest_title')}</h3>
                        <form onSubmit={handleAnalyze} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('crop_type')}</label>
                                <select value={crop} onChange={e => setCrop(e.target.value)} className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600">
                                    <option value="Mangoes">Mangoes</option>
                                    <option value="Maize">Maize</option>
                                    <option value="Tomatoes">Tomatoes</option>
                                    <option value="Avocados">Avocados</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('quantity')}</label>
                                    <input 
                                        type="number" 
                                        value={quantity} 
                                        onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} 
                                        className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                                        placeholder="e.g. 5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('unit')}</label>
                                    <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600">
                                        <option value="Tons">Tons</option>
                                        <option value="Kgs">Kgs</option>
                                        <option value="Crates">Crates</option>
                                        <option value="Bags">Bags (90kg)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('harvest_date')}</label>
                                <input 
                                    type="date" 
                                    value={harvestDate} 
                                    onChange={e => setHarvestDate(e.target.value)} 
                                    className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('notes_optional')}</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                                    placeholder={t('notes_placeholder')}
                                    rows={2}
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading || !quantity}
                                className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700 transition disabled:opacity-50"
                            >
                                {loading ? t('analyzing') : t('log_and_find_markets')}
                            </button>
                        </form>
                    </Card>

                    {/* Harvest History Card */}
                    <Card>
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Icon name="calendar-days" className="w-5 h-5 text-green-500" />
                            {t('harvest_history')}
                        </h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {logs.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">{t('no_logs_yet')}</p>
                            ) : (
                                logs.map(log => (
                                    <div key={log.id} className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div>
                                            <p className="font-semibold">{log.crop}</p>
                                            <p className="text-xs text-gray-500">{log.harvestDate}</p>
                                            {log.notes && <p className="text-xs text-gray-400 italic mt-1">{log.notes}</p>}
                                        </div>
                                        <div className="text-right whitespace-nowrap">
                                            <p className="font-bold text-green-600 dark:text-green-400">{log.quantity} {log.unit}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <Spinner />
                        </div>
                    ) : analyzed ? (
                        <>
                            <div>
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Icon name="chart-bar" className="w-6 h-6 text-blue-500" />
                                    {t('market_opportunities_for')} {crop}
                                </h3>
                                {opportunities.length === 0 ? (
                                    <p className="text-gray-500">{t('no_markets_found')}</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {opportunities.map(opp => (
                                            <Card key={opp.id} className="relative overflow-hidden hover:shadow-lg transition-shadow border-l-4 border-green-500">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-lg">{opp.marketName}</h4>
                                                        <p className="text-sm text-gray-500">{opp.location} ({opp.distance} km)</p>
                                                    </div>
                                                    <Tag color={opp.demandLevel === 'high' ? 'green' : 'yellow'}>{opp.demandLevel.toUpperCase()} DEMAND</Tag>
                                                </div>
                                                <div className="flex items-end justify-between mt-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase">{t('estimated_price')}</p>
                                                        <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                                                            {formatCurrency(opp.pricePerUnit)} <span className="text-sm font-normal text-gray-500">/{unit}</span>
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500">{t('transport_est')}</p>
                                                        <p className="font-semibold text-red-500">-{formatCurrency(opp.transportCostEstimate)}</p>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2 italic">{opp.notes}</p>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* AI Analysis Section */}
                            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800">
                                <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-blue-800 dark:text-blue-300">
                                    <Icon name="sparkles" className="w-5 h-5 text-blue-600" />
                                    {t('ai_harvest_strategy')}
                                </h3>
                                {analyzingAi ? (
                                    <div className="flex items-center gap-3 py-4 text-blue-700 dark:text-blue-300">
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></div>
                                        <p>{t('generating_strategy')}</p>
                                    </div>
                                ) : aiAnalysis ? (
                                    <div className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300">
                                        <div dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br />') }} />
                                    </div>
                                ) : null}
                            </Card>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                            <Icon name="basket" className="w-16 h-16 mb-4 text-gray-300" />
                            <p className="text-lg font-semibold">{t('produce_intro_title')}</p>
                            <p>{t('produce_intro_desc')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const FarmerHomeView: React.FC<{ user: User; refetchUser: () => void; }> = ({ user, refetchUser }) => {
    const { t, language } = useLocalization();
    const { speak, isSupported } = useTTS();
    const [weather, setWeather] = useState<Weather | null>(null);
    const [nudge, setNudge] = useState<SeasonalNudge | null>(null);
    const [recentCases, setRecentCases] = useState<DiagnosisCase[]>([]);
    const [isHealthCheckModalOpen, setIsHealthCheckModalOpen] = useState(false);
    
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [feedbackContent, setFeedbackContent] = useState('');
    const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);


    useEffect(() => {
        getWeather().then(setWeather);
        seasonalNudgeService.getNudge().then(setNudge);
        diagnosisService.getRecentCases().then(setRecentCases);
    }, []);

    const refreshWeather = () => {
        setWeather(null);
        getWeather().then(setWeather);
    };

    const handleSpeakNudge = () => {
        if (nudge && isSupported) {
            speak(`${t(nudge.title)}. ${t(nudge.message)}`, language);
        }
    };

    const handleHealthCheckSubmit = async (userInput: string) => {
        setIsHealthCheckModalOpen(false); // Close input modal
        setIsFeedbackModalOpen(true); // Open feedback modal
        setIsFetchingFeedback(true);
        setFeedbackContent('');

        const countryCode = localStorage.getItem('userCountry') || 'KE';
        const country = COUNTRIES.find(c => c.code === countryCode)?.name || 'Kenya';
        const diagnoses = recentCases.length > 0
            ? [...new Set(recentCases.slice(0, 3).map(c => c.diagnosis.label))].join(', ')
            : t('health_check_no_diagnoses');

        const prompt = t('health_check_prompt_with_input', {
            name: user.name.split(' ')[0],
            country: country,
            weatherCondition: t(weather?.condition.toLowerCase() || 'unknown'),
            temperature: weather?.temperature || 'unknown',
            diagnoses: diagnoses,
            userInput: userInput,
        });
        
        const systemPrompt = t('ai_system_prompt_farmer');

        try {
            const result = await generateText(prompt, systemPrompt);
            setFeedbackContent(result);
            await userService.addPoints(user.id, 5, 'point_earn_health_check');
            refetchUser();
        } catch (error) {
            console.error(error);
            setFeedbackContent(t('error_gemini_api'));
        } finally {
            setIsFetchingFeedback(false);
        }
    };

    const HealthCheckModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (input: string) => void }> = ({ isOpen, onClose, onSubmit }) => {
        const [concern, setConcern] = useState('');

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (!concern.trim()) return;
            onSubmit(concern);
        };

        return (
            <Modal isOpen={isOpen} onClose={onClose} title={t('health_check_modal_title')}>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="farm-concern" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('health_check_modal_prompt')}
                    </label>
                    <textarea
                        id="farm-concern"
                        rows={4}
                        value={concern}
                        onChange={(e) => setConcern(e.target.value)}
                        placeholder={t('health_check_modal_placeholder')}
                        className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <div className="mt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={!concern.trim()}
                            className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 dark:disabled:bg-gray-600"
                        >
                            {t('health_check_modal_button')}
                        </button>
                    </div>
                </form>
            </Modal>
        );
    };

    const HealthCheckFeedbackModal: React.FC = () => (
        <Modal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} title={t('health_check_feedback_title')}>
            {isFetchingFeedback ? (
                <div className="flex flex-col items-center justify-center h-48">
                    <Spinner />
                    <p className="mt-4 text-gray-600 dark:text-gray-400">{t('health_check_fetching')}</p>
                </div>
            ) : (
                <div>
                    <div className="space-y-4 text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: feedbackContent.replace(/\n/g, '<br />') }}></div>
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => setIsFeedbackModalOpen(false)}
                            className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition"
                        >
                            {t('close')}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
    
    const FeedbackCard: React.FC = () => {
        const [rating, setRating] = useState(0);
        const [feedback, setFeedback] = useState('');
        const [submitted, setSubmitted] = useState(false);

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            if (rating === 0) return;
            // In a real app, this would send to a backend
            await userService.addPoints(user.id, 15, 'point_earn_feedback');
            refetchUser();
            setSubmitted(true);
        };

        if (submitted) {
            return (
                <Card className="col-span-1 flex flex-col items-center justify-center text-center">
                    <Icon name="check-circle" className="w-12 h-12 text-green-500 mb-2" />
                    <p className="font-semibold">{t('feedback_thanks', { points: 15 })}</p>
                </Card>
            );
        }

        return (
            <Card className="col-span-1">
                <h3 className="font-bold text-lg mb-2">{t('share_feedback_title')}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-center mb-3">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} type="button" onClick={() => setRating(star)} className="text-gray-300 dark:text-gray-600 hover:text-yellow-400">
                                <Icon name="star" className={`w-8 h-8 ${rating >= star ? 'text-yellow-400' : ''}`} fill="currentColor" />
                            </button>
                        ))}
                    </div>
                    <textarea
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        placeholder={t('feedback_placeholder')}
                        rows={2}
                        className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm"
                    />
                    <button type="submit" disabled={rating === 0} className="w-full mt-2 bg-green-600 text-white font-semibold py-2 rounded-lg text-sm disabled:bg-gray-400 dark:disabled:bg-gray-600">
                        {t('submit_feedback')}
                    </button>
                </form>
            </Card>
        );
    };
    
    const InterventionsCard: React.FC = () => {
         const tips = [
             { action: 'Mulch now to save water', priority: 'high' },
             { action: 'Rotate crops to avoid pests', priority: 'medium' },
             { action: 'Test soil pH before planting', priority: 'medium' }
         ];

         return (
             <Card className="col-span-1 md:col-span-3 bg-yellow-50 dark:bg-yellow-900/30">
                 <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                     <Icon name="sparkles" className="w-6 h-6 text-yellow-600" />
                     {t('efficiency_interventions')}
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {tips.map((tip, idx) => (
                         <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border-l-4 border-yellow-500">
                             <p className="font-semibold text-sm">{tip.action}</p>
                         </div>
                     ))}
                 </div>
             </Card>
         );
    };

    return (
        <>
            <HealthCheckModal isOpen={isHealthCheckModalOpen} onClose={() => setIsHealthCheckModalOpen(false)} onSubmit={handleHealthCheckSubmit} />
            <HealthCheckFeedbackModal />
            <div className="p-6">
                <h2 className="text-3xl font-bold mb-6 animate-fade-in-up">{t('welcome_back', { name: user.name.split(' ')[0] })}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Health Check Card */}
                    <Card className="col-span-1 md:col-span-3 bg-blue-50 dark:bg-blue-900/30 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                        <Icon name="shield-check" className="w-16 h-16 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <div className="flex-grow">
                            <h3 className="font-bold text-lg">{t('health_check_title')}</h3>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">{t('health_check_desc')}</p>
                        </div>
                        <button 
                            onClick={() => setIsHealthCheckModalOpen(true)}
                            className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-transform active:scale-95 flex-shrink-0 mt-4 md:mt-0"
                        >
                            {t('health_check_button')}
                        </button>
                    </Card>
                    
                    {/* Interventions/Tips Card */}
                    <InterventionsCard />

                    {/* Weather Card */}
                    <Card className="col-span-1 hover:-translate-y-1 transition-transform duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">{t('local_weather')}</h3>
                            <button onClick={refreshWeather} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Refresh">
                                <Icon name="arrows-path" className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        {weather ? (
                            <div className="flex items-center gap-4">
                                <Icon name={weather.condition.toLowerCase() as 'sunny' | 'windy' | 'rainy'} className="w-16 h-16 text-yellow-500" />
                                <div>
                                    <p className="text-4xl font-bold">{weather.temperature}°C</p>
                                    <p className="text-gray-500 dark:text-gray-400">{t(weather.condition.toLowerCase())}, {weather.windSpeed} km/h wind</p>
                                </div>
                            </div>
                        ) : <Spinner />}
                    </Card>

                    {/* Points & Badges Card */}
                    <Card className="col-span-1 hover:-translate-y-1 transition-transform duration-300">
                         <h3 className="font-bold text-lg mb-4">{t('my_progress')}</h3>
                         <div className="flex items-center gap-4">
                            <div className="text-center">
                                <p className="text-4xl font-bold text-green-500">{user.points}</p>
                                <p className="text-gray-500 dark:text-gray-400">{t('points')}</p>
                            </div>
                            <div className="border-l pl-4 dark:border-gray-700">
                                 <p className="font-semibold">{t('badges')}</p>
                                 <div className="flex gap-2 mt-1">
                                    {user.badges?.map(badge => <Tag key={badge} color="yellow">{badge}</Tag>)}
                                 </div>
                            </div>
                         </div>
                    </Card>

                    {/* Feedback Section */}
                    <FeedbackCard />

                    {/* Seasonal Nudge Card */}
                    {nudge && (
                        <Card className="col-span-1 md:col-span-3 bg-green-50 dark:bg-green-900/30">
                            <div className="flex gap-4">
                                <Icon name={nudge.icon} className="w-10 h-10 text-green-600 dark:text-green-400 mt-1" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg">{t(nudge.title)}</h3>
                                        {isSupported && <button onClick={handleSpeakNudge} title={t('read_aloud')}><Icon name="speaker-wave" className="w-5 h-5 text-gray-500" /></button>}
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300">{t(nudge.message)}</p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
};

const FarmerCaseListView: React.FC<{ onSelectCase: (caseId: string) => void }> = ({ onSelectCase }) => {
    const { t } = useLocalization();
    const [cases, setCases] = useState<DiagnosisCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const fetchCases = useCallback(() => {
        setLoading(true);
        setError(null);
        diagnosisService.getRecentCases()
            .then(data => {
                setCases(data);
            })
            .catch(() => {
                 setError(t('error_offline_no_cache'));
            })
            .finally(() => {
                setLoading(false);
            });
    }, [t]);

    useEffect(() => {
        fetchCases();
    }, [fetchCases]);
    
    // Refetch when coming back online
    useEffect(() => {
        if(isOnline) {
            fetchCases();
        }
    }, [isOnline, fetchCases]);


    const statusColors: Record<DiagnosisCase['status'], string> = {
        unverified: 'gray',
        pending_expert_review: 'yellow',
        peer_review: 'yellow',
        verified: 'green',
        rejected: 'red',
    };

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold mb-6">{t('my_cases')}</h2>

            {!isOnline && cases.length > 0 && (
                <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg text-yellow-800 dark:text-yellow-200">
                    <p>{t('offline_showing_cached')}</p>
                </div>
            )}
            
            {loading ? <Spinner /> : error ? (
                 <div className="text-center py-10">
                    <p className="text-gray-500">{error}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {cases.map(c => (
                        <Card key={c.id} className="!p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/80 hover:shadow-lg transition-all" onClick={() => onSelectCase(c.id)}>
                            <img src={c.image} alt={c.scenarioName} className="w-20 h-20 object-cover rounded-lg" />
                            <div className="flex-grow">
                                <p className="font-bold">{c.diagnosis.label}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{c.crop} &middot; {new Date(c.timestamp).toLocaleDateString()}</p>
                            </div>
                             {c.risk === 'high' && (
                                <div className="flex items-center gap-1 text-red-500 font-semibold">
                                    <Icon name="exclamation-triangle" className="w-5 h-5"/>
                                    <span>{t('high_risk')}</span>
                                </div>
                            )}
                            <Tag color={statusColors[c.status]}>{t(c.status)}</Tag>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

const FarmerCaseDetailView: React.FC<{ caseId: string; onBack: () => void; onFindTreatment: (caseId: string, pestName: string) => void; refetchUser: () => void; user: User; }> = ({ caseId, onBack, onFindTreatment, refetchUser, user }) => {
    const { t } = useLocalization();
    const [caseData, setCaseData] = useState<DiagnosisCase | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);

    useEffect(() => {
        diagnosisService.getCase(caseId).then(data => setCaseData(data || null));
        chatService.getMessagesForCase(caseId).then(setMessages);
    }, [caseId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !caseData) return;
        
        const sentMessage = await chatService.sendMessage(caseId, 'J. Mwangi', 'farmer', newMessage);
        setMessages([...messages, sentMessage]);
        setNewMessage('');
    };
    
    const FollowUpModal: React.FC<{ caseData: DiagnosisCase; onClose: () => void; }> = ({ caseData, onClose }) => {
        const handleFollowUp = async (status: FollowUpStatus) => {
            await diagnosisService.updateCase(caseData.id, { followUpStatus: status });
            await userService.addPoints(user.id, 20, 'point_earn_follow_up');
            refetchUser();
            setCaseData(prev => prev ? { ...prev, followUpStatus: status } : null);
            onClose();
        };

        return (
            <Modal isOpen={true} onClose={onClose} title={t('verification_title')}>
                <h3 className="text-lg font-semibold mb-2">{t('verification_subtitle', { pest: caseData.diagnosis.label })}</h3>
                <p className="text-sm mb-4">{t('applied_on', { date: new Date(caseData.applicationLoggedAt!).toLocaleDateString() })}</p>
                <p className="font-semibold mb-4">{t('verification_question')}</p>
                <div className="flex flex-col gap-3">
                    <button onClick={() => handleFollowUp('resolved')} className="w-full text-left p-3 rounded-lg bg-green-100 dark:bg-green-900/50 hover:bg-green-200">{t('outcome_resolved')}</button>
                    <button onClick={() => handleFollowUp('partial')} className="w-full text-left p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/50 hover:bg-yellow-200">{t('outcome_partial')}</button>
                    <button onClick={() => handleFollowUp('no_change')} className="w-full text-left p-3 rounded-lg bg-red-100 dark:bg-red-900/50 hover:bg-red-200">{t('outcome_no_change')}</button>
                </div>
            </Modal>
        )
    };

    if (!caseData) return <Spinner />;
    
    const showFollowUpButton = caseData.applicationLoggedAt && caseData.followUpStatus === 'pending';

    return (
         <div className="p-6 h-full flex flex-col">
            <button onClick={onBack} className="flex items-center gap-2 mb-4 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white">
                <Icon name="arrow-left" className="w-5 h-5" /> {t('back_to_cases')}
            </button>
            <div className="grid grid-cols-3 gap-6 flex-grow">
                {/* Diagnosis Info */}
                <div className="col-span-1">
                    <Card>
                        <img src={caseData.image} alt={caseData.scenarioName} className="w-full h-48 object-cover rounded-lg mb-4" />
                        <h2 className="text-2xl font-bold">{caseData.diagnosis.label}</h2>
                        <p className="italic text-gray-500 dark:text-gray-400 mb-4">{caseData.diagnosis.pestName}</p>
                        <p className="text-sm mb-4">{caseData.diagnosis.explanation}</p>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {caseData.diagnosis.cues.map(cue => <Tag key={cue}>{cue}</Tag>)}
                        </div>
                        {showFollowUpButton ? (
                             <button onClick={() => setIsFollowUpModalOpen(true)} className="w-full bg-yellow-500 text-black font-bold py-3 rounded-lg hover:bg-yellow-600 mb-2">{t('check_results')}</button>
                        ) : (
                             <button onClick={() => onFindTreatment(caseData.id, caseData.diagnosis.label)} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700">{t('sim_btn_find_treatment')}</button>
                        )}
                    </Card>
                </div>
                {/* Chat */}
                <div className="col-span-2 flex flex-col">
                    <Card className="flex-grow flex flex-col">
                        <h3 className="text-lg font-bold mb-4">{t('expert_chat')}</h3>
                        <div className="flex-grow bg-gray-100 dark:bg-gray-900 rounded-lg p-4 space-y-4 overflow-y-auto">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex gap-2 ${msg.senderRole === 'farmer' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${msg.senderRole === 'farmer' ? 'bg-green-500 text-white' : 'bg-white dark:bg-gray-700'}`}>
                                        <p className="text-sm">{msg.message}</p>
                                        <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                            <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder={t('type_message')} className="flex-grow bg-gray-100 dark:bg-gray-900 border dark:border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500" />
                            <button type="submit" className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700"><Icon name="paper-airplane" className="w-6 h-6" /></button>
                        </form>
                    </Card>
                </div>
            </div>
            {isFollowUpModalOpen && <FollowUpModal caseData={caseData} onClose={() => setIsFollowUpModalOpen(false)} />}
         </div>
    );
};

const CommunityFeedView: React.FC = () => {
    const { t } = useLocalization();
    const [alerts, setAlerts] = useState<CommunityAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
    const listContainerRef = useRef<HTMLDivElement>(null);
    const [mapTransform, setMapTransform] = useState<string>('');

    const updateMapFocus = useCallback((alert: CommunityAlert | null) => {
        if (!alert) {
             setMapTransform('');
             return;
        }
        
        const top = parseFloat(alert.mapPosition.top);
        const left = parseFloat(alert.mapPosition.left);
        const translateX = 50 - left;
        const translateY = 50 - top;
        setMapTransform(`scale(1.8) translateX(${translateX}%) translateY(${translateY}%)`);
    }, []);

    useEffect(() => {
        communityAlertService.getAlerts().then(data => {
            const sortedData = data.sort((a, b) => b.timestamp - a.timestamp);
            setAlerts(sortedData);
            setLoading(false);
            if (sortedData.length > 0) {
                const firstAlert = sortedData[0];
                setSelectedAlertId(firstAlert.id);
                updateMapFocus(firstAlert);
            }
        });
    }, [updateMapFocus]);

    const severityStyles: Record<CommunityAlert['severity'], { tagColor: string; pulseColor: string; }> = {
        high: { tagColor: 'red', pulseColor: 'bg-red-500' },
        medium: { tagColor: 'yellow', pulseColor: 'bg-yellow-500' },
        low: { tagColor: 'blue', pulseColor: 'bg-blue-500' },
    };
    
    const handleSelectAlert = (alert: CommunityAlert) => {
        setSelectedAlertId(alert.id);
        updateMapFocus(alert);
    };

    const handleMarkerClick = (alert: CommunityAlert) => {
        handleSelectAlert(alert);
        const element = document.getElementById(`alert-item-${alert.id}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    
    const handleListHover = (alert: CommunityAlert) => {
        updateMapFocus(alert);
    }

    const handleListMouseLeave = () => {
        const selectedAlert = alerts.find(a => a.id === selectedAlertId);
        updateMapFocus(selectedAlert || null);
    };


    return (
        <div className="p-6 h-full flex flex-col">
            <h2 className="text-3xl font-bold mb-6">{t('community_feed')}</h2>
            {loading ? <Spinner /> : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
                    <div 
                        ref={listContainerRef}
                        className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto pr-2"
                        onMouseLeave={handleListMouseLeave}
                    >
                        {alerts.map(alert => (
                            <div 
                                id={`alert-item-${alert.id}`}
                                key={alert.id}
                                onMouseEnter={() => handleListHover(alert)}
                                onClick={() => handleSelectAlert(alert)}
                                className={`p-4 rounded-lg cursor-pointer border-2 transition-all duration-300 ${selectedAlertId === alert.id ? 'border-green-500 shadow-lg scale-105 bg-white dark:bg-gray-800' : 'border-transparent bg-white dark:bg-gray-800 shadow-md'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg">{alert.pestName}</h3>
                                    <Tag color={severityStyles[alert.severity].tagColor}>{t(alert.severity)}</Tag>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{alert.location}</p>
                                <p className="text-sm mt-2 font-semibold">{t('cases_reported_in_7_days', {count: alert.casesReported})}</p>
                            </div>
                        ))}
                         {alerts.length === 0 && <p className="text-gray-500">{t('no_active_alerts')}</p>}
                    </div>

                    <div className="lg:col-span-2 relative bg-gray-200 dark:bg-gray-900 rounded-lg overflow-hidden min-h-[400px] shadow-inner">
                         <div
                            className="absolute inset-0 w-full h-full transition-transform duration-500 ease-in-out"
                            style={{ transform: mapTransform }}
                        >
                            <img src="https://i.imgur.com/G5t0j2f.png" alt="Kenya Map" className="absolute inset-0 w-full h-full object-cover opacity-20 dark:opacity-10" />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-200/50 dark:from-gray-900/50 to-transparent"></div>
                            {alerts.map(alert => (
                                <button
                                    key={alert.id}
                                    onClick={() => handleMarkerClick(alert)}
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 group"
                                    style={{ top: alert.mapPosition.top, left: alert.mapPosition.left }}
                                    aria-label={`View details for ${alert.pestName} alert`}
                                >
                                    <div className={`relative flex items-center justify-center w-4 h-4 rounded-full ${severityStyles[alert.severity].pulseColor} ${selectedAlertId === alert.id ? 'scale-[2] ring-4 ring-white/50' : 'scale-100 ring-2 ring-white/30'}`}>
                                        <div className={`w-full h-full rounded-full animate-ping absolute ${severityStyles[alert.severity].pulseColor} ${selectedAlertId === alert.id ? 'opacity-75' : 'opacity-0'}`}></div>
                                    </div>
                                    <div className={`absolute bottom-full mb-2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2 transition-opacity whitespace-nowrap left-1/2 -translate-x-1/2 pointer-events-none ${selectedAlertId === alert.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        {alert.pestName} @ {alert.location}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <h3 className="absolute top-4 left-4 text-lg font-bold bg-white/50 dark:bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg z-10">{t('alert_map')}</h3>
                    </div>
                </div>
            )}
        </div>
    );
};

const FarmerRewardsView: React.FC<{ user: User; onRedeem: () => void }> = ({ user, onRedeem }) => {
    const { t } = useLocalization();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'store' | 'history'>('store');
    
    useEffect(() => {
        rewardsService.getRewards().then(data => {
            setRewards(data);
            setIsLoading(false);
        });
    }, []);

    const handleRedeem = async (reward: Reward) => {
        if (user.points < reward.cost) return;
        
        const confirmed = window.confirm(t('redeem_confirmation_message', { rewardName: t(reward.nameKey), cost: reward.cost }));
        if (confirmed) {
            try {
                await userService.redeemPoints(user.id, reward.cost, reward.nameKey);
                alert(t('redeem_success_message', { rewardName: t(reward.nameKey) }));
                onRedeem(); // This will trigger a re-fetch of the user object
            } catch (error) {
                alert((error as Error).message);
            }
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">{t('rewards')}</h2>
                <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 font-bold py-2 px-4 rounded-lg">
                    {t('your_points_balance')}: {user.points}
                </div>
            </div>

            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('store')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'store' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        {t('rewards_store')}
                    </button>
                    <button onClick={() => setActiveTab('history')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        {t('points_history')}
                    </button>
                </nav>
            </div>

            {isLoading ? <Spinner /> : activeTab === 'store' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rewards.map(reward => (
                        <Card key={reward.id}>
                            <Icon name={reward.icon} className="w-10 h-10 text-green-500 mb-3" />
                            <h3 className="font-bold text-lg">{t(reward.nameKey)}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 my-2 flex-grow">{t(reward.descriptionKey)}</p>
                            <div className="flex justify-between items-center mt-4">
                                <span className="font-bold text-green-600">{t('cost_points', { cost: reward.cost })}</span>
                                <button
                                    onClick={() => handleRedeem(reward)}
                                    disabled={user.points < reward.cost}
                                    className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg text-sm disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                                >
                                    {user.points < reward.cost ? t('not_enough_points') : t('redeem')}
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                 <Card>
                     <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {user.pointsHistory.map(tx => (
                            <li key={tx.id} className="py-4 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{t(tx.descriptionKey)}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(tx.timestamp).toLocaleString()}</p>
                                </div>
                                <span className={`font-bold text-lg ${tx.points > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {tx.points > 0 ? '+' : ''}{tx.points}
                                </span>
                            </li>
                        ))}
                     </ul>
                </Card>
            )}
        </div>
    );
};

const FarmerMarketView: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useLocalization();
    const [prices, setPrices] = useState<MarketPrice[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        marketService.getPrices(user.county || 'Nakuru').then(data => {
            setPrices(data);
            setIsLoading(false);
        });
    }, [user.county]);
    
    // Helper for Recommendation
    const RecommendationBadge: React.FC<{ crop: string; price: number }> = ({ crop, price }) => {
        const [rec, setRec] = useState<{ action: 'sell' | 'hold'; reasoning: string } | null>(null);
        useEffect(() => {
             marketService.getRecommendation(crop, price).then(setRec);
        }, [crop, price]);

        if (!rec) return <span className="text-gray-400 text-xs">Loading...</span>;
        
        return (
             <div className="flex flex-col items-end">
                <span className={`font-bold px-2 py-1 rounded text-xs ${rec.action === 'sell' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {t(rec.action === 'sell' ? 'sell_recommendation' : 'hold_recommendation')}
                </span>
                <span className="text-[10px] text-gray-500 max-w-[120px] text-right mt-1 leading-tight">{rec.reasoning}</span>
            </div>
        );
    };

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold mb-2">{t('market_prices')}</h2>
            <p className="text-gray-600 mb-6">{user.county || 'Kenya'}</p>
            
            {isLoading ? <Spinner /> : (
                <div className="grid grid-cols-1 gap-4">
                    {prices.map((p, idx) => (
                        <Card key={idx} className="flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg">{p.crop}</h3>
                                <p className="text-sm text-gray-500">{p.unit} &middot; {t(p.source === 'live' ? 'live_price' : 'median_price')}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold">{p.currency} {p.price.toLocaleString()}</p>
                                <div className="flex items-center justify-end gap-1 text-sm">
                                    <span className={p.trend === 'up' ? 'text-green-500' : p.trend === 'down' ? 'text-red-500' : 'text-gray-500'}>
                                        {t(`price_trend_${p.trend}`)}
                                    </span>
                                </div>
                            </div>
                            <RecommendationBadge crop={p.crop} price={p.price} />
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

const FarmerReportsView: React.FC = () => {
     const { t } = useLocalization();
     const [report, setReport] = useState<ProductivityReport | null>(null);

     useEffect(() => {
         // Mock loading report
         setTimeout(() => {
             setReport({
                 id: 'rep-001',
                 week: 'Nov 20 - Nov 26',
                 yieldForecast: '2.5 tons/acre',
                 inputEfficiency: 'Optimal',
                 alertsCount: 2,
                 recommendedActions: [
                     { action: 'Top-dress maize with CAN fertilizer', category: 'soil', priority: 'high' },
                     { action: 'Scout for Fall Armyworm eggs', category: 'pest', priority: 'high' },
                     { action: 'Repair irrigation trench', category: 'water', priority: 'medium' }
                 ]
             });
         }, 500);
     }, []);

     if (!report) return <Spinner />;

     return (
         <div className="p-6">
             <h2 className="text-3xl font-bold mb-6">{t('productivity_report')}</h2>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <Card className="bg-green-50 dark:bg-green-900/20">
                     <h3 className="text-sm font-medium text-gray-500">{t('yield_forecast')}</h3>
                     <p className="text-3xl font-bold text-green-700 dark:text-green-400">{report.yieldForecast}</p>
                 </Card>
                 <Card className="bg-blue-50 dark:bg-blue-900/20">
                     <h3 className="text-sm font-medium text-gray-500">{t('input_efficiency')}</h3>
                     <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{report.inputEfficiency}</p>
                 </Card>
             </div>

             <h3 className="text-xl font-bold mb-4">{t('recommended_actions')}</h3>
             <div className="space-y-3">
                 {report.recommendedActions.map((action, idx) => (
                     <Card key={idx} className="!p-4 flex items-center justify-between border-l-4 border-yellow-500">
                         <div>
                             <p className="font-semibold">{action.action}</p>
                             <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded mt-1 inline-block">{t(`action_category_${action.category}`)}</span>
                         </div>
                         <Tag color={action.priority === 'high' ? 'red' : 'yellow'}>{t(`priority_${action.priority}`)}</Tag>
                     </Card>
                 ))}
             </div>
         </div>
     );
};


const TreatmentFinderView: React.FC<{ initialPestName?: string; initialCaseId?: string; onStartChat: (dealer: AgroDealer, caseData: DiagnosisCase) => void }> = ({ initialPestName, initialCaseId, onStartChat }) => {
    const { t, formatCurrency } = useLocalization();
    const [searchTerm, setSearchTerm] = useState(initialPestName || '');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<ProductDealerResult[]>([]);
    const [substitutes, setSubstitutes] = useState<ProductDealerResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [initialCase, setInitialCase] = useState<DiagnosisCase | null>(null);
    const [expertDealers, setExpertDealers] = useState<AgroDealer[]>([]);
    
    // Filtering and Sorting State
    type SortByType = 'distance' | 'price';
    type FilterByType = 'all' | 'in_stock' | 'has_agronomist';
    const [sortBy, setSortBy] = useState<SortByType>('distance');
    const [filterBy, setFilterBy] = useState<FilterByType>('all');
    
    useEffect(() => {
        if(initialCaseId) {
            diagnosisService.getCase(initialCaseId).then(setInitialCase);
        }
        agroDealerService.getDealersWithAgronomists().then(setExpertDealers);
    }, [initialCaseId]);

    const handleSearch = useCallback(async () => {
        if (!searchTerm.trim()) return;
        setIsLoading(true);
        setError(null);
        setResults([]);
        setSubstitutes([]);
        try {
            const directResults = await agroDealerService.findDealersWithProduct(searchTerm, 'user-location');
            if (directResults.some(r => r.product.quantity > 0)) {
                setResults(directResults);
            } else {
                setResults(directResults); // Show out of stock items
                const smartSubstitutes = await agroDealerService.findSubstitutes(searchTerm);
                setSubstitutes(smartSubstitutes);
            }
        } catch (e) {
            setError(t('error_generic'));
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, t]);

    useEffect(() => {
        if (initialPestName) {
            handleSearch();
        }
    }, [initialPestName, handleSearch]);

    const filteredAndSortedResults = useMemo(() => {
        const allResults = [...results, ...substitutes];
        
        const filtered = allResults.filter(r => {
            if (filterBy === 'in_stock') return r.product.quantity > 0;
            if (filterBy === 'has_agronomist') return r.dealer.hasAgronomist;
            return true;
        });

        return filtered.sort((a, b) => {
            if (sortBy === 'price') return a.product.price - b.product.price;
            return a.dealer.distance - b.dealer.distance; // Default to distance
        });

    }, [results, substitutes, sortBy, filterBy]);
    
    const handleStartConsultation = (dealer: AgroDealer) => {
        if (!initialCase) {
             // If no case is linked, create a dummy one for context
            const dummyCase = diagnosisService.createDummyCaseForPest(searchTerm);
            onStartChat(dealer, dummyCase);
        } else {
            onStartChat(dealer, initialCase);
        }
    };

    const ExpertConnectCard: React.FC<{ dealer: AgroDealer }> = ({ dealer }) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col items-center text-center border border-transparent hover:border-green-500 hover:shadow-lg transition-all">
            <div className="relative">
                <div className="w-16 h-16 bg-green-200 dark:bg-green-700 rounded-full flex items-center justify-center font-bold text-green-700 dark:text-green-200 text-2xl">{dealer.agronomistName?.charAt(0)}</div>
                <span className="absolute bottom-0 right-0 block h-4 w-4 rounded-full bg-green-400 ring-2 ring-white dark:ring-gray-800" />
            </div>
            <h4 className="font-bold mt-2">{dealer.agronomistName}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">{dealer.name}</p>
            <div className="flex items-center gap-1 text-sm text-yellow-600 dark:text-yellow-400 my-2">
                <Icon name="star" className="w-4 h-4 fill-current" />
                <span>{dealer.rating?.toFixed(1)}</span>
            </div>
            <button 
                onClick={() => handleStartConsultation(dealer)}
                className="w-full mt-auto bg-green-600 text-white font-semibold py-2 px-3 rounded-lg text-sm hover:bg-green-700 transition"
            >
                {t('start_chat')}
            </button>
        </div>
    );

    const ProductResultCard: React.FC<{ result: ProductDealerResult }> = ({ result }) => {
        const { product, dealer } = result;
        const isOutOfStock = product.quantity === 0;

        return (
            <Card className={`transition-all ${isOutOfStock ? 'opacity-50 bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <div className="flex items-start gap-3">
                             <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${isOutOfStock ? 'bg-gray-200 dark:bg-gray-700' : 'bg-green-100 dark:bg-green-900'}`}>
                                <Icon name="shield-check" className={`w-7 h-7 ${isOutOfStock ? 'text-gray-400' : 'text-green-600'}`} />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">{product.name}</h4>
                                <p className="text-sm">{t('active_ingredient')}: {product.activeIngredient}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {dealer.name} - {t('distance_km', { distance: dealer.distance })}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <p className="text-2xl font-bold">{formatCurrency(product.price)}</p>
                        {isOutOfStock ? (
                            <Tag color="red">{t('out_of_stock')}</Tag>
                        ) : (
                            <Tag color="green">{t('in_stock')}</Tag>
                        )}
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t dark:border-gray-700 flex items-center justify-between">
                     <div>
                        {dealer.hasAgronomist && <Tag color="blue">{t('expert_advice_available')}</Tag>}
                    </div>
                    <div className="flex items-center gap-2">
                        {dealer.hasAgronomist && (
                            <button 
                                onClick={() => handleStartConsultation(dealer)}
                                className="font-semibold py-2 px-3 rounded-lg text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:hover:bg-blue-900"
                            >
                                {t('start_chat')}
                            </button>
                        )}
                        <button className="font-semibold py-2 px-3 rounded-lg text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600">{t('get_directions')}</button>
                        <button disabled={isOutOfStock} className="font-semibold py-2 px-3 rounded-lg text-sm bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">{t('reserve')}</button>
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold mb-1">{t('treatment_finder_title')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t('portal_subtitle')}</p>

            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder={t('search_treatments_for') + ' ' + (initialCase?.crop || '') + '...'}
                    className="flex-grow bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button type="submit" className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:opacity-50" disabled={isLoading}>
                    <Icon name="sparkles" className="w-6 h-6" />
                </button>
            </form>
            
             {/* Expert Connect Section */}
             {expertDealers.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">{t