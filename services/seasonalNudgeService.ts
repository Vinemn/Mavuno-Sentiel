
import type { SeasonalNudge } from '../types';

const MOCK_NUDGES: SeasonalNudge[] = [
    {
        id: 'nudge-01',
        title: 'seasonal_tip_title',
        message: 'planting_season_nudge',
        icon: 'calendar-days',
    }
];


export const seasonalNudgeService = {
  async getNudge(): Promise<SeasonalNudge | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        // In a real app, this would have logic based on date, location, etc.
        // For now, we just return the first mock nudge.
        resolve(MOCK_NUDGES[0]);
      }, 600);
    });
  }
};
