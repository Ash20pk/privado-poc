import { NextRequest, NextResponse } from 'next/server';

// Keep the GET method for backward compatibility
export async function GET(req: NextRequest) {
  return handleRequest(req);
}

// Add POST method to receive wallet address
export async function POST(req: NextRequest) {
  return handleRequest(req);
}

async function handleRequest(req: NextRequest) {
  try {
    // Target URL to proxy to
    const targetUrl = 'https://talented-top-kite.ngrok-free.app/privado/api/sign-in';
    
    // Get wallet address from request body if it's a POST request
    let walletAddress = '';
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        walletAddress = body.walletAddress || '';
      } catch (e) {
        console.log('No body or invalid JSON in request');
      }
    }
    
    // Make the request to the target URL with the ngrok header
    const fetchResponse = await fetch(targetUrl, {
      headers: {
        'ngrok-skip-browser-warning': '1',
        'Content-Type': 'application/json'
      }
    });

    // Get the response data
    const data = await fetchResponse.json();
    
    const sessionId = data.sessionId;
    
    // Store the session data in a cookie instead of a file
    const sessionData = {
      ...data,
      from: walletAddress // Add wallet address to the stored data
    };
    
    // Create a response with the data
    const apiResponse = NextResponse.json(data);
    
    // Set a cookie with the session data (encrypted as JSON string)
    // The cookie will expire in 1 hour (3600 seconds)
    apiResponse.cookies.set({
      name: `session-${sessionId}`,
      value: JSON.stringify(sessionData),
      httpOnly: true,
      maxAge: 3600,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Return the response with the cookie
    return apiResponse;
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from target API' },
      { status: 500 }
    );
  }
}
