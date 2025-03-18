// pages/api/proxy-image.js (สำหรับ Pages Router)
// หรือ app/api/proxy-image/route.js (สำหรับ App Router)

export async function GET(request) {
    // สำหรับ App Router
    const url = new URL(request.url).searchParams.get('url');
    
    // สำหรับ Pages Router
    // const { url } = request.query;
    
    if (!url) {
      return new Response('Missing URL parameter', { status: 400 });
    }
  
    try {
      const imageResponse = await fetch(url);
      const imageArrayBuffer = await imageResponse.arrayBuffer();
      
      return new Response(imageArrayBuffer, {
        headers: {
          'Content-Type': imageResponse.headers.get('content-type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=86400'
        }
      });
    } catch (error) {
      console.error('Error fetching image:', error);
      return new Response('Failed to fetch image', { status: 500 });
    }
  }