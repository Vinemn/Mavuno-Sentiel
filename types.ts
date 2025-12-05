
// FIX: Replaced incorrect component logic with actual type definitions.

export type Page = 'home' | 'simulator' | 'dashboard' | 'settings';

export type UserRole = 'farmer' | 'expert' | 'ministry' | 'agro-dealer';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  dealerId?: string;
  points: number;
  badges: string[];
  pointsHistory: PointsTransaction[];
  county?: string; // Added for localization of market prices
  primaryCrop?: string; // Added for tailored advice
}

export type Theme = 'light' | 'dark';

export interface Diagnosis {
  label: string;
  confidence: number;
  explanation: string;
  pestName: string;
  cues: string[];
  crop: string;
}

export interface Scenario {
  id: string;
  name: string;
  crop: string;
  image: string;
  diagnosis: Diagnosis;
}

export interface SymptomAnswers {
  symptomLocation: string;
  insectsVisible: string;
}

export type DiagnosisStatus = 'unverified' | 'pending_expert_review' | 'peer_review' | 'verified' | 'rejected';

export type FollowUpStatus = 'pending' | 'resolved' | 'partial' | 'no_change';

export interface DiagnosisCase {
  id: string;
  timestamp: number;
  farmerId: string;
  image: string;
  scenarioName: string;
  crop: string;
  symptomAnswers?: SymptomAnswers;
  diagnosis: Diagnosis;
  status: DiagnosisStatus;
  isReviewed: boolean;
  confidenceSource: 'ai' | 'hybrid' | 'expert';
  expertNotes?: string;
  applicationLoggedAt?: number;
  followUpStatus?: FollowUpStatus;
  treatment?: {
    productName: string;
    dealerName: string;
    MoA?: string;
  };
  ward?: string; // For geolocation analysis
  mapPosition?: {
    top: string;
    left: string;
  };
  risk: 'high' | 'medium' | 'low';
}

export type WeatherCondition = 'Sunny' | 'Windy' | 'Rainy';

export interface Weather {
  condition: WeatherCondition;
  temperature: number;
  windSpeed: number;
}

export interface CommunityAlert {
  id: string;
  pestName: string;
  severity: 'high' | 'medium' | 'low';
  location: string;
  casesReported: number;
  timestamp: number;
  mapPosition: {
    top: string;
    left: string;
  };
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    activeIngredient: string;
    moa: string; // Mode of Action
    unit: string;
    isBiocontrol: boolean;
    isRegistered: boolean;
    quantity: number;
    price: number;
    expiryDate: string;
    groupBuy?: {
        isActive: boolean;
        threshold: number; // units required for discount
        current: number; // units currently in group buy
        discountPrice: number;
    };
}

export interface AgroDealer {
    id: string;
    name: string;
    distance: number;
    address: string;
    phone: string;
    inventory: Product[];
    mapPosition: {
        top: string;
        left: string;
    };
    offersDelivery: boolean;
    hasAgronomist: boolean;
    agronomistName?: string;
    rating?: number;
}

export interface ProductDealerResult {
    product: Product;
    dealer: AgroDealer;
}

export interface SeasonalNudge {
    id: string;
    title: string;
    message: string;
    icon: string;
}

export interface ChatMessage {
    id: string;
    caseId: string;
    dealerId?: string;
    senderName: string;
    senderRole: UserRole;
    message: string;
    timestamp: number;
}

export type Language = 'en' | 'sw' | 'fr' | 'kln' | 'ki' | 'luo' | 'ha' | 'am';


// New types for analytics and dealer features
export interface MinistryAnalytics {
    kpis: {
        timeToDiagnosis: string;
        timeToTreatment: string;
        resolutionRate: number;
        successfulSubstitutions: number;
        stockouts: number;
        yieldSaved: string;
    };
    hotspotTrend: { date: string; cases: number }[];
    wardCoverage: { name: string; value: number }[];
    interventionROI: { name: string; cost: number; benefit: number }[];
    diseaseByCounty: { county: string; disease: string; cases: number }[];
}

export interface DemandHeatItem {
    pestName: string;
    searchCount: number;
}

// New types for notifications
export type NotificationType = 'alert' | 'reservation' | 'group_buy' | 'case_update' | 'reward';

export interface Notification {
  id: string;
  type: NotificationType;
  messageKey: string; // Key for localization
  messageParams: Record<string, string | number>;
  timestamp: number;
  isRead: boolean;
  link?: {
    view: 'alerts' | 'treatment_finder' | 'rewards' | 'market' | 'reports' | 'produce'; // Added 'produce'
    caseId?: string;
  };
}

// New types for SMS/USSD alert broadcasting
export type BroadcastAlertType = 'pest_outbreak' | 'reservation_confirmation';

export interface BroadcastAlert {
  type: BroadcastAlertType;
  params: Record<string, string | number>;
}

// New type for AI Assistant
export interface AIAssistantMessage {
    role: 'user' | 'model';
    text: string;
}

// New type for Map View
export type MapItem =
  | (DiagnosisCase & { itemType: 'case' })
  | (CommunityAlert & { itemType: 'alert' })
  | (AgroDealer & { itemType: 'dealer' });

// New types for Rewards System
export interface Reward {
    id: string;
    nameKey: string;
    descriptionKey: string;
    cost: number;
    type: 'seed' | 'treatment' | 'voucher';
    icon: 'leaf' | 'shield-check' | 'tag';
}

export interface PointsTransaction {
    id: string;
    descriptionKey: string;
    points: number; // Can be positive (earned) or negative (spent)
    timestamp: number;
}

// ADDED: Market Price Types
export interface MarketPrice {
  crop: string;
  county: string;
  price: number;
  currency: string;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: number;
  source: 'live' | '30-day-median';
  unit: string;
}

// ADDED: Productivity Report Types
export interface ProductivityReport {
  id: string;
  week: string;
  yieldForecast: string; // e.g., "2.5 tons/acre"
  inputEfficiency: string; // e.g., "Optimal" or "Over-use"
  alertsCount: number;
  recommendedActions: {
      action: string;
      category: 'soil' | 'water' | 'pest' | 'harvest';
      priority: 'high' | 'medium' | 'low';
  }[];
}

// ADDED: Produce and Market Opportunities
export interface ProduceItem {
    id: string;
    crop: string;
    quantity: number;
    unit: string; // e.g., 'Tons', 'Kgs', 'Crates'
    harvestDate: string;
    notes?: string;
}

export interface MarketOpportunity {
    id: string;
    marketName: string;
    location: string;
    distance: number;
    pricePerUnit: number;
    currency: string;
    demandLevel: 'high' | 'medium' | 'low';
    notes: string;
    transportCostEstimate: number;
}
