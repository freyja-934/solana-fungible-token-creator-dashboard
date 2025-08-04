import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test connection by checking if tokens table exists
    const { data, error } = await supabase
      .from('tokens')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful!',
      tableExists: true,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to connect to Supabase',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 