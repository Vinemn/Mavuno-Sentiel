// New file: services/rewardsService.ts
import type { Reward } from '../types';

const MOCK_REWARDS: Reward[] = [
  {
    id: 'reward-01',
    nameKey: 'reward_maize_seeds_name',
    descriptionKey: 'reward_maize_seeds_desc',
    cost: 250,
    type: 'seed',
    icon: 'leaf',
  },
  {
    id: 'reward-02',
    nameKey: 'reward_neem_oil_name',
    descriptionKey: 'reward_neem_oil_desc',
    cost: 400,
    type: 'treatment',
    icon: 'shield-check',
  },
  {
    id: 'reward-03',
    nameKey: 'reward_voucher_name',
    descriptionKey: 'reward_voucher_desc',
    cost: 150,
    type: 'voucher',
    icon: 'tag',
  },
   {
    id: 'reward-04',
    nameKey: 'reward_fertilizer_name',
    descriptionKey: 'reward_fertilizer_desc',
    cost: 300,
    type: 'treatment',
    icon: 'shield-check',
  },
];


export const rewardsService = {
  async getRewards(): Promise<Reward[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(MOCK_REWARDS);
      }, 500); // Simulate network latency
    });
  }
};
