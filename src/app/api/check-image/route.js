import { NextResponse } from 'next/server'

const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp']

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    const isValidType = VALID_IMAGE_EXTENSIONS.some(ext => fileName.endsWith(ext));
    
    if (!isValidType) {
      return NextResponse.json(
        { message: `Invalid file type. Supported formats: ${VALID_IMAGE_EXTENSIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Create a new File object with the correct content type
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileType = file.type || 'image/jpeg';
    
    // Create a new FormData for the API request
    const apiFormData = new FormData();
    apiFormData.append('file', new Blob([fileBuffer], { type: fileType }), fileName);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/check-image/`, {
        method: 'POST',
        body: apiFormData,
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const result = await response.json();
      
      // Ensure matches array is properly formatted for frontend display
      if (result.matches && Array.isArray(result.matches)) {
        result.matches = result.matches.map(match => {
          // If match is already a base64 string, ensure it doesn't have the data:image prefix
          if (typeof match === 'string') {
            return match.replace(/^data:image\/(jpeg|png|webp);base64,/, '');
          }
          return match;
        });
      }
      
      return NextResponse.json(result);
    } catch (error) {
      console.error('Error:', error);
      
      // Handle connection refused error
      if (error.cause?.code === 'ECONNREFUSED') {
        return NextResponse.json(
          { message: 'Unable to connect to the backend server. Please ensure it is running at http://localhost:8000' },
          { status: 503 }
        );
      }

      // Handle other API errors
      if (error.message.includes('API responded with status')) {
        return NextResponse.json(
          { message: error.message },
          { status: 502 }
        );
      }

      // Handle other errors
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
