import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data: tokens, error } = await supabase
    .from('tokens')
    .select('*')
    .limit(5);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tokens });
} 