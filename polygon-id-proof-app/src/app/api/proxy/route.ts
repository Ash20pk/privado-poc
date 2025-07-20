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
    const response = await fetch(targetUrl, {
      headers: {
        'ngrok-skip-browser-warning': '1',
        'Content-Type': 'application/json'
      }
    });

    // Get the response data
    const data = await response.json();
    
    const sessionId = data.sessionId;
    
    // Store the auth request in a file
    const fs = require('fs');
    const path = require('path');
    
    // Create sessions directory if it doesn't exist
    const sessionDir = path.join(process.cwd(), 'sessions');
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    
    // Write the auth request to a file with wallet address
    const fileData = {
      ...data,
      from: walletAddress // Add wallet address to the stored data
    };
    
    const filePath = path.join(sessionDir, `${sessionId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
    
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
