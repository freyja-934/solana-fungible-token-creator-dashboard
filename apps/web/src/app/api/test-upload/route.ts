import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const NFT_STORAGE_KEY = process.env.NEXT_PUBLIC_NFT_STORAGE_KEY;
    
    // Create a test file
    const testContent = JSON.stringify({ test: true, timestamp: Date.now() });
    const formData = new FormData();
    formData.append('file', new Blob([testContent], { type: 'application/json' }));

    // Try classic NFT.Storage API
    const response = await fetch('https://api.nft.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NFT_STORAGE_KEY}`,
      },
      body: formData,
    });

    const responseText = await response.text();
    
    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      keyInfo: {
        exists: !!NFT_STORAGE_KEY,
        length: NFT_STORAGE_KEY?.length || 0,
        format: NFT_STORAGE_KEY?.includes('.') ? 'dotted' : 'jwt',
        prefix: NFT_STORAGE_KEY?.substring(0, 20) + '...',
      },
      response: responseText.substring(0, 200),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
} 