import { pinata } from "@/utils/config";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;
    const metadata = data.get("metadata") ? JSON.parse(data.get("metadata") as string) : null;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Upload image to Pinata
    const imageUpload = await pinata.upload.public.file(file);
    const imageUrl = await pinata.gateways.public.convert(imageUpload.cid);

    let metadataUri = '';
    
    if (metadata) {
      // Create metadata with the image URL
      const metadataWithImage = {
        ...metadata,
        image: imageUrl,
        attributes: [],
        properties: {
          files: [{
            uri: imageUrl,
            type: file.type,
          }],
          category: 'fungible',
        },
      };

      // Upload metadata as JSON
      const metadataUpload = await pinata.upload.public.json(metadataWithImage);
      metadataUri = await pinata.gateways.public.convert(metadataUpload.cid);
    }

    return NextResponse.json({
      imageUri: imageUrl,
      metadataUri: metadataUri
    }, { status: 200 });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 