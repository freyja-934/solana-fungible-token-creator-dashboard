import { pinata } from "@/utils/config";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test if Pinata is configured correctly
    const testFile = new File(["Hello from Pinata test!"], "test.txt", { type: "text/plain" });
    const upload = await pinata.upload.public.file(testFile);
    const url = await pinata.gateways.public.convert(upload.cid);
    
    return NextResponse.json({
      success: true,
      message: "Pinata is configured correctly!",
      testUpload: {
        cid: upload.cid,
        url: url
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Pinata test error:", error);
    return NextResponse.json({
      success: false,
      error: "Pinata configuration error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 