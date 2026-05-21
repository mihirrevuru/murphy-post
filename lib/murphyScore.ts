export interface Edition {
  id: string;
  headline: string;
  probability: string;
  probability_context: string;
  body: string;
  verdict: string;
  timestamp: string;
  score_contribution: number;
}

export function calculateScore(editions: Edition[]): number {
  const total = editions.reduce((sum, e) => sum + (e.score_contribution ?? 0), 0);
  return Math.min(total, 100);
}
