
import type { MarketPrice } from '../types';

// Mock data reflecting realistic Kenyan market variance
const MOCK_PRICES: MarketPrice[] = [
    { crop: 'Maize', county: 'Machakos', price: 4500, currency: 'KES', unit: '90kg Bag', trend: 'up', lastUpdated: Date.now(), source: 'live' },
    { crop: 'Maize', county: 'Nakuru', price: 3800, currency: 'KES', unit: '90kg Bag', trend: 'stable', lastUpdated: Date.now() - 86400000, source: '30-day-median' },
    { crop: 'Maize', county: 'Kisumu', price: 5200, currency: 'KES', unit: '90kg Bag', trend: 'up', lastUpdated: Date.now(), source: 'live' },
    { crop: 'Beans', county: 'Machakos', price: 9000, currency: 'KES', unit: '90kg Bag', trend: 'down', lastUpdated: Date.now(), source: 'live' },
    { crop: 'Beans', county: 'Nakuru', price: 8500, currency: 'KES', unit: '90kg Bag', trend: 'stable', lastUpdated: Date.now(), source: 'live' },
    { crop: 'Potatoes', county: 'Nakuru', price: 3500, currency: 'KES', unit: '50kg Bag', trend: 'down', lastUpdated: Date.now(), source: 'live' },
    { crop: 'Tomatoes', county: 'Machakos', price: 4500, currency: 'KES', unit: 'Crate', trend: 'up', lastUpdated: Date.now(), source: 'live' },
];

export const marketService = {
    async getPrices(county: string): Promise<MarketPrice[]> {
        return new Promise(resolve => {
            setTimeout(() => {
                const relevantPrices = MOCK_PRICES.filter(p => p.county === county || p.county === 'Nakuru'); // Fallback to Nakuru (major market) if local not found
                // Deduplicate by crop, preferring local county
                const uniquePrices = Array.from(new Map(relevantPrices.map(p => [p.crop, p])).values());
                resolve(uniquePrices);
            }, 600);
        });
    },

    async getRecommendation(crop: string, currentPrice: number): Promise<{ action: 'sell' | 'hold'; reasoning: string }> {
        return new Promise(resolve => {
            setTimeout(() => {
                // Mock logic: randomly decide based on "market trends"
                const action = Math.random() > 0.5 ? 'sell' : 'hold';
                const reasoning = action === 'sell' 
                    ? `Prices for ${crop} are currently 15% above the 30-day median. Good time to profit.`
                    : `Market is saturated. ${crop} prices are expected to rise in 2 weeks as supply dwindles.`;
                resolve({ action, reasoning });
            }, 400);
        });
    }
};
