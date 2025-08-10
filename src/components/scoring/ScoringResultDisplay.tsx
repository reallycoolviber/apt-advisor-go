import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ScoringResult } from '@/services/scoringService';
import { formatValue } from '@/utils/formatValue';

interface ScoringResultDisplayProps {
  result: ScoringResult;
  apartmentAddress?: string;
}

export function ScoringResultDisplay({ result, apartmentAddress }: ScoringResultDisplayProps) {
  if (result.recommendationLevel === 'Jämförelse ej möjlig') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Poängbedömning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Inte tillräckligt med jämförelsedata för att beräkna poäng
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return 'bg-muted';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRecommendationColor = (level: string) => {
    if (level.includes('Utmärkt') || level.includes('Mycket bra')) return 'bg-green-100 text-green-800';
    if (level.includes('Bra') || level.includes('Godtagbart')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getTrendIcon = (score: number | null) => {
    if (!score) return <Minus className="h-4 w-4" />;
    if (score >= 60) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (score >= 40) return <Minus className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const financialMetrics = result.detailedBreakdown.filter(m => m.category === 'financial');
  const physicalMetrics = result.detailedBreakdown.filter(m => m.category === 'physical');

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Totalpoäng</span>
            <Badge variant="secondary" className={getRecommendationColor(result.recommendationLevel)}>
              {result.recommendationLevel}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">
                  {result.totalScore ? `${result.totalScore}/100` : 'N/A'}
                </span>
                {getTrendIcon(result.totalScore)}
              </div>
              <Progress 
                value={result.totalScore || 0} 
                className="h-2"
              />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>Jämförelser: {result.comparisonCount}</div>
            <div>Giltiga mätvärden: {result.validMetrics}</div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Ekonomiska faktorer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {financialMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{metric.metricName}</span>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(metric.score)}
                      <span className="text-sm font-medium">
                        {metric.score ? `${metric.score}/100` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <span>Ditt värde: {metric.apartmentValue ? formatValue(metric.apartmentValue, getFormatType(metric.metricName)) : 'Saknas'}</span>
                    {metric.comparisonAverage && (
                      <span className="ml-4">
                        Snitt: {formatValue(metric.comparisonAverage, getFormatType(metric.metricName))}
                      </span>
                    )}
                  </div>
                  {metric.score && (
                    <Progress 
                      value={metric.score} 
                      className="h-1 mt-2"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Physical Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Fysiska faktorer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {physicalMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{metric.metricName}</span>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(metric.score)}
                      <span className="text-sm font-medium">
                        {metric.score ? `${metric.score}/100` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <span>Ditt betyg: {metric.apartmentValue ? `${metric.apartmentValue}/5` : 'Saknas'}</span>
                    {metric.comparisonAverage && (
                      <span className="ml-4">
                        Snitt: {metric.comparisonAverage.toFixed(1)}/5
                      </span>
                    )}
                  </div>
                  {metric.score && (
                    <Progress 
                      value={metric.score} 
                      className="h-1 mt-2"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getFormatType(metricName: string): string {
  if (metricName.includes('Pris per kvm') || metricName.includes('Skuld per kvm') || metricName.includes('Avgift per kvm')) {
    return 'price_per_sqm';
  }
  if (metricName.includes('Kassaflöde per kvm')) {
    return 'fee_per_sqm';
  }
  return 'number';
}