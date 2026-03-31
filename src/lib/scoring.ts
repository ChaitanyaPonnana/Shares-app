// lib/scoring.ts
// Algorithmic scoring for Investment Insight, Risk, Strengths/Weaknesses

export interface StockMetrics {
  pe?: number;
  pb?: number;
  roe?: number;           // as decimal e.g. 0.18 = 18%
  debtToEquity?: number;
  revenueGrowth?: number; // decimal
  profitMargins?: number; // decimal
  dividendYield?: number; // decimal
  freeCashflow?: number;
  beta?: number;
  promoterHolding?: number; // percent 0-100
  marketCap?: number;
  currentPrice?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  earningsGrowth?: number;
}

export interface FundamentalScore {
  total: number;           // 0-100
  breakdown: {
    valuation: number;
    profitability: number;
    growth: number;
    solvency: number;
    shareholding: number;
  };
}

export interface InvestmentSignal {
  signal: "Buy" | "Hold" | "Avoid";
  horizon: "Long Term" | "Mid Term" | "Short Term";
  confidence: number;    // 0-100
  reasoning: string[];
}

export interface RiskLevel {
  level: "Low" | "Moderate" | "High";
  score: number; // 0-100, higher = more risk
  factors: string[];
}

export interface StrengthsWeaknesses {
  strengths: string[];
  weaknesses: string[];
}

// --- Fundamental Score ---
export function computeFundamentalScore(m: StockMetrics): FundamentalScore {
  let valuation = 0;
  let profitability = 0;
  let growth = 0;
  let solvency = 0;
  let shareholding = 0;

  // Valuation (max 25 pts): Low PE/PB = better
  if (m.pe != null) {
    if (m.pe > 0 && m.pe <= 15) valuation += 15;
    else if (m.pe <= 25) valuation += 10;
    else if (m.pe <= 40) valuation += 5;
    else valuation += 0;
  } else { valuation += 8; }

  if (m.pb != null) {
    if (m.pb > 0 && m.pb <= 2) valuation += 10;
    else if (m.pb <= 4) valuation += 6;
    else if (m.pb <= 8) valuation += 3;
    else valuation += 0;
  } else { valuation += 5; }

  // Profitability (max 25 pts)
  if (m.roe != null) {
    const roe = m.roe > 1 ? m.roe / 100 : m.roe;
    if (roe >= 0.2) profitability += 12;
    else if (roe >= 0.15) profitability += 9;
    else if (roe >= 0.10) profitability += 6;
    else if (roe >= 0.05) profitability += 3;
  } else { profitability += 5; }

  if (m.profitMargins != null) {
    const pm = m.profitMargins > 1 ? m.profitMargins / 100 : m.profitMargins;
    if (pm >= 0.2) profitability += 10;
    else if (pm >= 0.12) profitability += 7;
    else if (pm >= 0.06) profitability += 4;
    else if (pm > 0) profitability += 2;
  } else { profitability += 5; }

  if (m.dividendYield != null && m.dividendYield > 0) profitability += 3;

  // Growth (max 20 pts)
  if (m.revenueGrowth != null) {
    const rg = m.revenueGrowth > 1 ? m.revenueGrowth / 100 : m.revenueGrowth;
    if (rg >= 0.2) growth += 10;
    else if (rg >= 0.12) growth += 7;
    else if (rg >= 0.06) growth += 4;
    else if (rg >= 0) growth += 2;
  } else { growth += 5; }

  if (m.earningsGrowth != null) {
    const eg = m.earningsGrowth > 1 ? m.earningsGrowth / 100 : m.earningsGrowth;
    if (eg >= 0.2) growth += 10;
    else if (eg >= 0.12) growth += 7;
    else if (eg >= 0.06) growth += 4;
    else if (eg >= 0) growth += 2;
  } else { growth += 5; }

  // Solvency (max 20 pts)
  if (m.debtToEquity != null) {
    if (m.debtToEquity <= 0.3) solvency += 12;
    else if (m.debtToEquity <= 0.7) solvency += 9;
    else if (m.debtToEquity <= 1.2) solvency += 5;
    else if (m.debtToEquity <= 2.0) solvency += 2;
    else solvency += 0;
  } else { solvency += 7; }

  if (m.freeCashflow != null) {
    if (m.freeCashflow > 0) solvency += 8;
    else if (m.freeCashflow === 0) solvency += 3;
  } else { solvency += 4; }

  // Shareholding (max 10 pts)
  if (m.promoterHolding != null) {
    if (m.promoterHolding >= 60) shareholding += 10;
    else if (m.promoterHolding >= 50) shareholding += 7;
    else if (m.promoterHolding >= 35) shareholding += 4;
    else shareholding += 1;
  } else { shareholding += 5; }

  const total = Math.min(100, valuation + profitability + growth + solvency + shareholding);
  return { total, breakdown: { valuation, profitability, growth, solvency, shareholding } };
}

// --- Investment Signal ---
export function computeInvestmentSignal(m: StockMetrics, score: number): InvestmentSignal {
  const reasoning: string[] = [];
  let signal: "Buy" | "Hold" | "Avoid";
  let horizon: "Long Term" | "Mid Term" | "Short Term" = "Long Term";
  const confidence = Math.round(40 + score * 0.6);

  if (score >= 68) {
    signal = "Buy";
    reasoning.push("Strong fundamental score indicates good investment potential.");
  } else if (score >= 45) {
    signal = "Hold";
    reasoning.push("Mixed fundamentals — suitable for existing holders.");
  } else {
    signal = "Avoid";
    reasoning.push("Weak fundamentals suggest caution.");
  }

  if (m.revenueGrowth != null) {
    const rg = m.revenueGrowth > 1 ? m.revenueGrowth / 100 : m.revenueGrowth;
    if (rg >= 0.15) reasoning.push("Revenue growing at a healthy pace.");
    else if (rg < 0) reasoning.push("Revenue is declining — monitor closely.");
  }
  if (m.pe != null) {
    if (m.pe > 50) { reasoning.push("High PE ratio; growth expectations already priced in."); horizon = "Long Term"; }
    else if (m.pe < 15 && m.pe > 0) { reasoning.push("Attractively valued at current levels."); horizon = "Mid Term"; }
  }
  if (m.roe != null) {
    const roe = m.roe > 1 ? m.roe / 100 : m.roe;
    if (roe >= 0.18) reasoning.push("Excellent return on equity demonstrates capital efficiency.");
    else if (roe < 0.08) reasoning.push("Low ROE — capital deployment could be improved.");
  }
  if (m.debtToEquity != null) {
    if (m.debtToEquity > 1.5) reasoning.push("High debt may pose risk in rising interest rate environment.");
    else if (m.debtToEquity < 0.3) reasoning.push("Very low debt provides financial stability.");
  }
  if (m.beta != null) {
    if (m.beta > 1.3) { reasoning.push("High beta — price may be volatile in short term."); horizon = "Long Term"; }
    else if (m.beta < 0.7) { reasoning.push("Low beta stock — relatively stable price movement."); horizon = "Long Term"; }
  }

  return { signal, horizon, confidence, reasoning };
}

// --- Risk Analysis ---
export function computeRiskLevel(m: StockMetrics): RiskLevel {
  let score = 0;
  const factors: string[] = [];

  if (m.beta != null) {
    if (m.beta > 1.5) { score += 30; factors.push("High volatility (beta > 1.5)"); }
    else if (m.beta > 1.0) { score += 15; factors.push("Moderate volatility (beta > 1.0)"); }
    else { factors.push("Low market volatility"); }
  } else { score += 10; }

  if (m.debtToEquity != null) {
    if (m.debtToEquity > 2.0) { score += 30; factors.push("Very high leverage"); }
    else if (m.debtToEquity > 1.0) { score += 15; factors.push("Moderate leverage"); }
    else { factors.push("Low financial leverage"); }
  } else { score += 10; }

  if (m.profitMargins != null) {
    const pm = m.profitMargins > 1 ? m.profitMargins / 100 : m.profitMargins;
    if (pm < 0.05) { score += 20; factors.push("Thin profit margins"); }
    else if (pm < 0.10) { score += 10; }
    else { factors.push("Healthy profit margins"); }
  } else { score += 8; }

  if (m.freeCashflow != null && m.freeCashflow < 0) {
    score += 20;
    factors.push("Negative free cash flow");
  }

  const clampedScore = Math.min(100, score);
  const level: "Low" | "Moderate" | "High" = clampedScore >= 55 ? "High" : clampedScore >= 30 ? "Moderate" : "Low";
  return { level, score: clampedScore, factors };
}

// --- Strengths & Weaknesses ---
export function computeStrengthsWeaknesses(m: StockMetrics): StrengthsWeaknesses {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // ROE
  if (m.roe != null) {
    const roe = m.roe > 1 ? m.roe / 100 : m.roe;
    if (roe >= 0.18) strengths.push(`High return on equity (${(roe * 100).toFixed(1)}%), indicating efficient use of capital.`);
    else if (roe < 0.08) weaknesses.push(`Low return on equity (${(roe * 100).toFixed(1)}%)`);
  }

  // Revenue Growth
  if (m.revenueGrowth != null) {
    const rg = m.revenueGrowth > 1 ? m.revenueGrowth / 100 : m.revenueGrowth;
    if (rg >= 0.15) strengths.push(`Strong revenue growth of ${(rg * 100).toFixed(1)}% YoY.`);
    else if (rg < 0) weaknesses.push(`Declining revenue (${(rg * 100).toFixed(1)}% YoY).`);
    else if (rg < 0.06) weaknesses.push("Slow revenue growth — below industry average.");
  }

  // Earnings Growth
  if (m.earningsGrowth != null) {
    const eg = m.earningsGrowth > 1 ? m.earningsGrowth / 100 : m.earningsGrowth;
    if (eg >= 0.15) strengths.push(`Strong earnings growth of ${(eg * 100).toFixed(1)}% YoY.`);
    else if (eg < 0) weaknesses.push("Declining earnings signal profitability pressure.");
  }

  // Debt
  if (m.debtToEquity != null) {
    if (m.debtToEquity < 0.4) strengths.push("Low debt-to-equity ratio — strong balance sheet.");
    else if (m.debtToEquity > 1.5) weaknesses.push(`High debt-to-equity (${m.debtToEquity.toFixed(2)}x) increases financial risk.`);
  }

  // Profit Margins
  if (m.profitMargins != null) {
    const pm = m.profitMargins > 1 ? m.profitMargins / 100 : m.profitMargins;
    if (pm >= 0.18) strengths.push(`Excellent profit margin of ${(pm * 100).toFixed(1)}%.`);
    else if (pm < 0.06 && pm >= 0) weaknesses.push("Thin profit margins leave little buffer.");
    else if (pm < 0) weaknesses.push("Company is operating at a loss.");
  }

  // PE Ratio
  if (m.pe != null) {
    if (m.pe > 0 && m.pe <= 15) strengths.push("Attractively valued at low PE — potential upside.");
    else if (m.pe > 50) weaknesses.push(`High PE ratio (${m.pe.toFixed(1)}x) — stock may be overvalued.`);
  }

  // Promoter Holding
  if (m.promoterHolding != null) {
    if (m.promoterHolding >= 60) strengths.push(`High promoter holding (${m.promoterHolding.toFixed(1)}%) shows strong management confidence.`);
    else if (m.promoterHolding < 30) weaknesses.push("Low promoter holding may indicate limited insider conviction.");
  }

  // Free Cash Flow
  if (m.freeCashflow != null) {
    if (m.freeCashflow > 0) strengths.push("Positive free cash flow supports dividends and reinvestment.");
    else weaknesses.push("Negative free cash flow — may need external financing.");
  }

  // Dividend
  if (m.dividendYield != null && m.dividendYield > 0.02) {
    strengths.push(`Attractive dividend yield of ${(m.dividendYield * 100).toFixed(2)}%.`);
  }

  return { strengths, weaknesses };
}

export function computeAISummary(
  m: StockMetrics,
  score: number,
  signal: InvestmentSignal,
  risk: RiskLevel
): string {
  const scoreLabel = score >= 68 ? "strong" : score >= 45 ? "moderate" : "weak";
  const riskStr = risk.level.toLowerCase();
  const pe = m.pe ? `PE of ${m.pe.toFixed(1)}x` : "no PE data";
  const roe = m.roe ? `ROE of ${((m.roe > 1 ? m.roe / 100 : m.roe) * 100).toFixed(1)}%` : "ROE data unavailable";

  return `This stock shows ${scoreLabel} fundamentals with a score of ${score}/100. ` +
    `With a ${pe} and ${roe}, the company demonstrates ${score >= 60 ? "healthy" : "mixed"} financial metrics. ` +
    `Risk is assessed as ${riskStr}. ` +
    (signal.signal === "Buy"
      ? `The stock appears suitable for ${signal.horizon.toLowerCase()} investors seeking capital appreciation.`
      : signal.signal === "Hold"
        ? `Existing investors may consider holding while monitoring for fundamental improvements.`
        : `Caution is advised — consider waiting for better entry points or stronger fundamentals.`);
}
