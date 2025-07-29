import Irys from '@irys/sdk';
import dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../.env.local') });

interface TokenMetadata {
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

async function uploadMetadata() {
  const privateKey = process.env.SOLANA_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('SOLANA_PRIVATE_KEY not found in environment variables');
  }

  const irys = new Irys({
    url: 'https://node2.irys.xyz',
    token: 'solana',
    key: privateKey,
  });

  const args = process.argv.slice(2);
  const metadataPath = args[0];
  const imagePath = args[1];

  if (!metadataPath) {
    console.error('Usage: ts-node upload_metadata.ts <metadata.json> [image.png]');
    process.exit(1);
  }

  try {
    const metadata: TokenMetadata = JSON.parse(
      readFileSync(metadataPath, 'utf-8')
    );

    let imageUri: string | undefined;

    if (imagePath) {
      console.log('Uploading image...');
      const imageData = readFileSync(imagePath);
      const imageTags = [
        { name: 'Content-Type', value: 'image/png' },
        { name: 'App-Name', value: 'Solana-Token-Creator' },
      ];

      const imageReceipt = await irys.upload(imageData, { tags: imageTags });
      imageUri = `https://gateway.irys.xyz/${imageReceipt.id}`;
      console.log('Image uploaded:', imageUri);

      metadata.image = imageUri;
    }

    console.log('Uploading metadata...');
    const metadataTags = [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'App-Name', value: 'Solana-Token-Creator' },
    ];

    const metadataReceipt = await irys.upload(
      JSON.stringify(metadata, null, 2),
      { tags: metadataTags }
    );

    const metadataUri = `https://gateway.irys.xyz/${metadataReceipt.id}`;
    console.log('Metadata uploaded:', metadataUri);

    const output = {
      metadataUri,
      imageUri,
      metadata,
    };

    writeFileSync(
      'metadata-output.json',
      JSON.stringify(output, null, 2)
    );

    console.log('\nMetadata URI:', metadataUri);
    console.log('Output saved to metadata-output.json');

    return metadataUri;
  } catch (error) {
    console.error('Error uploading metadata:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  uploadMetadata();
}

export { uploadMetadata };
