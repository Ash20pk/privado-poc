import { NextRequest, NextResponse } from 'next/server';
import supabase from '../../../lib/supabase';

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
    // Check if there's an environment variable for the target URL, otherwise use the default
    const targetUrl = process.env.TARGET_API_URL || 'https://talented-top-kite.ngrok-free.app/privado/api/sign-in';
    
    
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

    // Check if the response is ok
    if (!fetchResponse.ok) {
      throw new Error(`Target API returned ${fetchResponse.status}: ${fetchResponse.statusText}`);
    }
    
    // Get the response text first to check if it's valid JSON
    const responseText = await fetchResponse.text();
    
    // Check if the response text is empty or not valid JSON
    if (!responseText || responseText.trim() === '') {
      throw new Error('Target API returned empty response');
    }
    
    // Parse the response text as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e: any) {
      console.error('Failed to parse JSON response:', responseText);
      throw new Error(`Invalid JSON response: ${e.message || 'Unknown parsing error'}`);
    }
    
    // Validate that sessionId exists in the response
    const sessionId = data.sessionId;
    if (!sessionId) {
      throw new Error('Session ID not found in response');
    }
    
    // Store the session data in Supabase storage instead of a cookie
    const sessionData = {
      ...data,
      from: walletAddress, // Add wallet address to the stored data
      created_at: new Date().toISOString()
    };
    
    // Store session data in Supabase
    const { error } = await supabase
      .from('sessions')
      .upsert({
        session_id: sessionId,
        data: sessionData,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // Expires in 1 hour
        verification_status: {
          success: false,
          timestamp: null,
          message: null
        }
      });
    
    if (error) {
      console.error('Error storing session in Supabase:', error);
      throw new Error(`Failed to store session: ${error.message}`);
    }
    
    // Create a response with the data
    const apiResponse = NextResponse.json(data);
    
    // Return the response
    return apiResponse;
  } catch (error: any) {
    console.error('Proxy error:', error);
    
    // Provide more detailed error information
    const errorMessage = error.message || 'Unknown error';
    const statusCode = error.status || 500;
    
    return NextResponse.json(
      { 
        error: `Failed to fetch from target API: ${errorMessage}`,
        details: error.stack ? error.stack.split('\n') : undefined
      },
      { status: statusCode }
    );
  }
}
