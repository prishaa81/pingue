import { NextResponse } from 'next/server';
import { parseBillWithGemini, getOrDiscoverFlashModel } from '@/lib/gemini';
import { parseBillFallback } from '@/lib/fallbackParser';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  const apiKeyStatus = apiKey ? 'set' : 'missing';
  const sampleSMS = 'Paid Rs 1,499 to Tata Power on 28-10-2026 for CA 100234567. UTR: 628945612344.';

  const diagnosticResult: Record<string, any> = {
    timestamp: new Date().toISOString(),
    apiKeyStatus,
    envConfiguredModel: process.env.GEMINI_MODEL || null,
    sampleInput: sampleSMS,
  };

  try {
    if (!apiKey) {
      diagnosticResult.status = 'warning';
      diagnosticResult.message = 'GEMINI_API_KEY is not defined in environment';
      diagnosticResult.fallbackResult = parseBillFallback(sampleSMS);
      return NextResponse.json(diagnosticResult);
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    // Discover model
    const resolvedModel = await getOrDiscoverFlashModel(ai);
    diagnosticResult.resolvedModel = resolvedModel;

    // Run test parse
    const parseResult = await parseBillWithGemini(sampleSMS);
    diagnosticResult.status = 'success';
    diagnosticResult.parseResult = parseResult;

    return NextResponse.json(diagnosticResult);
  } catch (err: any) {
    diagnosticResult.status = 'error';
    diagnosticResult.httpStatus = err?.status || err?.code || 500;
    diagnosticResult.errorMessage = err?.message || 'Unknown test error';
    diagnosticResult.fallbackResult = parseBillFallback(sampleSMS);

    return NextResponse.json(diagnosticResult, { status: 200 });
  }
}
