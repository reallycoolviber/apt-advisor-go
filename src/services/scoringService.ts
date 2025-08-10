import scoringConfig from '../config/scoringConfig.json';

export interface ScoringMetric {
  key: string;
  name: string;
  weight: number;
  lowerIsBetter: boolean;
  category: 'financial' | 'physical';
}

export interface RecommendationTier {
  threshold: number;
  level: string;
}

export interface ScoringConfig {
  metrics: ScoringMetric[];
  recommendationTiers: RecommendationTier[];
}

export interface MetricBreakdown {
  metricName: string;
  apartmentValue: number | null;
  comparisonAverage: number | null;
  score: number | null;
  assessment: string;
  weight: number;
  category: string;
}

export interface ScoringResult {
  totalScore: number | null;
  recommendationLevel: string;
  detailedBreakdown: MetricBreakdown[];
  comparisonCount: number;
  validMetrics: number;
  totalPossibleWeight: number;
  actualWeight: number;
}

/**
 * Normalize a value to a 0-100 score based on comparison average
 */
function normalize(value: number, comparisonAverage: number, lowerIsBetter: boolean): number {
  if (comparisonAverage === 0) return 50; // Neutral score if no baseline
  
  const ratio = value / comparisonAverage;
  let score: number;
  
  if (lowerIsBetter) {
    // For metrics where lower is better (e.g., price, debt)
    // If value is 50% of average, score = 75
    // If value equals average, score = 50  
    // If value is 150% of average, score = 25
    score = Math.max(0, Math.min(100, 100 - (ratio - 0.5) * 100));
  } else {
    // For metrics where higher is better (e.g., ratings)
    // If value is 150% of average, score = 75
    // If value equals average, score = 50
    // If value is 50% of average, score = 25  
    score = Math.max(0, Math.min(100, (ratio - 0.5) * 100 + 50));
  }
  
  return Math.round(score);
}

/**
 * Get assessment text based on score
 */
function getAssessment(score: number): string {
  if (score >= 85) return 'Utmärkt';
  if (score >= 75) return 'Mycket bra';
  if (score >= 65) return 'Bra';
  if (score >= 55) return 'Godtagbart';
  if (score >= 45) return 'Genomsnittligt';
  if (score >= 35) return 'Under genomsnitt';
  return 'Dåligt';
}

/**
 * Get recommendation level based on final score
 */
function getRecommendationLevel(finalScore: number, tiers: RecommendationTier[]): string {
  for (const tier of tiers) {
    if (finalScore >= tier.threshold) {
      return tier.level;
    }
  }
  return 'Undvik';
}

/**
 * Calculate price per sqm if not already present
 */
function enhanceWithComputedFields(apartment: any): any {
  const enhanced = { ...apartment };
  
  if (enhanced.price && enhanced.size && !enhanced.price_per_sqm) {
    enhanced.price_per_sqm = enhanced.price / enhanced.size;
  }
  
  return enhanced;
}

/**
 * Main scoring function
 */
export function calculateScore(apartmentToScore: any, comparisonApartments: any[]): ScoringResult {
  const config = scoringConfig as ScoringConfig;
  
  // Robustness check
  if (!comparisonApartments || comparisonApartments.length < 1) {
    return {
      totalScore: null,
      recommendationLevel: 'Jämförelse ej möjlig',
      detailedBreakdown: [],
      comparisonCount: 0,
      validMetrics: 0,
      totalPossibleWeight: 0,
      actualWeight: 0
    };
  }

  // Enhance both apartments with computed fields
  const enhancedApartment = enhanceWithComputedFields(apartmentToScore);
  const enhancedComparisons = comparisonApartments.map(enhanceWithComputedFields);

  let totalWeightedScore = 0;
  let totalWeightApplied = 0;
  const breakdown: MetricBreakdown[] = [];
  let validMetrics = 0;

  for (const metric of config.metrics) {
    const apartmentValue = enhancedApartment[metric.key];
    
    // Calculate comparison average from internal list
    const validComparisonValues = enhancedComparisons
      .map(apt => apt[metric.key])
      .filter(val => val !== null && val !== undefined && typeof val === 'number' && isFinite(val));

    // Skip if no comparison data available
    if (validComparisonValues.length === 0) {
      breakdown.push({
        metricName: metric.name,
        apartmentValue: apartmentValue || null,
        comparisonAverage: null,
        score: null,
        assessment: 'Ingen jämförelsedata',
        weight: metric.weight,
        category: metric.category
      });
      continue;
    }

    const comparisonAverage = validComparisonValues.reduce((a, b) => a + b, 0) / validComparisonValues.length;

    // Handle missing apartment value
    if (apartmentValue === null || apartmentValue === undefined || !isFinite(apartmentValue)) {
      breakdown.push({
        metricName: metric.name,
        apartmentValue: null,
        comparisonAverage,
        score: null,
        assessment: 'Data saknas',
        weight: metric.weight,
        category: metric.category
      });
      continue;
    }

    // Calculate normalized score
    const score = normalize(apartmentValue, comparisonAverage, metric.lowerIsBetter);
    const weightedScore = score * metric.weight;
    
    totalWeightedScore += weightedScore;
    totalWeightApplied += metric.weight;
    validMetrics++;
    
    breakdown.push({
      metricName: metric.name,
      apartmentValue,
      comparisonAverage,
      score,
      assessment: getAssessment(score),
      weight: metric.weight,
      category: metric.category
    });
  }

  // Calculate final score
  const totalPossibleWeight = config.metrics.reduce((sum, metric) => sum + metric.weight, 0);
  const finalScore = totalWeightApplied > 0 ? (totalWeightedScore / totalWeightApplied) : 0;
  const recommendationLevel = totalWeightApplied > 0 ? 
    getRecommendationLevel(finalScore, config.recommendationTiers) : 
    'Otillräcklig data';

  return {
    totalScore: totalWeightApplied > 0 ? Math.round(finalScore) : null,
    recommendationLevel,
    detailedBreakdown: breakdown,
    comparisonCount: comparisonApartments.length,
    validMetrics,
    totalPossibleWeight,
    actualWeight: totalWeightApplied
  };
}