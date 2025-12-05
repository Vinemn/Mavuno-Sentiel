// New file: services/diagnosisService.ts
import type { DiagnosisCase, Diagnosis, SymptomAnswers, DiagnosisStatus, MinistryAnalytics, FollowUpStatus } from '../types';
import { SCENARIOS } from '../constants';

const COUNTIES = ['Nakuru', 'Uasin Gishu', 'Kiambu', 'Meru', 'Kakamega', 'Kisumu', 'Bungoma', 'Trans Nzoia', 'Nyeri', 'Machakos'];
const getRandomCounty = () => COUNTIES[Math.floor(Math.random() * COUNTIES.length)];
const RECENT_CASES_CACHE_KEY = 'mavuno_recent_cases';

const HIGH_RISK_PESTS = ['Late Blight', 'Banana Xanthomonas Wilt', 'Maize Lethal Necrosis'];

const getRiskForPest = (pestName: string): 'high' | 'medium' | 'low' => {
    if (HIGH_RISK_PESTS.includes(pestName)) return 'high';
    if (['Gray Leaf Spot', 'Cassava Mosaic Disease'].includes(pestName)) return 'medium';
    return 'low';
}

const getRandomMapPosition = () => ({
    top: `${20 + Math.random() * 60}%`,
    left: `${20 + Math.random() * 60}%`,
});

// Mock database for diagnosis cases
let MOCK_CASES: DiagnosisCase[] = [
    {
        id: 'case-001',
        timestamp: Date.now() - 2 * 86400000,
        farmerId: 'FARMER-007',
        image: SCENARIOS[0].image,
        scenarioName: SCENARIOS[0].name,
        crop: SCENARIOS[0].crop,
        symptomAnswers: { symptomLocation: 'lower_leaves', insectsVisible: 'no' },
        diagnosis: { ...SCENARIOS[0].diagnosis, confidence: 0.78 },
        status: 'pending_expert_review',
        isReviewed: false,
        confidenceSource: 'hybrid',
        ward: getRandomCounty(),
        mapPosition: getRandomMapPosition(),
        risk: getRiskForPest(SCENARIOS[0].diagnosis.label),
    },
    {
        id: 'case-002',
        timestamp: Date.now() - 1 * 86400000,
        farmerId: 'FARMER-012',
        image: SCENARIOS[1].image,
        scenarioName: SCENARIOS[1].name,
        crop: SCENARIOS[1].crop,
        symptomAnswers: { symptomLocation: 'all_over', insectsVisible: 'unsure' },
        diagnosis: { ...SCENARIOS[1].diagnosis, confidence: 0.65 },
        status: 'peer_review',
        isReviewed: false,
        confidenceSource: 'hybrid',
        ward: getRandomCounty(),
        mapPosition: getRandomMapPosition(),
        risk: getRiskForPest(SCENARIOS[1].diagnosis.label),
    },
    {
        id: 'case-003',
        timestamp: Date.now() - 14 * 86400000,
        farmerId: 'FARMER-009',
        image: SCENARIOS[2].image,
        scenarioName: SCENARIOS[2].name,
        crop: SCENARIOS[2].crop,
        symptomAnswers: { symptomLocation: 'stem', insectsVisible: 'no' },
        diagnosis: { ...SCENARIOS[2].diagnosis, confidence: 0.91, label: 'Late Blight' },
        status: 'verified',
        isReviewed: true,
        confidenceSource: 'expert',
        expertNotes: 'Classic late blight presentation. Advised farmer on appropriate fungicide application and crop rotation.',
        applicationLoggedAt: Date.now() - 12 * 86400000,
        followUpStatus: 'pending',
        treatment: { productName: 'Agri-Thrive Fungicide', dealerName: 'GreenFarm Inputs Eldoret', MoA: 'M5' },
        ward: getRandomCounty(),
        mapPosition: getRandomMapPosition(),
        risk: getRiskForPest('Late Blight'),
    },
    {
        id: 'case-004',
        timestamp: Date.now() - 5 * 86400000,
        farmerId: 'FARMER-021',
        image: 'https://picsum.photos/seed/maize-stress/400/600',
        scenarioName: 'Maize with discolored leaves',
        crop: 'Maize',
        symptomAnswers: { symptomLocation: 'lower_leaves', insectsVisible: 'no' },
        diagnosis: { crop: 'Maize', label: 'Nitrogen Deficiency', confidence: 0.82, pestName: 'Abiotic Stress', explanation: 'Yellowing starts at the tip of lower leaves and proceeds down the midrib in a V-shape.', cues: ['V-shape yellowing', 'Lower leaves affected', 'Stunted growth'] },
        status: 'pending_expert_review',
        isReviewed: false,
        confidenceSource: 'hybrid',
        ward: getRandomCounty(),
        mapPosition: getRandomMapPosition(),
        risk: getRiskForPest('Nitrogen Deficiency'),
    },
    {
        id: 'case-005',
        timestamp: Date.now() - 25 * 86400000,
        farmerId: 'FARMER-009',
        image: 'https://picsum.photos/seed/tomato-resolved/400/600',
        scenarioName: SCENARIOS[2].name,
        crop: SCENARIOS[2].crop,
        diagnosis: { ...SCENARIOS[2].diagnosis, confidence: 0.95 },
        status: 'verified',
        isReviewed: true,
        confidenceSource: 'expert',
        applicationLoggedAt: Date.now() - 20 * 86400000,
        followUpStatus: 'resolved',
        treatment: { productName: 'Copper Oxychloride', dealerName: 'Kisumu Agro-Solutions', MoA: 'M1' },
        ward: getRandomCounty(),
        mapPosition: getRandomMapPosition(),
        risk: getRiskForPest(SCENARIOS[2].diagnosis.label),
    },
     // Add more cases for analytics
    ...Array.from({ length: 150 }, (_, i) => ({
        id: `case-10${i}`,
        timestamp: Date.now() - (i + 3) * 1.5 * 86400000,
        farmerId: `FARMER-0${(i % 25) + 10}`,
        image: SCENARIOS[i % SCENARIOS.length].image,
        scenarioName: SCENARIOS[i % SCENARIOS.length].name,
        crop: SCENARIOS[i % SCENARIOS.length].crop,
        diagnosis: { ...SCENARIOS[i % SCENARIOS.length].diagnosis, confidence: Math.random() * (0.95 - 0.6) + 0.6 },
        status: ((i % 4 === 0) ? 'verified' : 'pending_expert_review') as DiagnosisStatus,
        isReviewed: (i % 4 === 0),
        confidenceSource: ((i % 4 === 0) ? 'expert' : (i % 2 === 0 ? 'hybrid' : 'ai')) as 'ai' | 'hybrid' | 'expert',
        ward: getRandomCounty(),
        mapPosition: getRandomMapPosition(),
        applicationLoggedAt: (i % 4 === 0) ? Date.now() - (i + 2) * 2 * 86400000 : undefined,
        followUpStatus: (i % 4 === 0) ? ((i % 8 === 0 ? 'resolved' : 'pending') as FollowUpStatus) : undefined,
        risk: getRiskForPest(SCENARIOS[i % SCENARIOS.length].diagnosis.label),
    }))
];

let nextId = MOCK_CASES.length + 1;

export const diagnosisService = {
  async createCase(
    image: string,
    scenarioName: string,
    crop: string,
    aiDiagnosis: Diagnosis
  ): Promise<DiagnosisCase> {
    const newCase: DiagnosisCase = {
      id: `case-00${nextId++}`,
      timestamp: Date.now(),
      farmerId: `FARMER-${Math.floor(Math.random() * (99 - 15 + 1)) + 15}`,
      image,
      scenarioName,
      crop,
      diagnosis: aiDiagnosis,
      status: 'unverified',
      isReviewed: false,
      confidenceSource: 'ai',
      ward: getRandomCounty(),
      mapPosition: getRandomMapPosition(),
      risk: getRiskForPest(aiDiagnosis.label),
    };
    MOCK_CASES.unshift(newCase);
    return new Promise(resolve => setTimeout(() => resolve(newCase), 200));
  },

  createDummyCaseForPest(pestName: string): DiagnosisCase {
    const baseScenario = SCENARIOS.find(s => s.diagnosis.label === pestName) || SCENARIOS[0];
    return {
      id: `alert-case-${Date.now()}`,
      timestamp: Date.now(),
      farmerId: 'COMMUNITY-ALERT',
      image: baseScenario.image,
      scenarioName: pestName,
      crop: baseScenario.crop,
      diagnosis: {
        crop: baseScenario.crop,
        label: pestName,
        pestName: 'Unknown',
        confidence: 0.99,
        explanation: `Community alert for ${pestName}`,
        cues: [pestName]
      },
      status: 'verified',
      isReviewed: true,
      confidenceSource: 'expert',
      ward: 'Regional',
      mapPosition: getRandomMapPosition(),
      risk: getRiskForPest(pestName),
    }
  },

  async getCase(id: string): Promise<DiagnosisCase | undefined> {
    if (navigator.onLine) {
        try {
            const caseData = await new Promise<DiagnosisCase | undefined>(resolve =>
                setTimeout(() => resolve(MOCK_CASES.find(c => c.id === id)), 200)
            );
            // Also update the main cache if a single case is fetched, to keep it fresh
            if (caseData) {
                const cachedList = JSON.parse(localStorage.getItem(RECENT_CASES_CACHE_KEY) || '[]');
                const index = cachedList.findIndex((c: DiagnosisCase) => c.id === id);
                if (index > -1) {
                    cachedList[index] = caseData;
                } else {
                    cachedList.unshift(caseData);
                }
                localStorage.setItem(RECENT_CASES_CACHE_KEY, JSON.stringify(cachedList));
            }
            return caseData;
        } catch (error) {
            console.error("Network fetch for single case failed, falling back to cache if available", error);
        }
    }

    const cachedList = JSON.parse(localStorage.getItem(RECENT_CASES_CACHE_KEY) || '[]');
    return cachedList.find((c: DiagnosisCase) => c.id === id);
  },

  async updateCase(id: string, updates: Partial<DiagnosisCase>): Promise<DiagnosisCase> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const caseIndex = MOCK_CASES.findIndex(c => c.id === id);
        if (caseIndex === -1) {
          reject(new Error("Case not found"));
          return;
        }
        MOCK_CASES[caseIndex] = { ...MOCK_CASES[caseIndex], ...updates };
        resolve(MOCK_CASES[caseIndex]);
      }, 200);
    });
  },
  
  async getPendingReviewCases(): Promise<DiagnosisCase[]> {
    return new Promise(resolve => {
        setTimeout(() => {
            const pending = MOCK_CASES.filter(c => !c.isReviewed && (c.status === 'pending_expert_review' || c.status === 'peer_review')).sort((a, b) => a.timestamp - b.timestamp);
            resolve(pending);
        }, 300);
    });
  },
  
   async getRecentCases(farmerId?: string): Promise<DiagnosisCase[]> {
    // NOTE: FarmerId is ignored for this simplified cache implementation.
    if (navigator.onLine) {
        try {
            // Simulate network fetch
            const cases = await new Promise<DiagnosisCase[]>(resolve => {
                setTimeout(() => {
                    const allCases = farmerId ? MOCK_CASES.filter(c => c.farmerId === farmerId) : MOCK_CASES;
                    resolve(allCases.slice(0, 10).sort((a, b) => b.timestamp - a.timestamp));
                }, 300);
            });
            localStorage.setItem(RECENT_CASES_CACHE_KEY, JSON.stringify(cases));
            return cases;
        } catch (error) {
            console.error("Network fetch failed, falling back to cache if available", error);
        }
    }

    // Offline or fetch failed, try to return from cache
    const cachedData = localStorage.getItem(RECENT_CASES_CACHE_KEY);
    if (cachedData) {
        return JSON.parse(cachedData);
    }
    
    // If offline and no cache, reject the promise
    return Promise.reject(new Error("Offline and no cached data available."));
  },
  
  async getAllCases(): Promise<DiagnosisCase[]> {
    // A new method to get ALL cases, not just recent ones, for the map view
     if (navigator.onLine) {
        try {
            const cases = await new Promise<DiagnosisCase[]>(resolve => {
                setTimeout(() => {
                    resolve([...MOCK_CASES].sort((a, b) => b.timestamp - a.timestamp));
                }, 300);
            });
            // Don't cache all cases, just the recent ones.
            return cases;
        } catch (error) {
            // Fallback to recent cases cache if full fetch fails
            const cachedData = localStorage.getItem(RECENT_CASES_CACHE_KEY);
            if (cachedData) return JSON.parse(cachedData);
        }
     }
      const cachedData = localStorage.getItem(RECENT_CASES_CACHE_KEY);
      if (cachedData) return JSON.parse(cachedData);
      return Promise.reject(new Error("Offline and no cached data available."));
  },

  async logApplication(caseId: string, MoA: string): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        const caseIndex = MOCK_CASES.findIndex(c => c.id === caseId);
        if (caseIndex !== -1) {
          MOCK_CASES[caseIndex].applicationLoggedAt = Date.now();
          MOCK_CASES[caseIndex].followUpStatus = 'pending';
          if (MOCK_CASES[caseIndex].treatment) {
            MOCK_CASES[caseIndex].treatment!.MoA = MoA;
          }
        }
        resolve();
      }, 300);
    });
  },
  
  async submitVerification(caseId: string, status: 'resolved' | 'partial' | 'no_change'): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        const caseIndex = MOCK_CASES.findIndex(c => c.id === caseId);
        if (caseIndex !== -1) {
          MOCK_CASES[caseIndex].followUpStatus = status;
        }
        resolve();
      }, 300);
    });
  },

  async submitExpertReview(
    caseId: string,
    verdict: 'confirm' | 'correct' | 'reject',
    correctedDiagnosis?: Partial<Diagnosis>,
    notes?: string
  ): Promise<DiagnosisCase> {
     return new Promise((resolve, reject) => {
      setTimeout(() => {
        const caseIndex = MOCK_CASES.findIndex(c => c.id === caseId);
        if (caseIndex === -1) {
          reject(new Error("Case not found"));
          return;
        }
        
        const updatedCase = { ...MOCK_CASES[caseIndex] };
        updatedCase.isReviewed = true;
        updatedCase.expertNotes = notes;

        if (verdict === 'confirm') {
          updatedCase.status = 'verified';
          updatedCase.confidenceSource = 'expert';
        } else if (verdict === 'correct' && correctedDiagnosis) {
          updatedCase.status = 'verified';
          updatedCase.confidenceSource = 'expert';
          updatedCase.diagnosis = { ...updatedCase.diagnosis, ...correctedDiagnosis, confidence: 0.99 };
        } else if (verdict === 'reject') {
          updatedCase.status = 'rejected';
        }
        
        MOCK_CASES[caseIndex] = updatedCase;
        resolve(updatedCase);
      }, 500);
    });
  },

  async getDashboardAnalytics(): Promise<MinistryAnalytics> {
      return new Promise(resolve => setTimeout(() => {
          const resolvedCases = MOCK_CASES.filter(c => c.followUpStatus === 'resolved');
          const totalTreated = MOCK_CASES.filter(c => c.applicationLoggedAt).length;

          const trendData = MOCK_CASES.reduce((acc, c) => {
              const date = new Date(c.timestamp).toISOString().split('T')[0];
              acc[date] = (acc[date] || 0) + 1;
              return acc;
          }, {} as Record<string, number>);

          const hotspotTrend = Object.entries(trendData)
            .map(([date, cases]) => ({ date, cases }))
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-30);

          const wardCounts = MOCK_CASES.reduce((acc, c) => {
              if (c.ward) acc[c.ward] = (acc[c.ward] || 0) + 1;
              return acc;
          }, {} as Record<string, number>);

          const wardCoverage = Object.entries(wardCounts).map(([name, value]) => ({ name, value }));
          
          const diseaseCountyCounts = MOCK_CASES.reduce((acc, c) => {
              if (c.ward) {
                  const key = `${c.ward}|${c.diagnosis.label}`;
                  acc[key] = (acc[key] || 0) + 1;
              }
              return acc;
          }, {} as Record<string, number>);

          const diseaseByCounty = Object.entries(diseaseCountyCounts).map(([key, cases]) => {
              const [county, disease] = key.split('|');
              return { county, disease, cases };
          });
          
          resolve({
              kpis: {
                  timeToDiagnosis: '45 mins',
                  timeToTreatment: '3.1 days',
                  resolutionRate: totalTreated > 0 ? parseFloat((resolvedCases.length / totalTreated * 100).toFixed(1)) : 0,
                  successfulSubstitutions: 18,
                  stockouts: 4,
                  yieldSaved: '2.5 tons (est.)'
              },
              hotspotTrend,
              wardCoverage,
              diseaseByCounty,
              interventionROI: [
                { name: 'Scouting Program', cost: 50000, benefit: 120000 },
                { name: 'SMS Alerts', cost: 15000, benefit: 75000 },
                { name: 'Biocontrol Subsidy', cost: 80000, benefit: 150000 },
              ]
          });
      }, 800));
  },

  async getAnonymizedDataForExport(): Promise<any[]> {
      return new Promise(resolve => setTimeout(() => {
          const anonymized = MOCK_CASES.map(c => ({
              case_date: new Date(c.timestamp).toISOString().split('T')[0],
              crop_type: c.crop,
              diagnosis_label: c.diagnosis.label,
              diagnosis_pest_name: c.diagnosis.pestName,
              ai_confidence: c.diagnosis.confidence.toFixed(2),
              source: c.confidenceSource,
              status: c.status,
              ward: c.ward,
              treatment_applied: !!c.applicationLoggedAt,
              treatment_moa: c.treatment?.MoA || 'N/A',
              resolution_status: c.followUpStatus || 'N/A',
          }));
          resolve(anonymized);
      }, 200));
  }
};