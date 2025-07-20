import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    // Get session ID from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Fetch session data from Supabase
    const { data: sessionRecord, error } = await supabase
      .from('sessions')
      .select('data')
      .eq('session_id', sessionId)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error || !sessionRecord) {
      console.error("Error fetching session:", error);
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404, headers: corsHeaders }
      );
    }
    
    // Return session data
    return NextResponse.json(sessionRecord, {
      headers: corsHeaders
    });
    
  } catch (error: any) {
    console.error('Error retrieving session data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve session data',
        details: error.message || 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
