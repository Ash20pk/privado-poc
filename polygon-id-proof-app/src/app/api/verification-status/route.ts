import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  // Get session ID from query params
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');
  
  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID is required' },
      { status: 400, headers: corsHeaders }
    );
  }
  
  try {
    // Fetch session data from Supabase
    const { data: sessionRecord, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('session_id', sessionId)
      .gt('expires_at', new Date().toISOString()) // Only get non-expired sessions
      .single();
    
    if (error) {
      console.error("Error fetching session from Supabase:", error);
      return NextResponse.json(
        { error: 'Failed to fetch session data' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    if (!sessionRecord) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404, headers: corsHeaders }
      );
    }
    
    // Check if the session has a verification status
    // This would be set by the router API when it processes the verification
    const verificationStatus = sessionRecord.verification_status || {};
    
    // Determine verification state:
    // - true: explicitly verified
    // - false: explicitly failed (has timestamp indicating processing occurred)
    // - null: no verification attempt yet
    let verified = null;
    if (verificationStatus.success === true) {
      verified = true;
    } else if (verificationStatus.success === false && verificationStatus.timestamp) {
      verified = false;
    }
    // else verified remains null (no verification attempt yet)
    
    return NextResponse.json({
      verified: verified,
      timestamp: verificationStatus.timestamp || null,
      message: verificationStatus.message || null,
      processed_responses: verificationStatus.processed_responses || []
    }, {
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error("Error retrieving verification status:", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
