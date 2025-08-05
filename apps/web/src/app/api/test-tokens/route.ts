import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch all tokens
    const { data: tokens, error, count } = await supabase
      .from('tokens')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      count: count || 0,
      tokens: tokens || [],
      message: `Found ${count || 0} tokens in the database`,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch tokens',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 