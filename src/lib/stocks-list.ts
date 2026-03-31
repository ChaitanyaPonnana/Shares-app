// lib/stocks-list.ts
// Top NSE & BSE listed stocks with symbols
export interface StockInfo {
  symbol: string;     // Yahoo Finance symbol (e.g. RELIANCE.NS)
  name: string;
  exchange: "NSE" | "BSE";
  nseSymbol?: string;
  sector?: string;
}

export const POPULAR_STOCKS: StockInfo[] = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries Ltd", exchange: "NSE", nseSymbol: "RELIANCE", sector: "Energy" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services Ltd", exchange: "NSE", nseSymbol: "TCS", sector: "IT" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd", exchange: "NSE", nseSymbol: "HDFCBANK", sector: "Banking" },
  { symbol: "INFY.NS", name: "Infosys Ltd", exchange: "NSE", nseSymbol: "INFY", sector: "IT" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank Ltd", exchange: "NSE", nseSymbol: "ICICIBANK", sector: "Banking" },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever Ltd", exchange: "NSE", nseSymbol: "HINDUNILVR", sector: "FMCG" },
  { symbol: "SBIN.NS", name: "State Bank of India", exchange: "NSE", nseSymbol: "SBIN", sector: "Banking" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel Ltd", exchange: "NSE", nseSymbol: "BHARTIARTL", sector: "Telecom" },
  { symbol: "ITC.NS", name: "ITC Ltd", exchange: "NSE", nseSymbol: "ITC", sector: "FMCG" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank Ltd", exchange: "NSE", nseSymbol: "KOTAKBANK", sector: "Banking" },
  { symbol: "LT.NS", name: "Larsen & Toubro Ltd", exchange: "NSE", nseSymbol: "LT", sector: "Infrastructure" },
  { symbol: "AXISBANK.NS", name: "Axis Bank Ltd", exchange: "NSE", nseSymbol: "AXISBANK", sector: "Banking" },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints Ltd", exchange: "NSE", nseSymbol: "ASIANPAINT", sector: "Paints" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki India Ltd", exchange: "NSE", nseSymbol: "MARUTI", sector: "Auto" },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance Ltd", exchange: "NSE", nseSymbol: "BAJFINANCE", sector: "NBFC" },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical Industries Ltd", exchange: "NSE", nseSymbol: "SUNPHARMA", sector: "Pharma" },
  { symbol: "WIPRO.NS", name: "Wipro Ltd", exchange: "NSE", nseSymbol: "WIPRO", sector: "IT" },
  { symbol: "HCLTECH.NS", name: "HCL Technologies Ltd", exchange: "NSE", nseSymbol: "HCLTECH", sector: "IT" },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors Ltd", exchange: "NSE", nseSymbol: "TATAMOTORS", sector: "Auto" },
  { symbol: "TATASTEEL.NS", name: "Tata Steel Ltd", exchange: "NSE", nseSymbol: "TATASTEEL", sector: "Metals" },
  { symbol: "NTPC.NS", name: "NTPC Ltd", exchange: "NSE", nseSymbol: "NTPC", sector: "Power" },
  { symbol: "ONGC.NS", name: "Oil & Natural Gas Corp Ltd", exchange: "NSE", nseSymbol: "ONGC", sector: "Energy" },
  { symbol: "POWERGRID.NS", name: "Power Grid Corporation of India", exchange: "NSE", nseSymbol: "POWERGRID", sector: "Power" },
  { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement Ltd", exchange: "NSE", nseSymbol: "ULTRACEMCO", sector: "Cement" },
  { symbol: "TITAN.NS", name: "Titan Company Ltd", exchange: "NSE", nseSymbol: "TITAN", sector: "Consumer" },
  { symbol: "BAJAJFINSV.NS", name: "Bajaj Finserv Ltd", exchange: "NSE", nseSymbol: "BAJAJFINSV", sector: "NBFC" },
  { symbol: "NESTLEIND.NS", name: "Nestle India Ltd", exchange: "NSE", nseSymbol: "NESTLEIND", sector: "FMCG" },
  { symbol: "TECHM.NS", name: "Tech Mahindra Ltd", exchange: "NSE", nseSymbol: "TECHM", sector: "IT" },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises Ltd", exchange: "NSE", nseSymbol: "ADANIENT", sector: "Conglomerate" },
  { symbol: "ADANIPORTS.NS", name: "Adani Ports and SEZ Ltd", exchange: "NSE", nseSymbol: "ADANIPORTS", sector: "Infrastructure" },
  { symbol: "JSWSTEEL.NS", name: "JSW Steel Ltd", exchange: "NSE", nseSymbol: "JSWSTEEL", sector: "Metals" },
  { symbol: "GRASIM.NS", name: "Grasim Industries Ltd", exchange: "NSE", nseSymbol: "GRASIM", sector: "Cement" },
  { symbol: "CIPLA.NS", name: "Cipla Ltd", exchange: "NSE", nseSymbol: "CIPLA", sector: "Pharma" },
  { symbol: "DRREDDY.NS", name: "Dr. Reddy's Laboratories Ltd", exchange: "NSE", nseSymbol: "DRREDDY", sector: "Pharma" },
  { symbol: "EICHERMOT.NS", name: "Eicher Motors Ltd", exchange: "NSE", nseSymbol: "EICHERMOT", sector: "Auto" },
  { symbol: "HEROMOTOCO.NS", name: "Hero MotoCorp Ltd", exchange: "NSE", nseSymbol: "HEROMOTOCO", sector: "Auto" },
  { symbol: "DIVISLAB.NS", name: "Divi's Laboratories Ltd", exchange: "NSE", nseSymbol: "DIVISLAB", sector: "Pharma" },
  { symbol: "BPCL.NS", name: "Bharat Petroleum Corp Ltd", exchange: "NSE", nseSymbol: "BPCL", sector: "Energy" },
  { symbol: "COALINDIA.NS", name: "Coal India Ltd", exchange: "NSE", nseSymbol: "COALINDIA", sector: "Mining" },
  { symbol: "INDUSINDBK.NS", name: "IndusInd Bank Ltd", exchange: "NSE", nseSymbol: "INDUSINDBK", sector: "Banking" },
  { symbol: "BRITANNIA.NS", name: "Britannia Industries Ltd", exchange: "NSE", nseSymbol: "BRITANNIA", sector: "FMCG" },
  { symbol: "APOLLOHOSP.NS", name: "Apollo Hospitals Enterprise Ltd", exchange: "NSE", nseSymbol: "APOLLOHOSP", sector: "Healthcare" },
  { symbol: "TATACONSUM.NS", name: "Tata Consumer Products Ltd", exchange: "NSE", nseSymbol: "TATACONSUM", sector: "FMCG" },
  { symbol: "PIDILITIND.NS", name: "Pidilite Industries Ltd", exchange: "NSE", nseSymbol: "PIDILITIND", sector: "Chemicals" },
  { symbol: "SHREECEM.NS", name: "Shree Cement Ltd", exchange: "NSE", nseSymbol: "SHREECEM", sector: "Cement" },
  { symbol: "HAVELLS.NS", name: "Havells India Ltd", exchange: "NSE", nseSymbol: "HAVELLS", sector: "Electrical" },
  { symbol: "MCDOWELL-N.NS", name: "United Spirits Ltd", exchange: "NSE", nseSymbol: "MCDOWELL-N", sector: "Beverages" },
  { symbol: "DABUR.NS", name: "Dabur India Ltd", exchange: "NSE", nseSymbol: "DABUR", sector: "FMCG" },
  { symbol: "GODREJCP.NS", name: "Godrej Consumer Products Ltd", exchange: "NSE", nseSymbol: "GODREJCP", sector: "FMCG" },
  { symbol: "MARICO.NS", name: "Marico Ltd", exchange: "NSE", nseSymbol: "MARICO", sector: "FMCG" },
  { symbol: "MRF.NS", name: "MRF Ltd", exchange: "NSE", nseSymbol: "MRF", sector: "Auto" },
  { symbol: "BANKBARODA.NS", name: "Bank of Baroda Ltd", exchange: "NSE", nseSymbol: "BANKBARODA", sector: "Banking" },
  { symbol: "PNB.NS", name: "Punjab National Bank", exchange: "NSE", nseSymbol: "PNB", sector: "Banking" },
  { symbol: "CANBK.NS", name: "Canara Bank", exchange: "NSE", nseSymbol: "CANBK", sector: "Banking" },
  { symbol: "TATAPOWER.NS", name: "Tata Power Company Ltd", exchange: "NSE", nseSymbol: "TATAPOWER", sector: "Power" },
  { symbol: "ZOMATO.NS", name: "Zomato Ltd", exchange: "NSE", nseSymbol: "ZOMATO", sector: "Technology" },
  { symbol: "PAYTM.NS", name: "One 97 Communications Ltd (Paytm)", exchange: "NSE", nseSymbol: "PAYTM", sector: "FinTech" },
  { symbol: "NYKAA.NS", name: "FSN E-Commerce Ventures Ltd (Nykaa)", exchange: "NSE", nseSymbol: "NYKAA", sector: "Retail" },
  { symbol: "POLICYBZR.NS", name: "PB Fintech Ltd (PolicyBazaar)", exchange: "NSE", nseSymbol: "POLICYBZR", sector: "FinTech" },
  { symbol: "DMART.NS", name: "Avenue Supermarts Ltd (DMart)", exchange: "NSE", nseSymbol: "DMART", sector: "Retail" },
  { symbol: "IRCTC.NS", name: "Indian Railway Catering & Tourism Corp", exchange: "NSE", nseSymbol: "IRCTC", sector: "Tourism" },
  { symbol: "HAL.NS", name: "Hindustan Aeronautics Ltd", exchange: "NSE", nseSymbol: "HAL", sector: "Defence" },
  { symbol: "BEL.NS", name: "Bharat Electronics Ltd", exchange: "NSE", nseSymbol: "BEL", sector: "Defence" },
  { symbol: "MOTHERSON.NS", name: "Samvardhana Motherson International", exchange: "NSE", nseSymbol: "MOTHERSON", sector: "Auto" },
  { symbol: "VOLTAS.NS", name: "Voltas Ltd", exchange: "NSE", nseSymbol: "VOLTAS", sector: "Consumer" },
  { symbol: "MUTHOOTFIN.NS", name: "Muthoot Finance Ltd", exchange: "NSE", nseSymbol: "MUTHOOTFIN", sector: "NBFC" },
];

export function searchStocks(query: string): StockInfo[] {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  return POPULAR_STOCKS.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.nseSymbol?.toLowerCase().includes(q) ||
      s.symbol.toLowerCase().includes(q) ||
      s.sector?.toLowerCase().includes(q)
  ).slice(0, 8);
}

export function getStockBySymbol(symbol: string): StockInfo | undefined {
  const upper = symbol.toUpperCase();
  return POPULAR_STOCKS.find(
    (s) =>
      s.symbol === symbol ||
      s.nseSymbol === upper ||
      s.symbol.replace(".NS", "") === upper
  );
}
