export interface Evaluation {
  id: string;
  address: string | null;
  size: number | null;
  price: number | null;
  rooms: string | null;
  monthly_fee: number | null;
  planlösning: number | null;
  kitchen: number | null;
  bathroom: number | null;
  bedrooms: number | null;
  surfaces: number | null;
  förvaring: number | null;
  ljusinsläpp: number | null;
  balcony: number | null;
  debt_per_sqm: number | null;
  fee_per_sqm: number | null;
  cashflow_per_sqm: number | null;
  owns_land: boolean | null;
  created_at: string;
  price_per_sqm?: number; // Computed field
}

export interface SavedComparison {
  id: string;
  name: string;
  selected_evaluations: string[];
  selected_fields: string[];
  created_at: string;
}

export interface ComparisonField {
  key: keyof Evaluation;
  label: string;
  type: 'rating' | 'currency' | 'text' | 'number' | 'boolean';
  category: 'basic' | 'physical' | 'financial';
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  field: keyof Evaluation;
  direction: SortDirection;
}

export type TimeFilter = 'all' | 'week' | 'month' | '3months' | 'year' | 'custom';

export interface TimeFilterConfig {
  type: TimeFilter;
  customStart?: Date;
  customEnd?: Date;
}