// Fix: Create constants.ts to provide mock scenario data
import type { Scenario } from './types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'maize-leaf-spot',
    name: 'Maize with Gray Leaf Spot',
    crop: 'Maize',
    image: 'https://picsum.photos/seed/maize-spot/400/600',
    diagnosis: {
      // FIX: Added missing 'crop' property to match Diagnosis type.
      crop: 'Maize',
      label: 'Gray Leaf Spot',
      confidence: 0.92,
      explanation: 'Characterized by rectangular lesions that are tan or gray and are delimited by the leaf veins. Appears on lower leaves first.',
      pestName: 'Cercospora zeae-maydis',
      cues: ['Rectangular lesions', 'Gray coloration', 'Vein-limited spots'],
    },
  },
  {
    id: 'cassava-mosaic',
    name: 'Cassava with Mosaic Disease',
    crop: 'Cassava',
    image: 'https://picsum.photos/seed/cassava-mosaic/400/600',
    diagnosis: {
      // FIX: Added missing 'crop' property to match Diagnosis type.
      crop: 'Cassava',
      label: 'Cassava Mosaic Disease',
      confidence: 0.95,
      explanation: 'Symptoms include chlorotic mosaic on the leaves, leaf distortion, and overall stunting of the plant. Transmitted by whiteflies.',
      pestName: 'African cassava mosaic virus',
      cues: ['Yellow/green mosaic pattern', 'Distorted leaf shape', 'Stunted growth'],
    },
  },
  {
    id: 'tomato-blight',
    name: 'Tomato with Late Blight',
    crop: 'Tomato',
    image: 'https://picsum.photos/seed/tomato-blight/400/600',
    diagnosis: {
      // FIX: Added missing 'crop' property to match Diagnosis type.
      crop: 'Tomato',
      label: 'Late Blight',
      confidence: 0.88,
      explanation: 'Large, dark brown to black lesions on leaves and stems, often with a fuzzy white mold on the underside. Can rapidly destroy crops.',
      pestName: 'Phytophthora infestans',
      cues: ['Large dark lesions', 'Fuzzy white mold (underside)', 'Stem browning'],
    },
  },
  {
    id: 'coffee-berry-disease',
    name: 'Coffee with Berry Disease (CBD)',
    crop: 'Coffee',
    image: 'https://picsum.photos/seed/coffee-berry/400/600',
    diagnosis: {
      // FIX: Added missing 'crop' property to match Diagnosis type.
      crop: 'Coffee',
      label: 'Coffee Berry Disease',
      confidence: 0.91,
      explanation: 'Presents as dark, sunken, necrotic lesions on green coffee berries, which can lead to premature dropping or mummification.',
      pestName: 'Colletotrichum kahawae',
      cues: ['Dark sunken lesions', 'Necrosis on green berries', 'Scab-like appearance'],
    },
  },
  {
    id: 'banana-wilt',
    name: 'Banana with Xanthomonas Wilt (BXW)',
    crop: 'Banana',
    image: 'https://picsum.photos/seed/banana-wilt/400/600',
    diagnosis: {
      // FIX: Added missing 'crop' property to match Diagnosis type.
      crop: 'Banana',
      label: 'Banana Xanthomonas Wilt',
      confidence: 0.96,
      explanation: 'Causes progressive yellowing and wilting of leaves, premature fruit ripening, and a characteristic yellow bacterial ooze from cut stems.',
      pestName: 'Xanthomonas campestris pv. musacearum',
      cues: ['Progressive leaf yellowing', 'Wilting from top down', 'Yellow bacterial ooze'],
    },
  },
  {
    id: 'bean-rust',
    name: 'Bean with Rust',
    crop: 'Common Bean',
    image: 'https://picsum.photos/seed/bean-rust/400/600',
    diagnosis: {
      // FIX: Added missing 'crop' property to match Diagnosis type.
      crop: 'Common Bean',
      label: 'Bean Rust',
      confidence: 0.85,
      explanation: 'Characterized by small, reddish-brown pustules, primarily on the undersides of leaves. Can cause defoliation in severe cases.',
      pestName: 'Uromyces appendiculatus',
      cues: ['Reddish-brown pustules', 'Powdery spots', 'Leaf underside affected'],
    },
  },
];

export const COUNTRIES = [
  { code: 'KE', name: 'Kenya' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'UG', name: 'Uganda' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'BI', name: 'Burundi' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'MW', name: 'Malawi' },
];
