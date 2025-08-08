export interface EvaluationFormData {
  address: string;
  general: {
    size: string;
    rooms: string;
    price: string;
    finalPrice: string;
    monthlyFee: string;
  };
  financial: {
    debtPerSqm: string;
    cashflowPerSqm: string;
    majorMaintenanceDone: boolean | null;
    ownsLand: boolean | null;
    underhållsplan: string;
  };
  physical: {
    planlösning: number;
    kitchen: number;
    bathroom: number;
    bedrooms: number;
    surfaces: number;
    förvaring: number;
    ljusinsläpp: number;
    balcony: number;
    planlösning_comment: string;
    kitchen_comment: string;
    bathroom_comment: string;
    bedrooms_comment: string;
    surfaces_comment: string;
    förvaring_comment: string;
    ljusinsläpp_comment: string;
    balcony_comment: string;
    comments: string;
  };
}

export interface EvaluationData {
  id?: string;
  user_id?: string;
  source_id?: string;
  address?: string;
  size?: number;
  price?: number;
  rooms?: string;
  monthly_fee?: number;
  debt_per_sqm?: number;
  fee_per_sqm?: number;
  cashflow_per_sqm?: number;
  major_maintenance_done?: boolean;
  owns_land?: boolean;
  planlösning?: number;
  kitchen?: number;
  bathroom?: number;
  bedrooms?: number;
  surfaces?: number;
  förvaring?: number;
  ljusinsläpp?: number;
  balcony?: number;
  planlösning_comment?: string;
  kitchen_comment?: string;
  bathroom_comment?: string;
  bedrooms_comment?: string;
  surfaces_comment?: string;
  förvaring_comment?: string;
  ljusinsläpp_comment?: string;
  balcony_comment?: string;
  underhållsplan?: string;
  comments?: string;
  apartment_url?: string;
  annual_report_url?: string;
  final_price?: number;
  is_draft?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AutoSaveStatus {
  saving: boolean;
  saved: boolean;
  error: string | null;
}