// New file: services/userService.ts
import type { User, PointsTransaction } from '../types';

// In-memory mock user database
let MOCK_USERS: Record<string, User> = {
  'user-farmer-01': {
    id: 'user-farmer-01',
    role: 'farmer',
    name: 'J. Mwangi',
    points: 125,
    badges: ['Pioneer', 'Bug Hunter'],
    pointsHistory: [
        { id: 'ph-1', descriptionKey: 'point_earn_new_case', points: 10, timestamp: Date.now() - 86400000 * 2 },
        { id: 'ph-2', descriptionKey: 'point_earn_health_check', points: 5, timestamp: Date.now() - 86400000 },
    ],
  },
  'user-expert-01': { id: 'user-expert-01', name: 'Dr. A. Okoro', role: 'expert', points: 0, badges: [], pointsHistory: [] },
  'user-ministry-01': { id: 'user-ministry-01', name: 'Director K.', role: 'ministry', points: 0, badges: [], pointsHistory: [] },
  'user-dealer-01': { id: 'user-dealer-01', name: 'S. Kipchoge', role: 'agro-dealer', dealerId: 'dealer-1', points: 0, badges: [], pointsHistory: [] },
};

export const userService = {
  async getUser(userId: string): Promise<User | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const user = MOCK_USERS[userId];
        if (user) {
          // Return a deep copy to prevent direct mutation
          resolve(JSON.parse(JSON.stringify(user)));
        } else {
          resolve(null);
        }
      }, 150);
    });
  },

  async addPoints(userId: string, points: number, descriptionKey: string): Promise<User | null> {
    return new Promise(resolve => {
      setTimeout(() => {
        const user = MOCK_USERS[userId];
        if (user) {
          user.points += points;
          user.pointsHistory.unshift({
            id: `ph-${Date.now()}`,
            descriptionKey,
            points,
            timestamp: Date.now(),
          });
          resolve(JSON.parse(JSON.stringify(user)));
        } else {
          resolve(null);
        }
      }, 200);
    });
  },

  async redeemPoints(userId: string, cost: number, rewardNameKey: string): Promise<User | null> {
     return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = MOCK_USERS[userId];
        if (user) {
          if (user.points >= cost) {
             user.points -= cost;
             user.pointsHistory.unshift({
                id: `ph-${Date.now()}`,
                descriptionKey: 'point_redeem_reward', // Use a generic key
                points: -cost, // Negative for redemption
                timestamp: Date.now(),
            });
            resolve(JSON.parse(JSON.stringify(user)));
          } else {
              reject(new Error("Not enough points"));
          }
        } else {
          reject(new Error("User not found"));
        }
      }, 300);
    });
  },
};
