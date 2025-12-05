
import type { CommunityAlert } from '../types';

const MOCK_ALERTS: CommunityAlert[] = [
    {
        id: 'alert-01',
        pestName: 'Fall Armyworm',
        severity: 'high',
        location: 'Uasin Gishu County',
        casesReported: 42,
        timestamp: Date.now() - 1 * 86400000,
        mapPosition: { top: '38%', left: '35%' },
    },
    {
        id: 'alert-02',
        pestName: 'Cassava Mosaic Disease',
        severity: 'medium',
        location: 'Kisumu County',
        casesReported: 15,
        timestamp: Date.now() - 3 * 86400000,
        mapPosition: { top: '65%', left: '28%' },
    },
    {
        id: 'alert-03',
        pestName: 'Maize Lethal Necrosis',
        severity: 'high',
        location: 'Bomet County',
        casesReported: 25,
        timestamp: Date.now() - 5 * 86400000,
        mapPosition: { top: '58%', left: '42%' },
    },
    {
        id: 'alert-04',
        pestName: 'Late Blight',
        severity: 'low',
        location: 'Nyandarua County',
        casesReported: 8,
        timestamp: Date.now() - 2 * 86400000,
        mapPosition: { top: '50%', left: '60%' },
    }
];

export const communityAlertService = {
    async getAlerts(): Promise<CommunityAlert[]> {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(MOCK_ALERTS);
            }, 400); // Simulate network latency
        });
    }
};
