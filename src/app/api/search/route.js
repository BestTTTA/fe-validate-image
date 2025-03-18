import formidable from 'formidable';
import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';

// Disable the default body parser to handle file uploads
export async function POST(req) {
  // Parse the multipart form data
  const form = new formidable.IncomingForm();
  
  return new Promise((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parsing error:', err);
        return resolve(new Response(JSON.stringify({ detail: 'Error parsing form data' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      try {
        const file = files.file;
        
        if (!file) {
          return resolve(new Response(JSON.stringify({ detail: 'No file uploaded' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        
        // Read the file data
        const fileData = fs.readFileSync(file.filepath);
        
        // Create a new form with the file
        const formData = new FormData();
        formData.append('file', fileData, { 
          filename: file.originalFilename || 'image.jpg',
          contentType: file.mimetype,
        });
        
        // Send the request to the actual API
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        console.log('Making request to API:', `${apiUrl}/search`);
        
        const response = await fetch(`${apiUrl}/search`, {
          method: 'POST',
          body: formData,
        });
        
        console.log('API response status:', response.status);
        
        // Get the response data
        const responseText = await response.text();
        console.log('API response text:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Error parsing JSON response:', e);
          return resolve(new Response(JSON.stringify({ detail: 'Invalid response from API' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        
        if (!response.ok) {
          const errorMessage = data?.detail || 'Failed to process image';
          return resolve(new Response(JSON.stringify({ detail: errorMessage }), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        
        // Return the API response
        return resolve(new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      } catch (error) {
        console.error('Proxy error:', error);
        return resolve(new Response(JSON.stringify({ detail: 'Server error processing request: ' + error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
    });
  });
}