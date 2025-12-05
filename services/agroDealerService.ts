// New file: services/agroDealerService.ts
import type { AgroDealer, Product, ProductDealerResult, DemandHeatItem } from '../types';

const MOCK_PRODUCTS: Omit<Product, 'quantity' | 'price' | 'expiryDate' | 'groupBuy'>[] = [
  {
    id: 'prod-01', name: 'Mancozeb 80WP', sku: 'FNG-MANCO-80WP', activeIngredient: 'Mancozeb', moa: 'M3', unit: '1kg', isBiocontrol: false, isRegistered: true
  },
  {
    id: 'prod-02', name: 'Agri-Thrive Fungicide', sku: 'FNG-AGTHR-500G', activeIngredient: 'Chlorothalonil', moa: 'M5', unit: '500g', isBiocontrol: false, isRegistered: true
  },
  {
    id: 'prod-03', name: 'Copper Oxychloride', sku: 'FNG-COPPER-1KG', activeIngredient: 'Copper Oxychloride', moa: 'M1', unit: '1kg', isBiocontrol: false, isRegistered: true
  },
  {
    id: 'prod-04', name: 'Neem Oil Biopesticide', sku: 'BIO-NEEM-1L', activeIngredient: 'Azadirachtin', moa: 'UN', unit: '1L', isBiocontrol: true, isRegistered: true
  },
  {
    id: 'prod-05', name: 'VirusResist Cassava Stems', sku: 'PLT-CAS-VR-10', activeIngredient: 'Genetic Resistance', moa: 'N/A', unit: 'bundle', isBiocontrol: true, isRegistered: true
  },
  {
    id: 'prod-06', name: 'Pyrethrin Concentrate', sku: 'INS-PYR-500ML', activeIngredient: 'Pyrethrin', moa: '3A', unit: '500ml', isBiocontrol: true, isRegistered: true
  },
];


const MOCK_DEALERS: AgroDealer[] = [
  {
    id: 'dealer-1',
    name: 'Nakuru Agrovet Supplies',
    distance: 2.5,
    address: '123 Kenyatta Ave, Nakuru',
    phone: '+254 712 345 678',
    inventory: [
      { ...MOCK_PRODUCTS[0], quantity: 25, price: 1200, expiryDate: '2025-12-31' },
      { ...MOCK_PRODUCTS[1], quantity: 15, price: 950, expiryDate: '2026-06-30' },
      { ...MOCK_PRODUCTS[3], quantity: 0, price: 2500, expiryDate: '2025-08-01' }, // Out of stock
      { ...MOCK_PRODUCTS[5], quantity: 18, price: 1800, expiryDate: '2025-10-15' },
    ],
    mapPosition: { top: '30%', left: '45%' },
    offersDelivery: true,
    hasAgronomist: true,
    agronomistName: 'Esther Wambui',
    rating: 4.8,
  },
  {
    id: 'dealer-2',
    name: 'GreenFarm Inputs Eldoret',
    distance: 5.1,
    address: '456 Oloo St, Eldoret',
    phone: '+254 723 456 789',
    inventory: [
      { ...MOCK_PRODUCTS[0], quantity: 0, price: 1150, expiryDate: '2025-11-30' }, // Out of stock
      { ...MOCK_PRODUCTS[2], quantity: 30, price: 1500, expiryDate: '2026-02-28' },
      { ...MOCK_PRODUCTS[1], quantity: 8, price: 980, expiryDate: '2025-07-20' }, // Fresher expiry
    ],
    mapPosition: { top: '55%', left: '25%' },
    offersDelivery: false,
    hasAgronomist: false,
    rating: 4.2,
  },
  {
    id: 'dealer-3',
    name: 'Kisumu Agro-Solutions',
    distance: 8.0,
    address: '789 lakeside Rd, Kisumu',
    phone: '+254 734 567 890',
    inventory: [
      { ...MOCK_PRODUCTS[4], quantity: 100, price: 50, expiryDate: '2024-12-31' },
      { ...MOCK_PRODUCTS[2], quantity: 12, price: 1450, expiryDate: '2025-09-15' },
    ],
    mapPosition: { top: '70%', left: '60%' },
    offersDelivery: true,
    hasAgronomist: true,
    agronomistName: 'Peter Omondi',
    rating: 4.5,
  },
   {
    id: 'dealer-4',
    name: 'FarmFirst Nanyuki',
    distance: 12.3,
    address: '321 Equator Lane, Nanyuki',
    phone: '+254 745 678 901',
    inventory: [
      { ...MOCK_PRODUCTS[0], quantity: 50, price: 1100, expiryDate: '2026-10-31', groupBuy: { isActive: true, threshold: 10, current: 4, discountPrice: 950 } }, // Best price + Group Buy
      { ...MOCK_PRODUCTS[1], quantity: 2, price: 900, expiryDate: '2024-11-30' }, // Nearing expiry
    ],
    mapPosition: { top: '20%', left: '75%' },
    offersDelivery: true,
    hasAgronomist: false,
    rating: 4.0,
  },
  {
    id: 'dealer-5',
    name: 'Meru Crop Experts',
    distance: 4.2,
    address: '987 Meru Bypass',
    phone: '+254 756 789 012',
    inventory: [
      { ...MOCK_PRODUCTS[1], quantity: 20, price: 920, expiryDate: '2026-08-15' },
      { ...MOCK_PRODUCTS[5], quantity: 30, price: 1750, expiryDate: '2026-01-20' },
    ],
    mapPosition: { top: '25%', left: '65%' },
    offersDelivery: false,
    hasAgronomist: true,
    agronomistName: 'Grace Kawira',
    rating: 4.9,
  },
];

// FIX: Export service methods as a single object to match import in Dashboard.tsx
export const agroDealerService = {

  async getDealerInventory(dealerId: string): Promise<Product[]> {
      return new Promise(resolve => {
          setTimeout(() => {
              const dealer = MOCK_DEALERS.find(d => d.id === dealerId);
              resolve(dealer ? dealer.inventory : []);
          }, 300);
      });
  },

  async getDemandHeat(): Promise<DemandHeatItem[]> {
      return new Promise(resolve => {
          setTimeout(() => {
              resolve([
                  { pestName: 'Fall Armyworm', searchCount: 142 },
                  { pestName: 'Late Blight', searchCount: 119 },
                  { pestName: 'Gray Leaf Spot', searchCount: 98 },
                  { pestName: 'Cassava Mosaic Disease', searchCount: 75 },
                  { pestName: 'Nitrogen Deficiency', searchCount: 51 },
              ]);
          }, 500);
      });
  },

  /**
   * Simulates finding nearby agro-dealers from a database.
   * @param {string} productName - The product name to filter the dealer list.
   * @param {string} location - The user's location (mocked for this service).
   * @returns {Promise<ProductDealerResult[]>} A promise that resolves with a list of matching products and their dealers.
   */
  async findDealersWithProduct(productName: string, location: string): Promise<ProductDealerResult[]> {
    console.log(`Searching for dealers with '${productName}' near '${location}'`);
    return new Promise(resolve => {
      setTimeout(() => {
        const results: ProductDealerResult[] = [];
        const searchTerms = productName.toLowerCase().split(' ');
        
        MOCK_DEALERS.forEach(dealer => {
           const foundProducts = dealer.inventory.filter(p => {
              const productNameLower = p.name.toLowerCase();
              return searchTerms.every(term => productNameLower.includes(term));
           });

          if (foundProducts.length > 0) {
             foundProducts.forEach(product => {
                results.push({ product, dealer });
             });
          }
        });
        
        // Return all results, sorting will be done on the client
        resolve(results);
      }, 700); // Simulate network latency
    });
  },
  
  async getDealersWithAgronomists(): Promise<AgroDealer[]> {
    return new Promise(resolve => {
        setTimeout(() => {
            const dealers = MOCK_DEALERS.filter(d => d.hasAgronomist)
                                      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
            resolve(dealers);
        }, 400);
    });
  },

  /**
   * Finds and ranks smart substitutes for an out-of-stock product.
   * @param {string} originalProductName - The name of the product that is out of stock.
   * @returns {Promise<ProductDealerResult[]>} A promise that resolves with a ranked list of substitutes.
   */
  async findSubstitutes(originalProductName: string): Promise<ProductDealerResult[]> {
      const originalProductInfo = MOCK_PRODUCTS.find(p => p.name.toLowerCase().includes(originalProductName.toLowerCase()));
      if (!originalProductInfo) return [];

      const today = new Date();
      const substitutes: ProductDealerResult[] = [];

      MOCK_DEALERS.forEach(dealer => {
          dealer.inventory.forEach(product => {
              const isSubstitute = product.id !== originalProductInfo.id && (product.activeIngredient === originalProductInfo.activeIngredient || product.moa === originalProductInfo.moa);
              const isExpired = new Date(product.expiryDate) < today;

              if (isSubstitute && product.quantity > 0 && !isExpired) {
                  substitutes.push({ product, dealer });
              }
          });
      });

      // Rotation-aware ranking: biocontrol > fresh expiry > closest > best price
      substitutes.sort((a, b) => {
          // 1. Biocontrols first
          if (a.product.isBiocontrol && !b.product.isBiocontrol) return -1;
          if (!a.product.isBiocontrol && b.product.isBiocontrol) return 1;
          
          // 2. Freshest expiry date
          const expiryA = new Date(a.product.expiryDate).getTime();
          const expiryB = new Date(b.product.expiryDate).getTime();
          if (expiryA !== expiryB) return expiryB - expiryA;

          // 3. Closest dealer
          if (a.dealer.distance !== b.dealer.distance) return a.dealer.distance - b.dealer.distance;
          
          // 4. Best price
          return a.product.price - b.product.price;
      });
      
      return new Promise(resolve => setTimeout(() => resolve(substitutes), 500));
  },

  /**
   * Simulates reserving a product from a dealer.
   */
  async reserveProduct(productId: string, dealerId: string): Promise<{ success: boolean; reservationCode: string; }> {
      return new Promise(resolve => setTimeout(() => {
          const reservationCode = `MVNO-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
          resolve({ success: true, reservationCode });
      }, 600));
  },

  /**
   * Simulates joining a group buy.
   */
  async joinGroupBuy(productId: string, dealerId: string): Promise<{ success: boolean; message: string; }> {
       return new Promise(resolve => setTimeout(() => {
          resolve({ success: true, message: "You have joined the group buy! We will notify you when the target is reached." });
      }, 400));
  },

  /**
   * Simulates requesting delivery.
   */
  async requestDelivery(dealerId: string): Promise<{ success: boolean; message: string; }> {
       return new Promise(resolve => setTimeout(() => {
          resolve({ success: true, message: "A local Boda rider has been notified and will contact you shortly via SMS to confirm delivery." });
      }, 800));
  },
  
  async getAllDealers(): Promise<AgroDealer[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(MOCK_DEALERS);
      }, 300);
    });
  },
};
