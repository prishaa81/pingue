import { NextRequest, NextResponse } from 'next/server';
import { parseBillWithGemini } from '@/lib/gemini';
import { parseBillFallback } from '@/lib/fallbackParser';
import { getServiceRoleClient } from '@/lib/supabase';

const DAILY_USER_PARSING_LIMIT = 50;

export async function POST(req: NextRequest) {
  const apiKeyStatus = process.env.GEMINI_API_KEY ? 'set' : 'missing';
  let requestText = '';
  let hasImage = false;

  try {
    const body = await req.json();
    const { text, imageBase64, mimeType, userId } = body;
    requestText = text || '';
    hasImage = Boolean(imageBase64);

    if (!text && !imageBase64) {
      console.warn('[parse-bill route] Bad request: Neither text nor screenshot image provided');
      return NextResponse.json(
        { error: 'Either text, SMS, or screenshot image is required.' },
        { status: 400 }
      );
    }

    // Check & update per-user daily quota in public.ai_usage if userId provided
    const supabaseAdmin = getServiceRoleClient();
    if (supabaseAdmin && userId) {
      const today = new Date().toISOString().split('T')[0];
      const { data: usage } = await supabaseAdmin
        .from('ai_usage')
        .select('count')
        .eq('user_id', userId)
        .eq('day', today)
        .maybeSingle();

      if (usage && usage.count >= DAILY_USER_PARSING_LIMIT) {
        console.warn(`[parse-bill route] User ${userId} exceeded daily quota of ${DAILY_USER_PARSING_LIMIT}`);
        // Fall back to built-in parser if text is provided
        if (text) {
          console.log('[parse-bill route] Using built-in fallback parser due to quota limit');
          const fallback = parseBillFallback(text);
          return NextResponse.json(fallback);
        }
        return NextResponse.json(
          { error: `Daily AI parsing limit (${DAILY_USER_PARSING_LIMIT}) reached. Please fill in details manually.` },
          { status: 429 }
        );
      }

      // Upsert quota count
      if (usage) {
        await supabaseAdmin
          .from('ai_usage')
          .update({ count: usage.count + 1 })
          .eq('user_id', userId)
          .eq('day', today);
      } else {
        await supabaseAdmin
          .from('ai_usage')
          .insert({ user_id: userId, day: today, count: 1 });
      }
    }

    // Attempt Gemini parsing (with internal fallback to built-in parser)
    console.log(`[parse-bill route] Processing parse request | API Key Status: ${apiKeyStatus} | Text Length: ${requestText.length} | Has Image: ${hasImage}`);
    const parsed = await parseBillWithGemini(text, imageBase64, mimeType || 'image/jpeg');

    return NextResponse.json(parsed);
  } catch (error: any) {
    const httpStatus = error?.status || 500;
    const msg = error instanceof Error ? error.message : 'Failed to parse bill';
    const model = process.env.GEMINI_MODEL || 'auto-discovered';

    console.error(
      `[parse-bill route ERROR] HTTP Status: ${httpStatus} | Model: ${model} | API Key: ${apiKeyStatus} | Error: ${msg}`
    );

    // If text was provided and Gemini threw an unhandled error, fall back to built-in parser
    if (requestText) {
      console.log('[parse-bill route] Fallback: running built-in regex parser on provided text');
      const fallback = parseBillFallback(requestText);
      return NextResponse.json({
        ...fallback,
        errorDetails: `Gemini parsing failed (${msg}), extracted via built-in parser`,
      });
    }

    return NextResponse.json(
      {
        error: msg,
        httpStatus,
        model,
        apiKeyStatus,
      },
      { status: typeof httpStatus === 'number' && httpStatus >= 400 && httpStatus <= 599 ? httpStatus : 500 }
    );
  }
}
