import { NextRequest, NextResponse } from "next/server";
import { ethers } from "krnl-sdk";
import { abi as contractAbi, CONTRACT_ADDRESS, ENTRY_ID, ACCESS_TOKEN } from "../../../lib/krnlConfig";
import supabase from '../../../lib/supabase';

// Create a provider for KRNL RPC
const krnlProvider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_KRNL);

// Check if required environment variables are available
if (!CONTRACT_ADDRESS) {
  console.error("Contract address not found");
}

if (!ENTRY_ID || !ACCESS_TOKEN || ENTRY_ID == undefined || ACCESS_TOKEN == undefined) {
  console.error("Entry ID or Access Token not found");
}

// Encode parameters for kernel 
const abiCoder = new ethers.AbiCoder();

/**
 * API handler for executing KRNL with the provided address and player's move
 */
// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://wallet.privado.id',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400' // 24 hours
    }
  });
}

// Define CORS headers once to reuse
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://wallet.privado.id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const token = body;
    
    // Extract parameters from URL query parameters
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    // Also check for senderAddress in query params
    const querySenderAddress = url.searchParams.get('senderAddress');
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID not provided" },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }
    
    // Try to get sender address from multiple sources
    let senderAddress = "";
    
    // 1. First check query parameters
    if (querySenderAddress) {
      senderAddress = querySenderAddress;
    } else {
      // 2. Try to get from Supabase
      try {
        // Query the session from Supabase
        const { data: sessionRecord, error } = await supabase
          .from('sessions')
          .select('data')
          .eq('session_id', sessionId)
          .gt('expires_at', new Date().toISOString()) // Only get non-expired sessions
          .single();
        
        if (error) {
          console.error("Error fetching session from Supabase:", error);
        } else if (sessionRecord && sessionRecord.data) {
          // Extract the sender address from the session data
          const sessionData = sessionRecord.data;
          senderAddress = sessionData.from || "";
        }
      } catch (error) {
        console.error("Error retrieving session from Supabase:", error);
      }
    }
    
    // If we still don't have a sender address, use a default or return an error
    if (!senderAddress) {
      return NextResponse.json(
        { success: false, error: "Sender address not found" },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }
    
    // // Execute KRNL
    const executeResult = await executeKrnl(token, senderAddress, sessionId);

    let isVerificationSuccessful = false;
    let processedResponses = [];
    
    if (executeResult && executeResult.kernel_responses && executeResult.kernel_responses.length > 0) {
      try {
        // Decode the array of KernelResponse
        // KernelResponse struct: { uint256 kernelId, bytes result, string err }
        const decodedResponses = abiCoder.decode(["tuple(uint256,bytes,string)[]"], executeResult.kernel_responses);
        
        // Process each KernelResponse
        if (decodedResponses && decodedResponses.length > 0 && decodedResponses[0].length > 0) {
          const responses = decodedResponses[0];
          
          for (let i = 0; i < responses.length; i++) {
            const response = responses[i];
            const kernelId = response[0]; // uint256 kernelId
            const resultBytes = response[1]; // bytes result
            const errorMsg = response[2]; // string err
            
            // If there's result data and no error, try to decode the result
            let resultString = null;
            if (resultBytes && resultBytes.length > 0 && !errorMsg) {
              try {
                const decodedResult = abiCoder.decode(["tuple(string)"], resultBytes);
                resultString = decodedResult[0][0]; // Extract the string from the tuple
                
                // Check if the result is 'success'
                if (resultString && resultString.toLowerCase() === 'success') {
                  isVerificationSuccessful = true;
                }
                
                // Add to processed responses
                processedResponses.push({
                  kernelId: kernelId.toString(),
                  result: resultString,
                  error: errorMsg
                });
              } catch (decodeError) {
                // Add to processed responses with the error
                processedResponses.push({
                  kernelId: kernelId.toString(),
                  result: null,
                  error: errorMsg || `Failed to decode result: ${decodeError instanceof Error ? decodeError.message : String(decodeError)}`
                });
              }
            } else {
              // Add to processed responses
              processedResponses.push({
                kernelId: kernelId.toString(),
                result: null,
                error: errorMsg
              });
            }
          }
        }
      } catch (decodeError) {
        console.error("Error decoding kernel_responses:", decodeError);
      }
    }

    // Update the session record with verification status
    try {
      const updateData: any = {
        verification_status: {
          success: isVerificationSuccessful,
          timestamp: new Date().toISOString(),
          message: isVerificationSuccessful ? "Verification successful" : "Verification failed",
          processed_responses: processedResponses
        }
      };
      
      // Only store executeResult in data field if verification is successful
      if (isVerificationSuccessful) {
        updateData.data = executeResult; // Overwrite the data field with executeResult
      }
      
      await supabase
        .from('sessions')
        .update(updateData)
        .eq('session_id', sessionId);
    } catch (error) {
      console.error("Error updating session verification status:", error);
    }
    
    if (!isVerificationSuccessful) {
      return NextResponse.json({
        success: false,
        error: "Verification failed"
      }, {
        headers: corsHeaders
      });
    }
    
    // The session is already updated in Supabase above, so the frontend polling will pick it up
    // No need for an additional API call since the verification-status endpoint reads from Supabase
    
    // Return response based on verification result
    return NextResponse.json({
      success: true,
      data: executeResult,
      message: "KRNL execution successful"
    }, {
      headers: corsHeaders
    });

    
  } catch (error: any) {
    console.error("Error executing KRNL:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute KRNL" },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

/**
 * Execute KRNL with the provided token and sender address
 * @param token Privado ID token
 * @param senderAddress Wallet address (from wallet connection)
 * @param sessionId Session ID
 * @param customKernelId Optional kernel ID to use
 * @returns KRNL payload result
 */
async function executeKrnl(token: string, senderAddress: string, sessionId: string, customKernelId?: string) {
  // Validate address
  const walletAddress = senderAddress;
  if (!walletAddress) {
    throw new Error("Wallet address is required");
  }
  
  // Use provided kernel ID or default to 1655 (can be overridden via env)
  const kernelId = customKernelId || "1686";
  
  // Create the kernel request data with the correct structure
  const kernelRequestData = {
    senderAddress: walletAddress,
    kernelPayload: {
      [kernelId]: {
        "parameters": {
            "header": {},
            "body": {
                "token": token
            },
            "query": {
                "sessionId": sessionId
            },
            "path": {}
        }
        }
    }
  } as any; // Use type assertion to bypass TypeScript type checking
  
  // Encode player move for smart-contract signature
  const functionParams = abiCoder.encode(["address"], [walletAddress]);
  
  // Check if ENTRY_ID and ACCESS_TOKEN are defined
  if (!ENTRY_ID || !ACCESS_TOKEN) {
    throw new Error("ENTRY_ID or ACCESS_TOKEN is not defined");
  }
  
  // Execute KRNL kernels
  const krnlPayload = await krnlProvider.executeKernels(
    ENTRY_ID, 
    ACCESS_TOKEN, 
    kernelRequestData, 
    functionParams
  );
  
  return krnlPayload;
}

/**
 * Helper function for client-side use
 * Call the `play` function on the Game contract with KRNL payload and the player's move.
 * Note: This function can't be used directly in the API route since it requires a signer,
 * but it's included here for reference and documentation purposes.
 * 
 * @param executeResult The result from executeKrnl
 * @param playerMove Player move (same value passed to executeKrnl)
 * @param signer The signer to use for the transaction
 * @returns Transaction hash
 */
async function callAirdropContract(executeResult: any, playerMove: number, signer?: ethers.Signer) {
  if (!signer) {
    throw new Error("Signer is required");
  }

  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address is required");
  }
  
  // Create contract instance
  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signer);
  
  // Format payload as expected by Game.sol
  const krnlPayload = {
    auth: executeResult.auth,
    kernelResponses: executeResult.kernel_responses,
    kernelParams: executeResult.kernel_params
  };
  
  // Call `play` on contract
  const tx = await contract.play(krnlPayload, playerMove);
  await tx.wait();
  return tx.hash;
}
