import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Try to insert a test token
    const testToken = {
      creator: 'TestWallet1234567890123456789012345678901234',
      name: 'Test Token',
      symbol: 'TEST',
      description: 'Testing Supabase insert',
      mint_address: `TestMint${Date.now()}`,
      fee_enabled: false,
      initial_supply: '1000000',
      decimals: 9,
    };

    const { data, error } = await supabase
      .from('tokens')
      .insert(testToken)
      .select();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error,
        hint: error.hint,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Test token inserted successfully',
      data,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to insert test token',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 