
interface UploadMetadata {
  name: string;
  symbol: string;
  description: string;
  image?: string;
  [key: string]: unknown;
}

export async function uploadToIPFS(
  file: File,
  metadata?: UploadMetadata
): Promise<{ imageUri: string; metadataUri: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (metadata) {
      formData.append("metadata", JSON.stringify(metadata));
    }

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Upload error:', error);
    
    // Fallback to data URI if upload fails
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const imageUri = `data:${file.type};base64,${base64}`;
    
    if (metadata) {
      const metadataWithImage = {
        ...metadata,
        image: imageUri,
        attributes: [],
        properties: {
          files: [{
            uri: imageUri,
            type: file.type,
          }],
          category: 'fungible',
        },
      };
      
      const metadataJson = JSON.stringify(metadataWithImage);
      const metadataBase64 = btoa(metadataJson);
      const metadataUri = `data:application/json;base64,${metadataBase64}`;
      
      return { imageUri, metadataUri };
    }
    
    return { imageUri, metadataUri: '' };
  }
} 