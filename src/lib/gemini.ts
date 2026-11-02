// Gemini AI parser with schema enforcement for Indian utility & subscription bills
import { ParsedBillData } from './types';
import { parseBillFallback } from './fallbackParser';

export interface GeminiParsedResult extends ParsedBillData {
  paid_date?: string;
  txn_ref?: string | null;
  consumer_id?: string | null;
  validity_days?: number | null;
  parserUsed?: 'gemini' | 'builtin_fallback';
  modelUsed?: string;
  errorDetails?: string;
}

const PROMPT_INSTRUCTIONS = `
You are an expert financial and utility bill parser for an Indian bill reminder system.
Parse the provided text, SMS, receipt, or screenshot into structured JSON with the following exact fields:
- biller: string (e.g. "Vi", "Jio", "Airtel", "Tata Power", "BESCOM", "Mahanagar Gas", "ACT Fibernet", "Netflix", "Society Maintenance")
- amount: number (positive float or integer, remove any currency symbols like ₹, Rs, INR)
- paid_date: string (in YYYY-MM-DD format. The date on which payment occurred or will occur. If today, use current date)
- txn_ref: string or null (transaction id, UTR, UPI reference number, payment reference)
- consumer_id: string or null (consumer account number, CA number, electricity connection ID, customer ID. For mobile recharges, return the 10-digit mobile number)
- validity_days: number or null (e.g. 28, 56, 84 for telecom recharge packs, null otherwise)
- cycle_type: "days" | "months" | "one-time" (if recharge pack with day validity use "days", if monthly utility use "months", if one-off use "one-time")
- cycle_value: number (e.g. 28 for recharge pack, 1 for monthly, 3 for quarterly)
- confidence: number between 0.0 and 1.0 (confidence in the extracted fields)

Respond ONLY with valid JSON matching the schema.
`;

let cachedModelName: string | null = null;
let lastModelCheckTime = 0;
const MODEL_CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

/**
 * Resolves an active Gemini Flash model that supports image input using Google's ListModels endpoint.
 * Respects GEMINI_MODEL if specified in env.
 */
export async function getOrDiscoverFlashModel(ai: any): Promise<string> {
  const envModel = process.env.GEMINI_MODEL?.trim();
  if (envModel) {
    return envModel;
  }

  const now = Date.now();
  if (cachedModelName && now - lastModelCheckTime < MODEL_CACHE_TTL_MS) {
    return cachedModelName;
  }

  try {
    const list = await ai.models.list();
    const flashCandidates: string[] = [];
    for await (const m of list) {
      const name = (m.name || '').replace(/^models\//, '');
      // Select flash models that support multimodal generation, excluding tts/audio/live
      if (
        name.includes('flash') &&
        !name.includes('tts') &&
        !name.includes('audio') &&
        !name.includes('live')
      ) {
        flashCandidates.push(name);
      }
    }

    // Preferred flash models in order of stability and responsiveness
    const preference = [
      'gemini-3.5-flash',
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-2.5-flash-lite',
      'gemini-3.1-flash-lite',
    ];

    let chosen = flashCandidates.find((c) => preference.includes(c)) || flashCandidates[0] || 'gemini-3.5-flash';

    cachedModelName = chosen;
    lastModelCheckTime = now;
    console.log(`[Gemini Model Discovery] Picked available model: ${chosen} (from ${flashCandidates.length} candidates)`);
    return chosen;
  } catch (err: any) {
    console.error('[Gemini Model Discovery Failed] Error listing models:', err?.message || err);
    return 'gemini-3.5-flash';
  }
}

/**
 * Helper to pause execution
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function parseBillWithGemini(
  text?: string,
  imageBase64?: string,
  mimeType: string = 'image/jpeg'
): Promise<GeminiParsedResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const apiKeyStatus = apiKey ? 'set' : 'missing';

  if (!apiKey) {
    console.error('[Gemini AI Parse Error] GEMINI_API_KEY is missing');
    if (text) {
      console.log('[Gemini Fallback] Using built-in fallback parser because GEMINI_API_KEY is missing');
      return parseBillFallback(text);
    }
    throw new Error('GEMINI_API_KEY is not configured (status: missing)');
  }

  // Import Google GenAI SDK
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });

  const modelName = await getOrDiscoverFlashModel(ai);

  const cleanedImage = imageBase64 ? imageBase64.replace(/^data:image\/\w+;base64,/, '') : undefined;

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: PROMPT_INSTRUCTIONS },
  ];

  if (cleanedImage) {
    parts.push({
      inlineData: {
        mimeType,
        data: cleanedImage,
      },
    });
  }

  if (text) {
    parts.push({ text: `Text to parse: ${text}` });
  }

  // Attempt Gemini API call with 429 rate limit retry
  let response: any = null;
  let lastError: any = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              biller: { type: 'STRING' },
              amount: { type: 'NUMBER' },
              paid_date: { type: 'STRING' },
              txn_ref: { type: 'STRING' },
              consumer_id: { type: 'STRING' },
              validity_days: { type: 'NUMBER' },
              cycle_type: { type: 'STRING' },
              cycle_value: { type: 'NUMBER' },
              confidence: { type: 'NUMBER' },
            },
            required: ['biller', 'amount'],
          },
          temperature: 0.1,
        },
      });

      // Successful call
      break;
    } catch (err: any) {
      lastError = err;
      const httpStatus = err?.status || err?.code || 'unknown';
      const errorMessage = err?.message || 'Unknown error';

      console.error(
        `[Gemini AI Parse Error] Attempt ${attempt}/2 | Model: ${modelName} | API Key: ${apiKeyStatus} | HTTP Status: ${httpStatus} | Message: ${errorMessage}`
      );

      // Handle 429 (Rate limit) or 503 with one retry after a short delay
      if ((httpStatus === 429 || httpStatus === 503 || errorMessage.includes('429')) && attempt === 1) {
        console.warn(`[Gemini AI Rate Limit/Spike] Received status ${httpStatus}. Retrying in 1.8 seconds...`);
        await sleep(1800);
        continue;
      }

      // If model was not found (404), invalidate cache so it re-discovers on next call
      if (httpStatus === 404) {
        cachedModelName = null;
      }

      break;
    }
  }

  // If Gemini failed, fall back to built-in parser if text is available
  if (!response) {
    const httpStatus = lastError?.status || '500';
    const errorMsg = lastError?.message || 'Failed to call Gemini API';

    if (text) {
      console.warn(`[Gemini Fallback Triggered] Gemini call failed (${httpStatus}). Falling back to built-in parser for text.`);
      const fallbackResult = parseBillFallback(text);
      return {
        ...fallbackResult,
        errorDetails: `Gemini unavailable (${httpStatus}): ${errorMsg}`,
      };
    }

    throw new Error(`Gemini parsing failed (${httpStatus}): ${errorMsg}`);
  }

  try {
    const rawText = response.text || '';
    const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const today = new Date().toISOString().split('T')[0];
    const dateVal = parsed.paid_date || parsed.date || today;

    return {
      biller: parsed.biller || 'Utility Bill',
      amount: Number(parsed.amount) || 0,
      date: dateVal,
      paid_date: dateVal,
      cycle_type: parsed.cycle_type || (parsed.validity_days ? 'days' : 'months'),
      cycle_value: Number(parsed.validity_days || parsed.cycle_value) || 1,
      txn_ref: parsed.txn_ref || parsed.reference || null,
      reference: parsed.txn_ref || parsed.reference || undefined,
      consumer_id: parsed.consumer_id || null,
      validity_days: parsed.validity_days ? Number(parsed.validity_days) : null,
      confidence: Number(parsed.confidence) || 0.9,
      raw_detected: text || 'Screenshot image parsed',
      parserUsed: 'gemini',
      modelUsed: modelName,
    };
  } catch (parseJsonErr: any) {
    console.error(`[Gemini JSON Parse Error] Model: ${modelName} | API Key: ${apiKeyStatus} | Raw: ${response.text}`);
    if (text) {
      console.log('[Gemini Fallback] Falling back to built-in parser after JSON error');
      return parseBillFallback(text);
    }
    throw new Error(`Failed to parse structured JSON from Gemini response: ${parseJsonErr.message}`);
  }
}
