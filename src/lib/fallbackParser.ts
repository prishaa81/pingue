// Built-in rule-based fallback parser for Indian bills, recharge SMS, and receipts
// Works offline without AI as a resilient fallback.
import { ParsedBillData } from './types';

export interface FallbackParsedResult extends ParsedBillData {
  paid_date?: string;
  txn_ref?: string | null;
  consumer_id?: string | null;
  validity_days?: number | null;
  parserUsed: 'builtin_fallback';
}

const BILLER_RULES: Array<{ name: string; pattern: RegExp; defaultCategory?: string }> = [
  { name: 'Tata Power', pattern: /tata\s*power/i, defaultCategory: 'electricity' },
  { name: 'BESCOM', pattern: /bescom/i, defaultCategory: 'electricity' },
  { name: 'Adani Electricity', pattern: /adani\s*electricity|adani\s*power/i, defaultCategory: 'electricity' },
  { name: 'Torrent Power', pattern: /torrent\s*power/i, defaultCategory: 'electricity' },
  { name: 'MSEDCL / Mahavitaran', pattern: /msedcl|mahavitaran/i, defaultCategory: 'electricity' },
  { name: 'BSES Rajdhani', pattern: /bses\s*rajdhani|bses/i, defaultCategory: 'electricity' },
  { name: 'Mahanagar Gas', pattern: /mahanagar\s*gas|mgl/i, defaultCategory: 'gas' },
  { name: 'Indraprastha Gas', pattern: /indraprastha\s*gas|igl/i, defaultCategory: 'gas' },
  { name: 'Adani Total Gas', pattern: /adani\s*total\s*gas|adani\s*gas/i, defaultCategory: 'gas' },
  { name: 'ACT Fibernet', pattern: /act\s*(?:fibernet|broadband)/i, defaultCategory: 'internet' },
  { name: 'Airtel Xstream', pattern: /airtel\s*(?:xstream|broadband|fiber)/i, defaultCategory: 'internet' },
  { name: 'JioFiber', pattern: /jio\s*fiber/i, defaultCategory: 'internet' },
  { name: 'Vi', pattern: /\bvi\b|vodafone|idea/i, defaultCategory: 'recharge' },
  { name: 'Jio', pattern: /\bjio\b/i, defaultCategory: 'recharge' },
  { name: 'Airtel', pattern: /\bairtel\b/i, defaultCategory: 'recharge' },
  { name: 'Netflix', pattern: /netflix/i, defaultCategory: 'subscription' },
  { name: 'Spotify', pattern: /spotify/i, defaultCategory: 'subscription' },
  { name: 'Amazon Prime', pattern: /amazon\s*prime|\bprime\b/i, defaultCategory: 'subscription' },
  { name: 'Disney+ Hotstar', pattern: /hotstar|disney/i, defaultCategory: 'subscription' },
  { name: 'YouTube Premium', pattern: /youtube\s*premium/i, defaultCategory: 'subscription' },
  { name: 'Society Maintenance', pattern: /society|maintenance|maintenance\s*bill/i, defaultCategory: 'maintenance' },
  { name: 'Municipal Water Board', pattern: /water\s*board|water\s*bill|bwssb|jal\s*board/i, defaultCategory: 'water' },
  { name: 'HDFC ERGO Insurance', pattern: /hdfc\s*ergo|insurance/i, defaultCategory: 'insurance' },
  { name: 'LIC Policy', pattern: /\blic\b|life\s*insurance/i, defaultCategory: 'insurance' },
];

export function parseBillFallback(text: string): FallbackParsedResult {
  const today = new Date().toISOString().split('T')[0];
  const cleaned = text.trim();

  let amount = 0;
  let dateVal = today;
  let txnRef: string | null = null;
  let consumerId: string | null = null;
  let validityDays: number | null = null;
  let cycleType: 'days' | 'months' | 'one-time' = 'months';
  let cycleValue = 1;
  let biller = 'Utility Bill';

  // 1. Amount Extraction (₹, Rs, Rs., INR, or "paid ... of ...")
  const amtRegexes = [
    /(?:₹|Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /(?:paid|bill of|amount(?: of)?)\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /debited\s*(?:by|for)?\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /recharge\s*(?:of)?\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
  ];

  for (const rx of amtRegexes) {
    const match = cleaned.match(rx);
    if (match && match[1]) {
      const parsed = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
        break;
      }
    }
  }

  // 2. Validity Extraction (e.g., "28 days validity", "validity of 84 days", "valid for 56 days")
  const valRegexes = [
    /(\d{1,3})\s*days?(?:\s*validity)?/i,
    /validity(?:\s*of)?\s*(\d{1,3})\s*days?/i,
    /valid\s*(?:till|for)?\s*(\d{1,3})\s*days?/i,
  ];

  for (const rx of valRegexes) {
    const match = cleaned.match(rx);
    if (match && match[1]) {
      const days = parseInt(match[1], 10);
      if (!isNaN(days) && days > 0 && days <= 365) {
        validityDays = days;
        cycleType = 'days';
        cycleValue = days;
        break;
      }
    }
  }

  // 3. Txn Reference / UPI Ref / UTR / Reference Number
  const txnRegexes = [
    /(?:UPI\s*(?:Ref|Reference)?(?:\s*No\.?)?|UTR(?:\s*No\.?)?|Txn\s*(?:ID|Ref|Reference|No\.?)?|Ref\s*(?:ID|No\.?)|Transaction\s*ID)[:\s#]*([A-Za-z0-9]{8,25})/i,
    /RRN[:\s#]*([A-Za-z0-9]{8,20})/i,
  ];

  for (const rx of txnRegexes) {
    const match = cleaned.match(rx);
    if (match && match[1]) {
      txnRef = match[1].trim();
      break;
    }
  }

  // 4. Consumer ID / Account / CA Number / Mobile Number
  const cidRegexes = [
    /(?:CA\s*(?:No\.?|Number)?|Consumer\s*(?:ID|No\.?|Number)?|Account\s*(?:No\.?|Number|#)?|A\/C\s*(?:No\.?)?|BP\s*(?:No\.?|Number)?)[:\s#]*([A-Za-z0-9-]{6,25})/i,
    /(?:sub(?:scriber)?\s*id)[:\s#]*([A-Za-z0-9-]{6,20})/i,
  ];

  for (const rx of cidRegexes) {
    const match = cleaned.match(rx);
    if (match && match[1]) {
      consumerId = match[1].trim();
      break;
    }
  }

  // If consumer ID not found, look for 10-digit Indian mobile number
  if (!consumerId) {
    const mobMatch = cleaned.match(/(?:mobile|num|number|recharge\s*for)?\s*(?:\+91[-\s]?)?([6-9]\d{9})\b/i);
    if (mobMatch && mobMatch[1]) {
      consumerId = mobMatch[1];
    }
  }

  // 5. Date Extraction
  const dateIso = cleaned.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  const dateDmy = cleaned.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  const dateText = cleaned.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{2,4})\b/i);

  if (dateIso) {
    dateVal = dateIso[0];
  } else if (dateDmy) {
    let [_, d, m, y] = dateDmy;
    if (y.length === 2) y = '20' + y;
    dateVal = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  } else if (dateText) {
    const months: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const day = dateText[1].padStart(2, '0');
    const mon = months[dateText[2].toLowerCase().slice(0, 3)] || '01';
    let yr = dateText[3];
    if (yr.length === 2) yr = '20' + yr;
    dateVal = `${yr}-${mon}-${day}`;
  }

  // 6. Biller detection
  for (const rule of BILLER_RULES) {
    if (rule.pattern.test(cleaned)) {
      biller = rule.name;
      break;
    }
  }

  // Compute confidence based on how many fields were successfully captured
  let score = 0.5;
  if (amount > 0) score += 0.2;
  if (biller !== 'Utility Bill') score += 0.15;
  if (txnRef) score += 0.05;
  if (consumerId) score += 0.05;
  if (validityDays) score += 0.05;

  return {
    biller,
    amount,
    date: dateVal,
    paid_date: dateVal,
    cycle_type: cycleType,
    cycle_value: cycleValue,
    txn_ref: txnRef,
    reference: txnRef || undefined,
    consumer_id: consumerId,
    validity_days: validityDays,
    confidence: Math.min(score, 0.95),
    raw_detected: cleaned,
    parserUsed: 'builtin_fallback',
  };
}
