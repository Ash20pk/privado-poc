import { NextRequest, NextResponse } from 'next/server';

// Import the necessary setup functions
import { initializeVerifier } from '@/lib/polygonIdVerifier';
import {
  CircuitId,
  ZeroKnowledgeProofRequest,
  AuthorizationRequestMessage,
  PROTOCOL_CONSTANTS,
  core,
  CredentialStatusType
} from '@0xpolygonid/js-sdk';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Retrieve the original auth request
    const authRequest = {
      "id": "4823b83f-24b3-4536-9abb-1e0ce23bc8cd",
      "thid": "4823b83f-24b3-4536-9abb-1e0ce23bc8cd",
      "typ": PROTOCOL_CONSTANTS.MediaType.PlainMessage,
      "type": PROTOCOL_CONSTANTS.PROTOCOL_MESSAGE_TYPE.AUTHORIZATION_REQUEST_MESSAGE_TYPE,
      "from": "did:polygonid:polygon:amoy:2qM4krYhpKkCPHv3tHgW8d1yJE3aWZrpREeD2CE9nk",
      "body": {
        "callbackUrl": "http://localhost:3000/api/verify-proof",
        "reason": "Verify your age to access this service",
        "message": "Please prove you are over 22 years old using your KYC credential",
        "scope": [
          {
            "id": 1,
            "circuitId": CircuitId.AtomicQuerySigV2,
            "optional": false,
            "query": {
              "allowedIssuers": [
                "*"
              ],
              "type": "UniquenessCredential",
              "context": "https://raw.githubusercontent.com/Ash20pk/privado-poc/refs/heads/main/public/schemas/json-ld/UniquenessCredential.jsonld",
              "credentialSubject": {
                "confidenceScore": {
                  "$gt": 80
                }
              }
            }
          }
        ]
      }
    }
    if (!authRequest) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired session',
        timestamp: new Date().toISOString()
      }, { status: 400, headers: corsHeaders });
    }
    
    
    // Get the raw body data (token string)
    const rawBody = await request.text();
    const tokenStr = rawBody.trim();

    console.log('📄 Raw token:', tokenStr);
    
    console.log('📄 Raw token length:', tokenStr.length);
    if (tokenStr.length > 0) {
      console.log('📄 Token preview:', tokenStr.substring(0, Math.min(50, tokenStr.length)) + '...');
      // Try to parse the token to see its structure
      try {
        const parsedToken = JSON.parse(tokenStr);
        console.log('📄 Token is valid JSON with keys:', Object.keys(parsedToken));
      } catch (e) {
        console.log('📄 Token is not valid JSON, treating as raw string');
      }
    } else {
      console.log('⚠️ Warning: Empty token received');
    }
    
    
    // Initialize the verifier
    console.log('⚙️ Initializing Polygon ID verifier...');
    const verifier = await initializeVerifier();
    console.log('✅ Verifier initialized successfully');
    
    // Set verification options
    const verificationOpts = {
      acceptedStateTransitionDelay: 5 * 60 * 1000,
    };
    
    // Execute the verification
    console.log('🔐 Starting proof verification...');
    console.log('🔐 Auth request:', JSON.stringify(authRequest, null, 2));
    console.log('🔐 Verification options:', JSON.stringify(verificationOpts, null, 2));
    
    try {
      const authResponse = await verifier.fullVerify(tokenStr, authRequest, verificationOpts);
      
      const duration = (Date.now() - startTime) / 1000;
      console.log(`✅ Verification completed in ${duration.toFixed(1)}s`);
      console.log('🔐 Auth response received:', authResponse ? 'valid response' : 'null response');
      
      // Process the verification result
      const userDID = authResponse?.from || 'unknown';
      
      return NextResponse.json({
        success: true,
        message: 'Proof verification successful',
        timestamp: new Date().toISOString(),
        data: {
          verified: true,
          userDID,
          verificationTimeMs: Date.now() - startTime
        }
      }, { headers: corsHeaders });
      
    } catch (verifyError) {
      console.error('❌ Verification error details:', verifyError);
      if (verifyError instanceof Error) {
        console.error('❌ Error message:', verifyError.message);
        console.error('❌ Error stack:', verifyError.stack);
      }
      throw verifyError; // Re-throw to be caught by the outer try-catch
    }
    
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    console.error(`❌ Verification failed after ${duration.toFixed(1)}s:`, error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during verification',
      timestamp: new Date().toISOString(),
      verificationTimeMs: Date.now() - startTime
    }, { status: 500, headers: corsHeaders });
  }
}

// Handle GET requests for testing
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  return NextResponse.json({
    success: true,
    message: 'Verification callback endpoint is ready',
    timestamp: new Date().toISOString(),
    params: Object.fromEntries(searchParams.entries())
  }, { headers: corsHeaders });
}