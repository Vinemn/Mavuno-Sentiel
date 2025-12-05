
import type { MarketOpportunity, ProduceItem } from '../types';

// Mock database of market opportunities in Kenya
const MARKET_DB: Record<string, any[]> = {
    'Mangoes': [
        { name: 'Marikiti Market', location: 'Nairobi', basePrice: 35, unit: 'kg', demand: 'high', coords: { lat: -1.28, lng: 36.82 } },
        { name: 'Kongowea Market', location: 'Mombasa', basePrice: 45, unit: 'kg', demand: 'high', coords: { lat: -4.04, lng: 39.66 } },
        { name: 'Machakos Town Market', location: 'Machakos', basePrice: 20, unit: 'kg', demand: 'medium', coords: { lat: -1.51, lng: 37.26 } },
        { name: 'Local Export Agent', location: 'Embu', basePrice: 55, unit: 'kg', demand: 'high', coords: { lat: -0.53, lng: 37.45 } }
    ],
    'Maize': [
        { name: 'NCPB Depot', location: 'Eldoret', basePrice: 3500, unit: '90kg Bag', demand: 'high', coords: { lat: 0.51, lng: 35.26 } },
        { name: 'Gikomba Market', location: 'Nairobi', basePrice: 4200, unit: '90kg Bag', demand: 'high', coords: { lat: -1.28, lng: 36.83 } },
        { name: 'Kitale Millers', location: 'Kitale', basePrice: 3200, unit: '90kg Bag', demand: 'medium', coords: { lat: 1.01, lng: 35.00 } }
    ],
    'Tomatoes': [
        { name: 'Wakulima Market', location: 'Nairobi', basePrice: 6000, unit: 'Crate', demand: 'high', coords: { lat: -1.28, lng: 36.82 } },
        { name: 'Nakuru Top Market', location: 'Nakuru', basePrice: 4500, unit: 'Crate', demand: 'medium', coords: { lat: -0.30, lng: 36.08 } }
    ],
    'Avocados': [
        { name: 'Kakuzi Export Center', location: 'Muranga', basePrice: 85, unit: 'kg', demand: 'high', coords: { lat: -0.72, lng: 37.15 } },
        { name: 'City Park Market', location: 'Nairobi', basePrice: 60, unit: 'kg', demand: 'medium', coords: { lat: -1.26, lng: 36.80 } }
    ]
};

// Mock harvest logs
const MOCK_HARVEST_LOGS: ProduceItem[] = [
    { id: 'h-1', crop: 'Maize', quantity: 20, unit: 'Bags (90kg)', harvestDate: '2023-11-15' },
    { id: 'h-2', crop: 'Tomatoes', quantity: 5, unit: 'Crates', harvestDate: '2023-11-10' }
];

export const produceService = {
    async logHarvest(item: ProduceItem): Promise<void> {
        return new Promise(resolve => {
            setTimeout(() => {
                MOCK_HARVEST_LOGS.unshift(item);
                resolve();
            }, 300);
        });
    },

    async getHarvestLogs(): Promise<ProduceItem[]> {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([...MOCK_HARVEST_LOGS]);
            }, 300);
        });
    },

    async getMarketOpportunities(produce: ProduceItem): Promise<MarketOpportunity[]> {
        return new Promise(resolve => {
            setTimeout(() => {
                const opportunities: MarketOpportunity[] = [];
                const markets = MARKET_DB[produce.crop] || [];

                // Simple mock logic for distance and pricing adjustment
                markets.forEach((market, index) => {
                    // Mock random distance based on user 'location' (abstracted here)
                    const distance = Math.floor(Math.random() * 300) + 10; 
                    
                    // Price fluctuation logic
                    const variance = (Math.random() * 0.2) - 0.1; // +/- 10%
                    const adjustedPrice = Math.round(market.basePrice * (1 + variance));
                    
                    // Transport cost estimate (approx 20 KES per km per ton, scaled down for demo)
                    const transportCost = Math.round(distance * 15 * (produce.quantity / 10)); // Rough calculation

                    opportunities.push({
                        id: `mkt-${index}`,
                        marketName: market.name,
                        location: market.location,
                        distance: distance,
                        pricePerUnit: adjustedPrice,
                        currency: 'KES',
                        demandLevel: market.demand,
                        transportCostEstimate: transportCost > 500 ? transportCost : 500, // Min transport
                        notes: market.demand === 'high' ? 'High demand due to shortage in region.' : 'Standard seasonal prices.'
                    });
                });

                // Sort by highest potential revenue (Price - Transport) - simplified
                resolve(opportunities.sort((a, b) => b.pricePerUnit - a.pricePerUnit));
            }, 800);
        });
    }
};
