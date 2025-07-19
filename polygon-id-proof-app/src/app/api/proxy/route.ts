import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Target URL to proxy to
    const targetUrl = 'https://talented-top-kite.ngrok-free.app/privado/api/sign-in';
    
    // Make the request to the target URL with the ngrok header
    const response = await fetch(targetUrl, {
      headers: {
        'ngrok-skip-browser-warning': '1',
        'Content-Type': 'application/json'
      }
    });

    // Get the response data
    const data = await response.json();
    
    // Return the response data
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from target API' },
      { status: 500 }
    );
  }
}
