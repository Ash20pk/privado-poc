import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getRawBody } from '@/lib/utils';
import { initializeVerifier } from '@/lib/polygonIdVerifier';
import {
  CircuitId,
  ZeroKnowledgeProofRequest,
  AuthorizationRequestMessage,
  PROTOCOL_CONSTANTS,
} from '@0xpolygonid/js-sdk';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Create a map to store the auth requests and their session IDs
const requestMap = new Map<string, AuthorizationRequestMessage>();

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// GET endpoint for generating auth requests
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const sessionId = searchParams.get('sessionId') || uuidv4();
  const credentialType = searchParams.get('credentialType') || 'UniquenessCredential';
  const credentialContext = searchParams.get('credentialContext') || 
    'https://raw.githubusercontent.com/Ash20pk/privado-poc/refs/heads/main/public/schemas/json-ld/UniquenessCredential.jsonld';
  const callbackPath = searchParams.get('callbackPath') || '/api/universal-link';
  const reason = searchParams.get('reason') || 'Verify your credential to access this service';
  const message = searchParams.get('message') || 'Please provide proof of your credential';
  
  try {
    // Generate the auth request
    const authRequest = await generateAuthRequest(
      sessionId, 
      credentialType, 
      credentialContext, 
      url.origin + callbackPath,
      reason,
      message
    );
    
    // Store the auth request for later verification
    requestMap.set(sessionId, authRequest);
    
    // Return the auth request as JSON
    return NextResponse.json(authRequest, { 
      status: 200, 
      headers: corsHeaders 
    });
  } catch (error) {
    console.error('Error generating auth request:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error generating auth request',
      timestamp: new Date().toISOString()
    }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

// POST endpoint for handling callbacks
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');
  
  console.log('🔄 Received callback for session:', sessionId);
  
  if (!sessionId) {
    console.error('❌ Missing sessionId parameter');
    return NextResponse.json({
      success: false,
      error: 'Missing sessionId parameter',
      timestamp: new Date().toISOString()
    }, { 
      status: 400, 
      headers: corsHeaders 
    });
  }
  
  try {
    // Retrieve the original auth request
    const authRequest = requestMap.get(sessionId);
    
    if (!authRequest) {
      console.error('❌ Invalid or expired session:', sessionId);
      console.log('📊 Current sessions in map:', Array.from(requestMap.keys()));
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired session',
        timestamp: new Date().toISOString()
      }, { 
        status: 400, 
        headers: corsHeaders 
      });
    }
    
    console.log('✅ Found auth request for session:', sessionId);
    
    // Get the raw body data (token string)
    const rawBody = await request.text();
    const tokenStr = rawBody.trim();
    
    console.log('📄 Raw token length:', tokenStr.length);
    
    if (tokenStr.length === 0) {
      console.error('❌ Empty token received');
      return NextResponse.json({
        success: false,
        error: 'Empty token received',
        timestamp: new Date().toISOString()
      }, { 
        status: 400, 
        headers: corsHeaders 
      });
    }
    
    // Log first few characters of token for debugging
    console.log('📄 Token preview:', tokenStr.substring(0, Math.min(100, tokenStr.length)) + '...');
    
    // Try to parse the token to see if it's valid JSON
    try {
      JSON.parse(tokenStr);
      console.log('✅ Token is valid JSON');
    } catch (e) {
      console.log('⚠️ Token is not valid JSON, treating as raw string');
    }
    
    // Initialize the verifier
    console.log('⚙️ Initializing Polygon ID verifier...');
    const verifier = await initializeVerifier();
    console.log('✅ Verifier initialized successfully');
    
    // Set verification options
    const verificationOpts = {
      acceptedStateTransitionDelay: 5 * 60 * 1000, // 5 minutes
    };
    
    // Execute the verification
    console.log('🔐 Starting proof verification...');
    console.log('🔐 Auth request:', JSON.stringify(authRequest, null, 2));
    console.log('🔐 Verification options:', JSON.stringify(verificationOpts, null, 2));
    
    // Make sure the auth request has the required properties
    if (!authRequest || !authRequest.body || !Array.isArray(authRequest.body.scope)) {
      throw new Error('Invalid auth request structure');
    }
    
    // Make sure the scope array has at least one item
    if (authRequest.body.scope.length === 0) {
      throw new Error('Auth request scope array is empty');
    }
    
    // Check if the first scope item has the required properties
    const firstScope = authRequest.body.scope[0];
    if (!firstScope || !firstScope.circuitId || !firstScope.query) {
      throw new Error('Invalid scope item in auth request');
    }
    
    try {
      // Wrap the verification in a try-catch to handle specific errors
      console.log('🔐 Calling verifier.fullVerify with token and auth request...');
      
      // Try to parse the token first to ensure it's valid
      let tokenToVerify = tokenStr;
      try {
        // If the token is a JSON string, we need to parse it first
        const parsedToken = JSON.parse(tokenStr);
        console.log('✅ Token parsed successfully as JSON');
        
        // If the parsed token has a specific structure, handle it accordingly
        if (typeof parsedToken === 'object') {
          console.log('📄 Token structure:', Object.keys(parsedToken));
          
          // If the token has a 'token' property, use that instead
          if (parsedToken.token) {
            console.log('🔐 Using token property from parsed JSON');
            tokenToVerify = parsedToken.token;
          }
        }
      } catch (e) {
        // If parsing fails, use the raw token string
        console.log('📄 Using raw token string for verification');
      }
      
      // Log token length for debugging
      console.log('📄 Token length for verification:', tokenToVerify.length);
      
      const authResponse = await verifier.fullVerify(tokenToVerify, authRequest, verificationOpts);
      
      const duration = (Date.now() - startTime) / 1000;
      console.log(`✅ Verification completed in ${duration.toFixed(1)}s`);
      
      // Process the verification result
      const userDID = authResponse?.from || 'unknown';
      
      // Clean up the request map
      requestMap.delete(sessionId);
      
      return NextResponse.json({
        success: true,
        message: 'Proof verification successful',
        timestamp: new Date().toISOString(),
        data: {
          verified: true,
          userDID,
          verificationTimeMs: Date.now() - startTime
        }
      }, { 
        headers: corsHeaders 
      });
      
    } catch (verifyError) {
      console.error('❌ Verification error details:', verifyError);
      
      // Log more detailed error information
      if (verifyError instanceof Error) {
        console.error('❌ Error message:', verifyError.message);
        console.error('❌ Error stack:', verifyError.stack);
        
        // Check for specific error patterns
        if (verifyError.message.includes('Cannot read properties of undefined')) {
          console.error('❌ This appears to be a property access error on an undefined object');
          console.error('❌ Likely causes: Malformed token or auth request structure mismatch');
        }
      }
      
      // Return a more specific error response instead of re-throwing
      return NextResponse.json({
        success: false,
        error: verifyError instanceof Error ? verifyError.message : 'Unknown verification error',
        errorType: verifyError instanceof Error ? verifyError.constructor.name : 'Unknown',
        timestamp: new Date().toISOString(),
        verificationTimeMs: Date.now() - startTime
      }, { 
        status: 400, 
        headers: corsHeaders 
      });
    }
    
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    console.error(`❌ Verification failed after ${duration.toFixed(1)}s:`, error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during verification',
      timestamp: new Date().toISOString(),
      verificationTimeMs: Date.now() - startTime
    }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

// Helper function to generate an auth request
async function generateAuthRequest(
  sessionId: string,
  credentialType: string,
  credentialContext: string,
  callbackUrl: string,
  reason: string,
  message: string
): Promise<AuthorizationRequestMessage> {
  const requestId = sessionId;
  const verifierDID = 'did:polygonid:polygon:amoy:2qM4krYhpKkCPHv3tHgW8d1yJE3aWZrpREeD2CE9nk';
  
  // Create the proof request based on credential type
  const proofRequest: ZeroKnowledgeProofRequest = {
    id: 1,
    circuitId: CircuitId.AtomicQuerySigV2,
    optional: false,
    query: {
      allowedIssuers: ['*'],
      type: credentialType,
      context: credentialContext,
      credentialSubject: {
        // Default to confidence score for UniquenessCredential
        // This can be expanded to handle different credential types
        confidenceScore: {
          $gt: 80
        }
      }
    }
  };
  
  // Create the auth request with explicit structure to match the expected format
  const authRequest: AuthorizationRequestMessage = {
    id: requestId,
    thid: requestId,
    typ: PROTOCOL_CONSTANTS.MediaType.PlainMessage,
    type: PROTOCOL_CONSTANTS.PROTOCOL_MESSAGE_TYPE.AUTHORIZATION_REQUEST_MESSAGE_TYPE,
    from: verifierDID,
    to: undefined, // Add this even if undefined to match expected structure
    body: {
      callbackUrl: `${callbackUrl}?sessionId=${sessionId}`,
      reason: reason,
      message: message,
      scope: [proofRequest] // Ensure this is a non-empty array
    }
  };
  
  // Log the created auth request for debugging
  console.log('📝 Generated auth request:', JSON.stringify(authRequest, null, 2));
  
  return authRequest;
}
