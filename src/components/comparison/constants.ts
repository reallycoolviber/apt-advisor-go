import { ComparisonField } from './types';

export const COMPARISON_FIELDS: ComparisonField[] = [
  { key: 'address', label: 'Adress', type: 'text', category: 'basic' },
  { key: 'size', label: 'Storlek (kvm)', type: 'number', category: 'basic' },
  { key: 'price', label: 'Pris', type: 'currency', category: 'basic' },
  { key: 'rooms', label: 'Rum', type: 'text', category: 'basic' },
  { key: 'monthly_fee', label: 'Månadsavgift', type: 'currency', category: 'basic' },
  { key: 'planlösning', label: 'Planlösning', type: 'rating', category: 'physical' },
  { key: 'kitchen', label: 'Kök', type: 'rating', category: 'physical' },
  { key: 'bathroom', label: 'Badrum', type: 'rating', category: 'physical' },
  { key: 'bedrooms', label: 'Sovrum', type: 'rating', category: 'physical' },
  { key: 'surfaces', label: 'Ytor', type: 'rating', category: 'physical' },
  { key: 'förvaring', label: 'Förvaring', type: 'rating', category: 'physical' },
  { key: 'ljusinsläpp', label: 'Ljusinsläpp', type: 'rating', category: 'physical' },
  { key: 'balcony', label: 'Balkong/Uteplats', type: 'rating', category: 'physical' },
  { key: 'debt_per_sqm', label: 'Skuld per kvm', type: 'currency', category: 'financial' },
  { key: 'fee_per_sqm', label: 'Avgift per kvm', type: 'currency', category: 'financial' },
  { key: 'cashflow_per_sqm', label: 'Kassaflöde per kvm', type: 'currency', category: 'financial' },
  { key: 'owns_land', label: 'Äger mark', type: 'boolean', category: 'financial' },
];

// Add price per sqm as a computed field
const PRICE_PER_SQM_FIELD: ComparisonField = {
  key: 'price_per_sqm',
  label: 'Pris per kvm',
  type: 'currency',
  category: 'basic'
};

export const COMPARISON_FIELDS_WITH_COMPUTED: ComparisonField[] = [
  ...COMPARISON_FIELDS,
  PRICE_PER_SQM_FIELD
];

export const DEFAULT_FIELDS = [
  'address', 
  'size', 
  'price', 
  'price_per_sqm', 
  'debt_per_sqm', 
  'cashflow_per_sqm'
];