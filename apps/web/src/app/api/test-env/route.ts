import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.NEXT_PUBLIC_NFT_STORAGE_KEY;
  
  return NextResponse.json({
    hasKey: !!key,
    keyLength: key?.length || 0,
    keyPrefix: key?.substring(0, 10) || 'not set',
    nodeEnv: process.env.NODE_ENV,
  });
} 